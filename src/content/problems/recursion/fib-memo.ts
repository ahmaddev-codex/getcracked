import type { ProblemInput } from '../../schema';

export const fibMemo: ProblemInput = {
  tier: 'problem',
  slug: "fib-memo",
  topic: "recursion",
  difficulty: "core",
  title: "Fibonacci with Memoisation",
  companies: ["Amazon"],
  recommendedAfter: ["recursion"],

  brief: "Return the `n`th Fibonacci number, where `fib(0) = 0` and `fib(1) = 1`.\n\n```\nfib(10)  ->  55\n```",

  hints: [
    "The naive recursion recomputes the same values exponentially often. Draw the call tree for fib(5) and count how many times fib(2) appears.",
    "Cache each result the first time you compute it, keyed by n.",
    "With the cache, every n from 0 to the target is computed exactly once.",
  ],

  starterCode: {
    javascript: "function fib(n) {\n  // TODO: nth Fibonacci number.\n  return 0;\n}",
    python: "def fib(n):\n    # TODO: nth Fibonacci number.\n    return 0",
  },

  referenceSolution: {
    javascript: "function fib(n) {\n  const memo = {};\n  function go(k) {\n    if (k <= 1) return k;\n    if (memo[k] !== undefined) return memo[k];\n    memo[k] = go(k - 1) + go(k - 2);\n    return memo[k];\n  }\n  return go(n);\n}",
    python: "def fib(n):\n    memo = {}\n\n    def go(k):\n        if k <= 1:\n            return k\n        if k in memo:\n            return memo[k]\n        memo[k] = go(k - 1) + go(k - 2)\n        return memo[k]\n\n    return go(n)",
  },

  complexity: {
    time: "O(n)",
    space: "O(n)",
    note: "Without the cache this is O(2^n) \u2014 fib(50) would take longer than the exercise timeout. The cache is the entire difference.",
  },

  testSpec: {
    entry: "fib",
    entryByLanguage: { python: "fib" },
    cases: [
        { name: "base zero", args: [0], expected: 0 },
        { name: "base one", args: [1], expected: 1 },
        { name: "small", args: [10], expected: 55 },
        { name: "larger", args: [30], expected: 832040 },
        { name: "mid", args: [20], expected: 6765, hidden: true },
    ],
  },
};
