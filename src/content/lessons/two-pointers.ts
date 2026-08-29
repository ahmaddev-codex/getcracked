import type { LessonInput } from '../schema';

export const twoPointersLesson: LessonInput = {
  tier: 'lesson',
  slug: 'two-pointers',
  order: 3,
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
  walkthrough: {
    entry: 'reverse',
    source: {
      javascript: `function reverse(xs) {
  let i = 0;
  let j = xs.length - 1;
  while (i < j) {
    const t = xs[i];
    xs[i] = xs[j];
    xs[j] = t;
    i++;
    j--;
  }
  return xs;
}`,
      python: `def reverse(xs):
    i = 0
    j = len(xs) - 1
    while i < j:
        t = xs[i]
        xs[i] = xs[j]
        xs[j] = t
        i += 1
        j -= 1
    return xs`,
    },
    args: [[1, 2, 3, 4, 5]],
    caption: 'Watch the two pointers converge, swapping as they go.',
  },

  exercises: [
    {
      slug: 'reverse-in-place',
      title: 'Reverse in place',
      brief: 'Reverse `xs` without allocating a new array. Converging pointers, swapping as they meet.',
      hints: [
        'One index at each end. Swap, then step both inward.',
        'Stop when they meet. Continuing past that point undoes every swap.',
      ],
      starterCode: {
        javascript: `function reverse(xs) {
  // TODO: reverse xs in place and return it.
  return xs;
}`,
      },
      referenceSolution: {
        javascript: `function reverse(xs) {
  let i = 0;
  let j = xs.length - 1;
  while (i < j) {
    const t = xs[i];
    xs[i] = xs[j];
    xs[j] = t;
    i++;
    j--;
  }
  return xs;
}`,
      },
      testSpec: {
        entry: 'reverse',
        cases: [
          { name: 'even length', args: [[1, 2, 3, 4]], expected: [4, 3, 2, 1] },
          { name: 'odd length', args: [[1, 2, 3]], expected: [3, 2, 1] },
          { name: 'single element', args: [[9]], expected: [9] },
          { name: 'empty', args: [[]], expected: [], hidden: true },
        ],
      },
    },
    {
      slug: 'sorted-pair-sum',
      title: 'Pair sum, sorted',
      brief:
        'Given a **sorted** array and a target, return the indices of the two values that sum to it, or `[]`. Constant extra space — no map.',
      hints: [
        'Start wide: one pointer at each end. Their sum is the largest and smallest you can currently make.',
        'Too big means the right end is too large; too small means the left is. Move exactly one.',
      ],
      starterCode: {
        javascript: `function pairSum(nums, target) {
  // TODO: converging pointers over a sorted array.
  return [];
}`,
      },
      referenceSolution: {
        javascript: `function pairSum(nums, target) {
  let i = 0;
  let j = nums.length - 1;
  while (i < j) {
    const sum = nums[i] + nums[j];
    if (sum === target) return [i, j];
    if (sum < target) i++;
    else j--;
  }
  return [];
}`,
      },
      testSpec: {
        entry: 'pairSum',
        cases: [
          { name: 'pair exists', args: [[1, 3, 4, 7], 7], expected: [1, 2] },
          { name: 'no pair', args: [[1, 2, 3], 99], expected: [] },
          { name: 'ends', args: [[2, 5, 9], 11], expected: [0, 2] },
          // -4 + 5 = 1, and converging pointers meet that pair first.
          { name: 'negatives', args: [[-4, -1, 2, 5], 1], expected: [0, 3], hidden: true },
        ],
      },
    },
  ],

  recommendedAfter: ['hashing'],
};
