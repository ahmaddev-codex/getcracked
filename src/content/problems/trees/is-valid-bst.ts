import type { ProblemInput } from '../../schema';

export const isValidBst: ProblemInput = {
  tier: 'problem',
  slug: 'is-valid-bst',
  topic: 'trees',
  difficulty: 'medium',
  title: 'Validate Binary Search Tree',
  companies: ['Amazon', 'Microsoft', 'Bloomberg', 'Meta'],
  recommendedAfter: ['trees'],

  brief: `Given the root of a binary tree (represented as \`{ value, left, right }\` nodes with \`null\` for missing children), determine if it is a valid Binary Search Tree (BST).

A valid BST is defined as:
- The left subtree of a node contains only nodes with keys **less than** the node's key.
- The right subtree of a node contains only nodes with keys **greater than** the node's key.
- Both the left and right subtrees must also be binary search trees.

\`\`\`
isValidBST({ value: 2, left: { value: 1, left: null, right: null }, right: { value: 3, left: null, right: null } }) -> true
\`\`\``,

  hints: [
    'A common mistake is only checking if `node.left.value < node.value` and `node.right.value > node.value`. That is necessary but not sufficient — every node in the left subtree must be smaller than all its ancestor upper bounds.',
    'Pass valid allowable minimum and maximum bounds `(minVal, maxVal)` down the recursive tree calls.',
    'For the left child, the upper bound becomes `node.value`. For the right child, the lower bound becomes `node.value`.',
  ],

  starterCode: {
    javascript: `function isValidBST(root) {
  // TODO: return true if binary tree is a valid BST.
  return true;
}`,
    python: `def is_valid_bst(root):
    # TODO: return true if binary tree is a valid BST.
    return True`,
  },

  referenceSolution: {
    javascript: `function isValidBST(root) {
  function validate(node, min, max) {
    if (!node) return true;
    if ((min !== null && node.value <= min) || (max !== null && node.value >= max)) {
      return false;
    }
    return validate(node.left, min, node.value) && validate(node.right, node.value, max);
  }
  return validate(root, null, null);
}`,
    python: `def is_valid_bst(root):
    def validate(node, min_val, max_val):
        if node is None:
            return True
        val = node.get('value')
        if (min_val is not None and val <= min_val) or (max_val is not None and val >= max_val):
            return False
        return validate(node.get('left'), min_val, val) and validate(node.get('right'), val, max_val)

    return validate(root, None, None)`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(h) where h is tree height',
    note: 'Visits each node once while carrying upper and lower bounding constraints down the recursion stack.',
  },

  testSpec: {
    entry: 'isValidBST',
    entryByLanguage: { python: 'is_valid_bst' },
    cases: [
      {
        name: 'valid small BST',
        args: [
          {
            value: 2,
            left: { value: 1, left: null, right: null },
            right: { value: 3, left: null, right: null },
          },
        ],
        expected: true,
      },
      {
        name: 'invalid right subtree child violation',
        args: [
          {
            value: 5,
            left: { value: 1, left: null, right: null },
            right: {
              value: 4,
              left: { value: 3, left: null, right: null },
              right: { value: 6, left: null, right: null },
            },
          },
        ],
        expected: false,
      },
      { name: 'empty tree is valid', args: [null], expected: true },
      {
        name: 'single node is valid',
        args: [{ value: 10, left: null, right: null }],
        expected: true,
        hidden: true,
      },
    ],
  },
};
