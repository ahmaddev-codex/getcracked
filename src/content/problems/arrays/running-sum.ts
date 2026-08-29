import type { ProblemInput } from '../../schema';

export const runningSum: ProblemInput = {
  tier: 'problem',
  slug: "running-sum",
  topic: "arrays",
  difficulty: "warm-up",
  title: "Running Sum",
  companies: ["Amazon"],
  recommendedAfter: ["arrays"],

  brief: "Return an array where each element is the sum of all elements up to and including that index.\n\n```\nrunningSum([1, 2, 3, 4])  ->  [1, 3, 6, 10]\n```",

  hints: [
    "Each answer is the previous answer plus the current element.",
    "You do not need a nested loop \u2014 carry a running total as you go.",
  ],

  starterCode: {
    javascript: "function runningSum(nums) {\n  // TODO: return the running totals.\n  return [];\n}",
    python: "def running_sum(nums):\n    # TODO: return the running totals.\n    return []",
  },

  referenceSolution: {
    javascript: "function runningSum(nums) {\n  const out = [];\n  let total = 0;\n  for (let i = 0; i < nums.length; i++) {\n    total += nums[i];\n    out.push(total);\n  }\n  return out;\n}",
    python: "def running_sum(nums):\n    out = []\n    total = 0\n    for i in range(len(nums)):\n        total += nums[i]\n        out.append(total)\n    return out",
  },

  complexity: {
    time: "O(n)",
    space: "O(n)",
    note: "One pass, and the output array is the only extra space. Recomputing each prefix from scratch would be O(n^2).",
  },

  testSpec: {
    entry: "runningSum",
    entryByLanguage: { python: "running_sum" },
    cases: [
        { name: "basic", args: [[1, 2, 3, 4]], expected: [1, 3, 6, 10] },
        { name: "negatives", args: [[3, -1, 2]], expected: [3, 2, 4] },
        { name: "empty", args: [[]], expected: [] },
        { name: "single", args: [[5]], expected: [5], hidden: true },
    ],
  },
};
