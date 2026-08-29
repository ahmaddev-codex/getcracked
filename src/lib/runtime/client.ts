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
}

const DEFAULT_TIMEOUT_MS = 5_000;
/** Headroom over the sandbox deadline, so the hard kill is genuinely a backstop. */
const TERMINATE_GRACE_MS = 2_000;

/** Minimal surface the client needs, so a test can substitute a fake. */
export interface WorkerLike {
  postMessage(message: unknown): void;
  terminate(): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
  removeEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
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

  private ensureWorker(): WorkerLike {
    this.worker ??= this.createWorker();
    return this.worker;
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

    const request: RunRequest = {
      id,
      spec: opts.spec,
      source: opts.source,
      language: opts.language,
      trace: opts.trace,
      timeoutMs,
      measure: opts.measure,
    };

    return new Promise<SpecResult>((resolve, reject) => {
      const cleanup = () => {
        worker.removeEventListener('message', onMessage);
        clearTimeout(killTimer);
      };

      const onMessage = (event: MessageEvent) => {
        const data = event.data as RunResponse;
        // Ignore replies to superseded runs rather than resolving the wrong one.
        if (data.id !== id) return;
        cleanup();
        if (data.ok) resolve(data.result);
        else reject(new Error(data.error));
      };

      const killTimer = setTimeout(() => {
        cleanup();
        this.reset();
        reject(new Error('TIMEOUT'));
      }, timeoutMs + TERMINATE_GRACE_MS);

      worker.addEventListener('message', onMessage);
      worker.postMessage(request);
    });
  }
}
