import type { ProblemInput } from '../../schema';

export const climbStairs: ProblemInput = {
  tier: 'problem',
  slug: "climb-stairs",
  topic: "dynamic-programming",
  difficulty: "easy",
  title: "Climbing Stairs",
  companies: ["Amazon", "Adobe"],
  recommendedAfter: ["dynamic-programming", "recursion"],

  brief: "You climb 1 or 2 steps at a time. Return how many distinct ways there are to reach step `n`.\n\n```\nclimbStairs(3)  ->  3\n```",

  hints: [
    "To reach step n you arrived from n-1 or from n-2. So the count for n is the sum of those two.",
    "That is the Fibonacci recurrence with different base cases \u2014 check what ways(1) and ways(2) should be.",
    "You only ever need the last two values, so an array is optional.",
  ],

  starterCode: {
    javascript: "function climbStairs(n) {\n  // TODO: number of distinct ways to reach step n.\n  return 0;\n}",
    python: "def climb_stairs(n):\n    # TODO: number of distinct ways to reach step n.\n    return 0",
  },

  referenceSolution: {
    javascript: "function climbStairs(n) {\n  if (n <= 2) return n;\n  let a = 1;\n  let b = 2;\n  for (let i = 3; i <= n; i++) {\n    const next = a + b;\n    a = b;\n    b = next;\n  }\n  return b;\n}",
    python: "def climb_stairs(n):\n    if n <= 2:\n        return n\n    a, b = 1, 2\n    for _ in range(3, n + 1):\n        a, b = b, a + b\n    return b",
  },

  complexity: {
    time: "O(n)",
    space: "O(1)",
    note: "The naive recursion is O(2^n). Keeping two variables instead of a table drops the space from O(n) to constant.",
  },

  testSpec: {
    entry: "climbStairs",
    entryByLanguage: { python: "climb_stairs" },
    cases: [
        { name: "one step", args: [1], expected: 1 },
        { name: "two steps", args: [2], expected: 2 },
        { name: "three steps", args: [3], expected: 3 },
        { name: "ten steps", args: [10], expected: 89 },
        { name: "five steps", args: [5], expected: 8, hidden: true },
    ],
  },
};
