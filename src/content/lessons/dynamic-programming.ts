import type { LessonInput } from '../schema';

export const dynamicProgrammingLesson: LessonInput = {
  tier: 'lesson',
  slug: "dynamic-programming",
  order: 9,
  track: 'algorithms',
  title: "Dynamic Programming",
  summary: "Stop recomputing what you already worked out.",

  difficulty: 'advanced',

  operations: [
    {
      name: 'fill the table',
      time: 'O(states x work per state)',
      note: 'The only formula that matters here.',
    },
    {
      name: 'space',
      time: 'O(states)',
      note: 'Often reducible to O(one row).',
    },
    {
      name: 'top-down (memoised)',
      time: 'Same bound',
      note: 'Plus O(depth) stack. Easier to write from the recurrence.',
    },
    {
      name: 'bottom-up',
      time: 'Same bound',
      note: 'No stack, and easier to space-optimise.',
    },
  ],

  variants: [
    {
      name: '1-D DP',
      what: 'Fibonacci, climbing stairs, house robber.',
    },
    {
      name: '2-D DP',
      what: 'Grid paths, edit distance, longest common subsequence.',
    },
    {
      name: 'Knapsack',
      what: '0/1, unbounded, bounded — the archetype for choice-under-capacity.',
    },
    {
      name: 'Bitmask DP',
      what: 'State is a subset. Only viable for n around 20.',
    },
    {
      name: 'DP on trees or DAGs',
      what: 'States are nodes; children resolve first.',
    },
  ],

  furtherReading: [
    {
      label: 'Dynamic programming',
      url: 'https://en.wikipedia.org/wiki/Dynamic_programming',
      source: 'Wikipedia',
    },
    {
      label: 'Knapsack problem',
      url: 'https://en.wikipedia.org/wiki/Knapsack_problem',
      source: 'Wikipedia',
    },
  ],

  explainer: "Dynamic programming applies when a problem has two properties: an **optimal\nsubstructure** (the best answer is built from best answers to smaller versions)\nand **overlapping subproblems** (those smaller versions recur). Without the\nsecond, plain recursion is already fine.\n\nThere are two ways to write the same thing:\n\n- **Top-down** \u2014 write the recursion, add a cache. Closest to how you reasoned\n  about the problem, and it only computes the subproblems actually reached.\n- **Bottom-up** \u2014 fill a table from the smallest case upward. No recursion stack,\n  and it often reveals that you only need the last row or two, which drops the\n  space from O(n) to O(1).\n\nThe hard part is never the code. It is naming the state: *what exactly does\n`best[i]` mean?* Get that sentence precise and the recurrence is usually one line.\nLeave it vague and you will write a table you cannot debug.\n\nGreedy is the tempting shortcut, and it fails on coin systems like [1, 3, 4]\nwhere making 6 greedily takes 4+1+1 instead of 3+3. DP considers the alternatives\ngreedy discards.",

  walkthrough: {
    entry: "uniquePaths",
    entryByLanguage: { python: 'unique_paths' },
    source: {
      javascript: `function uniquePaths(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[0].length; c++) {
      if (r === 0 || c === 0) {
        grid[r][c] = 1;
        continue;
      }
      grid[r][c] = grid[r - 1][c] + grid[r][c - 1];
    }
  }
  return grid[grid.length - 1][grid[0].length - 1];
}`,
      python: `def unique_paths(grid):
    for r in range(len(grid)):
        for c in range(len(grid[0])):
            if r == 0 or c == 0:
                grid[r][c] = 1
                continue
            grid[r][c] = grid[r - 1][c] + grid[r][c - 1]
    return grid[len(grid) - 1][len(grid[0]) - 1]`,
    },
    visual: 'grid',
    args: [[[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]],
    caption:
      "The table filling row by row. Each cell is the one above plus the one to its left \u2014 the recurrence, made visible. Watch the edges fill with 1s first, because there is exactly one way to walk a straight line.",
  },

  complexity: {
    time: "O(states \u00d7 work per state)",
    space: "O(states), often reducible to O(1) rows",
    note: "The gain over naive recursion is usually exponential to polynomial, because a branching call tree collapses into one entry per distinct state.",
  },

  whenToUse: {
    reachFor: [
      'The problem asks for a maximum, minimum, or a count of ways.',
      'You are making a sequence of choices where each affects what remains.',
      'A recursive solution is obvious but recomputes the same arguments.',
      'Greedy gives an answer that is wrong on a small counterexample.',
    ],
    insteadOf: [
      {
        alternative: 'Greedy',
        why: 'Far cheaper when it is correct. DP is what you fall back to when a locally best choice can block a globally best answer — a single counterexample decides which you are in.',
      },
      {
        alternative: 'Plain recursion',
        why: 'The same recurrence without memoisation. For a branching call tree the difference is exponential against polynomial, and it is one cache away.',
      },
      {
        alternative: 'Backtracking',
        why: 'Use backtracking when you need the arrangements themselves; DP when you only need the best value or a count, and the states repeat.',
      },
    ],
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
