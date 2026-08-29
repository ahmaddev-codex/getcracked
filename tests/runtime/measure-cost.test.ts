import { describe, expect, it } from 'vitest';
import { measureRun } from '@/lib/runtime/measure';

describe('measureRun', () => {
  const LINEAR = `function total(nums) {
  let s = 0;
  for (let i = 0; i < nums.length; i++) { s += nums[i]; }
  return s;
}`;

  it('counts array reads proportional to input size', async () => {
    const small = await measureRun({ source: LINEAR, entry: 'total', args: [Array.from({length: 10}, (_, i) => i)] });
    const large = await measureRun({ source: LINEAR, entry: 'total', args: [Array.from({length: 100}, (_, i) => i)] });

    expect(small!.arrayReads).toBe(10);
    expect(large!.arrayReads).toBe(100);
  }, 60_000);

  it('counts statements executed', async () => {
    const m = await measureRun({ source: LINEAR, entry: 'total', args: [[1, 2, 3]] });
    expect(m!.steps).toBeGreaterThan(3);
  }, 60_000);

  it('counts array writes separately from reads', async () => {
    const m = await measureRun({
      source: 'function fill(xs) { for (let i = 0; i < xs.length; i++) { xs[i] = i; } return xs; }',
      entry: 'fill',
      args: [[0, 0, 0]],
    });
    expect(m!.arrayWrites).toBe(3);
  }, 60_000);

  it('reports interpreter memory', async () => {
    const m = await measureRun({ source: LINEAR, entry: 'total', args: [[1]] });
    expect(m!.memoryBytes).toBeGreaterThan(0);
  }, 60_000);

  it('returns null rather than a partial measurement when the entry is not found', async () => {
    const m = await measureRun({ source: 'const f = () => 1;', entry: 'f', args: [] });
    expect(m).toBeNull();
  }, 60_000);

  it('returns null for unparseable source', async () => {
    expect(await measureRun({ source: 'function {{{', entry: 'f', args: [] })).toBeNull();
  }, 60_000);
});
