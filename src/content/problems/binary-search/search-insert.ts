import type { ProblemInput } from '../../schema';

export const searchInsert: ProblemInput = {
  tier: 'problem',
  slug: "search-insert",
  topic: "binary-search",
  difficulty: "medium",
  title: "Search Insert Position",
  companies: ["Amazon", "Adobe"],
  recommendedAfter: ["binary-search"],

  brief: "Return the index of `target` in the sorted array, or the index where it would be inserted to keep it sorted.\n\n```\nsearchInsert([1, 3, 5, 6], 5)  ->  2\nsearchInsert([1, 3, 5, 6], 2)  ->  1\n```",

  hints: [
    "This is binary search, but the answer when the target is absent is where the search ended.",
    "When the loop exits, `low` is sitting exactly at the insertion point.",
  ],

  starterCode: {
    javascript: "function searchInsert(nums, target) {\n  // TODO: index of target, or where it belongs.\n  return 0;\n}",
    python: "def search_insert(nums, target):\n    # TODO: index of target, or where it belongs.\n    return 0",
  },

  referenceSolution: {
    javascript: "function searchInsert(nums, target) {\n  let low = 0;\n  let high = nums.length - 1;\n  while (low <= high) {\n    const mid = low + Math.floor((high - low) / 2);\n    if (nums[mid] === target) return mid;\n    if (nums[mid] < target) low = mid + 1;\n    else high = mid - 1;\n  }\n  return low;\n}",
    python: "def search_insert(nums, target):\n    low = 0\n    high = len(nums) - 1\n    while low <= high:\n        mid = low + (high - low) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[mid] < target:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return low",
  },

  complexity: {
    time: "O(log n)",
    space: "O(1)",
    note: "The only change from plain binary search is returning `low` instead of -1 \u2014 the position the search converged on.",
  },

  testSpec: {
    entry: "searchInsert",
    entryByLanguage: { python: "search_insert" },
    cases: [
        { name: "found", args: [[1, 3, 5, 6], 5], expected: 2 },
        { name: "insert middle", args: [[1, 3, 5, 6], 2], expected: 1 },
        { name: "insert end", args: [[1, 3, 5, 6], 7], expected: 4 },
        { name: "insert start", args: [[1, 3, 5, 6], 0], expected: 0, hidden: true },
    ],
  },
};
