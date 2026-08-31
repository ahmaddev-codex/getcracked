import type { ProblemInput } from '../../schema';

export const singleNumber: ProblemInput = {
  tier: 'problem',
  slug: 'single-number',
  topic: 'bit-manipulation',
  difficulty: 'easy',
  title: 'Single Number',
  recommendedAfter: ['bit-manipulation'],

  brief: `Every value in \`nums\` appears exactly twice, except one that appears once.
Return that one.

\`\`\`
singleNumber([4, 1, 2, 1, 2])  ->  4
\`\`\`

A set or a counter solves it in O(n) time and O(n) space. There is a way to do it
in O(1) space, and it is the reason this problem is a bit-manipulation problem
rather than a hashing one.`,

  hints: [
    'What operation, applied to a number and itself, cancels out?',
    '`x ^ x` is 0, and `x ^ 0` is x. XOR is also commutative, so the order you meet the numbers does not matter.',
    'Fold XOR across the whole array. Every pair cancels to 0, and what survives is the value with no partner.',
  ],

  starterCode: {
    javascript: `function singleNumber(nums) {
  // TODO: return the value that appears exactly once.
  return 0;
}`,
    python: `def single_number(nums):
    # TODO: return the value that appears exactly once.
    return 0`,
  },

  referenceSolution: {
    javascript: `function singleNumber(nums) {
  let seen = 0;
  for (const n of nums) seen ^= n;
  return seen;
}`,
    python: `def single_number(nums):
    seen = 0
    for n in nums:
        seen ^= n
    return seen`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    note: 'One pass and a single accumulator. The hash-set solution is the same time but O(n) space — this is the rare case where the clever answer is also the simpler one to write.',
  },

  testSpec: {
    entry: 'singleNumber',
    entryByLanguage: { python: 'single_number' },
    cases: [
      { name: 'the odd one out is last', args: [[2, 2, 1]], expected: 1 },
      { name: 'unpaired value in the middle', args: [[4, 1, 2, 1, 2]], expected: 4 },
      { name: 'a single element is its own answer', args: [[7]], expected: 7 },
      { name: 'order does not matter', args: [[1, 1, 3, 5, 5]], expected: 3, hidden: true },
    ],
  },
};
