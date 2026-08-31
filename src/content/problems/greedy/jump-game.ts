import type { ProblemInput } from '../../schema';

export const jumpGame: ProblemInput = {
  tier: 'problem',
  slug: 'jump-game',
  topic: 'greedy',
  difficulty: 'medium',
  title: 'Jump Game',
  recommendedAfter: ['greedy'],

  brief: `You start at index 0. Each \`nums[i]\` is the **maximum** number of steps you
may jump forward from \`i\`. Return whether you can reach the last index.

\`\`\`
canJump([2, 3, 1, 1, 4])  ->  true
canJump([3, 2, 1, 0, 4])  ->  false
\`\`\`

The tempting approach is to try every jump length from every position, which is
exponential. The greedy insight makes it one pass: you never need to know *which*
jumps you took, only how far you could possibly have got.`,

  hints: [
    'You do not need the path. Track a single number: the furthest index reachable so far.',
    'Walk left to right. At index `i`, if `i` is beyond everything you could reach, you are stuck and no later index can help.',
    'Otherwise extend the reach to `max(reach, i + nums[i])`. If the reach ever covers the last index, the answer is true.',
  ],

  starterCode: {
    javascript: `function canJump(nums) {
  // TODO: return whether the last index is reachable from index 0.
  return false;
}`,
    python: `def can_jump(nums):
    # TODO: return whether the last index is reachable from index 0.
    return False`,
  },

  referenceSolution: {
    javascript: `function canJump(nums) {
  let reach = 0;
  for (let i = 0; i < nums.length; i++) {
    if (i > reach) return false;
    reach = Math.max(reach, i + nums[i]);
  }
  return true;
}`,
    python: `def can_jump(nums):
    reach = 0
    for i, n in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + n)
    return True`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    note: 'One pass, one number. The greedy choice is safe because reachability is monotone — if you can reach index i you can reach everything before it, so the furthest reach is the only fact worth carrying.',
  },

  testSpec: {
    entry: 'canJump',
    entryByLanguage: { python: 'can_jump' },
    cases: [
      { name: 'a clear path to the end', args: [[2, 3, 1, 1, 4]], expected: true },
      { name: 'a zero that traps you', args: [[3, 2, 1, 0, 4]], expected: false },
      { name: 'a single element is already the end', args: [[0]], expected: true },
      { name: 'a zero you can jump over', args: [[2, 0, 1]], expected: true, hidden: true },
    ],
  },
};
