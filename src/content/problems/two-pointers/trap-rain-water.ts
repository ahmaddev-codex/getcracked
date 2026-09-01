import type { ProblemInput } from '../../schema';

export const trapRainWater: ProblemInput = {
  tier: 'problem',
  slug: 'trap-rain-water',
  topic: 'two-pointers',
  difficulty: 'hard',
  title: 'Trapping Rain Water',
  companies: ['Amazon', 'Google', 'Meta', 'Goldman Sachs', 'Apple'],
  recommendedAfter: ['two-pointers', 'arrays'],

  brief: `Given \`n\` non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.

\`\`\`
trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]) -> 6
trap([4, 2, 0, 3, 2, 5])                   -> 9
trap([])                                   -> 0
\`\`\``,

  hints: [
    'The water level at any index `i` is determined by `min(maxLeft, maxRight) - height[i]`.',
    'Using two pointers (`left` at index 0 and `right` at index `n - 1`), you can track `leftMax` and `rightMax` simultaneously.',
    'Advance whichever pointer has the smaller maximum height, because the bottleneck for trapped water on that side is already established.',
  ],

  starterCode: {
    javascript: `function trap(height) {
  // TODO: calculate total volume of trapped water.
  return 0;
}`,
    python: `def trap(height):
    # TODO: calculate total volume of trapped water.
    return 0`,
  },

  referenceSolution: {
    javascript: `function trap(height) {
  if (!height || height.length === 0) return 0;
  let left = 0;
  let right = height.length - 1;
  let leftMax = 0;
  let rightMax = 0;
  let water = 0;

  while (left < right) {
    if (height[left] < height[right]) {
      if (height[left] >= leftMax) {
        leftMax = height[left];
      } else {
        water += leftMax - height[left];
      }
      left++;
    } else {
      if (height[right] >= rightMax) {
        rightMax = height[right];
      } else {
        water += rightMax - height[right];
      }
      right--;
    }
  }

  return water;
}`,
    python: `def trap(height):
    if not height:
        return 0
    left = 0
    right = len(height) - 1
    left_max = 0
    right_max = 0
    water = 0

    while left < right:
        if height[left] < height[right]:
            if height[left] >= left_max:
                left_max = height[left]
            else:
                water += left_max - height[left]
            left += 1
        else:
            if height[right] >= right_max:
                right_max = height[right]
            else:
                water += right_max - height[right]
            right -= 1

    return water`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    note: 'Optimal two-pointer approach requiring a single pass and constant extra space.',
  },

  testSpec: {
    entry: 'trap',
    cases: [
      {
        name: 'standard multi-peak elevation',
        args: [[0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]],
        expected: 6,
      },
      {
        name: 'valley elevation',
        args: [[4, 2, 0, 3, 2, 5]],
        expected: 9,
      },
      {
        name: 'strictly ascending (no trap)',
        args: [[1, 2, 3, 4, 5]],
        expected: 0,
      },
      {
        name: 'empty elevation',
        args: [[]],
        expected: 0,
      },
      {
        name: 'single valley',
        args: [[3, 0, 2, 0, 4]],
        expected: 7,
        hidden: true,
      },
    ],
  },
};
