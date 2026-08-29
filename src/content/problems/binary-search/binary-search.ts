import type { ProblemInput } from '../../schema';

export const binarySearch: ProblemInput = {
  tier: 'problem',
  slug: "binary-search",
  topic: "binary-search",
  difficulty: "warm-up",
  title: "Binary Search",
  companies: ["Amazon", "Microsoft"],
  recommendedAfter: ["binary-search"],

  brief: "Return the index of `target` in the **sorted** array `nums`, or `-1`.\n\n```\nsearch([-1, 0, 3, 5, 9, 12], 9)  ->  4\n```",

  hints: [
    "Compare against the middle. Half the array is eliminated by that one comparison.",
    "Keep low and high as the bounds of what is still possible, and move exactly one of them each step.",
    "Compute the midpoint as low + (high - low) / 2 rather than (low + high) / 2, which can overflow in languages with fixed-width integers.",
  ],

  starterCode: {
    javascript: "function search(nums, target) {\n  // TODO: index of target, or -1.\n  return -1;\n}",
    python: "def search(nums, target):\n    # TODO: index of target, or -1.\n    return -1",
  },

  referenceSolution: {
    javascript: "function search(nums, target) {\n  let low = 0;\n  let high = nums.length - 1;\n  while (low <= high) {\n    const mid = low + Math.floor((high - low) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return -1;\n}",
    python: "def search(nums, target):\n    low = 0\n    high = len(nums) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1",
  },

  complexity: {
    time: "O(log n)",
    space: "O(1)",
    note: "Each comparison halves the search space, so 1,000,000 elements need about 20 steps.",
  },

  testSpec: {
    entry: "search",
    entryByLanguage: { python: "search" },
    cases: [
        { name: "found", args: [[-1, 0, 3, 5, 9, 12], 9], expected: 4 },
        { name: "missing", args: [[-1, 0, 3, 5, 9, 12], 2], expected: -1 },
        { name: "first", args: [[1, 2, 3], 1], expected: 0 },
        { name: "empty", args: [[], 1], expected: -1 },
        { name: "last", args: [[1, 2, 3], 3], expected: 2, hidden: true },
    ],
  },
};
