import type { ProblemInput } from '../../schema';

/**
 * The first authored exercise. Its shape is the template every later problem
 * follows, so it is deliberately complete rather than minimal.
 */
export const twoSum: ProblemInput = {
  tier: 'problem',
  slug: 'two-sum',
  topic: 'hashing',
  difficulty: 'warm-up',
  title: 'Two Sum',
  companies: ['Amazon', 'Google', 'Meta'],
  recommendedAfter: ['hashing'],

  brief: `Given an array of integers \`nums\` and an integer \`target\`, return the
indices of the two numbers that add up to \`target\`.

Each input has exactly one solution, and you may not use the same element twice.
Return the indices in ascending order.

\`\`\`
twoSum([2, 7, 11, 15], 9)  ->  [0, 1]
\`\`\`

The obvious approach compares every pair, which is O(n²). There is an O(n) way.`,

  hints: [
    'For each number, there is exactly one other number that would complete the pair. Can you name it before you go looking for it?',
    'You are asking "have I seen `target - current` already?" once per element. Which data structure answers that question in O(1)?',
    'Store each number as you pass it, mapped to its index. Then a single pass is enough — you never need to look forward, only back.',
  ],

  starterCode: {
    javascript: `function twoSum(nums, target) {
  // TODO: return the indices of the two numbers adding up to target.
  return [];
}`,
  },

  referenceSolution: {
    javascript: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: 'One pass over the array, with a hash map holding at most n entries. The brute-force pair comparison is O(n²) time and O(1) space — the map trades space for time.',
  },

  testSpec: {
    entry: 'twoSum',
    cases: [
      { name: 'pair at the start', args: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { name: 'pair in the middle', args: [[3, 2, 4], 6], expected: [1, 2] },
      { name: 'duplicate values', args: [[3, 3], 6], expected: [0, 1] },
      { name: 'negative numbers', args: [[-3, 4, 3, 90], 0], expected: [0, 2] },
      // Hidden so a learner cannot pattern-match the boundary from the visible
      // cases; it still runs and still has to pass.
      { name: 'pair at the very end', args: [[1, 2, 3, 4, 5], 9], expected: [3, 4], hidden: true },
    ],
  },
};
