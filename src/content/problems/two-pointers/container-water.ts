import type { ProblemInput } from '../../schema';

export const containerWater: ProblemInput = {
  tier: 'problem',
  slug: "container-water",
  topic: "two-pointers",
  difficulty: "stretch",
  title: "Container With Most Water",
  companies: ["Amazon", "Google"],
  recommendedAfter: ["two-pointers"],

  brief: "Each element of `heights` is a vertical line. Return the largest area of water two lines can hold between them.\n\n```\nmaxArea([1, 8, 6, 2, 5, 4, 8, 3, 7])  ->  49\n```",

  hints: [
    "Area is the shorter of the two lines times the distance between them.",
    "Start with the widest possible pair \u2014 one at each end \u2014 and move inward.",
    "Move the shorter line. Moving the taller one can only reduce the area, because width shrinks and the height is still capped by the shorter side.",
  ],

  starterCode: {
    javascript: "function maxArea(heights) {\n  // TODO: largest area between two lines.\n  return 0;\n}",
    python: "def max_area(heights):\n    # TODO: largest area between two lines.\n    return 0",
  },

  referenceSolution: {
    javascript: "function maxArea(heights) {\n  let best = 0;\n  let i = 0;\n  let j = heights.length - 1;\n  while (i < j) {\n    const area = Math.min(heights[i], heights[j]) * (j - i);\n    if (area > best) best = area;\n    if (heights[i] < heights[j]) i++;\n    else j--;\n  }\n  return best;\n}",
    python: "def max_area(heights):\n    best = 0\n    i = 0\n    j = len(heights) - 1\n    while i < j:\n        area = min(heights[i], heights[j]) * (j - i)\n        if area > best:\n            best = area\n        if heights[i] < heights[j]:\n            i += 1\n        else:\n            j -= 1\n    return best",
  },

  complexity: {
    time: "O(n)",
    space: "O(1)",
    note: "The brute force over every pair is O(n^2). The invariant \u2014 moving the taller line can never help \u2014 is what makes one pass sufficient.",
  },

  testSpec: {
    entry: "maxArea",
    entryByLanguage: { python: "max_area" },
    cases: [
        { name: "classic", args: [[1, 8, 6, 2, 5, 4, 8, 3, 7]], expected: 49 },
        { name: "two lines", args: [[1, 1]], expected: 1 },
        { name: "increasing", args: [[1, 2, 3, 4, 5]], expected: 6 },
        { name: "empty-ish", args: [[5]], expected: 0, hidden: true },
    ],
  },
};
