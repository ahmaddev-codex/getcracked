import { describe, expect, it } from 'vitest';
import {
  MAX_COLLECTION_ELEMENTS,
  TRACE_PROTOCOL_VERSION,
  stateAtStep,
  toProtocol,
  traceBytes,
} from '@/lib/trace/protocol';
import { runJavaScript } from '@/lib/runtime/javascript';
import { runPython } from '@/lib/runtime/python';

const TIMEOUT = 120_000;

/**
 * The trace protocol (T2.7).
 *
 * The payload assertions are the important ones. T0.2 measured a 500-element
 * loop producing ~1 MB because every line event snapshotted the whole array;
 * these tests are what stop that regressing.
 */

describe('versioning', () => {
  it('stamps a version, so a renderer can refuse a trace it cannot read', () => {
    expect(toProtocol([]).version).toBe(TRACE_PROTOCOL_VERSION);
  });
});

describe('diffing line events', () => {
  it('keeps only variables that changed', () => {
    const trace = toProtocol([
      { kind: 'line', line: 1, vars: { i: 0, total: 0 } },
      { kind: 'line', line: 2, vars: { i: 1, total: 0 } },
    ]);

    expect(trace.events[0]).toMatchObject({ changed: { i: 0, total: 0 } });
    // `total` did not move, so it is not repeated.
    expect(trace.events[1]).toMatchObject({ changed: { i: 1 } });
  });

  it('does not report an unchanged NaN as changing every step', () => {
    // Object.is rather than ===, or NaN !== NaN makes it change forever.
    const trace = toProtocol([
      { kind: 'line', line: 1, vars: { x: NaN } },
      { kind: 'line', line: 2, vars: { x: NaN } },
    ]);
    expect(Object.keys((trace.events[1] as { changed: object }).changed)).toHaveLength(0);
  });

  it('reports a variable that returns to a previous value', () => {
    const trace = toProtocol([
      { kind: 'line', line: 1, vars: { i: 0 } },
      { kind: 'line', line: 2, vars: { i: 1 } },
      { kind: 'line', line: 3, vars: { i: 0 } },
    ]);
    expect(trace.events[2]).toMatchObject({ changed: { i: 0 } });
  });
});

describe('hoisting collections', () => {
  it('sends an array once rather than on every line', () => {
    const nums = [1, 2, 3];
    const trace = toProtocol([
      { kind: 'line', line: 1, vars: { nums, i: 0 } },
      { kind: 'line', line: 2, vars: { nums, i: 1 } },
      { kind: 'line', line: 3, vars: { nums, i: 2 } },
    ]);

    expect(trace.collections).toHaveLength(1);
    expect(trace.collections[0]).toMatchObject({ name: 'nums', initial: [1, 2, 3] });
    // And it never appears inside an event.
    for (const event of trace.events) {
      expect(JSON.stringify(event)).not.toContain('nums');
    }
  });

  it('truncates a collection past the H5 cap and says so', () => {
    const big = Array.from({ length: MAX_COLLECTION_ELEMENTS + 50 }, (_, i) => i);
    const trace = toProtocol([{ kind: 'line', line: 1, vars: { big } }]);

    expect(trace.collections[0].initial).toHaveLength(MAX_COLLECTION_ELEMENTS);
    expect(trace.collections[0].truncated).toBe(true);
  });
});

describe('payload size — the T0.2 regression guard', () => {
  it(
    'keeps a 500-element loop far below the megabyte it used to cost',
    async () => {
      const result = await runJavaScript({
        source:
          'function total(nums) { let s = 0; for (let i = 0; i < nums.length; i++) { s += nums[i]; } return s; }',
        entry: 'total',
        args: [Array.from({ length: 500 }, (_, i) => i)],
        trace: true,
        maxEvents: 100_000,
      });

      const raw = JSON.stringify(result.events).length;
      const encoded = traceBytes(toProtocol(result.events));

      // Measured at ~1MB raw in T0.2. An order of magnitude is the bar.
      expect(encoded).toBeLessThan(raw / 10);
      expect(encoded).toBeLessThan(200_000);
    },
    TIMEOUT,
  );
});

describe('replaying state', () => {
  const trace = toProtocol([
    { kind: 'line', line: 1, vars: { xs: [0, 0, 0], i: 0 } },
    { kind: 'array_write', array: 'xs', index: 0, value: 9 },
    { kind: 'line', line: 2, vars: { i: 1 } },
    { kind: 'array_write', array: 'xs', index: 1, value: 8 },
  ]);

  it('rebuilds array state by replaying writes', () => {
    expect(stateAtStep(trace, 3).arrays.get('xs')).toEqual([9, 8, 0]);
  });

  it('rebuilds partial state at an earlier step', () => {
    // Scrubbing backwards must not show later writes.
    expect(stateAtStep(trace, 1).arrays.get('xs')).toEqual([9, 0, 0]);
  });

  it('tracks the current line', () => {
    expect(stateAtStep(trace, 2).line).toBe(2);
  });

  it('carries variables forward across steps that did not change them', () => {
    // `i` was set at step 0 and only changed at step 2.
    expect(stateAtStep(trace, 1).variables.get('i')).toBe(0);
    expect(stateAtStep(trace, 3).variables.get('i')).toBe(1);
  });

  it('handles a step before anything happened', () => {
    expect(stateAtStep(trace, -1).line).toBeNull();
  });
});

describe('cross-language equivalence through the protocol', () => {
  it(
    'produces the same array access sequence from both runtimes',
    async () => {
      const source = {
        javascript:
          'function search(nums, target) { for (let i = 0; i < nums.length; i++) { if (nums[i] === target) { return i; } } return -1; }',
        python:
          'def search(nums, target):\n    for i in range(len(nums)):\n        if nums[i] == target:\n            return i\n    return -1',
      };
      const args = [[5, 3, 9, 1, 7], 1];

      const js = toProtocol(
        (await runJavaScript({ source: source.javascript, entry: 'search', args, trace: true }))
          .events,
      );
      const py = toProtocol(
        (await runPython({ source: source.python, entry: 'search', args, trace: true })).events,
      );

      const reads = (t: typeof js) =>
        t.events.filter((e) => e.kind === 'array_read').map((e) => `${e.array}[${e.index}]`);

      expect(reads(js)).toEqual(reads(py));
    },
    TIMEOUT,
  );
});

/**
 * The change information the visualizer narrates.
 *
 * Reconstructed during replay rather than sent on the wire, so these cost
 * nothing in payload — which is the whole reason `toProtocol` diffs in the first
 * place. Tested here because a renderer that highlights the wrong thing is worse
 * than one that highlights nothing.
 */
describe('what changed at a step', () => {
  const trace = toProtocol([
    { kind: 'line', line: 1, vars: { xs: [3, 1, 2], i: 0, n: 3 } },
    { kind: 'array_read', array: 'xs', index: 0, value: 3 },
    { kind: 'line', line: 2, vars: { i: 1 } },
    { kind: 'array_write', array: 'xs', index: 1, value: 9 },
    { kind: 'return', value: 9 },
  ]);

  it('carries the value a write replaced', () => {
    const state = stateAtStep(trace, 3);
    expect(state.lastWrite).toMatchObject({ array: 'xs', index: 1, value: 9, previous: 1 });
  });

  it('takes the previous value from the array as it stood, not the initial one', () => {
    // Two writes to the same index: the second must report the first's value,
    // not the value the array started with.
    const twice = toProtocol([
      { kind: 'line', line: 1, vars: { xs: [0], i: 0 } },
      { kind: 'array_write', array: 'xs', index: 0, value: 5 },
      { kind: 'array_write', array: 'xs', index: 0, value: 7 },
    ]);
    expect(stateAtStep(twice, 2).lastWrite).toMatchObject({ previous: 5, value: 7 });
  });

  it('reports changes for the step asked for, not everything so far', () => {
    expect([...stateAtStep(trace, 0).changed].sort()).toEqual(['i', 'n']);
    // Step 2 changed only `i`; `n` was set back at step 0 and has not moved.
    expect([...stateAtStep(trace, 2).changed]).toEqual(['i']);
  });

  it('reports no change on a step that is not a line event', () => {
    expect(stateAtStep(trace, 1).changed.size).toBe(0);
  });

  it('remembers what each changed variable was before', () => {
    expect(stateAtStep(trace, 2).previousValues.get('i')).toBe(0);
  });

  it('marks the run finished only once it has returned', () => {
    expect(stateAtStep(trace, 3).finished).toBe(false);
    const done = stateAtStep(trace, 4);
    expect(done.finished).toBe(true);
    expect(done.returned).toBe(9);
  });

  it('scrubbing backwards reports that step, not the furthest reached', () => {
    // The player replays from the start on every seek precisely so this holds.
    stateAtStep(trace, 4);
    expect(stateAtStep(trace, 2).finished).toBe(false);
    expect([...stateAtStep(trace, 2).changed]).toEqual(['i']);
  });
});
