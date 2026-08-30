import { describe, expect, it } from 'vitest';
import { javaScriptIndexVariables } from '@/lib/runtime/index-vars';

/**
 * Which variables actually index an array (B2).
 *
 * The visualizer used to decide this by value: any integer in range was drawn
 * as a pointer into the structure. These tests pin the replacement, and the
 * heap case below is the one that motivated it.
 */
describe('javaScriptIndexVariables', () => {
  it('finds a variable used as a subscript', () => {
    expect(javaScriptIndexVariables('function f(a, i) { return a[i]; }')).toEqual({
      a: ['i'],
    });
  });

  it('keeps arrays separate', () => {
    const source = 'function f(a, b, i, j) { return a[i] + b[j]; }';
    expect(javaScriptIndexVariables(source)).toEqual({ a: ['i'], b: ['j'] });
  });

  it('collects every variable that indexes the same array', () => {
    const source = 'function f(a, i, j) { const t = a[i]; a[i] = a[j]; a[j] = t; return a; }';
    expect(javaScriptIndexVariables(source)).toEqual({ a: ['i', 'j'] });
  });

  it('ignores a computed subscript, which names no single position', () => {
    // `a[i + 1]` does not correspond to a variable a learner can watch move, so
    // marking `i` on element i+1 would point at the wrong cell.
    expect(javaScriptIndexVariables('function f(a, i) { return a[i + 1]; }')).toEqual({});
  });

  it('ignores a literal subscript', () => {
    expect(javaScriptIndexVariables('function f(a) { return a[0]; }')).toEqual({});
  });

  it('ignores property access, which is not indexing', () => {
    expect(javaScriptIndexVariables('function f(a) { return a.length; }')).toEqual({});
  });

  it('sees subscripts inside nested functions', () => {
    const source = 'function f(a) { function go(i) { return a[i]; } return go(0); }';
    expect(javaScriptIndexVariables(source)).toEqual({ a: ['i'] });
  });

  it('returns nothing rather than guessing when the source will not parse', () => {
    expect(javaScriptIndexVariables('function (')).toEqual({});
  });

  it('excludes a counter that never indexes anything', () => {
    // The case this exists for. `swaps` is 0 while `i` is 0, and by value alone
    // both looked like pointers at element 0 of the heap.
    const source = `function siftDown(heap) {
      let i = 0;
      let swaps = 0;
      const left = 2 * i + 1;
      if (heap[left] > heap[i]) { swaps = swaps + 1; }
      return swaps;
    }`;

    const found = javaScriptIndexVariables(source);
    expect(found.heap).toContain('i');
    expect(found.heap).toContain('left');
    expect(found.heap ?? []).not.toContain('swaps');
  });
});
