import type { ProblemInput } from '../../schema';

export const houseRobber: ProblemInput = {
  tier: 'problem',
  slug: "house-robber",
  topic: "dynamic-programming",
  difficulty: "core",
  title: "House Robber",
  companies: ["Amazon", "Google"],
  recommendedAfter: ["dynamic-programming"],

  brief: "You cannot rob two adjacent houses. Return the maximum total you can take from `nums`.\n\n```\nrob([2, 7, 9, 3, 1])  ->  12\n```",

  hints: [
    "At each house you choose: take it and add the best from two houses back, or skip it and keep the best from one house back.",
    "Track those two running bests rather than a whole table.",
    "The answer is the better of the two once you reach the end.",
  ],

  starterCode: {
    javascript: "function rob(nums) {\n  // TODO: maximum non-adjacent total.\n  return 0;\n}",
    python: "def rob(nums):\n    # TODO: maximum non-adjacent total.\n    return 0",
  },

  referenceSolution: {
    javascript: "function rob(nums) {\n  let take = 0;\n  let skip = 0;\n  for (let i = 0; i < nums.length; i++) {\n    const nextTake = skip + nums[i];\n    const nextSkip = Math.max(skip, take);\n    take = nextTake;\n    skip = nextSkip;\n  }\n  return Math.max(take, skip);\n}",
    python: "def rob(nums):\n    take = 0\n    skip = 0\n    for n in nums:\n        take, skip = skip + n, max(skip, take)\n    return max(take, skip)",
  },

  complexity: {
    time: "O(n)",
    space: "O(1)",
    note: "A table would be O(n) space and is a fine first version. Only two values are ever read, which is what collapses it to constant.",
  },

  testSpec: {
    entry: "rob",
    entryByLanguage: { python: "rob" },
    cases: [
        { name: "classic", args: [[2, 7, 9, 3, 1]], expected: 12 },
        { name: "two houses", args: [[1, 2]], expected: 2 },
        { name: "empty", args: [[]], expected: 0 },
        { name: "single", args: [[5]], expected: 5 },
        { name: "all equal", args: [[3, 3, 3, 3]], expected: 6, hidden: true },
    ],
  },
};
