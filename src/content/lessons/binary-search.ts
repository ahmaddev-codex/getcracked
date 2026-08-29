import type { LessonInput } from '../schema';

export const binarySearchLesson: LessonInput = {
  tier: 'lesson',
  slug: "binary-search",
  order: 6,
  title: "Binary Search",
  summary: "Halve the search space with every comparison.",

  explainer: "Binary search needs one property: the ability to discard half the remaining\ncandidates after a single comparison. On a sorted array that comes free, since\ncomparing against the middle tells you which half the target cannot be in.\n\nThe version most people can write from memory is finding an exact value. The\nversion that shows up in interviews is **searching for a boundary** \u2014 the first\nelement satisfying some condition, the insertion point, the smallest workable\nanswer. Same halving, different exit condition.\n\nThat generalisation is the useful one: the array does not have to be the thing\nyou search. If you can ask \"is `x` big enough?\" and the answer is monotonic \u2014\nfalse, false, false, true, true \u2014 you can binary search over the *answer space*,\nnot the input.\n\n```\nlow, high = smallest_possible, largest_possible\nwhile low < high:\n    mid = low + (high - low) // 2\n    if feasible(mid): high = mid\n    else:             low = mid + 1\nreturn low\n```",

  walkthrough: {
    entry: "search",
    source: {
      javascript: "function search(nums, target) {\n  let low = 0;\n  let high = nums.length - 1;\n  while (low <= high) {\n    const mid = low + Math.floor((high - low) / 2);\n    const value = nums[mid];\n    if (value === target) {\n      return mid;\n    }\n    if (value < target) {\n      low = mid + 1;\n    } else {\n      high = mid - 1;\n    }\n  }\n  return -1;\n}",
      python: `def search(nums, target):
    low = 0
    high = len(nums) - 1
    while low <= high:
        mid = low + (high - low) // 2
        value = nums[mid]
        if value == target:
            return mid
        if value < target:
            low = mid + 1
        else:
            high = mid - 1
    return -1`,
    },
    visual: 'array',
    args: [[1, 3, 5, 7, 9, 11, 13, 15], 13],
    caption: "Eight elements, three comparisons. Watch low and high close in \u2014 each read discards half of what is left.",
  },

  complexity: {
    time: "O(log n)",
    space: "O(1) iteratively, O(log n) recursively",
    note: "About 20 steps for a million elements, 30 for a billion. The recursive form costs stack frames the iterative one does not.",
  },

  patternCues: [
    "The input is sorted, or can be sorted without losing what you need.",
    "You are asked for a boundary: first, last, smallest that works, largest that fits.",
    "The answer space is numeric and the feasibility test is monotonic.",
    "The input is large enough that O(n) is being ruled out deliberately.",
  ],

  pitfalls: [
    {
      title: "The overflow-prone midpoint",
      body: "`(low + high) / 2` can overflow in fixed-width integer languages. `low + (high - low) / 2` cannot, and costs nothing.",
    },
    {
      title: "The wrong loop condition",
      body: "`while (low <= high)` and `while (low < high)` terminate on different states and suit different problems. Pick one deliberately, then check what the surviving index means.",
    },
    {
      title: "Not moving the bounds",
      body: "Setting `low = mid` rather than `mid + 1` can leave the range unchanged and loop forever. Every branch must shrink the range.",
    },
  ],

  recommendedAfter: ["arrays"],
};
