import type { ProblemInput } from '../../schema';

export const levelOrder: ProblemInput = {
  tier: 'problem',
  slug: 'level-order',
  topic: 'trees',
  difficulty: 'medium',
  title: 'Binary Tree Level Order Traversal',
  companies: ['Amazon', 'Meta', 'Microsoft', 'Bloomberg'],
  recommendedAfter: ['trees', 'stacks-queues'],

  brief:
    'A binary tree node is represented as `{ value, left, right }`, with `null` for a missing child.\n\nReturn the level order traversal of its nodes values (i.e., from left to right, level by level).\n\n```\nlevelOrder({\n  value: 3,\n  left: { value: 9, left: null, right: null },\n  right: {\n    value: 20,\n    left: { value: 15, left: null, right: null },\n    right: { value: 7, left: null, right: null }\n  }\n})  ->  [[3], [9, 20], [15, 7]]\n```',

  hints: [
    'Level order traversal is Breadth-First Search (BFS). What data structure is natural for BFS?',
    'Use a queue initialized with the root node. In each step, record the current queue length to know how many nodes belong to the current level.',
    'Pop nodes from the queue, collect their values, and enqueue their non-null children.',
  ],

  starterCode: {
    javascript: 'function levelOrder(root) {\n  // TODO: return level-by-level array of values\n  return [];\n}',
    python: 'def level_order(root):\n    # TODO: return level-by-level array of values\n    return []',
  },

  referenceSolution: {
    javascript: `function levelOrder(root) {
  if (!root) return [];
  const result = [];
  const queue = [root];

  while (queue.length > 0) {
    const levelSize = queue.length;
    const currentLevel = [];

    for (let i = 0; i < levelSize; i++) {
      const node = queue.shift();
      currentLevel.push(node.value);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }

    result.push(currentLevel);
  }

  return result;
}`,
    python: `def level_order(root):
    if not root:
        return []
    result = []
    queue = [root]

    while queue:
        level_size = len(queue)
        current_level = []

        for _ in range(level_size):
            node = queue.pop(0)
            current_level.append(node['value'])
            if node.get('left'):
                queue.append(node['left'])
            if node.get('right'):
                queue.append(node['right'])

        result.append(current_level)

    return result`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: 'Each node is enqueued and dequeued once. In the worst case (full binary tree), the queue holds up to n/2 nodes at the leaf level.',
  },

  testSpec: {
    entry: 'levelOrder',
    entryByLanguage: { python: 'level_order' },
    cases: [
      {
        name: 'empty',
        args: [null],
        expected: [],
      },
      {
        name: 'single node',
        args: [{ value: 1, left: null, right: null }],
        expected: [[1]],
      },
      {
        name: 'three levels',
        args: [
          {
            value: 3,
            left: { value: 9, left: null, right: null },
            right: {
              value: 20,
              left: { value: 15, left: null, right: null },
              right: { value: 7, left: null, right: null },
            },
          },
        ],
        expected: [[3], [9, 20], [15, 7]],
      },
      {
        name: 'linear left',
        args: [
          {
            value: 1,
            left: {
              value: 2,
              left: { value: 3, left: null, right: null },
              right: null,
            },
            right: null,
          },
        ],
        expected: [[1], [2], [3]],
        hidden: true,
      },
    ],
  },
};
