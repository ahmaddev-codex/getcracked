import { describe, expect, it } from 'vitest';
import { runPython } from '@/lib/runtime/python';

// Pyodide is several MB of WASM; first load dominates. Generous ceiling.
const LOAD_TIMEOUT = 120_000;

const TWO_SUM = `
def two_sum(nums, target):
    seen = {}
    for i in range(len(nums)):
        complement = target - nums[i]
        if complement in seen:
            return [seen[complement], i]
        seen[nums[i]] = i
    return []
`;

describe('runPython', () => {
  it(
    'executes learner code and returns its value',
    async () => {
      const r = await runPython({
        source: TWO_SUM,
        entry: 'two_sum',
        args: [[2, 7, 11, 15], 9],
      });

      expect(r.ok).toBe(true);
      expect(r.value).toEqual([0, 1]);
    },
    LOAD_TIMEOUT,
  );

  it(
    'reports a runtime error without crashing the host',
    async () => {
      const r = await runPython({
        source: 'def boom():\n    raise ValueError("kaboom")\n',
        entry: 'boom',
        args: [],
      });

      expect(r.ok).toBe(false);
      expect(r.error).toMatch(/kaboom/);
    },
    LOAD_TIMEOUT,
  );

  it(
    'emits ordered line events carrying variable state',
    async () => {
      const r = await runPython({
        source: TWO_SUM,
        entry: 'two_sum',
        args: [[2, 7, 11, 15], 9],
        trace: true,
      });

      const lines = r.events.filter((e) => e.kind === 'line');
      expect(lines.length).toBeGreaterThan(0);
      expect(lines.some((e) => 'i' in e.vars)).toBe(true);
    },
    LOAD_TIMEOUT,
  );

  it(
    'emits array index reads for subscript access',
    async () => {
      const r = await runPython({
        source: TWO_SUM,
        entry: 'two_sum',
        args: [[2, 7, 11, 15], 9],
        trace: true,
      });

      const reads = r.events.filter((e) => e.kind === 'array_read');
      expect(reads.length).toBeGreaterThan(0);
      expect(reads[0]).toMatchObject({ array: 'nums', index: 0, value: 2 });
    },
    LOAD_TIMEOUT,
  );

  it(
    'emits array index writes for subscript assignment',
    async () => {
      const r = await runPython({
        source: 'def bump(xs):\n    xs[1] = 99\n    return xs\n',
        entry: 'bump',
        args: [[1, 2, 3]],
        trace: true,
      });

      expect(r.events).toContainEqual({
        kind: 'array_write',
        array: 'xs',
        index: 1,
        value: 99,
      });
    },
    LOAD_TIMEOUT,
  );

  it(
    'terminates an infinite loop at the deadline',
    async () => {
      const started = Date.now();
      const r = await runPython({
        source: 'def spin():\n    while True:\n        pass\n',
        entry: 'spin',
        args: [],
        timeoutMs: 500,
      });
      const elapsed = Date.now() - started;

      expect(r.timedOut).toBe(true);
      expect(r.ok).toBe(false);
      expect(elapsed).toBeLessThan(30_000);
    },
    LOAD_TIMEOUT,
  );

  it(
    'leaves tracing off by default so a plain test run pays no trace cost',
    async () => {
      const r = await runPython({
        source: TWO_SUM,
        entry: 'two_sum',
        args: [[2, 7, 11, 15], 9],
      });

      expect(r.events).toEqual([]);
    },
    LOAD_TIMEOUT,
  );
});
