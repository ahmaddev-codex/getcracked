import { describe, expect, it } from 'vitest';
import { runJavaScript } from '@/lib/runtime/javascript';

const TWO_SUM = `
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`;

describe('runJavaScript', () => {
  it('executes learner code and returns its value', async () => {
    const r = await runJavaScript({
      source: TWO_SUM,
      entry: 'twoSum',
      args: [[2, 7, 11, 15], 9],
    });

    expect(r.ok).toBe(true);
    expect(r.value).toEqual([0, 1]);
  });

  it('reports a runtime error without crashing the host', async () => {
    const r = await runJavaScript({
      source: 'function boom() { throw new Error("kaboom"); }',
      entry: 'boom',
      args: [],
    });

    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/kaboom/);
  });

  it('emits ordered line events carrying variable state', async () => {
    const r = await runJavaScript({
      source: TWO_SUM,
      entry: 'twoSum',
      args: [[2, 7, 11, 15], 9],
      trace: true,
    });

    const lines = r.events.filter((e) => e.kind === 'line');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((e) => 'i' in e.vars)).toBe(true);
  });

  it('emits array index reads for subscript access', async () => {
    const r = await runJavaScript({
      source: TWO_SUM,
      entry: 'twoSum',
      args: [[2, 7, 11, 15], 9],
      trace: true,
    });

    const reads = r.events.filter((e) => e.kind === 'array_read');
    expect(reads.length).toBeGreaterThan(0);
    expect(reads[0]).toMatchObject({ array: 'nums', index: 0, value: 2 });
  });

  it('emits array index writes for subscript assignment', async () => {
    const r = await runJavaScript({
      source: 'function bump(xs) { xs[1] = 99; return xs; }',
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
  });

  it('terminates an infinite loop via the interrupt handler', async () => {
    const started = Date.now();
    const r = await runJavaScript({
      source: 'function spin() { while (true) {} }',
      entry: 'spin',
      args: [],
      timeoutMs: 250,
    });
    const elapsed = Date.now() - started;

    expect(r.timedOut).toBe(true);
    expect(r.ok).toBe(false);
    // Proves the interrupt actually fired rather than the promise hanging.
    expect(elapsed).toBeLessThan(5000);
  });

  it('leaves tracing off by default so a plain test run pays no trace cost', async () => {
    const r = await runJavaScript({
      source: TWO_SUM,
      entry: 'twoSum',
      args: [[2, 7, 11, 15], 9],
    });

    expect(r.events).toEqual([]);
  });
});
