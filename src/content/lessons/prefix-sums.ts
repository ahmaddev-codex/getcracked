import type { LessonInput } from '../schema';

export const prefixSumsLesson: LessonInput = {
  tier: 'lesson',
  slug: 'prefix-sums',
  title: 'Prefix Sums',
  summary: 'Pay once up front so every range question afterwards is free.',
  order: 3,
  track: 'algorithms',

  difficulty: 'foundational',

  operations: [
    {
      name: 'build',
      time: 'O(n)',
      note: 'One pass.',
    },
    {
      name: 'range query',
      time: 'O(1)',
      note: 'One subtraction.',
    },
    {
      name: 'point update',
      time: 'O(n)',
      note: 'Everything after the change is invalidated. Use a Fenwick tree instead.',
    },
    {
      name: '2-D range query',
      time: 'O(1)',
      note: 'After an O(rows x cols) build; inclusion-exclusion over four corners.',
    },
  ],

  variants: [
    {
      name: 'Prefix sum',
      what: 'Range totals.',
    },
    {
      name: 'Prefix XOR',
      what: 'Range XOR — XOR is its own inverse.',
    },
    {
      name: 'Difference array',
      what: 'The mirror image: cheap range updates, one pass at the end.',
    },
    {
      name: '2-D prefix sum',
      what: 'Submatrix sums in constant time.',
    },
  ],

  furtherReading: [
    {
      label: 'Prefix sum',
      url: 'https://en.wikipedia.org/wiki/Prefix_sum',
      source: 'Wikipedia',
    },
  ],

  explainer: `A prefix sum array holds, at each position, the total of everything up to and
including it. Build it once in O(n), and the sum of any range \`[lo, hi]\`
becomes a single subtraction:

    sum(lo, hi) = prefix[hi] - prefix[lo - 1]

That is the whole technique. Its value is entirely in the trade it makes: one
linear pass up front turns every subsequent range query from O(n) into O(1). If
you ask one question it is a waste; if you ask many it is transformative.

The same idea generalises past addition. Any operation with an inverse works —
prefix XOR answers range XOR, prefix products answer range products if you are
careful about zeros. Operations without an inverse, like minimum, do not work
this way and need a sparse table or a segment tree instead.

The mirror image is the **difference array**: instead of querying ranges
cheaply, you *update* them cheaply. Add \`v\` at \`lo\` and subtract it after
\`hi\`, then one prefix pass at the end applies every range update at once.

In two dimensions the same subtraction becomes inclusion-exclusion over four
corners, which is how you answer submatrix sums in constant time.`,

  walkthrough: {
    entry: 'rangeSum',
    entryByLanguage: { python: 'range_sum' },
    source: {
      javascript: `function rangeSum(nums, lo, hi) {
  for (let i = 1; i < nums.length; i++) {
    nums[i] = nums[i] + nums[i - 1];
  }
  const upper = nums[hi];
  let lower = 0;
  if (lo > 0) {
    lower = nums[lo - 1];
  }
  return upper - lower;
}`,
      python: `def range_sum(nums, lo, hi):
    for i in range(1, len(nums)):
        nums[i] = nums[i] + nums[i - 1]
    upper = nums[hi]
    lower = 0
    if lo > 0:
        lower = nums[lo - 1]
    return upper - lower`,
    },
    visual: 'array',
    args: [[3, 1, 4, 1, 5], 1, 3],
    caption:
      'The array becomes its own prefix table in one pass, then the answer for [1, 3] is one subtraction. Watch each cell absorb everything to its left.',
  },

  complexity: {
    time: 'O(n) to build, O(1) per range query',
    space: 'O(n), or O(1) if you overwrite the input as here',
    note: 'The break-even point is one query: below that, summing the range directly is cheaper. Above it, the build cost is amortised away immediately.',
  },

  whenToUse: {
    reachFor: [
      'Many range-sum questions over an array that does not change.',
      'You need "does a subarray with sum k exist?" — prefix sums plus a hash map answers it in one pass.',
      'Range updates rather than range queries, which is the difference array.',
      'Submatrix sums, where the same subtraction becomes four corners.',
    ],
    insteadOf: [
      {
        alternative: 'Recomputing the sum each query',
        why: 'O(n) per query. Fine for one; catastrophic for many, which is exactly when this technique is offered.',
      },
      {
        alternative: 'A sliding window',
        why: 'A window handles contiguous ranges that move, and handles them in O(1) space. Prefer it when the range slides; prefer prefix sums when queries land anywhere, in any order.',
      },
      {
        alternative: 'A segment tree or Fenwick tree',
        why: 'Necessary once the underlying array *changes* between queries — a prefix array must be rebuilt in O(n) after any update. Also the answer for min or max, which have no inverse to subtract.',
      },
    ],
  },

  patternCues: [
    'The problem asks for sums of many different subarrays.',
    'It says "subarray sum equals k", which is prefix sums plus a hash map.',
    'The array is fixed and the queries are numerous.',
    'You are applying many range updates and only need the result at the end.',
  ],

  pitfalls: [
    {
      title: 'The off-by-one at the lower bound',
      body: '`prefix[hi] - prefix[lo]` excludes `nums[lo]`. You want `prefix[lo - 1]`, and `lo = 0` needs its own case — which is why many implementations pad the array with a leading zero.',
    },
    {
      title: 'Building it when the array will change',
      body: 'One update invalidates every entry after it. If updates are interleaved with queries, this is the wrong structure.',
    },
    {
      title: 'Overflow on large inputs',
      body: 'A prefix sum is by definition the largest number in the problem. In fixed-width languages this is where it overflows, not in the individual elements.',
    },
  ],

  exercises: [
    {
      slug: 'build-prefix',
      title: 'Build the prefix table',
      brief: 'Turn `nums` into its own prefix-sum array in place and return it.',
      hints: [
        'Each cell is itself plus the cell before it — once the cell before it is already a prefix sum.',
        'Start at index 1; index 0 is already correct.',
      ],
      starterCode: {
        javascript: `function buildPrefix(nums) {
  // TODO: make each element the sum of everything up to it.
  return nums;
}`,
      },
      referenceSolution: {
        javascript: `function buildPrefix(nums) {
  for (let i = 1; i < nums.length; i++) {
    nums[i] = nums[i] + nums[i - 1];
  }
  return nums;
}`,
      },
      testSpec: {
        entry: 'buildPrefix',
        cases: [
          { name: 'typical', args: [[3, 1, 4]], expected: [3, 4, 8] },
          { name: 'with negatives', args: [[2, -1, 3]], expected: [2, 1, 4] },
          { name: 'single element', args: [[9]], expected: [9] },
          { name: 'empty', args: [[]], expected: [], hidden: true },
        ],
      },
    },
  ],
};
