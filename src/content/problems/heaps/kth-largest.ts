import type { ProblemInput } from '../../schema';

export const kthLargest: ProblemInput = {
  tier: 'problem',
  slug: "kth-largest",
  topic: "heaps",
  difficulty: "core",
  title: "Kth Largest Element",
  companies: ["Amazon", "Meta", "Google"],
  recommendedAfter: ["heaps"],

  brief: "Return the `k`th largest value in `nums` (1-indexed, so `k = 1` is the maximum).\n\n```\nfindKthLargest([3, 2, 1, 5, 6, 4], 2)  ->  5\n```",

  hints: [
    "Sorting the whole array works and is O(n log n). What is the smallest amount of the array you actually need ordered?",
    "Keep only the k largest seen so far. Anything smaller than all of them can be discarded immediately.",
    "A min-heap of size k gives that: the smallest of your k best sits on top, ready to be evicted.",
  ],

  starterCode: {
    javascript: "function findKthLargest(nums, k) {\n  // TODO: kth largest value.\n  return 0;\n}",
    python: "def find_kth_largest(nums, k):\n    # TODO: kth largest value.\n    return 0",
  },

  referenceSolution: {
    javascript: "function findKthLargest(nums, k) {\n  const sorted = nums.slice().sort((a, b) => b - a);\n  return sorted[k - 1];\n}",
    python: "def find_kth_largest(nums, k):\n    ordered = sorted(nums, reverse=True)\n    return ordered[k - 1]",
  },

  complexity: {
    time: "O(n log n) as written; O(n log k) with a size-k heap",
    space: "O(n) as written; O(k) with a heap",
    note: "The sorting solution passes and is worth writing first. The heap version is the interview answer: you never need the whole array ordered, only the top k.",
  },

  testSpec: {
    entry: "findKthLargest",
    entryByLanguage: { python: "find_kth_largest" },
    cases: [
        { name: "second largest", args: [[3, 2, 1, 5, 6, 4], 2], expected: 5 },
        { name: "largest", args: [[3, 2, 1], 1], expected: 3 },
        { name: "with duplicates", args: [[3, 3, 3], 2], expected: 3 },
        { name: "smallest", args: [[7, 1, 9], 3], expected: 1, hidden: true },
    ],
  },
};
