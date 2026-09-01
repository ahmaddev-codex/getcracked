import { describe, it, expect } from 'vitest';
import { convertJsToTypeScript } from '@/lib/runtime/type-inference';

describe('convertJsToTypeScript', () => {
  it('converts untyped function declaration into typed TypeScript', () => {
    const js = 'function twoSum(nums, target) {\n  return [];\n}';
    const spec = {
      entry: 'twoSum',
      cases: [{ args: [[2, 7, 11, 15], 9], expected: [0, 1], hidden: false }],
    };

    const ts = convertJsToTypeScript(js, spec);
    expect(ts).toBe('function twoSum(nums: number[], target: number): number[] {\n  return [];\n}');
  });

  it('handles boolean and string parameter types', () => {
    const js = 'function isPalindrome(s) {\n  return true;\n}';
    const spec = {
      entry: 'isPalindrome',
      cases: [{ args: ['racecar'], expected: true, hidden: false }],
    };

    const ts = convertJsToTypeScript(js, spec);
    expect(ts).toBe('function isPalindrome(s: string): boolean {\n  return true;\n}');
  });
});
