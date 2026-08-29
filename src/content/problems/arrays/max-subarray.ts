import type { ProblemInput } from '../../schema';

export const maxSubarray: ProblemInput = {
  tier: 'problem',
  slug: "max-subarray",
  topic: "arrays",
  difficulty: "core",
  title: "Maximum Subarray",
  companies: ["Amazon", "Microsoft", "Meta"],
  recommendedAfter: ["arrays"],

  brief: "Return the largest sum obtainable from any contiguous subarray of `nums`. The array has at least one element.\n\n```\nmaxSubarray([-2, 1, -3, 4, -1, 2, 1, -5, 4])  ->  6\n```",

  hints: [
    "At each element you have one decision: extend the subarray you are on, or start fresh from here.",
    "Start fresh when the running sum has gone negative \u2014 a negative prefix can only hurt what follows.",
    "Track the best you have ever seen separately from the sum you are currently building.",
  ],

  starterCode: {
    javascript: "function maxSubarray(nums) {\n  // TODO: return the largest contiguous sum.\n  return 0;\n}",
    python: "def max_subarray(nums):\n    # TODO: return the largest contiguous sum.\n    return 0",
  },

  referenceSolution: {
    javascript: "function maxSubarray(nums) {\n  let best = nums[0];\n  let current = nums[0];\n  for (let i = 1; i < nums.length; i++) {\n    current = Math.max(nums[i], current + nums[i]);\n    best = Math.max(best, current);\n  }\n  return best;\n}",
    python: "def max_subarray(nums):\n    best = nums[0]\n    current = nums[0]\n    for i in range(1, len(nums)):\n        current = max(nums[i], current + nums[i])\n        best = max(best, current)\n    return best",
  },

  complexity: {
    time: "O(n)",
    space: "O(1)",
    note: "Kadane's algorithm. The brute force over every pair of endpoints is O(n^2); the insight that kills the inner loop is that a negative running sum is never worth keeping.",
  },

  testSpec: {
    entry: "maxSubarray",
    entryByLanguage: { python: "max_subarray" },
    cases: [
        { name: "mixed", args: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
        { name: "all negative", args: [[-3, -1, -2]], expected: -1 },
        { name: "all positive", args: [[1, 2, 3]], expected: 6 },
        { name: "single", args: [[7]], expected: 7, hidden: true },
    ],
  },
};
