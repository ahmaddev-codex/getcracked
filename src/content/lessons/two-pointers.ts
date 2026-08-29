import type { LessonInput } from '../schema';

export const twoPointers: LessonInput = {
  tier: 'lesson',
  slug: 'two-pointers',
  order: 2,
  title: 'Two Pointers',
  summary: 'Walk an array from both ends, or at two speeds, instead of nesting loops.',

  explainer: `Two pointers is the other common way a nested loop collapses into a
single pass — and it is the one to reach for when a hash map would be overkill or
the data is already **sorted**.

Two shapes cover most of it:

- **Converging.** One index at each end, moving toward each other. Each step
  rules out one candidate permanently, which is why a sorted array can be
  searched in one pass instead of n².
- **Same-direction.** Both indices move forward, one faster than the other. This
  is how you detect a cycle, remove duplicates in place, or maintain a window.

The thing that makes it work is an **invariant**: something true before and after
every step. In converging search over a sorted array, the invariant is "the
answer, if it exists, lies between the two pointers." Every move preserves that,
which is why discarding the rest is safe.

If you cannot state the invariant, the pointers are guesswork.`,

  complexity: {
    time: 'O(n) for a single pass',
    space: 'O(1) — the pointers are the only extra state',
    note: 'Often the reason to prefer this over a hash map: same linear time, but constant space instead of O(n). If the input needs sorting first, that sort dominates at O(n log n).',
  },

  patternCues: [
    'The array is sorted, or sorting it would not lose information you need.',
    'You are looking for a pair, a triplet, or a subarray that satisfies a condition.',
    'The problem asks you to do it in constant extra space.',
    'You need to compare elements from opposite ends, or detect a cycle.',
  ],

  pitfalls: [
    {
      title: 'Moving both pointers at once',
      body: 'In a converging search you move exactly one per step — the one whose move can improve the result. Moving both can step over the answer.',
    },
    {
      title: 'Off-by-one at the meeting point',
      body: 'Decide deliberately whether the pointers may land on the same index. `while (i < j)` and `while (i <= j)` solve different problems.',
    },
    {
      title: 'Reaching for it on unsorted data',
      body: 'Converging pointers rely on order to know which way to move. Without it, use a hash map instead.',
    },
  ],

  // Curriculum ordering, not a dependency: two pointers is understandable on its
  // own, and reads better once the hash-map trade-off is familiar so the two can
  // be compared. Nothing is locked either way (§6.6).
  recommendedAfter: ['hashing'],
};
