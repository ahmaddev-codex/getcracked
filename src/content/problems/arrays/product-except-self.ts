import type { ProblemInput } from '../../schema';

export const productExceptSelf: ProblemInput = {
  tier: 'problem',
  slug: 'product-except-self',
  topic: 'arrays',
  difficulty: 'medium',
  title: 'Product of Array Except Self',
  companies: ['Amazon', 'Meta', 'Apple', 'Uber', 'Stripe'],
  recommendedAfter: ['arrays'],

  brief:
    'Given an integer array `nums`, return an array `answer` such that `answer[i]` is equal to the product of all the elements of `nums` except `nums[i]`.\n\nYou must write an algorithm that runs in `O(n)` time and without using the division operation.\n\n```\nproductExceptSelf([1, 2, 3, 4])  ->  [24, 12, 8, 6]\nproductExceptSelf([-1, 1, 0, -3, 3])  ->  [0, 0, 9, 0, 0]\n```',

  hints: [
    'Think about the product of all elements to the left of index `i`, and the product of all elements to the right of index `i`.',
    'Can you make two passes? In the first pass from left to right, calculate prefix products. In the second pass from right to left, multiply by suffix products.',
    'You can compute the output array directly by storing prefix products in it first, then keeping a single running suffix variable as you loop backward.',
  ],

  starterCode: {
    javascript: 'function productExceptSelf(nums) {\n  // TODO: return products without division\n  return [];\n}',
    python: 'def product_except_self(nums):\n    # TODO: return products without division\n    return []',
  },

  referenceSolution: {
    javascript: `function productExceptSelf(nums) {
  const n = nums.length;
  const result = new Array(n).fill(1);

  let prefix = 1;
  for (let i = 0; i < n; i++) {
    result[i] = prefix;
    prefix *= nums[i];
  }

  let suffix = 1;
  for (let i = n - 1; i >= 0; i--) {
    result[i] *= suffix;
    suffix *= nums[i];
  }

  return result;
}`,
    python: `def product_except_self(nums):
    n = len(nums)
    result = [1] * n

    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= nums[i]

    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= nums[i]

    return result`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(1) auxiliary space (excluding the output array)',
    note: 'Two linear passes compute prefix products and suffix products in-place without division.',
  },

  testSpec: {
    entry: 'productExceptSelf',
    entryByLanguage: { python: 'product_except_self' },
    cases: [
      {
        name: 'positive integers',
        args: [[1, 2, 3, 4]],
        expected: [24, 12, 8, 6],
      },
      {
        name: 'with single zero',
        args: [[-1, 1, 0, -3, 3]],
        expected: [0, 0, 9, 0, 0],
      },
      {
        name: 'two elements',
        args: [[2, 5]],
        expected: [5, 2],
      },
      {
        name: 'with multiple zeros',
        args: [[0, 4, 0]],
        expected: [0, 0, 0],
        hidden: true,
      },
    ],
  },
};
