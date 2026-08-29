import type { LessonInput } from '../schema';

export const arraysLesson: LessonInput = {
  tier: 'lesson',
  slug: "arrays",
  order: 1,
  title: "Arrays & Traversal",
  summary: "The one pass that replaces the nested loop.",

  explainer: "An array gives you two things in constant time: the element at an index, and\nthe length. Almost every array technique is about turning a problem that *looks*\nlike it needs to compare everything with everything into one that needs a single\nwalk.\n\nThe tell is a nested loop where the inner one is doing bookkeeping rather than\nreal work \u2014 counting, searching for a partner, tracking a running best. That\ninner loop is usually replaceable by state you carry along.\n\n```\n// O(n^2): the inner loop re-derives what you already passed\nfor i in range(n):\n    for j in range(i):\n        ...\n\n// O(n): carry the answer with you\nrunning = initial\nfor i in range(n):\n    running = combine(running, a[i])\n```\n\nThe three shapes worth recognising: a **running aggregate** (prefix sums, max so\nfar), a **decision per element** (extend or restart, as in Kadane's), and\n**two indices moving independently** \u2014 which is its own topic.",

  walkthrough: {
    entry: "runningSum",
    entryByLanguage: { python: 'running_sum' },
    source: {
      javascript: "function runningSum(nums) {\n  let total = 0;\n  for (let i = 0; i < nums.length; i++) {\n    total = total + nums[i];\n    nums[i] = total;\n  }\n  return nums;\n}",
      python: `def running_sum(nums):
    total = 0
    for i in range(len(nums)):
        total = total + nums[i]
        nums[i] = total
    return nums`,
    },
    visual: 'array',
    args: [[3, 1, 4, 1, 5]],
    caption: "A single pass carrying a running total \u2014 watch the write follow the read one step behind.",
  },

  complexity: {
    time: "O(n) for a single pass",
    space: "O(1) if you carry state, O(n) if you build an output array",
    note: "Nested loops over the same array are the signal. The question to ask is what the inner loop actually needs \u2014 often it is one number you could have been tracking all along.",
  },

  patternCues: [
    "You wrote a nested loop and the inner one only searches or counts.",
    "The problem says 'contiguous' or 'subarray'.",
    "You need a running total, running maximum, or a comparison against everything seen so far.",
    "The naive solution is O(n^2) and the input size suggests that will not pass.",
  ],

  pitfalls: [
    {
      title: "Reading past the end",
      body: "`a[a.length]` is undefined in JavaScript and an IndexError in Python. Loop conditions using `<=` are the usual cause.",
    },
    {
      title: "Mutating while iterating",
      body: "Removing elements during a forward loop shifts everything after the removal, so the next element is skipped. Build a new array or walk backwards.",
    },
    {
      title: "Assuming non-empty",
      body: "An empty array breaks `a[0]` and any 'best so far' seeded from the first element. Decide what the answer is for an empty input before you write the loop.",
    },
  ],

  recommendedAfter: [],
};
