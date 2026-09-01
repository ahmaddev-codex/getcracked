import type { ProblemInput } from '../../schema';

export const searchRotatedSortedArray: ProblemInput = {
  tier: 'problem',
  slug: 'search-rotated-sorted-array',
  topic: 'binary-search',
  difficulty: 'medium',
  title: 'Search in Rotated Sorted Array',
  companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple'],
  recommendedAfter: ['binary-search'],

  brief: `There is an integer array \`nums\` sorted in ascending order (with distinct values). Prior to being passed to your function, \`nums\` is possibly rotated at an unknown pivot index.

Given the array \`nums\` and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or \`-1\` if it is not in \`nums\`.

You must write an algorithm with **O(log n)** runtime complexity.

\`\`\`
search([4, 5, 6, 7, 0, 1, 2], 0) -> 4
search([4, 5, 6, 7, 0, 1, 2], 3) -> -1
search([1], 0)                   -> -1
\`\`\``,

  hints: [
    'Notice that if you divide a rotated sorted array in half, at least one of the two halves is guaranteed to be normally sorted.',
    'Compare `nums[left]` with `nums[mid]` to determine which half (left or right) is sorted.',
    'Once you identify the sorted half, check if `target` falls within its boundaries. If it does, search that half; otherwise, search the opposite half.',
  ],

  starterCode: {
    javascript: `function search(nums, target) {
  // TODO: find target index in rotated sorted array in O(log n).
  return -1;
}`,
    python: `def search(nums, target):
    # TODO: find target index in rotated sorted array in O(log n).
    return -1`,
  },

  referenceSolution: {
    javascript: `function search(nums, target) {
  let left = 0;
  let right = nums.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (nums[mid] === target) return mid;

    // Check if left half is normally sorted
    if (nums[left] <= nums[mid]) {
      if (nums[left] <= target && target < nums[mid]) {
        right = mid - 1;
      } else {
        left = mid + 1;
      }
    } else {
      // Right half is sorted
      if (nums[mid] < target && target <= nums[right]) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
  }

  return -1;
}`,
    python: `def search(nums, target):
    left, right = 0, len(nums) - 1

    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid

        # Check if left half is sorted
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else:
            # Right half is sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1

    return -1`,
  },

  complexity: {
    time: 'O(log n)',
    space: 'O(1)',
    note: 'Halves the search space at each iteration using modified binary search boundaries.',
  },

  testSpec: {
    entry: 'search',
    cases: [
      { name: 'target in right sorted half', args: [[4, 5, 6, 7, 0, 1, 2], 0], expected: 4 },
      { name: 'target not present', args: [[4, 5, 6, 7, 0, 1, 2], 3], expected: -1 },
      { name: 'single element not found', args: [[1], 0], expected: -1 },
      { name: 'single element found', args: [[1], 1], expected: 0 },
      { name: 'target at pivot point', args: [[6, 7, 1, 2, 3, 4, 5], 6], expected: 0, hidden: true },
    ],
  },
};
