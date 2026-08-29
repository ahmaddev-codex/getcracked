import type { LessonInput } from '../schema';

export const hashingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'hashing',
  order: 2,
  title: 'Hash Maps',
  summary: 'Trade memory for time by remembering what you have already seen.',

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

  complexity: {
    time: 'O(1) average per lookup or insert',
    space: 'O(n) for n stored entries',
    note: 'Average, not worst. A pathological set of keys that all collide degrades lookups to O(n) — rare in practice, and the reason hash functions matter.',
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
