import { describe, expect, it, vi } from 'vitest';
import { RuntimeClient, type WorkerLike } from '@/lib/runtime/client';
import type { RunRequest, RunResponse } from '@/lib/runtime/protocol';
import type { TestSpec } from '@/content/schema';

/**
 * The client's timeout, termination, and id-matching logic.
 *
 * This is the part most likely to be wrong and least likely to be caught by a
 * manual click-through: a stale reply resolving the wrong run, or a wedged
 * worker leaving the page waiting forever, only show up under conditions nobody
 * clicks their way into.
 */

const SPEC: TestSpec = {
  entry: 'f',
  cases: [{ args: [], expected: 1, hidden: false }],
};

class FakeWorker implements WorkerLike {
  listeners = new Set<(event: MessageEvent) => void>();
  posted: RunRequest[] = [];
  terminated = false;

  postMessage(message: unknown) {
    this.posted.push(message as RunRequest);
  }
  terminate() {
    this.terminated = true;
  }
  errorListeners = new Set<(event: MessageEvent) => void>();

  addEventListener(type: 'message' | 'error', listener: (event: MessageEvent) => void) {
    (type === 'error' ? this.errorListeners : this.listeners).add(listener);
  }
  removeEventListener(type: 'message' | 'error', listener: (event: MessageEvent) => void) {
    (type === 'error' ? this.errorListeners : this.listeners).delete(listener);
  }

  /** Simulates the worker dying while evaluating its modules. */
  fail() {
    for (const l of [...this.errorListeners]) l({} as MessageEvent);
  }

  /** Simulates the worker replying. */
  reply(response: RunResponse) {
    for (const l of [...this.listeners]) l({ data: response } as MessageEvent);
  }
}

function passingResult() {
  return {
    passed: true,
    cases: [],
    timedOut: false,
    trace: null,
    traceDegraded: false,
    metrics: null,
  };
}

function makeClient() {
  const worker = new FakeWorker();
  const client = new RuntimeClient(() => worker);
  return { worker, client };
}

describe('RuntimeClient', () => {
  it('resolves with the worker’s result', async () => {
    const { worker, client } = makeClient();

    const promise = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
    worker.reply({ id: worker.posted[0].id, ok: true, result: passingResult() });

    await expect(promise).resolves.toMatchObject({ passed: true });
  });

  it('rejects when the worker reports an error', async () => {
    const { worker, client } = makeClient();

    const promise = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
    worker.reply({ id: worker.posted[0].id, ok: false, error: 'boom' });

    await expect(promise).rejects.toThrow('boom');
  });

  it('ignores a reply belonging to a superseded run', async () => {
    const { worker, client } = makeClient();

    const promise = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
    // A late reply from an earlier run must not resolve this one.
    worker.reply({ id: 'stale-id', ok: true, result: passingResult() });

    let settled = false;
    void promise.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).toBe(false);

    worker.reply({ id: worker.posted[0].id, ok: true, result: passingResult() });
    await expect(promise).resolves.toBeTruthy();
  });

  it('stops listening once a run settles, so listeners cannot accumulate', async () => {
    const { worker, client } = makeClient();

    const promise = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
    worker.reply({ id: worker.posted[0].id, ok: true, result: passingResult() });
    await promise;

    expect(worker.listeners.size).toBe(0);
  });

  it('reuses one worker across runs rather than starting a new one each time', async () => {
    let created = 0;
    const worker = new FakeWorker();
    const client = new RuntimeClient(() => {
      created++;
      return worker;
    });

    for (let i = 0; i < 3; i++) {
      const p = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
      worker.reply({ id: worker.posted[i].id, ok: true, result: passingResult() });
      await p;
    }

    expect(created).toBe(1);
  });

  describe('hard deadline', () => {
    it('terminates a worker that never replies', async () => {
      vi.useFakeTimers();
      const { worker, client } = makeClient();

      const promise = client.run({
        spec: SPEC,
        source: 'x',
        language: 'javascript',
        timeoutMs: 100,
      });
      const assertion = expect(promise).rejects.toThrow('TIMEOUT');

      // Past the sandbox deadline plus the grace period.
      await vi.advanceTimersByTimeAsync(5_000);
      await assertion;

      // Without this, a wedged worker would leave the page waiting forever.
      expect(worker.terminated).toBe(true);
      vi.useRealTimers();
    });

    it('starts a fresh worker after a termination', async () => {
      vi.useFakeTimers();
      let created = 0;
      const workers: FakeWorker[] = [];
      const client = new RuntimeClient(() => {
        created++;
        const w = new FakeWorker();
        workers.push(w);
        return w;
      });

      const first = client.run({ spec: SPEC, source: 'x', language: 'javascript', timeoutMs: 100 });
      const rejects = expect(first).rejects.toThrow('TIMEOUT');
      await vi.advanceTimersByTimeAsync(5_000);
      await rejects;

      vi.useRealTimers();

      // One bad submission must not leave the page unable to run anything again.
      const second = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
      workers[1].reply({ id: workers[1].posted[0].id, ok: true, result: passingResult() });
      await expect(second).resolves.toBeTruthy();
      expect(created).toBe(2);
    });

    it('does not fire the deadline once a run has already replied', async () => {
      vi.useFakeTimers();
      const { worker, client } = makeClient();

      const promise = client.run({ spec: SPEC, source: 'x', language: 'javascript', timeoutMs: 100 });
      worker.reply({ id: worker.posted[0].id, ok: true, result: passingResult() });
      await promise;

      await vi.advanceTimersByTimeAsync(10_000);
      expect(worker.terminated).toBe(false);
      vi.useRealTimers();
    });
  });

  it('disposes the worker so a navigating learner leaves nothing running', () => {
    const { worker, client } = makeClient();
    client.warm();
    expect(client.isRunning).toBe(true);

    client.dispose();
    expect(worker.terminated).toBe(true);
    expect(client.isRunning).toBe(false);
  });
});

describe('worker that dies at module evaluation', () => {
  it('falls back to running in-thread rather than hanging', async () => {
    // The failure this exists for: the worker constructs fine, then throws while
    // evaluating its imports. Not a constructor throw, not a rejected
    // postMessage — without an error listener the run waits out the deadline.
    const worker = new FakeWorker();
    const client = new RuntimeClient(() => worker);

    const promise = client.run({
      spec: { entry: 'f', cases: [{ args: [], expected: 2, hidden: false }] },
      source: 'function f() { return 2; }',
      language: 'javascript',
    });

    worker.fail();

    await expect(promise).resolves.toMatchObject({ passed: true });
    expect(client.usingWorker).toBe(false);
  }, 60_000);

  it('routes later runs straight in-thread once a worker has failed', async () => {
    let created = 0;
    const worker = new FakeWorker();
    const client = new RuntimeClient(() => {
      created++;
      return worker;
    });

    const first = client.run({
      spec: { entry: 'f', cases: [{ args: [], expected: 1, hidden: false }] },
      source: 'function f() { return 1; }',
      language: 'javascript',
    });
    worker.fail();
    await first;

    await client.run({
      spec: { entry: 'f', cases: [{ args: [], expected: 1, hidden: false }] },
      source: 'function f() { return 1; }',
      language: 'javascript',
    });

    // Retrying a worker known to be broken just costs another failure.
    expect(created).toBe(1);
  }, 60_000);

  it('recycles worker after reaching MAX_RUNS_BEFORE_RECYCLE executions', async () => {
    let created = 0;
    let currentWorker: FakeWorker;
    const client = new RuntimeClient(() => {
      created++;
      currentWorker = new FakeWorker();
      return currentWorker;
    });

    for (let i = 0; i < 24; i++) {
      const p = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
      currentWorker!.reply({ id: String(i), ok: true, result: passingResult() });
      await p;
    }
    expect(created).toBe(1);
    expect(client.executionCount).toBe(24);

    // 25th run reaches threshold and triggers reset
    const p25 = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
    currentWorker!.reply({ id: '24', ok: true, result: passingResult() });
    await p25;

    expect(client.executionCount).toBe(0);

    // Next run will spawn a fresh worker
    const p26 = client.run({ spec: SPEC, source: 'x', language: 'javascript' });
    expect(created).toBe(2);
    currentWorker!.reply({ id: '25', ok: true, result: passingResult() });
    await p26;
  });
});

/**
 * Python in a worker that cannot run it.
 *
 * Pyodide 314 refuses to load in a classic worker, which is what Turbopack
 * emits in development. The worker says so rather than attempting a
 * multi-megabyte download that is guaranteed to fail, and the client re-runs on
 * the main thread — keeping the worker, because JavaScript still runs there.
 */
describe('language the worker cannot run', () => {
  it('re-runs on the main thread instead of failing', async () => {
    const worker = new FakeWorker();
    const client = new RuntimeClient(() => worker);

    const promise = client.run({
      spec: { entry: 'identity', cases: [{ args: [1], expected: 1, hidden: false }] },
      source: 'def identity(x):\n    return x',
      language: 'python',
    });

    await Promise.resolve();
    expect(worker.posted[0].language).toBe('python');
    worker.reply({
      id: '0',
      ok: false,
      unsupported: true,
      error: 'Python cannot run in this worker.',
    });

    const result = await promise;
    expect(result.cases[0].passed).toBe(true);
  }, 120_000);

  it('keeps the worker, because it can still run other languages', async () => {
    const worker = new FakeWorker();
    const client = new RuntimeClient(() => worker);

    const promise = client.run({
      spec: { entry: 'identity', cases: [{ args: [1], expected: 1, hidden: false }] },
      source: 'def identity(x):\n    return x',
      language: 'python',
    });
    await Promise.resolve();
    worker.reply({ id: '0', ok: false, unsupported: true, error: 'no' });
    await promise;

    // A worker that declines Python is healthy, unlike one that crashed.
    expect(client.usingWorker).toBe(true);
  }, 120_000);
});
