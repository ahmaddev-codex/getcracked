import type { ProblemInput } from '../../schema';

export const longestConsecutiveSequence: ProblemInput = {
  tier: 'problem',
  slug: 'longest-consecutive-sequence',
  topic: 'hashing',
  difficulty: 'medium',
  title: 'Longest Consecutive Sequence',
  companies: ['Google', 'Meta', 'Amazon', 'Microsoft', 'Spotify'],
  recommendedAfter: ['hashing'],

  brief: `Given an unsorted array of integers \`nums\`, return the length of the longest consecutive elements sequence.

You must write an algorithm that runs in **O(n)** time complexity.

\`\`\`
longestConsecutive([100, 4, 200, 1, 3, 2]) -> 4
// The longest consecutive elements sequence is [1, 2, 3, 4]. Its length is 4.

longestConsecutive([0, 3, 7, 2, 5, 8, 4, 6, 0, 1]) -> 9
longestConsecutive([]) -> 0
\`\`\``,

  hints: [
    'Insert all numbers into a Hash Set for O(1) existence checks.',
    'A number `x` is the start of a consecutive sequence only if `x - 1` is NOT present in the set.',
    'For each sequence start, count forward (`x + 1`, `x + 2`, ...) until the streak breaks, then update the maximum length found.',
  ],

  starterCode: {
    javascript: `function longestConsecutive(nums) {
  // TODO: find the length of the longest consecutive elements sequence in O(n).
  return 0;
}`,
    python: `def longest_consecutive(nums):
    # TODO: find the length of the longest consecutive elements sequence in O(n).
    return 0`,
  },

  referenceSolution: {
    javascript: `function longestConsecutive(nums) {
  if (nums.length === 0) return 0;
  const numSet = new Set(nums);
  let longest = 0;

  for (const num of numSet) {
    // Only start counting if num is the beginning of a sequence
    if (!numSet.has(num - 1)) {
      let currentNum = num;
      let currentStreak = 1;

      while (numSet.has(currentNum + 1)) {
        currentNum += 1;
        currentStreak += 1;
      }

      longest = Math.max(longest, currentStreak);
    }
  }

  return longest;
}`,
    python: `def longest_consecutive(nums):
    if not nums:
        return 0
    num_set = set(nums)
    longest = 0

    for num in num_set:
        if (num - 1) not in num_set:
            current_num = num
            current_streak = 1

            while (current_num + 1) in num_set:
                current_num += 1
                current_streak += 1

            longest = max(longest, current_streak)

    return longest`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: 'Although the while loop is nested, each number is visited at most twice (once in the outer set iteration, once in the streak counting loop), guaranteeing strict O(n) runtime.',
  },

  testSpec: {
    entry: 'longestConsecutive',
    entryByLanguage: { python: 'longest_consecutive' },
    cases: [
      { name: 'standard unsorted list', args: [[100, 4, 200, 1, 3, 2]], expected: 4 },
      { name: 'large sequence with duplicates', args: [[0, 3, 7, 2, 5, 8, 4, 6, 0, 1]], expected: 9 },
      { name: 'single element', args: [[42]], expected: 1 },
      { name: 'empty array', args: [[]], expected: 0 },
      { name: 'negative numbers', args: [[-2, -3, -1, 10, 20]], expected: 3, hidden: true },
    ],
  },
};
