import { describe, it, expect } from 'vitest';
import { runTestSpec } from '@/content/test-runner';
import {
  transpileJava,
  transpileCpp,
  transpileGo,
} from '@/lib/runtime/adapters/compiled-languages';

describe('Compiled Language Runners (Java, C++, Go)', () => {
  describe('Java Runner', () => {
    it('transpiles Java class solution to runnable JS', () => {
      const java = `
class Solution {
    public int maxSubArray(int[] nums) {
        int max = nums[0];
        return max;
    }
}
`;
      const transpiled = transpileJava(java);
      expect(transpiled).toContain('function maxSubArray(');
      expect(transpiled).not.toContain('class Solution');
    });

    it('executes Java code through test runner and passes test cases', async () => {
      const javaCode = `
class Solution {
    public int maxSubArray(int[] nums) {
        int max = nums[0];
        int current = nums[0];
        for (int i = 1; i < nums.length; i++) {
            current = Math.max(nums[i], current + nums[i]);
            max = Math.max(max, current);
        }
        return max;
    }
}
`;
      const result = await runTestSpec({
        spec: {
          entry: 'maxSubArray',
          cases: [
            { name: 'mixed', args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6, hidden: false },
            { name: 'single', args: [[1]], expected: 1, hidden: false },
          ],
        },
        source: javaCode,
        language: 'java',
      });

      expect(result.passed).toBe(true);
      expect(result.cases[0].passed).toBe(true);
    });

    it('catches syntax errors with line numbers', async () => {
      const badJava = `
class Solution {
    public int solve(int x) {
        return (x + 1;
    }
}
`;
      const result = await runTestSpec({
        spec: { entry: 'solve', cases: [{ args: [1], expected: 2, hidden: false }] },
        source: badJava,
        language: 'java',
      });

      expect(result.passed).toBe(false);
      expect(result.cases[0].error).toContain('syntax error');
    });
  });

  describe('C++ Runner', () => {
    it('transpiles C++ function to runnable JS', () => {
      const cpp = `
#include <vector>
using namespace std;

class Solution {
public:
    int sum(vector<int>& nums) {
        int total = 0;
        for (int i = 0; i < nums.size(); i++) {
            total += nums[i];
        }
        return total;
    }
};
`;
      const transpiled = transpileCpp(cpp);
      expect(transpiled).toContain('function sum(');
      expect(transpiled).not.toContain('#include');
    });

    it('executes C++ code and verifies test case output', async () => {
      const cppCode = `
#include <vector>
using namespace std;

class Solution {
public:
    int add(int a, int b) {
        return a + b;
    }
};
`;
      const result = await runTestSpec({
        spec: {
          entry: 'add',
          cases: [{ name: 'simple add', args: [10, 25], expected: 35, hidden: false }],
        },
        source: cppCode,
        language: 'cpp',
      });

      expect(result.passed).toBe(true);
      expect(result.cases[0].passed).toBe(true);
    });
  });

  describe('Go Runner', () => {
    it('transpiles Go function to runnable JS', () => {
      const go = `
package main

func add(a int, b int) int {
    sum := a + b
    return sum
}
`;
      const transpiled = transpileGo(go);
      expect(transpiled).toContain('function add(a, b)');
      expect(transpiled).toContain('let sum =');
    });

    it('executes Go code through test runner and passes test cases', async () => {
      const goCode = `
package main

func multiply(x int, y int) int {
    ans := x * y
    return ans
}
`;
      const result = await runTestSpec({
        spec: {
          entry: 'multiply',
          cases: [{ name: 'mult', args: [6, 7], expected: 42, hidden: false }],
        },
        source: goCode,
        language: 'go',
      });

      expect(result.passed).toBe(true);
      expect(result.cases[0].passed).toBe(true);
    });
  });
});
