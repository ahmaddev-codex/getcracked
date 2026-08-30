import type { LessonInput } from '../schema';

export const recursionLesson: LessonInput = {
  tier: 'lesson',
  slug: "recursion",
  order: 6,
  track: 'algorithms',
  title: "Recursion & Memoisation",
  summary: "Solve it for a smaller input, then handle the rest.",

  difficulty: 'core',

  operations: [
    {
      name: 'call',
      time: 'O(1) plus the body',
      note: 'Each frame costs stack space.',
    },
    {
      name: 'stack depth',
      time: 'O(depth)',
      note: 'Overflow is a real limit — roughly 10k frames in a browser.',
    },
    {
      name: 'memoised recurrence',
      time: 'O(distinct states x work per state)',
      note: 'What turns exponential into polynomial.',
    },
  ],

  variants: [
    {
      name: 'Linear recursion',
      what: 'One call per frame. Equivalent to a loop.',
    },
    {
      name: 'Binary / branching recursion',
      what: 'Two or more calls. This is where memoisation pays.',
    },
    {
      name: 'Tail recursion',
      what: 'The call is the last action. Some languages optimise it away; JavaScript and Python do not.',
    },
    {
      name: 'Mutual recursion',
      what: 'Two functions calling each other.',
    },
  ],

  furtherReading: [
    {
      label: 'Recursion (computer science)',
      url: 'https://en.wikipedia.org/wiki/Recursion_(computer_science)',
      source: 'Wikipedia',
    },
    {
      label: 'Memoization',
      url: 'https://en.wikipedia.org/wiki/Memoization',
      source: 'Wikipedia',
    },
  ],

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

  whenToUse: {
    reachFor: [
      'The problem is naturally defined in terms of itself.',
      'The structure is a tree or a graph, where the code mirrors the shape of the data.',
      'You are exploring choices, each leaving a smaller version of the same problem.',
      'A recursive formulation is obviously correct and you can memoise it afterwards.',
    ],
    insteadOf: [
      {
        alternative: 'An explicit stack',
        why: 'Same traversal without a call-stack limit. Prefer it when the depth could reach tens of thousands, or when you need to pause and resume.',
      },
      {
        alternative: 'Iteration',
        why: 'A loop is usually faster and always avoids stack overflow. Recursion earns its cost when the alternative is bookkeeping you would otherwise write by hand.',
      },
      {
        alternative: 'Bottom-up DP',
        why: 'Once memoised, recursion is DP with a call stack. The bottom-up form avoids the stack entirely and is often easier to space-optimise.',
      },
    ],
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

  recommendedAfter: ['arrays', 'trees'],
};
