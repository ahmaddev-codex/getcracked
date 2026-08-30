import type { LessonInput } from '../schema';

export const greedyLesson: LessonInput = {
  tier: 'lesson',
  slug: 'greedy',
  title: 'Greedy',
  summary: 'Take the best-looking option now — when you can prove that is safe.',
  order: 8,
  track: 'algorithms',

  difficulty: 'core',

  operations: [
    {
      name: 'the loop itself',
      time: 'O(n)',
      note: 'Trivial. The cost is almost always the sort before it.',
    },
    {
      name: 'with a sort',
      time: 'O(n log n)',
      note: 'Which is what makes the greedy choice well defined.',
    },
    {
      name: 'space',
      time: 'O(1)',
      note: 'Beyond whatever the sort needs.',
    },
  ],

  variants: [
    {
      name: 'Interval scheduling',
      what: 'Earliest finishing time first.',
    },
    {
      name: 'Fractional knapsack',
      what: 'Best value-to-weight ratio first. The 0/1 version is not greedy.',
    },
    {
      name: 'Huffman coding',
      what: 'Repeatedly merge the two least frequent.',
    },
    {
      name: 'Kruskal / Prim',
      what: 'Minimum spanning tree — both provably greedy.',
    },
  ],

  furtherReading: [
    {
      label: 'Greedy algorithm',
      url: 'https://en.wikipedia.org/wiki/Greedy_algorithm',
      source: 'Wikipedia',
    },
    {
      label: 'Matroid (why greedy works)',
      url: 'https://en.wikipedia.org/wiki/Matroid',
      source: 'Wikipedia',
    },
  ],

  explainer: `A greedy algorithm makes the choice that looks best right now and never
reconsiders. When that works it is the simplest and fastest thing available.
When it does not, it produces a confident wrong answer, which is worse than
being slow.

So the real content of this topic is not the code — the code is a loop — it is
knowing **when greedy is safe**. Two properties have to hold:

**Greedy choice property** — a globally optimal solution can be reached by making
the locally optimal choice at each step. Nothing you pick now blocks the best
outcome later.

**Optimal substructure** — after making that choice, what remains is the same
problem on a smaller input.

Coin change makes the danger concrete. With coins 25, 10, 5 and 1, taking the
largest coin that fits is optimal for every amount. Add a 20 and remove the 10,
and 40 greedily becomes 25 + 5 + 5 + 5 — four coins where 20 + 20 is two. Same
algorithm, same code, wrong answer, because the coin system changed.

In an interview the useful move is to **try to break it**. Construct a small
counterexample. If you cannot, say why the greedy choice is safe. If you can,
you have just discovered that the problem is dynamic programming.

Most correct greedy solutions begin by sorting — by end time, by ratio, by
deadline — because the sort is what makes "best right now" well defined.`,

  walkthrough: {
    entry: 'coinsNeeded',
    entryByLanguage: { python: 'coins_needed' },
    source: {
      javascript: `function coinsNeeded(coins, target) {
  let remaining = target;
  let used = 0;
  for (let i = 0; i < coins.length; i++) {
    while (remaining >= coins[i]) {
      remaining = remaining - coins[i];
      used = used + 1;
    }
  }
  return used;
}`,
      python: `def coins_needed(coins, target):
    remaining = target
    used = 0
    for i in range(len(coins)):
        while remaining >= coins[i]:
            remaining = remaining - coins[i]
            used = used + 1
    return used`,
    },
    visual: 'array',
    args: [[25, 10, 5, 1], 63],
    caption:
      'Largest coin first, never reconsidered. This is optimal for these coins — and the lesson above shows a coin set where the identical code is wrong.',
  },

  complexity: {
    time: 'Usually O(n log n), dominated by the sort that makes the choice well defined',
    space: 'O(1) beyond the sort',
    note: 'Greedy is normally the cheapest correct approach when it is correct at all. The cost of using it wrongly is not performance — it is a wrong answer that passes small tests.',
  },

  whenToUse: {
    reachFor: [
      'You can argue that a locally best choice never blocks a globally best outcome.',
      'Interval scheduling: pick the earliest finishing time, repeatedly.',
      'The problem asks for a maximum count or minimum count and the items have a natural priority order.',
      'Huffman coding, minimum spanning trees, and the fractional knapsack — all provably greedy.',
    ],
    insteadOf: [
      {
        alternative: 'Dynamic programming',
        why: 'The direct trade. DP explores the choices greedy skips, at a real cost in time and space. Use greedy when you can prove skipping is safe, DP when you cannot — and a single counterexample decides it.',
      },
      {
        alternative: 'Backtracking',
        why: 'Exhaustive and always correct, and exponential. Greedy is what you use when the structure of the problem means you never need to reconsider.',
      },
    ],
  },

  patternCues: [
    'The problem asks for a maximum or minimum count, and items have an obvious ordering.',
    'It is about scheduling, intervals, or deadlines.',
    'Sorting the input makes the right choice at each step obvious.',
    'You can construct an exchange argument: swapping any other choice for the greedy one does not make things worse.',
  ],

  pitfalls: [
    {
      title: 'Assuming greedy works because it passes the examples',
      body: 'Sample inputs are small and forgiving. Spend thirty seconds trying to build a counterexample before committing — that is the whole decision.',
    },
    {
      title: 'Sorting by the wrong key',
      body: 'Interval scheduling sorts by *end* time. Sorting by start, or by duration, is a correct-looking algorithm that gives wrong answers.',
    },
    {
      title: 'Greedy on 0/1 knapsack',
      body: 'The ratio-first choice is optimal for the fractional version and wrong for the 0/1 version. The two problems look identical and are not.',
    },
  ],

  exercises: [
    {
      slug: 'largest-first',
      title: 'Take the largest first',
      brief:
        'Given sorted-descending `weights` and a `capacity`, return how many items you can take, largest first, without exceeding capacity.',
      hints: [
        'Walk the list in order and take an item whenever it still fits.',
        'Track what is left rather than what you have used — the comparison is simpler.',
      ],
      starterCode: {
        javascript: `function takeGreedy(weights, capacity) {
  // TODO: take each item that still fits, in order.
  return 0;
}`,
      },
      referenceSolution: {
        javascript: `function takeGreedy(weights, capacity) {
  let remaining = capacity;
  let taken = 0;
  for (let i = 0; i < weights.length; i++) {
    if (weights[i] <= remaining) {
      remaining = remaining - weights[i];
      taken = taken + 1;
    }
  }
  return taken;
}`,
      },
      testSpec: {
        entry: 'takeGreedy',
        cases: [
          { name: 'takes two', args: [[5, 3, 2], 8], expected: 2 },
          { name: 'takes all', args: [[3, 2, 1], 10], expected: 3 },
          { name: 'takes none', args: [[9], 4], expected: 0 },
          { name: 'exact fit', args: [[4, 4], 8], expected: 2, hidden: true },
        ],
      },
    },
  ],
};
