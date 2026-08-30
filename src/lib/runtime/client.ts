'use client';

import type { Language, TestSpec } from '@/content/schema';
import type { SpecResult } from '@/content/test-runner';
import type { RunRequest, RunResponse } from './protocol';

/**
 * Main-thread client for the execution worker.
 *
 * Owns two independent safety nets, and the second exists because the first can
 * in principle be defeated:
 *
 *  1. QuickJS's interrupt handler stops a runaway loop inside the sandbox. This
 *     is the normal path and it is fast — measured at 201ms on a 200ms deadline.
 *  2. A hard wall-clock deadline on this side, after which the worker is
 *     terminated outright. If a submission ever wedged the worker in a way the
 *     interrupt could not reach, without this the page would wait forever.
 *
 * The worker is recreated after a termination, so one bad submission does not
 * leave the page unable to run anything again.
 */

export interface RunOptions {
  spec: TestSpec;
  source: string;
  language: Language;
  trace?: boolean;
  /** Passed to QuickJS's interrupt handler. */
  timeoutMs?: number;
  /** Costs an extra sandboxed run; on only when the UI will show the result. */
  measure?: boolean;
  /**
   * Sibling files for a tier-3 build challenge (see content/challenge.ts).
   *
   * Structured-cloneable plain data, so a workspace crosses the worker boundary
   * as-is rather than being flattened into a string and reparsed on the far side.
   */
  modules?: ReadonlyArray<{ name: string; source: string }>;
  entryModule?: string;
}

const DEFAULT_TIMEOUT_MS = 5_000;
/** Headroom over the sandbox deadline, so the hard kill is genuinely a backstop. */
const TERMINATE_GRACE_MS = 2_000;
/**
 * Extra headroom for a first Python run.
 *
 * `timeoutMs` bounds execution *inside* the sandbox, but the hard kill on this
 * side also covers loading the interpreter — and Pyodide is a multi-megabyte
 * download on a cold cache. Without this allowance the backstop fires while
 * CPython is still downloading and a correct solution reports a timeout, which
 * is the most confusing failure the runtime could produce.
 */
const PYTHON_COLD_START_MS = 60_000;

/** Minimal surface the client needs, so a test can substitute a fake. */
export interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  /**
   * `error` matters as much as `message`.
   *
   * A worker can construct successfully and then die while evaluating its
   * modules — a bundler emitting a classic worker for code that needs a module
   * one, say. That failure surfaces only here: it is not a constructor throw and
   * not a rejected postMessage, so without listening for it the run just hangs
   * until the deadline.
   */
  addEventListener(
    type: 'message' | 'error',
    listener: (event: MessageEvent & { message?: string }) => void,
  ): void;
  removeEventListener(
    type: 'message' | 'error',
    listener: (event: MessageEvent & { message?: string }) => void,
  ): void;
}

export type WorkerFactory = () => WorkerLike;

const defaultFactory: WorkerFactory = () =>
  new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' });

export class RuntimeClient {
  private worker: WorkerLike | null = null;
  private nextId = 0;
  private readonly createWorker: WorkerFactory;

  /**
   * The factory is injectable so the timeout, termination, and id-matching
   * logic can be tested without a browser — that logic is where the bugs live,
   * and it is exactly the part a manual click-through exercises least.
   */
  constructor(createWorker: WorkerFactory = defaultFactory) {
    this.createWorker = createWorker;
  }

  /** Set once a worker has failed; every later run goes in-thread. */
  private workerUnavailable = false;

  private ensureWorker(): WorkerLike | null {
    if (this.workerUnavailable) return null;
    try {
      this.worker ??= this.createWorker();
      return this.worker;
    } catch {
      // Some bundlers emit a classic worker regardless of `type: 'module'`,
      // and a few environments block workers outright.
      this.workerUnavailable = true;
      return null;
    }
  }

  /**
   * Runs in-thread when no worker is available.
   *
   * Losing the worker costs the hard-terminate backstop and a little
   * responsiveness while a run is in flight — QuickJS's interrupt handler still
   * stops a runaway loop, measured at 201ms in T0.2. A learner unable to run
   * their code at all would be a far worse outcome than one whose tab stutters.
   */
  private async runInThread(opts: RunOptions): Promise<SpecResult> {
    const { runTestSpec } = await import('@/content/test-runner');
    return runTestSpec({
      spec: opts.spec,
      source: opts.source,
      language: opts.language,
      trace: opts.trace,
      timeoutMs: opts.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      measure: opts.measure,
      modules: opts.modules,
      entryModule: opts.entryModule,
    });
  }

  /** Discards the current worker; the next run starts a fresh one. */
  private reset() {
    this.worker?.terminate();
    this.worker = null;
  }

  /**
   * Starts the worker early, so the first run does not pay module and WASM
   * initialisation while a learner waits on their click.
   */
  warm(): void {
    this.ensureWorker();
  }

  /** True when execution has fallen back to the main thread. */
  get usingWorker(): boolean {
    return !this.workerUnavailable;
  }

  dispose(): void {
    this.reset();
  }

  /** Exposed for tests: whether a worker is currently alive. */
  get isRunning(): boolean {
    return this.worker !== null;
  }

  async run(opts: RunOptions): Promise<SpecResult> {
    const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const id = String(this.nextId++);
    const worker = this.ensureWorker();
    if (!worker) return this.runInThread(opts);

    const request: RunRequest = {
      id,
      spec: opts.spec,
      source: opts.source,
      language: opts.language,
      trace: opts.trace,
      timeoutMs,
      measure: opts.measure,
      modules: opts.modules,
      entryModule: opts.entryModule,
    };

    return new Promise<SpecResult>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        settled = true;
        worker.removeEventListener('message', onMessage);
        worker.removeEventListener('error', onError);
        clearTimeout(killTimer);
      };

      /** The worker failed to start or crashed. Fall back rather than hang. */
      const onError = () => {
        if (settled) return;
        cleanup();
        this.workerUnavailable = true;
        this.reset();
        this.runInThread(opts).then(resolve, reject);
      };

      const onMessage = (event: MessageEvent) => {
        const data = event.data as RunResponse;
        // Ignore replies to superseded runs rather than resolving the wrong one.
        if (data.id !== id) return;
        cleanup();

        // The worker can run other languages fine, so it is kept: only this run
        // moves to the main thread.
        if (!data.ok && 'unsupported' in data && data.unsupported) {
          this.runInThread(opts).then(resolve, reject);
          return;
        }

        if (data.ok) resolve(data.result);
        else reject(new Error(data.error));
      };

      const killTimer = setTimeout(
        () => {
          cleanup();
          this.reset();
          reject(new Error('TIMEOUT'));
        },
        timeoutMs +
          TERMINATE_GRACE_MS +
          (opts.language === 'python' ? PYTHON_COLD_START_MS : 0),
      );

      worker.addEventListener('message', onMessage);
      worker.addEventListener('error', onError);
      try {
        worker.postMessage(request);
      } catch {
        // The worker died on startup — a module it imports failed to load, say.
        cleanup();
        this.workerUnavailable = true;
        this.reset();
        this.runInThread(opts).then(resolve, reject);
        return;
      }
    });
  }
}
