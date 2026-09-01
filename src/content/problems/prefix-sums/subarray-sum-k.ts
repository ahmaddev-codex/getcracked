import type { ProblemInput } from '../../schema';

export const subarraySumK: ProblemInput = {
  tier: 'problem',
  slug: 'subarray-sum-k',
  topic: 'prefix-sums',
  difficulty: 'medium',
  title: 'Subarray Sum Equals K',
  companies: ['Stripe', 'Meta', 'Amazon'],
  recommendedAfter: ['prefix-sums', 'hashing'],

  brief: `Count the contiguous subarrays of \`nums\` whose values sum to \`k\`.

\`\`\`
subarraySum([1, 1, 1], 2)  ->  2
\`\`\`

Both \`[1,1]\` windows count — subarrays are counted by position, not by content.

The values can be negative, which is what rules out a sliding window: with negatives
the running sum is not monotone, so shrinking from the left does not reliably reduce
it. This is the problem where prefix sums and hashing meet.`,

  hints: [
    'Write `sum(i..j)` in terms of prefix sums. If `P[x]` is the sum of everything before x, then the subarray ending at j starting at i is `P[j+1] - P[i]`.',
    'So you are asking: for the current prefix `P`, how many earlier prefixes equal `P - k`? Every one of them ends a subarray summing to k.',
    'Keep a map from prefix value to how many times it has occurred, seeded with `{0: 1}` for the empty prefix. For each running sum, add `count[sum - k]` to the answer, then record `sum`.',
  ],

  starterCode: {
    javascript: `function subarraySum(nums, k) {
  // TODO: count contiguous subarrays summing to k.
  return 0;
}`,
    python: `def subarray_sum(nums, k):
    # TODO: count contiguous subarrays summing to k.
    return 0`,
  },

  referenceSolution: {
    javascript: `function subarraySum(nums, k) {
  // The empty prefix, so a subarray starting at index 0 is counted.
  const counts = new Map([[0, 1]]);
  let sum = 0;
  let total = 0;

  for (const n of nums) {
    sum += n;
    total += counts.get(sum - k) ?? 0;
    counts.set(sum, (counts.get(sum) ?? 0) + 1);
  }

  return total;
}`,
    python: `def subarray_sum(nums, k):
    # The empty prefix, so a subarray starting at index 0 is counted.
    counts = {0: 1}
    total = 0
    running = 0

    for n in nums:
        running += n
        total += counts.get(running - k, 0)
        counts[running] = counts.get(running, 0) + 1

    return total`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: 'One pass with a map holding at most n distinct prefix sums. The brute force over every start and end is O(n²), and the sliding window that would fix that is unavailable here because negative values break its monotonicity.',
  },

  testSpec: {
    entry: 'subarraySum',
    entryByLanguage: { python: 'subarray_sum' },
    cases: [
      { name: 'two overlapping windows', args: [[1, 1, 1], 2], expected: 2 },
      { name: 'whole array and a prefix', args: [[1, 2, 3], 3], expected: 2 },
      { name: 'zeros make several empty-sum windows', args: [[1, -1, 0], 0], expected: 3 },
      { name: 'nothing sums to k', args: [[1, 2, 3], 100], expected: 0 },
      { name: 'negatives on both sides', args: [[-1, 1, -1, 1], 0], expected: 4, hidden: true },
    ],
  },
};
