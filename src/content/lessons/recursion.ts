import type { LessonInput } from '../schema';

export const recursionLesson: LessonInput = {
  tier: 'lesson',
  slug: "recursion",
  order: 7,
  title: "Recursion & Memoisation",
  summary: "Solve it for a smaller input, then handle the rest.",

  explainer: "A recursive solution needs exactly two things: a **base case** small enough to\nanswer outright, and a step that makes the problem strictly smaller. If either is\nmissing you get infinite recursion, which is a stack overflow rather than a wrong\nanswer.\n\nThe part worth internalising is that recursion is often *correct but slow* rather\nthan wrong. Naive Fibonacci is a faithful translation of the definition and takes\nexponential time, because it recomputes the same subproblems along every branch\nof the call tree.\n\n**Memoisation** fixes that without changing the shape of the code: cache each\nresult the first time it is computed. The recursion stays readable and the\ncomplexity collapses, usually from exponential to linear in the number of\ndistinct subproblems.\n\nThat is also the bridge to dynamic programming. Memoised recursion is top-down\nDP; filling a table iteratively is the same computation bottom-up.",

  walkthrough: {
    entry: "sumArray",
    entryByLanguage: { python: 'sum_array' },
    source: {
      javascript: "function sumArray(nums) {\n  function go(index) {\n    if (index >= nums.length) {\n      return 0;\n    }\n    const here = nums[index];\n    const rest = go(index + 1);\n    return here + rest;\n  }\n  return go(0);\n}",
      python: `def sum_array(nums):
    def go(index):
        if index >= len(nums):
            return 0
        here = nums[index]
        rest = go(index + 1)
        return here + rest
    return go(0)`,
    },
    visual: 'array',
    args: [[4, 8, 15, 16, 23]],
    caption: "Recursion unwinding: each call reads one element, then the answers add back up as the stack collapses.",
  },

  complexity: {
    time: "Depends on the recurrence \u2014 O(number of distinct subproblems) once memoised",
    space: "O(depth) for the call stack, plus O(subproblems) for the cache",
    note: "Memoisation does not make the algorithm cleverer. It stops it repeating itself, which for a branching recurrence is the difference between 2^n and n.",
  },

  patternCues: [
    "The problem is naturally defined in terms of itself.",
    "You are exploring choices where each choice leaves a smaller version of the same problem.",
    "The structure is a tree or a graph.",
    "A brute-force recursion is obvious but too slow, and the same arguments keep recurring.",
  ],

  pitfalls: [
    {
      title: "A base case that is never reached",
      body: "Every path must shrink towards it. A branch that does not is an infinite loop with extra steps.",
    },
    {
      title: "Caching on the wrong key",
      body: "The key must capture everything the result depends on. Miss a parameter and the cache returns a confidently wrong answer.",
    },
    {
      title: "Deep recursion on large inputs",
      body: "Python's default limit is around 1000 frames. A linear recursion over a big array will hit it \u2014 iterate instead.",
    },
  ],

  recommendedAfter: ["arrays"],
};
