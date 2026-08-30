import type { LessonInput } from '../schema';

export const backtrackingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'backtracking',
  title: 'Backtracking',
  summary: 'Try a choice, explore, undo it, try the next — and prune early.',
  order: 7,
  track: 'algorithms',

  difficulty: 'advanced',

  operations: [
    {
      name: 'explore',
      time: 'O(branching^depth)',
      note: 'Exponential by nature. Pruning changes the case you hit, not the bound.',
    },
    {
      name: 'undo a choice',
      time: 'O(1)',
      note: 'The restore that makes shared state possible.',
    },
    {
      name: 'space',
      time: 'O(depth)',
      note: 'Call stack plus the one working state.',
    },
  ],

  variants: [
    {
      name: 'Subsets / combinations',
      what: 'Include or exclude at each index.',
    },
    {
      name: 'Permutations',
      what: 'Choose an unused element at each position.',
    },
    {
      name: 'Constraint satisfaction',
      what: 'N-Queens, Sudoku — prune on every placement.',
    },
    {
      name: 'Branch and bound',
      what: 'Prune using a bound on the best achievable result.',
    },
  ],

  furtherReading: [
    {
      label: 'Backtracking',
      url: 'https://en.wikipedia.org/wiki/Backtracking',
      source: 'Wikipedia',
    },
    {
      label: 'Recursion and backtracking',
      url: 'https://visualgo.net/en/recursion',
      source: 'VisuAlgo',
    },
  ],

  explainer: `Backtracking is brute force that cleans up after itself. You make a choice,
recurse on what remains, then **undo the choice** before trying the next one.
That undo is the whole technique: it lets one shared piece of state stand in for
the exponentially many states you would otherwise have to build.

Every backtracking solution has the same four parts:

1. **A choice** — which value goes in this position.
2. **A constraint** — whether the choice is still legal given what came before.
3. **A goal** — how you know a full solution has been reached.
4. **An undo** — restoring state so the next branch starts clean.

Miss the undo and later branches inherit earlier decisions, which produces
answers that are wrong in ways that look almost right.

The cost is exponential by nature: you are exploring a tree of possibilities. The
only lever that matters is **pruning** — abandoning a branch the moment it cannot
lead to a solution. Checking validity when a candidate is complete makes it
hopeless; checking it as each choice is made is what turns an impossible search
into a fast one. In N-Queens, that difference is the entire problem.

Where subproblems repeat with the same arguments, memoisation applies and the
search collapses into dynamic programming. Where they do not, backtracking is
usually the best available.`,

  walkthrough: {
    entry: 'countPlacements',
    entryByLanguage: { python: 'count_placements' },
    source: {
      javascript: `function countPlacements(board) {
  let count = 0;
  function place(index) {
    if (index >= board.length) {
      count = count + 1;
      return;
    }
    board[index] = 0;
    place(index + 1);
    if (index === 0 || board[index - 1] === 0) {
      board[index] = 1;
      place(index + 1);
      board[index] = 0;
    }
  }
  place(0);
  return count;
}`,
      python: `def count_placements(board):
    count = 0

    def place(index):
        nonlocal count
        if index >= len(board):
            count = count + 1
            return
        board[index] = 0
        place(index + 1)
        if index == 0 or board[index - 1] == 0:
            board[index] = 1
            place(index + 1)
            board[index] = 0

    place(0)
    return count`,
    },
    visual: 'array',
    args: [[0, 0, 0, 0]],
    caption:
      'Counting arrangements with no two adjacent 1s. Watch a cell get set, the search go deeper, and the cell get restored on the way back out — that restore is the backtrack.',
  },

  complexity: {
    time: 'Exponential in the worst case — O(branching^depth), reduced by pruning',
    space: 'O(depth) for the call stack, plus the shared state being mutated',
    note: 'Pruning does not change the worst case; it changes the case you actually hit. That is why the constraint check belongs at every choice rather than at the end.',
  },

  whenToUse: {
    reachFor: [
      'The problem asks for *all* solutions, or a count of them, rather than one best value.',
      'Permutations, combinations, subsets, or arrangements under constraints.',
      'Constraint puzzles — N-Queens, Sudoku, word search on a grid.',
      'The search space is large but most of it is invalid, so pruning cuts it down quickly.',
    ],
    insteadOf: [
      {
        alternative: 'Dynamic programming',
        why: 'If the same subproblem recurs with the same arguments, memoise and the exponential search collapses to polynomial. Backtracking is for when the states are genuinely distinct — which is usually the case once you are building actual arrangements rather than scoring them.',
      },
      {
        alternative: 'A greedy choice',
        why: 'Far cheaper when it is correct, and wrong on a small counterexample when it is not. Backtracking is what you fall back to precisely because a locally best choice does not lead to a globally best answer.',
      },
      {
        alternative: 'BFS over states',
        why: 'Better when you need the *shortest* sequence of choices, since BFS finds it first. Backtracking explores depth-first and would have to search everything to prove a path is shortest.',
      },
    ],
  },

  patternCues: [
    'The problem says "all", "every", "generate", or "how many ways".',
    'You are filling positions one at a time and each choice restricts the next.',
    'A solution is a sequence of decisions rather than a single number.',
    'Brute force is obvious but most candidates are invalid long before they are complete.',
  ],

  pitfalls: [
    {
      title: 'Forgetting to undo',
      body: 'The single most common bug. Without restoring state, the second branch starts from the first branch\'s leftovers, and the answers are subtly wrong rather than obviously broken.',
    },
    {
      title: 'Collecting references instead of copies',
      body: 'Pushing the working array into a results list stores a reference to something you are about to mutate. Every result ends up identical — usually empty. Push a copy.',
    },
    {
      title: 'Validating only at the leaves',
      body: 'Checking the constraint only once a candidate is complete does the full exponential work. Check as each choice is made and prune immediately.',
    },
    {
      title: 'Generating duplicates from equal elements',
      body: 'With repeated values, the same combination is reached by different paths. Sort first and skip an equal sibling at the same depth.',
    },
  ],

  exercises: [
    {
      slug: 'count-subsets',
      title: 'Count the subsets',
      brief:
        'Return how many subsets `nums` has, by choosing include-or-exclude for each element recursively. Do not use a formula.',
      hints: [
        'At each index there are exactly two branches: take it, or skip it.',
        'The base case is running past the end — that is one complete subset.',
      ],
      starterCode: {
        javascript: `function countSubsets(nums) {
  // TODO: recurse over include/exclude at each index.
  return 0;
}`,
      },
      referenceSolution: {
        javascript: `function countSubsets(nums) {
  function go(index) {
    if (index >= nums.length) return 1;
    return go(index + 1) + go(index + 1);
  }
  return go(0);
}`,
      },
      testSpec: {
        entry: 'countSubsets',
        cases: [
          { name: 'three elements', args: [[1, 2, 3]], expected: 8 },
          { name: 'one element', args: [[5]], expected: 2 },
          { name: 'empty', args: [[]], expected: 1 },
          { name: 'four elements', args: [[1, 2, 3, 4]], expected: 16, hidden: true },
        ],
      },
    },
  ],
};
