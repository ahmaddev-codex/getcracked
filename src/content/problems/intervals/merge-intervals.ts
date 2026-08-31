import type { ProblemInput } from '../../schema';

export const mergeIntervals: ProblemInput = {
  tier: 'problem',
  slug: 'merge-intervals',
  topic: 'intervals',
  difficulty: 'medium',
  title: 'Merge Intervals',
  recommendedAfter: ['intervals'],

  brief: `Given a list of \`[start, end]\` intervals, merge every pair that overlaps and
return the result sorted by start.

\`\`\`
mergeIntervals([[1, 3], [2, 6], [8, 10]])  ->  [[1, 6], [8, 10]]
\`\`\`

Touching counts as overlapping: \`[1, 4]\` and \`[4, 5]\` merge into \`[1, 5]\`.

Almost every interval problem starts the same way, and that first step is most of
the difficulty — in an unsorted list, any interval can overlap any other, so there
is no single pass that works.`,

  hints: [
    'In an unsorted list you would have to compare every pair. What ordering makes overlap something you can decide by looking only at the previous interval?',
    'Sort by start. Then an interval can only overlap the one you most recently kept, because everything earlier ends before this one begins — or was already merged into it.',
    'Walk the sorted list. If `start <= last[1]`, extend that interval to `max(last[1], end)`. Otherwise push it as a new one.',
  ],

  starterCode: {
    javascript: `function mergeIntervals(intervals) {
  // TODO: merge overlapping intervals and return them sorted by start.
  return [];
}`,
    python: `def merge_intervals(intervals):
    # TODO: merge overlapping intervals and return them sorted by start.
    return []`,
  },

  referenceSolution: {
    javascript: `function mergeIntervals(intervals) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged = [];
  for (const [start, end] of sorted) {
    const last = merged[merged.length - 1];
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}`,
    python: `def merge_intervals(intervals):
    merged = []
    for start, end in sorted(intervals, key=lambda i: i[0]):
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged`,
  },

  complexity: {
    time: 'O(n log n)',
    space: 'O(n)',
    note: 'The sort dominates — the merge itself is one pass. That is the shape of most interval problems: sorting is what turns an all-pairs question into a neighbours-only one.',
  },

  testSpec: {
    entry: 'mergeIntervals',
    entryByLanguage: { python: 'merge_intervals' },
    cases: [
      {
        name: 'two overlap, one stands alone',
        args: [[[1, 3], [2, 6], [8, 10]]],
        expected: [[1, 6], [8, 10]],
      },
      { name: 'touching intervals merge', args: [[[1, 4], [4, 5]]], expected: [[1, 5]] },
      {
        name: 'given out of order',
        args: [[[8, 10], [1, 3], [2, 6]]],
        expected: [[1, 6], [8, 10]],
      },
      {
        name: 'one interval swallows another',
        args: [[[1, 10], [2, 3]]],
        expected: [[1, 10]],
        hidden: true,
      },
    ],
  },
};
