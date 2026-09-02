import { describe, it, expect } from 'vitest';
import { runTestSpec } from '@/content/test-runner';
import { stripTypeScriptTypes } from '@/lib/runtime/typescript';

describe('TypeScript Code Runner', () => {
  it('strips TypeScript type annotations while preserving code semantics', () => {
    const tsCode = `
interface User {
  id: number;
  name: string;
}

type ID = string | number;

function solve(nums: number[], target: number): number[] {
  const result: number[] = [];
  const map: Map<number, number> = new Map();
  for (let i: number = 0; i < nums.length; i++) {
    result.push(nums[i]!);
  }
  return result as number[];
}
`;
    const stripped = stripTypeScriptTypes(tsCode);
    expect(stripped).not.toContain('interface User');
    expect(stripped).not.toContain('type ID');
    expect(stripped).not.toContain(': number[]');
    expect(stripped).toContain('function solve(');
  });

  it('runs TypeScript code successfully through QuickJS WASM test runner', async () => {
    const tsSolution = `
function twoSum(nums: number[], target: number): number[] {
  const map: Map<number, number> = new Map();
  for (let i: number = 0; i < nums.length; i++) {
    const complement: number = target - nums[i]!;
    if (map.has(complement)) {
      return [map.get(complement)!, i];
    }
    map.set(nums[i]!, i);
  }
  return [];
}
`;

    const result = await runTestSpec({
      spec: {
        entry: 'twoSum',
        cases: [
          { name: 'basic', args: [[2, 7, 11, 15], 9], expected: [0, 1], hidden: false },
          { name: 'zeroes', args: [[0, 4, 3, 0], 0], expected: [0, 3], hidden: false },
        ],
      },
      source: tsSolution,
      language: 'typescript',
    });

    expect(result.passed).toBe(true);
    expect(result.cases.length).toBe(2);
    expect(result.cases[0].passed).toBe(true);
    expect(result.cases[1].passed).toBe(true);
  });

  it('reports errors accurately when TypeScript code fails test cases', async () => {
    const failingTs = `
function add(a: number, b: number): number {
  return (a - b) as number;
}
`;

    const result = await runTestSpec({
      spec: {
        entry: 'add',
        cases: [{ name: 'addition', args: [2, 3], expected: 5, hidden: false }],
      },
      source: failingTs,
      language: 'typescript',
    });

    expect(result.passed).toBe(false);
    expect(result.cases[0].passed).toBe(false);
  });
});
