import type { ProblemInput } from '../../schema';

export const reverseLinkedList: ProblemInput = {
  tier: 'problem',
  slug: 'reverse-linked-list',
  topic: 'linked-lists',
  difficulty: 'easy',
  title: 'Reverse Linked List',
  companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple'],
  recommendedAfter: ['linked-lists'],

  brief: `Given the head of a singly linked list represented as an array of values, reverse the list and return the reversed array of values.

\`\`\`
reverseList([1, 2, 3, 4, 5]) -> [5, 4, 3, 2, 1]
reverseList([1, 2])          -> [2, 1]
reverseList([])              -> []
\`\`\``,

  hints: [
    'Iterate through the list while maintaining a `prev` pointer initialized to `null` and a `curr` pointer initialized to the head.',
    'At each step, save `curr.next`, redirect `curr.next = prev`, then advance `prev = curr` and `curr = next`.',
    'When `curr` becomes null, `prev` is the new head of the reversed list.',
  ],

  starterCode: {
    javascript: `function reverseList(nums) {
  // TODO: reverse the list and return the array of values.
  return nums;
}`,
    python: `def reverse_list(nums):
    # TODO: reverse the list and return the array of values.
    return nums`,
  },

  referenceSolution: {
    javascript: `function reverseList(nums) {
  const result = [];
  for (let i = nums.length - 1; i >= 0; i--) {
    result.push(nums[i]);
  }
  return result;
}`,
    python: `def reverse_list(nums):
    return nums[::-1]`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(1) auxiliary pointer manipulation (or O(n) array space)',
    note: 'Iterating through n nodes reversing pointers in-place takes linear time with no additional heap allocations.',
  },

  testSpec: {
    entry: 'reverseList',
    entryByLanguage: { python: 'reverse_list' },
    cases: [
      { name: 'five elements', args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { name: 'two elements', args: [[1, 2]], expected: [2, 1] },
      { name: 'single element', args: [[1]], expected: [1] },
      { name: 'empty list', args: [[]], expected: [], hidden: true },
    ],
  },
};
