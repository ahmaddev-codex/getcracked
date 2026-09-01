import type { ProblemInput } from '../../schema';

export const threeSum: ProblemInput = {
  tier: 'problem',
  slug: 'three-sum',
  topic: 'two-pointers',
  difficulty: 'medium',
  title: 'Three Sum',
  companies: ['Meta', 'Amazon', 'Apple', 'Google'],
  recommendedAfter: ['two-pointers'],

  brief:
    'Given an array of integers `nums`, return all unique triplets `[nums[i], nums[j], nums[k]]` such that `i != j`, `i != k`, and `j != k`, and `nums[i] + nums[j] + nums[k] == 0`.\n\nThe solution set must not contain duplicate triplets.\n\n```\nthreeSum([-1, 0, 1, 2, -1, -4])  ->  [[-1, -1, 2], [-1, 0, 1]]\nthreeSum([0, 1, 1])               ->  []\nthreeSum([0, 0, 0])               ->  [[0, 0, 0]]\n```',

  hints: [
    'Sorting the array first makes it easy to skip duplicate values and use the two-pointer technique.',
    'For each element `nums[i]`, we need to find two numbers that sum to `-nums[i]`. That is a classic two-pointer problem on the remaining sorted subarray.',
    'Remember to increment/decrement pointers past identical values to avoid adding duplicate triplets to the result.',
  ],

  starterCode: {
    javascript: 'function threeSum(nums) {\n  // TODO: find all unique triplets that sum to 0\n  return [];\n}',
    python: 'def three_sum(nums):\n    # TODO: find all unique triplets that sum to 0\n    return []',
  },

  referenceSolution: {
    javascript: `function threeSum(nums) {
  const result = [];
  nums.sort((a, b) => a - b);

  for (let i = 0; i < nums.length - 2; i++) {
    if (i > 0 && nums[i] === nums[i - 1]) continue;
    if (nums[i] > 0) break;

    let left = i + 1;
    let right = nums.length - 1;

    while (left < right) {
      const sum = nums[i] + nums[left] + nums[right];
      if (sum === 0) {
        result.push([nums[i], nums[left], nums[right]]);
        while (left < right && nums[left] === nums[left + 1]) left++;
        while (left < right && nums[right] === nums[right - 1]) right--;
        left++;
        right--;
      } else if (sum < 0) {
        left++;
      } else {
        right--;
      }
    }
  }

  return result;
}`,
    python: `def three_sum(nums):
    result = []
    nums.sort()

    for i in range(len(nums) - 2):
        if i > 0 and nums[i] == nums[i - 1]:
            continue
        if nums[i] > 0:
            break

        left = i + 1
        right = len(nums) - 1

        while left < right:
            total = nums[i] + nums[left] + nums[right]
            if total == 0:
                result.append([nums[i], nums[left], nums[right]])
                while left < right and nums[left] == nums[left + 1]:
                    left += 1
                while left < right and nums[right] == nums[right - 1]:
                    right -= 1
                left += 1
                right -= 1
            elif total < 0:
                left += 1
            else:
                right -= 1

    return result`,
  },

  complexity: {
    time: 'O(n^2)',
    space: 'O(1) extra space (or O(n) depending on sort implementation)',
    note: 'Sorting takes O(n log n), and the outer loop with two-pointer inner scan takes O(n^2), dominating the time.',
  },

  testSpec: {
    entry: 'threeSum',
    entryByLanguage: { python: 'three_sum' },
    cases: [
      {
        name: 'standard mixed',
        args: [[-1, 0, 1, 2, -1, -4]],
        expected: [[-1, -1, 2], [-1, 0, 1]],
      },
      {
        name: 'no solution',
        args: [[0, 1, 1]],
        expected: [],
      },
      {
        name: 'all zeros',
        args: [[0, 0, 0]],
        expected: [[0, 0, 0]],
      },
      {
        name: 'too short',
        args: [[1, 2]],
        expected: [],
        hidden: true,
      },
      {
        name: 'duplicates everywhere',
        args: [[-2, 0, 0, 2, 2]],
        expected: [[-2, 0, 2]],
        hidden: true,
      },
    ],
  },
};
