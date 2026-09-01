import { describe, expect, it } from 'vitest';
import { stripTypeScriptTypes, runTypeScript } from '@/lib/runtime/typescript';

describe('TypeScript Runtime Adapter (stripTypeScriptTypes)', () => {
  it('strips parameter and return types while preserving function signature', () => {
    const tsCode = `function twoSum(nums: number[], target: number): number[] {
  const seen: Map<number, number> = new Map();
  for (let i: number = 0; i < nums.length; i++) {
    const complement: number = target - nums[i]!;
    if (seen.has(complement)) {
      return [seen.get(complement)!, i] as number[];
    }
    seen.set(nums[i]!, i);
  }
  return [];
}`;

    const jsCode = stripTypeScriptTypes(tsCode);
    expect(jsCode).not.toContain(': number[]');
    expect(jsCode).not.toContain(': Map<number, number>');
    expect(jsCode).not.toContain(' as number[]');
    expect(jsCode).toContain('function twoSum(nums, target) {');
    expect(jsCode).toContain('const seen = new Map();');
  });

  it('preserves line counts so visualizer line stepping matches 1:1', () => {
    const tsCode = `interface Candidate {
  id: string;
  score: number;
}

type Mode = 'active' | 'passive';

function evaluate(val: number): boolean {
  let res: boolean = val > 10;
  return res;
}`;

    const jsCode = stripTypeScriptTypes(tsCode);
    const tsLineCount = tsCode.split('\n').length;
    const jsLineCount = jsCode.split('\n').length;

    expect(jsLineCount).toBe(tsLineCount);
  });

  it('executes typed TypeScript code inside the QuickJS sandbox', async () => {
    const tsCode = `interface Pair {
  first: number;
  second: number;
}

function sumPairs(nums: number[]): number {
  let total: number = 0;
  for (let i: number = 0; i < nums.length; i++) {
    total += nums[i]!;
  }
  return total;
}`;

    const result = await runTypeScript({
      source: tsCode,
      entry: 'sumPairs',
      args: [[10, 20, 30, 40]],
    });

    expect(result.ok).toBe(true);
    expect(result.value).toBe(100);
    expect(result.error).toBeUndefined();
  });
});
