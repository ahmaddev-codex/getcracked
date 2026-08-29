import type { LessonInput } from '../schema';

export const treesLesson: LessonInput = {
  tier: 'lesson',
  slug: "trees",
  order: 8,
  title: "Trees",
  summary: "Recursion with a shape.",

  explainer: "A tree is a graph with no cycles and one path between any two nodes. That\nabsence of cycles is what makes tree algorithms simpler than graph algorithms:\nyou never need a visited set, because you cannot arrive anywhere twice.\n\nNearly every tree problem is one sentence about a node plus its children. \"The\ndepth is one more than the deeper subtree.\" \"The tree is balanced if both\nsubtrees are balanced and their depths differ by at most one.\" Write that sentence\nand the code follows.\n\nTraversal order is the other half:\n\n- **Pre-order** (node, left, right) \u2014 copying a tree, serialising it.\n- **In-order** (left, node, right) \u2014 yields a binary search tree in sorted order.\n- **Post-order** (left, right, node) \u2014 anything needing children resolved first,\n  like computing sizes or freeing nodes.\n- **Level-order** \u2014 a queue, not recursion. Use it when distance from the root\n  matters.\n\nA **binary search tree** adds an invariant: everything left is smaller,\neverything right is larger. That turns lookup into binary search \u2014 but only while\nthe tree stays balanced. A BST built from sorted input degenerates into a linked\nlist and every operation becomes O(n).",

  walkthrough: {
    entry: "treeDepth",
    entryByLanguage: { python: 'tree_depth' },
    source: {
      javascript: "function treeDepth(tree) {\n  function go(index) {\n    if (index >= tree.length) {\n      return 0;\n    }\n    if (tree[index] === -1) {\n      return 0;\n    }\n    const left = go(2 * index + 1);\n    const right = go(2 * index + 2);\n    return 1 + Math.max(left, right);\n  }\n  return go(0);\n}",
      python: `def tree_depth(tree):
    def go(index):
        if index >= len(tree):
            return 0
        if tree[index] == -1:
            return 0
        left = go(2 * index + 1)
        right = go(2 * index + 2)
        return 1 + max(left, right)
    return go(0)`,
    },
    args: [[1, 2, 3, 4, 5, -1, 6]],
    caption: "A tree stored in an array: node i has children at 2i+1 and 2i+2. Watch the traversal walk down each branch and back.",
  },

  complexity: {
    time: "O(n) for a full traversal, O(h) for a BST lookup",
    space: "O(h) for the recursion stack",
    note: "Height h is log n for a balanced tree and n for a degenerate one. The gap between those two is why self-balancing trees exist.",
  },

  patternCues: [
    "The data is hierarchical: filesystem, DOM, org chart, parse tree.",
    "The problem mentions parent, child, leaf, root, or depth.",
    "You need sorted order with fast insertion, which is a BST's in-order walk.",
    "A recursive definition falls out naturally from the statement.",
  ],

  pitfalls: [
    {
      title: "Forgetting the empty tree",
      body: "`null` is a valid tree and usually the base case. Most tree bugs are a missing null check at the top.",
    },
    {
      title: "Assuming balance",
      body: "A BST is only O(log n) while it stays balanced. Sorted insertions produce a linked list with extra pointers.",
    },
    {
      title: "Confusing depth and height",
      body: "Depth is measured from the root down, height from a node to its deepest leaf. Problems use both, and swapping them gives an off-by-one that only shows on lopsided trees.",
    },
  ],

  recommendedAfter: ["recursion"],
};
