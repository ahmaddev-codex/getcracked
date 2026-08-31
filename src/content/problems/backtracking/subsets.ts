import type { ProblemInput } from '../../schema';

export const subsets: ProblemInput = {
  tier: 'problem',
  slug: 'subsets',
  topic: 'backtracking',
  difficulty: 'medium',
  title: 'Subsets',
  recommendedAfter: ['backtracking', 'recursion'],

  brief: `Return every subset of \`nums\`, which contains no duplicates.

\`\`\`
subsets([1, 2])  ->  [[], [2], [1], [1, 2]]
\`\`\`

**Order is fixed** so the answer can be compared: for each element in order, first
every subset that excludes it, then every subset that includes it. That is exactly
what you get by taking the "skip" branch before the "take" branch at each step, so
if your recursion is shaped that way the order falls out for free.

There are 2ⁿ subsets, so nothing here is faster than exponential. What the problem
teaches is the shape — the decision tree, and undoing a choice on the way back up.`,

  hints: [
    'At each index you make one binary decision: is this element in the subset or not? That decision tree has 2ⁿ leaves, and each leaf is one answer.',
    'Recurse on the index. At index i, first recurse without taking `nums[i]`, then recurse having taken it — that ordering is what produces the expected order.',
    'Push `nums[i]` before the "take" call and pop it after. The pop is the backtracking: without it, choices from one branch leak into the next.',
  ],

  starterCode: {
    javascript: `function subsets(nums) {
  // TODO: return every subset, skip-before-take order.
  return [];
}`,
    python: `def subsets(nums):
    # TODO: return every subset, skip-before-take order.
    return []`,
  },

  referenceSolution: {
    javascript: `function subsets(nums) {
  const out = [];
  const current = [];

  function walk(i) {
    if (i === nums.length) {
      // A copy, because current keeps mutating after this.
      out.push([...current]);
      return;
    }
    walk(i + 1);
    current.push(nums[i]);
    walk(i + 1);
    current.pop();
  }

  walk(0);
  return out;
}`,
    python: `def subsets(nums):
    out = []
    current = []

    def walk(i):
        if i == len(nums):
            # A copy, because current keeps mutating after this.
            out.append(list(current))
            return
        walk(i + 1)
        current.append(nums[i])
        walk(i + 1)
        current.pop()

    walk(0)
    return out`,
  },

  complexity: {
    time: 'O(n · 2ⁿ)',
    space: 'O(n) for the recursion, O(n · 2ⁿ) for the output',
    note: 'There are 2ⁿ subsets and copying each costs up to n, so the output itself is the dominant term — no algorithm can beat it, because producing the answer requires writing it down.',
  },

  testSpec: {
    entry: 'subsets',
    cases: [
      { name: 'empty input has one subset', args: [[]], expected: [[]] },
      { name: 'a single element', args: [[1]], expected: [[], [1]] },
      { name: 'two elements, skip before take', args: [[1, 2]], expected: [[], [2], [1], [1, 2]] },
      {
        name: 'three elements',
        args: [[1, 2, 3]],
        expected: [[], [3], [2], [2, 3], [1], [1, 3], [1, 2], [1, 2, 3]],
        hidden: true,
      },
    ],
  },
};
