import type { ProblemInput } from '../../schema';

export const removeDuplicates: ProblemInput = {
  tier: 'problem',
  slug: "remove-duplicates",
  topic: "two-pointers",
  difficulty: "medium",
  title: "Remove Duplicates from Sorted Array",
  companies: ["Meta", "Microsoft"],
  recommendedAfter: ["two-pointers"],

  brief: "Given a **sorted** array, remove duplicates in place so each value appears once. Return the array truncated to the unique values.\n\n```\nremoveDuplicates([1, 1, 2, 3, 3])  ->  [1, 2, 3]\n```",

  hints: [
    "Because the array is sorted, duplicates are always adjacent.",
    "Keep a write pointer for where the next unique value goes, and a read pointer scanning ahead.",
    "Only advance the write pointer when the value differs from the last one you kept.",
  ],

  starterCode: {
    javascript: "function removeDuplicates(nums) {\n  // TODO: keep each value once, in place.\n  return nums;\n}",
    python: "def remove_duplicates(nums):\n    # TODO: keep each value once, in place.\n    return nums",
  },

  referenceSolution: {
    javascript: "function removeDuplicates(nums) {\n  if (nums.length === 0) return [];\n  let write = 1;\n  for (let read = 1; read < nums.length; read++) {\n    if (nums[read] !== nums[write - 1]) {\n      nums[write] = nums[read];\n      write++;\n    }\n  }\n  return nums.slice(0, write);\n}",
    python: "def remove_duplicates(nums):\n    if len(nums) == 0:\n        return []\n    write = 1\n    for read in range(1, len(nums)):\n        if nums[read] != nums[write - 1]:\n            nums[write] = nums[read]\n            write += 1\n    return nums[:write]",
  },

  complexity: {
    time: "O(n)",
    space: "O(1) extra",
    note: "Same-direction pointers at different speeds. Building a new array would be O(n) space; the in-place version is the point of the exercise.",
  },

  testSpec: {
    entry: "removeDuplicates",
    entryByLanguage: { python: "remove_duplicates" },
    cases: [
        { name: "with duplicates", args: [[1, 1, 2, 3, 3]], expected: [1, 2, 3] },
        { name: "all same", args: [[2, 2, 2]], expected: [2] },
        { name: "already unique", args: [[1, 2, 3]], expected: [1, 2, 3] },
        { name: "empty", args: [[]], expected: [], hidden: true },
    ],
  },
};
