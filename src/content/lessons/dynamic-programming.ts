import type { LessonInput } from '../schema';

export const dynamicProgrammingLesson: LessonInput = {
  tier: 'lesson',
  slug: "dynamic-programming",
  order: 11,
  title: "Dynamic Programming",
  summary: "Stop recomputing what you already worked out.",

  explainer: "Dynamic programming applies when a problem has two properties: an **optimal\nsubstructure** (the best answer is built from best answers to smaller versions)\nand **overlapping subproblems** (those smaller versions recur). Without the\nsecond, plain recursion is already fine.\n\nThere are two ways to write the same thing:\n\n- **Top-down** \u2014 write the recursion, add a cache. Closest to how you reasoned\n  about the problem, and it only computes the subproblems actually reached.\n- **Bottom-up** \u2014 fill a table from the smallest case upward. No recursion stack,\n  and it often reveals that you only need the last row or two, which drops the\n  space from O(n) to O(1).\n\nThe hard part is never the code. It is naming the state: *what exactly does\n`best[i]` mean?* Get that sentence precise and the recurrence is usually one line.\nLeave it vague and you will write a table you cannot debug.\n\nGreedy is the tempting shortcut, and it fails on coin systems like [1, 3, 4]\nwhere making 6 greedily takes 4+1+1 instead of 3+3. DP considers the alternatives\ngreedy discards.",

  walkthrough: {
    entry: "climbWays",
    source: {
      javascript: "function climbWays(table) {\n  table[0] = 1;\n  table[1] = 1;\n  for (let i = 2; i < table.length; i++) {\n    const oneBack = table[i - 1];\n    const twoBack = table[i - 2];\n    table[i] = oneBack + twoBack;\n  }\n  return table[table.length - 1];\n}",
    },
    args: [[0, 0, 0, 0, 0, 0, 0, 0]],
    caption: "The DP table filling left to right. Each cell reads the two before it \u2014 the recurrence made visible.",
  },

  complexity: {
    time: "O(states \u00d7 work per state)",
    space: "O(states), often reducible to O(1) rows",
    note: "The gain over naive recursion is usually exponential to polynomial, because a branching call tree collapses into one entry per distinct state.",
  },

  patternCues: [
    "The problem asks for a maximum, minimum, or a count of ways.",
    "You are making a sequence of choices where each affects what remains.",
    "A recursive solution is obvious but recomputes the same arguments.",
    "Greedy gives an answer that is wrong on a small counterexample.",
  ],

  pitfalls: [
    {
      title: "A vague state definition",
      body: "If you cannot say in one sentence what `dp[i]` means, the recurrence will be wrong in a way that is very hard to see.",
    },
    {
      title: "Wrong base cases",
      body: "The table's first entries are the whole foundation. An off-by-one there is consistently wrong everywhere and looks like a logic bug.",
    },
    {
      title: "Iterating in the wrong order",
      body: "Bottom-up requires every dependency to be filled before it is read. Getting the loop order wrong reads zeroes and reports plausible nonsense.",
    },
  ],

  recommendedAfter: ["recursion"],
};
