import type { ProblemInput } from '../../schema';

export const sortColors: ProblemInput = {
  tier: 'problem',
  slug: 'sort-colors',
  topic: 'sorting',
  difficulty: 'medium',
  title: 'Sort Colors',
  recommendedAfter: ['sorting', 'two-pointers'],

  brief: `\`nums\` contains only \`0\`, \`1\` and \`2\`. Return it sorted.

\`\`\`
sortColors([2, 0, 2, 1, 1, 0])  ->  [0, 0, 1, 1, 2, 2]
\`\`\`

A comparison sort does this in O(n log n) and calling one is a perfectly good answer
to give first. But three known values is extra information, and the point of the
problem is what that information buys: one pass, no comparisons between elements.

Counting each value and rewriting the array is the two-pass version. The
single-pass one is the Dutch national flag partition.`,

  hints: [
    'You are not sorting arbitrary values — there are exactly three, and you know what they are. What does that let you do that a comparison sort cannot?',
    'Two passes is easy: count how many 0s, 1s and 2s there are, then overwrite. Try that first, then look for the version that does not need the counts.',
    'One pass: keep a boundary for where 0s end and where 2s begin, and a cursor between them. Swap the cursor value to whichever end it belongs, and only advance the cursor when what it lands on is settled.',
  ],

  starterCode: {
    javascript: `function sortColors(nums) {
  // TODO: return nums sorted, given it contains only 0, 1 and 2.
  return nums;
}`,
    python: `def sort_colors(nums):
    # TODO: return nums sorted, given it contains only 0, 1 and 2.
    return nums`,
  },

  referenceSolution: {
    javascript: `function sortColors(nums) {
  const out = [...nums];
  let low = 0;
  let mid = 0;
  let high = out.length - 1;

  while (mid <= high) {
    if (out[mid] === 0) {
      [out[low], out[mid]] = [out[mid], out[low]];
      low++;
      mid++;
    } else if (out[mid] === 2) {
      [out[high], out[mid]] = [out[mid], out[high]];
      // Not advancing: what came back from the far end is unexamined.
      high--;
    } else {
      mid++;
    }
  }

  return out;
}`,
    python: `def sort_colors(nums):
    out = list(nums)
    low = mid = 0
    high = len(out) - 1

    while mid <= high:
        if out[mid] == 0:
            out[low], out[mid] = out[mid], out[low]
            low += 1
            mid += 1
        elif out[mid] == 2:
            out[high], out[mid] = out[mid], out[high]
            # Not advancing: what came back from the far end is unexamined.
            high -= 1
        else:
            mid += 1

    return out`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: 'One pass, and in place if you are allowed to mutate the input — the copy here exists so the tests compare a returned value. Beating O(n log n) is only possible because the set of values is known in advance; on arbitrary input no comparison sort can do better.',
  },

  testSpec: {
    entry: 'sortColors',
    entryByLanguage: { python: 'sort_colors' },
    cases: [
      { name: 'a mixed array', args: [[2, 0, 2, 1, 1, 0]], expected: [0, 0, 1, 1, 2, 2] },
      { name: 'already sorted', args: [[0, 1, 2]], expected: [0, 1, 2] },
      { name: 'exactly reversed', args: [[2, 1, 0]], expected: [0, 1, 2] },
      { name: 'one value only', args: [[1, 1, 1]], expected: [1, 1, 1] },
      { name: 'a value missing entirely', args: [[2, 0, 0, 2]], expected: [0, 0, 2, 2], hidden: true },
    ],
  },
};
