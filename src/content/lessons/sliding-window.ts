import type { LessonInput } from '../schema';

export const slidingWindowLesson: LessonInput = {
  tier: 'lesson',
  slug: "sliding-window",
  order: 4,
  title: "Sliding Window",
  summary: "Reuse the previous window instead of recomputing it.",

  explainer: "A sliding window is the specialisation of two pointers for problems about\n**contiguous** runs. Both indices move forward; the span between them is the\nwindow.\n\nThe insight is subtraction. Moving a window one step right adds one element and\nremoves one \u2014 everything else is unchanged. Recomputing the whole window each\ntime throws away that overlap and turns O(n) into O(n\u00b7k).\n\nTwo variants:\n\n- **Fixed size.** The window is always k wide. Add the entering element,\n  subtract the leaving one.\n- **Variable size.** The window grows from the right until it violates a\n  condition, then shrinks from the left until it is valid again. Each index\n  enters once and leaves once, so it is still linear despite the nested `while`.\n\nThe variable form is where people misjudge the complexity. The inner loop looks\nquadratic, but the left edge only ever moves forward \u2014 it cannot do more total\nwork than the right edge did.",

  walkthrough: {
    entry: "maxSumWindow",
    source: {
      javascript: "function maxSumWindow(nums, k) {\n  let sum = 0;\n  for (let i = 0; i < k; i++) {\n    sum = sum + nums[i];\n  }\n  let best = sum;\n  for (let right = k; right < nums.length; right++) {\n    const left = right - k;\n    sum = sum + nums[right] - nums[left];\n    if (sum > best) {\n      best = sum;\n    }\n  }\n  return best;\n}",
    },
    args: [[2, 1, 5, 1, 3, 2], 3],
    caption: "A fixed window of three sliding right. Each step reads one element entering and one leaving \u2014 never the whole window.",
  },

  complexity: {
    time: "O(n)",
    space: "O(1) for a fixed window, O(k) when tracking window contents",
    note: "Both edges only move forward, so each index is handled at most twice however deeply nested the loops look.",
  },

  patternCues: [
    "The problem says 'contiguous', 'consecutive', or 'substring'.",
    "You are asked for a longest, shortest, or best run satisfying a condition.",
    "A fixed length k appears in the statement.",
    "Recomputing each candidate range would repeat most of the previous one.",
  ],

  pitfalls: [
    {
      title: "Recomputing the window",
      body: "Summing the whole window on every step is the mistake the technique exists to remove. Add and subtract instead.",
    },
    {
      title: "Shrinking with `if` instead of `while`",
      body: "One violation can require removing several elements. An `if` fixes it once and leaves the window invalid.",
    },
    {
      title: "Measuring the window wrong",
      body: "The size is `right - left + 1`. Forgetting the `+ 1` is the most common off-by-one here.",
    },
  ],

  recommendedAfter: ["arrays", "two-pointers"],
};
