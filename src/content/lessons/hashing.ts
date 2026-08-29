import type { LessonInput } from '../schema';

export const hashing: LessonInput = {
  tier: 'lesson',
  slug: 'hashing',
  order: 1,
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

  recommendedAfter: [],
};
