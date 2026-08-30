import type { LessonInput } from '../schema';

export const hashingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'hashing',
  order: 4,
  track: 'data-structures',
  title: 'Hash Maps',
  summary: 'Trade memory for time by remembering what you have already seen.',

  difficulty: 'foundational',

  operations: [
    {
      name: 'insert',
      time: 'O(1) average, O(n) worst',
      note: 'Worst case needs every key to collide — rare, and why hash functions matter.',
    },
    {
      name: 'lookup',
      time: 'O(1) average, O(n) worst',
    },
    {
      name: 'delete',
      time: 'O(1) average',
    },
    {
      name: 'iterate in sorted order',
      time: 'not supported',
      note: 'A hash map has no order. If you need one, you need a tree.',
    },
  ],

  variants: [
    {
      name: 'Hash set',
      what: 'Membership only, no values.',
    },
    {
      name: 'Hash map / dictionary',
      what: 'Key to value.',
    },
    {
      name: 'Separate chaining',
      what: 'Collisions become a list in the bucket. What most standard libraries do.',
    },
    {
      name: 'Open addressing',
      what: 'Collisions probe for another slot. Better cache behaviour, harder deletion.',
    },
  ],

  furtherReading: [
    {
      label: 'Hash table',
      url: 'https://en.wikipedia.org/wiki/Hash_table',
      source: 'Wikipedia',
    },
    {
      label: 'Hash table visualiser',
      url: 'https://visualgo.net/en/hashtable',
      source: 'VisuAlgo',
    },
  ],

  explainer: `A hash map answers one question in constant time: **have I seen this
before, and what was it attached to?**

That sounds modest. It is the single most common way an O(n²) solution becomes
O(n).

The pattern is almost always the same shape. You are looping over data and, for
each element, asking a question about the elements you have *already passed*. The
naive version answers that by looping again — comparing every element against
every other. The hash-map version answers it by having written those elements
down as it went.

\`\`\`
for each element:
    if the map already answers my question -> done
    otherwise, record this element and move on
\`\`\`

The cost is memory: you are storing up to n entries to avoid the second loop.
That trade is the whole idea, and it is why "time complexity" and "space
complexity" are usually discussed together.`,

  walkthrough: {
    entry: "countValues",
    entryByLanguage: { python: 'count_values' },
    source: {
      javascript: "function countValues(nums) {\n  const counts = {};\n  let distinct = 0;\n  for (let i = 0; i < nums.length; i++) {\n    const value = nums[i];\n    if (counts[value] === undefined) {\n      counts[value] = 0;\n      distinct = distinct + 1;\n    }\n    counts[value] = counts[value] + 1;\n  }\n  return distinct;\n}",
      python: `def count_values(nums):
    counts = {}
    distinct = 0
    for i in range(len(nums)):
        value = nums[i]
        if value not in counts:
            counts[value] = 0
            distinct = distinct + 1
        counts[value] = counts[value] + 1
    return distinct`,
    },
    visual: 'map',
    args: [[2, 7, 2, 5, 7, 2]],
    caption: "One pass over the array, building a count for each value. Watch how every element is read exactly once.",
  },

  complexity: {
    time: 'O(1) average per lookup or insert',
    space: 'O(n) for n stored entries',
    note: 'Average, not worst. A pathological set of keys that all collide degrades lookups to O(n) — rare in practice, and the reason hash functions matter.',
  },

  whenToUse: {
    reachFor: [
      'The question is "have I seen this?" or "how many times?", asked repeatedly.',
      'You are about to write a nested loop whose inner half only searches for a match.',
      'You need to look backwards at earlier elements — a map remembers them for you.',
      'Keys are sparse, or are not integers at all.',
    ],
    insteadOf: [
      {
        alternative: 'Sorting first',
        why: 'Sorting costs O(n log n) and buys you order. If you only need counts or membership, hashing does it in O(n) and order was never the point.',
      },
      {
        alternative: 'A nested loop',
        why: 'The direct trade this structure exists for: O(n²) becomes O(n) by remembering instead of re-searching.',
      },
      {
        alternative: 'A tree map',
        why: 'Choose the tree when you need keys in sorted order, range queries, or a predecessor. A hash map gives you none of those, and is faster when you do not need them.',
      },
    ],
  },

  patternCues: [
    'You are about to write a nested loop where the inner one only looks for a match.',
    'The question is "have I seen X?" or "how many times has X appeared?"',
    'You need to look *backwards* at earlier elements, never forwards.',
    'The naive solution is O(n²) and the problem hints that something faster exists.',
  ],

  pitfalls: [
    {
      title: 'Recording before you look',
      body: 'If you add the current element to the map before checking for its match, an element can pair with itself. Check first, then record.',
    },
    {
      title: 'Storing the value when you need the index',
      body: 'Most problems want *where* something was, not what it was. Map the value to its index, not to true.',
    },
    {
      title: 'Assuming keys are unique',
      body: 'Duplicate values overwrite each other. If earlier occurrences matter, store a list of indices rather than one.',
    },
  ],

  exercises: [
    {
      slug: 'seen-before',
      title: 'Have I seen this?',
      brief: 'Return `true` if any value appears twice in `nums`, otherwise `false`. One pass, using a set.',
      hints: [
        'You only ever ask about elements you have already passed — so record each one as you go.',
        'Check membership *before* adding the current element, or every element matches itself.',
      ],
      starterCode: {
        javascript: `function hasDuplicate(nums) {
  // TODO: return true if any value repeats.
  return false;
}`,
      },
      referenceSolution: {
        javascript: `function hasDuplicate(nums) {
  const seen = new Set();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(nums[i])) return true;
    seen.add(nums[i]);
  }
  return false;
}`,
      },
      testSpec: {
        entry: 'hasDuplicate',
        cases: [
          { name: 'a repeat', args: [[1, 2, 3, 2]], expected: true },
          { name: 'all distinct', args: [[1, 2, 3]], expected: false },
          { name: 'empty', args: [[]], expected: false },
          { name: 'adjacent repeat', args: [[5, 5]], expected: true, hidden: true },
        ],
      },
    },
    {
      slug: 'count-occurrences',
      title: 'Count each value',
      brief: 'Return an object mapping each value in `nums` to how many times it appears.',
      hints: [
        'This is the same loop, but the map holds a running count instead of an index.',
        'A missing key needs a default — reading it before writing gives `undefined`, not `0`.',
      ],
      starterCode: {
        javascript: `function countValues(nums) {
  // TODO: map each value to its number of occurrences.
  return {};
}`,
      },
      referenceSolution: {
        javascript: `function countValues(nums) {
  const counts = {};
  for (let i = 0; i < nums.length; i++) {
    const n = nums[i];
    counts[n] = (counts[n] || 0) + 1;
  }
  return counts;
}`,
      },
      testSpec: {
        entry: 'countValues',
        cases: [
          { name: 'mixed', args: [[1, 2, 2, 3]], expected: { 1: 1, 2: 2, 3: 1 } },
          { name: 'empty', args: [[]], expected: {} },
          { name: 'all same', args: [[7, 7, 7]], expected: { 7: 3 }, hidden: true },
        ],
      },
    },
  ],

  recommendedAfter: ['arrays'],
};
