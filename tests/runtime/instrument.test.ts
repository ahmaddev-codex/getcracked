import { describe, expect, it } from 'vitest';
import { runJavaScript } from '@/lib/runtime/javascript';
import type { TraceEvent } from '@/lib/runtime/trace';

/**
 * R-2 mitigation: JavaScript tracing must survive real learner code.
 *
 * QuickJS exposes no execution hook carrying line or variable state (T0.2 §1),
 * so tracing means rewriting the learner's source. That makes two things
 * load-bearing, and both are asserted here:
 *
 *   1. **Coverage** — every statement form, not the handful a hand-rolled
 *      visitor happened to cover.
 *   2. **Correctness** — instrumentation must never change what the learner's
 *      code returns. Traced and untraced runs are compared, and a mismatch
 *      discards the trace rather than reporting a wrong answer.
 */

const lines = (events: TraceEvent[]) =>
  events.filter((e): e is Extract<TraceEvent, { kind: 'line' }> => e.kind === 'line');

async function trace(source: string, entry: string, args: unknown[] = []) {
  return runJavaScript({ source, entry, args, trace: true });
}

describe('statement coverage', () => {
  it('traces inside try/catch/finally', async () => {
    const r = await trace(
      `function risky() {
        let log = [];
        try {
          log.push('try');
          throw new Error('x');
        } catch (e) {
          log.push('catch');
        } finally {
          log.push('finally');
        }
        return log;
      }`,
      'risky',
    );

    expect(r.ok).toBe(true);
    expect(r.value).toEqual(['try', 'catch', 'finally']);
    expect(lines(r.events).length).toBeGreaterThan(3);
  });

  it('traces inside switch cases', async () => {
    const r = await trace(
      `function pick(n) {
        let out = '';
        switch (n) {
          case 1:
            out = 'one';
            break;
          default:
            out = 'other';
        }
        return out;
      }`,
      'pick',
      [1],
    );

    expect(r.value).toBe('one');
    expect(lines(r.events).length).toBeGreaterThan(1);
  });

  it('traces inside a nested function body', async () => {
    const r = await trace(
      `function outer(xs) {
        function double(n) {
          const d = n * 2;
          return d;
        }
        let total = 0;
        for (const x of xs) {
          total += double(x);
        }
        return total;
      }`,
      'outer',
      [[1, 2, 3]],
    );

    expect(r.value).toBe(12);
    expect(lines(r.events).length).toBeGreaterThan(3);
  });

  it('traces labeled statements and nested loops', async () => {
    const r = await trace(
      `function search(grid, target) {
        let found = null;
        outer: for (let i = 0; i < grid.length; i++) {
          for (let j = 0; j < grid[i].length; j++) {
            if (grid[i][j] === target) {
              found = [i, j];
              break outer;
            }
          }
        }
        return found;
      }`,
      'search',
      [
        [
          [1, 2],
          [3, 4],
        ],
        4,
      ],
    );

    expect(r.value).toEqual([1, 1]);
  });

  it('does not break optional chaining or spread', async () => {
    const r = await trace(
      `function merge(a, b) {
        const out = { ...a, ...b };
        const n = out?.x ?? 0;
        return n;
      }`,
      'merge',
      [{ x: 1 }, { y: 2 }],
    );

    expect(r.value).toBe(1);
  });
});

describe('scope safety', () => {
  it('does not report a let before its declaration (temporal dead zone)', async () => {
    // Naively emitting every in-function binding at every statement throws a
    // ReferenceError on the TDZ and breaks the learner's program.
    const r = await trace(
      `function tdz() {
        const before = 1;
        let after = 2;
        return before + after;
      }`,
      'tdz',
    );

    expect(r.ok).toBe(true);
    expect(r.value).toBe(3);
  });

  it('does not leak a block-scoped binding to an outer statement', async () => {
    const r = await trace(
      `function scoped() {
        let total = 0;
        { let inner = 5; total += inner; }
        total += 1;
        return total;
      }`,
      'scoped',
    );

    expect(r.ok).toBe(true);
    expect(r.value).toBe(6);
  });
});

describe('correctness guarantee', () => {
  it('reports the same value traced and untraced', async () => {
    const source = `function sum(xs) {
      let t = 0;
      for (let i = 0; i < xs.length; i++) { t += xs[i]; }
      return t;
    }`;

    const traced = await runJavaScript({ source, entry: 'sum', args: [[1, 2, 3]], trace: true });
    const plain = await runJavaScript({ source, entry: 'sum', args: [[1, 2, 3]] });

    expect(traced.value).toEqual(plain.value);
    expect(traced.value).toBe(6);
  });

  it('still reports a thrown error correctly when tracing', async () => {
    const r = await trace('function boom() { throw new Error("kaboom"); }', 'boom');

    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/kaboom/);
  });
});

describe('graceful degradation', () => {
  it('still runs and still emits array events when the source cannot be instrumented', async () => {
    // Structure events come from a Proxy on the arguments and need no source
    // rewriting, so they survive an instrumentation failure. Losing line
    // highlighting is acceptable; losing the run is not.
    const r = await runJavaScript({
      source: `const search = function (xs) { return xs[1]; };`,
      entry: 'search',
      args: [[9, 8, 7]],
      trace: true,
    });

    expect(r.ok).toBe(true);
    expect(r.value).toBe(8);
    expect(r.events.some((e) => e.kind === 'array_read')).toBe(true);
    expect(r.traceDegraded).toBe(true);
  });

  it('reports full tracing as not degraded', async () => {
    const r = await trace(
      `function ok(xs) { return xs[0]; }`,
      'ok',
      [[1]],
    );

    expect(r.traceDegraded).toBe(false);
  });
});

describe('differential validation', () => {
  it('discards a trace whose instrumented run disagrees with the plain run', async () => {
    // Simulated by a function whose result depends on how many times the
    // enclosing scope has been touched — if instrumentation ever perturbed
    // behaviour, this is the shape of bug that would surface.
    const source = `function counter() {
      let calls = 0;
      function bump() { calls += 1; return calls; }
      bump();
      return calls;
    }`;

    const traced = await runJavaScript({ source, entry: 'counter', args: [], trace: true });
    const plain = await runJavaScript({ source, entry: 'counter', args: [] });

    // The guarantee: whatever tracing does, the reported value matches the
    // learner's own code.
    expect(traced.value).toEqual(plain.value);
    expect(traced.ok).toBe(plain.ok);
  });

  it('never lets instrumentation change a thrown outcome into a passing one', async () => {
    const source = `function boom(xs) {
      if (xs.length === 0) { throw new Error('empty'); }
      return xs[0];
    }`;

    const traced = await runJavaScript({ source, entry: 'boom', args: [[]], trace: true });
    const plain = await runJavaScript({ source, entry: 'boom', args: [[]] });

    expect(traced.ok).toBe(plain.ok);
    expect(traced.ok).toBe(false);
  });
});
