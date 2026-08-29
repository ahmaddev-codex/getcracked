import type { ProblemInput } from '../../schema';

export const maxSumSubarrayK: ProblemInput = {
  tier: 'problem',
  slug: "max-sum-subarray-k",
  topic: "sliding-window",
  difficulty: "warm-up",
  title: "Maximum Sum of Size K",
  companies: ["Amazon"],
  recommendedAfter: ["sliding-window"],

  brief: "Return the largest sum of any contiguous subarray of exactly length `k`.\n\n```\nmaxSumK([2, 1, 5, 1, 3, 2], 3)  ->  9\n```",

  hints: [
    "Recomputing each window from scratch repeats almost all the work.",
    "Slide: add the element entering the window and subtract the one leaving it.",
  ],

  starterCode: {
    javascript: "function maxSumK(nums, k) {\n  // TODO: largest sum of any window of length k.\n  return 0;\n}",
    python: "def max_sum_k(nums, k):\n    # TODO: largest sum of any window of length k.\n    return 0",
  },

  referenceSolution: {
    javascript: "function maxSumK(nums, k) {\n  if (nums.length < k || k <= 0) return 0;\n  let sum = 0;\n  for (let i = 0; i < k; i++) sum += nums[i];\n  let best = sum;\n  for (let i = k; i < nums.length; i++) {\n    sum += nums[i] - nums[i - k];\n    if (sum > best) best = sum;\n  }\n  return best;\n}",
    python: "def max_sum_k(nums, k):\n    if len(nums) < k or k <= 0:\n        return 0\n    total = 0\n    for i in range(k):\n        total += nums[i]\n    best = total\n    for i in range(k, len(nums)):\n        total += nums[i] - nums[i - k]\n        if total > best:\n            best = total\n    return best",
  },

  complexity: {
    time: "O(n)",
    space: "O(1)",
    note: "Fixed-size window. Recomputing each window is O(n\u00b7k); sliding reuses all but two elements of the previous sum.",
  },

  testSpec: {
    entry: "maxSumK",
    entryByLanguage: { python: "max_sum_k" },
    cases: [
        { name: "classic", args: [[2, 1, 5, 1, 3, 2], 3], expected: 9 },
        { name: "k equals length", args: [[1, 2, 3], 3], expected: 6 },
        { name: "k too large", args: [[1, 2], 5], expected: 0 },
        { name: "negatives", args: [[-1, -2, -3], 2], expected: -3, hidden: true },
    ],
  },
};
