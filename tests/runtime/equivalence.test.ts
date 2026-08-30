import { describe, expect, it } from 'vitest';
import { runJavaScript } from '@/lib/runtime/javascript';
import { runPython } from '@/lib/runtime/python';
import type { TraceEvent } from '@/lib/runtime/trace';

const TIMEOUT = 120_000;

/**
 * The load-bearing claim of this spike: two runtimes with completely different
 * tracing mechanisms — CPython's `sys.settrace` versus AST-rewritten QuickJS —
 * produce the same event shape, so one renderer can consume either.
 */

const JS_LINEAR_SEARCH = `
function search(nums, target) {
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === target) {
      return i;
    }
  }
  return -1;
}
`;

const PY_LINEAR_SEARCH = `
def search(nums, target):
    for i in range(len(nums)):
        if nums[i] == target:
            return i
    return -1
`;

const NUMS = [5, 3, 9, 1, 7];
const TARGET = 1;

function arrayAccessPattern(events: TraceEvent[]) {
  return events
    .filter((e) => e.kind === 'array_read')
    .map((e) => ({ array: e.array, index: e.index, value: e.value }));
}

describe('cross-language trace equivalence', () => {
  it(
    'produces the identical array access sequence for the same algorithm',
    async () => {
      const js = await runJavaScript({
        source: JS_LINEAR_SEARCH,
        entry: 'search',
        args: [NUMS, TARGET],
        trace: true,
      });
      const py = await runPython({
        source: PY_LINEAR_SEARCH,
        entry: 'search',
        args: [NUMS, TARGET],
        trace: true,
      });

      expect(js.ok && py.ok).toBe(true);
      expect(js.value).toEqual(py.value);
      expect(arrayAccessPattern(js.events)).toEqual(arrayAccessPattern(py.events));
    },
    TIMEOUT,
  );

  it(
    'emits the same set of event kinds from both runtimes',
    async () => {
      const js = await runJavaScript({
        source: JS_LINEAR_SEARCH,
        entry: 'search',
        args: [NUMS, TARGET],
        trace: true,
      });
      const py = await runPython({
        source: PY_LINEAR_SEARCH,
        entry: 'search',
        args: [NUMS, TARGET],
        trace: true,
      });

      const kinds = (e: TraceEvent[]) => Array.from(new Set(e.map((x) => x.kind))).sort();
      expect(kinds(js.events)).toEqual(kinds(py.events));
    },
    TIMEOUT,
  );

  it(
    'tracks the loop variable by the same name in both runtimes',
    async () => {
      const js = await runJavaScript({
        source: JS_LINEAR_SEARCH,
        entry: 'search',
        args: [NUMS, TARGET],
        trace: true,
      });
      const py = await runPython({
        source: PY_LINEAR_SEARCH,
        entry: 'search',
        args: [NUMS, TARGET],
        trace: true,
      });

      const loopValues = (events: TraceEvent[]) =>
        events
          .filter((e) => e.kind === 'line' && typeof e.vars.i === 'number')
          .map((e) => (e as Extract<TraceEvent, { kind: 'line' }>).vars.i);

      expect(loopValues(js.events).length).toBeGreaterThan(0);
      expect(loopValues(py.events).length).toBeGreaterThan(0);
      // Both should walk i upward to the hit at index 3.
      expect(Math.max(...(loopValues(js.events) as number[]))).toBe(3);
      expect(Math.max(...(loopValues(py.events) as number[]))).toBe(3);
    },
    TIMEOUT,
  );

  /**
   * The cap is a correctness property, so this must not also be a speed test.
   *
   * It failed in CI and passed locally, and the reason was neither flakiness nor
   * the runtime: a traced run that trips the sandbox deadline returns
   * `timedOut: true` with `truncated: false` and no events, so a slow machine
   * turned "the cap works" into "expected false to be true". Raising the loop
   * from 500 to 1000 in an earlier attempt to stabilise it made that strictly
   * worse, because the tracing cost was quadratic in the loop length.
   *
   * The runtime fix — checking the cap before building an event rather than
   * after — is what makes the work bounded. This keeps the deadline generous
   * anyway and asserts it was not hit, so if the cost ever regresses the failure
   * names the cause instead of pointing at the assertion after it.
   */
  it(
    'truncates rather than flooding when a run exceeds the event cap',
    async () => {
      const SIZE = 500;
      const CAP = 50;

      const js = await runJavaScript({
        source: `function fill(xs) { for (let i = 0; i < ${SIZE}; i++) { xs[i] = i; } return xs.length; }`,
        entry: 'fill',
        args: [new Array(SIZE).fill(0)],
        trace: true,
        maxEvents: CAP,
        // Ten times the deadline a learner gets, so this measures the cap and
        // not the runner.
        timeoutMs: 50_000,
      });

      expect(js.timedOut, 'the run hit the deadline, so the cap was never reached').toBe(
        false,
      );
      expect(js.truncated).toBe(true);
      expect(js.events.at(-1)).toMatchObject({ kind: 'truncated' });
      // The cap, plus the one marker that says it was reached.
      expect(js.events.length).toBeLessThanOrEqual(CAP + 1);
    },
    TIMEOUT,
  );

  /**
   * The cap bounds work, not just payload — and in both languages.
   *
   * Without this, a capped trace stays *correct* while costing time quadratic in
   * the input, which is invisible until a slow machine turns it into a timeout.
   * Asserting a ratio rather than an absolute time keeps it meaningful on any
   * machine: ten times the input must not cost ten times the time, because
   * beyond the cap there is nothing left to record.
   */
  it.each(['javascript', 'python'] as const)(
    'stops paying for events it will not keep (%s)',
    async (language) => {
      const run = (size: number) => {
        const source =
          language === 'javascript'
            ? `function fill(xs) { for (let i = 0; i < ${size}; i++) { xs[i] = i; } return xs.length; }`
            : `def fill(xs):\n    for i in range(${size}):\n        xs[i] = i\n    return len(xs)\n`;
        const adapter = language === 'javascript' ? runJavaScript : runPython;
        return adapter({
          source,
          entry: 'fill',
          args: [new Array(size).fill(0)],
          trace: true,
          maxEvents: 50,
          timeoutMs: 50_000,
        });
      };

      // Warm the runtime first, so the small run is not paying WASM startup and
      // flattering the ratio.
      await run(50);

      const smallStart = Date.now();
      const small = await run(200);
      const smallMs = Date.now() - smallStart;

      const largeStart = Date.now();
      const large = await run(2000);
      const largeMs = Date.now() - largeStart;

      expect(small.truncated).toBe(true);
      expect(large.truncated).toBe(true);
      // Both keep exactly the cap, whatever the input size.
      expect(small.events.length).toBe(large.events.length);

      // A generous bound: the point is that it is not ~10x, not that it is 1x.
      // A few ms of fixed overhead makes a tight ratio meaningless on a fast
      // machine, so the small side gets a floor.
      expect(largeMs).toBeLessThan(Math.max(smallMs, 20) * 5);
    },
    TIMEOUT,
  );
});

/**
 * Both runtimes must report the same index variables.
 *
 * The visualizer draws pointer marks from this, so a disagreement would mean
 * the same walkthrough labels different variables depending on which language
 * the learner picked — the animation contradicting itself across a toggle.
 *
 * The two analyses are necessarily separate implementations: only Python's own
 * parser can answer this for Python. That is exactly why they are tested
 * together rather than each on its own.
 */
describe('index variables agree across languages', () => {
  it('reports the same subscript variables for the same algorithm', async () => {
    const js = await runJavaScript({
      source: `function siftDown(heap) {
  let i = 0;
  let swaps = 0;
  const left = 2 * i + 1;
  if (left < heap.length && heap[left] > heap[i]) {
    swaps = swaps + 1;
  }
  return swaps;
}`,
      entry: 'siftDown',
      args: [[1, 8, 6]],
      trace: true,
    });

    const py = await runPython({
      source: `def sift_down(heap):
    i = 0
    swaps = 0
    left = 2 * i + 1
    if left < len(heap) and heap[left] > heap[i]:
        swaps = swaps + 1
    return swaps`,
      entry: 'sift_down',
      args: [[1, 8, 6]],
      trace: true,
    });

    expect(js.indexedBy?.heap).toEqual(['i', 'left']);
    expect(py.indexedBy?.heap).toEqual(['i', 'left']);
  }, 120_000);

  it('neither reports a counter that never indexes', async () => {
    // The bug this whole mechanism exists to fix, checked on both sides.
    const js = await runJavaScript({
      source: 'function f(a) { let n = 0; for (let i = 0; i < a.length; i++) { n = n + a[i]; } return n; }',
      entry: 'f',
      args: [[1, 2, 3]],
      trace: true,
    });
    const py = await runPython({
      source: `def f(a):
    n = 0
    for i in range(len(a)):
        n = n + a[i]
    return n`,
      entry: 'f',
      args: [[1, 2, 3]],
      trace: true,
    });

    expect(js.indexedBy?.a).toEqual(['i']);
    expect(py.indexedBy?.a).toEqual(['i']);
  }, 120_000);
});
