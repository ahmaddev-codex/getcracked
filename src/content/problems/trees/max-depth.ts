import type { ProblemInput } from '../../schema';

export const maxDepth: ProblemInput = {
  tier: 'problem',
  slug: "max-depth",
  topic: "trees",
  difficulty: "core",
  title: "Maximum Depth of a Tree",
  companies: ["Amazon", "Meta"],
  recommendedAfter: ["trees", "recursion"],

  brief: "A node is `{ value, left, right }`, with `null` for a missing child. Return the number of nodes on the longest root-to-leaf path.\n\n```\nmaxDepth({ value: 1, left: null, right: null })  ->  1\n```",

  hints: [
    "The depth of a tree is one more than the deeper of its two subtrees.",
    "That sentence is the whole solution \u2014 the base case is an empty tree, which has depth 0.",
  ],

  starterCode: {
    javascript: "function maxDepth(root) {\n  // TODO: longest root-to-leaf node count.\n  return 0;\n}",
    python: "def max_depth(root):\n    # TODO: longest root-to-leaf node count.\n    return 0",
  },

  referenceSolution: {
    javascript: "function maxDepth(root) {\n  if (!root) return 0;\n  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));\n}",
    python: "def max_depth(root):\n    if root is None:\n        return 0\n    return 1 + max(max_depth(root.get('left')), max_depth(root.get('right')))",
  },

  complexity: {
    time: "O(n)",
    space: "O(h) for height h",
    note: "Every node is visited once. The space is the recursion stack, which is the tree's height \u2014 O(n) for a degenerate tree, O(log n) for a balanced one.",
  },

  testSpec: {
    entry: "maxDepth",
    entryByLanguage: { python: "max_depth" },
    cases: [
        { name: "empty", args: [null], expected: 0 },
        { name: "single node", args: [{"value": 1, "left": null, "right": null}], expected: 1 },
        { name: "left heavy", args: [{"value": 1, "left": {"value": 2, "left": {"value": 3, "left": null, "right": null}, "right": null}, "right": null}], expected: 3 },
        { name: "balanced", args: [{"value": 1, "left": {"value": 2, "left": null, "right": null}, "right": {"value": 3, "left": null, "right": null}}], expected: 2, hidden: true },
    ],
  },
};
