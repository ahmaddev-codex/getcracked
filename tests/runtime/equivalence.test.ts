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

  it(
    'truncates rather than flooding when a run exceeds the event cap',
    async () => {
      const js = await runJavaScript({
        source: 'function fill(xs) { for (let i = 0; i < xs.length; i++) { xs[i] = i; } return xs.length; }',
        entry: 'fill',
        args: [new Array(500).fill(0)],
        trace: true,
        maxEvents: 50,
      });

      expect(js.truncated).toBe(true);
      expect(js.events.at(-1)).toMatchObject({ kind: 'truncated' });
      expect(js.events.length).toBeLessThanOrEqual(51);
    },
    TIMEOUT,
  );
});
