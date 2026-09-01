import type { ProblemInput } from '../../schema';

export const insertInterval: ProblemInput = {
  tier: 'problem',
  slug: 'insert-interval',
  topic: 'intervals',
  difficulty: 'medium',
  title: 'Insert Interval',
  companies: ['Google', 'Meta', 'Amazon', 'Microsoft', 'LinkedIn'],
  recommendedAfter: ['intervals'],

  brief: `You are given an array of non-overlapping intervals \`intervals\` where \`intervals[i] = [start, end]\` sorted in ascending order by start time. You are also given an interval \`newInterval = [start, end]\`.

Insert \`newInterval\` into \`intervals\` such that \`intervals\` is still sorted in ascending order and contains no overlapping intervals (merging overlapping intervals if necessary).

\`\`\`
insertInterval([[1, 3], [6, 9]], [2, 5]) 
  -> [[1, 5], [6, 9]]

insertInterval([[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], [4, 8]) 
  -> [[1, 2], [3, 10], [12, 16]]
\`\`\``,

  hints: [
    'Iterate through the sorted intervals in three distinct phases: before overlap, during overlap, and after overlap.',
    'Phase 1: Add all intervals that end before `newInterval` starts (`interval[1] < newInterval[0]`).',
    'Phase 2: Merge all intervals that overlap with `newInterval` by expanding `newInterval = [min(start), max(end)]`.',
    'Phase 3: Add the merged `newInterval` and all remaining intervals that start after `newInterval` ends.',
  ],

  starterCode: {
    javascript: `function insertInterval(intervals, newInterval) {
  // TODO: insert and merge newInterval into sorted intervals.
  return [];
}`,
    python: `def insert_interval(intervals, new_interval):
    # TODO: insert and merge new_interval into sorted intervals.
    return []`,
  },

  referenceSolution: {
    javascript: `function insertInterval(intervals, newInterval) {
  const result = [];
  let i = 0;
  const n = intervals.length;

  // 1. Add all intervals coming before newInterval
  while (i < n && intervals[i][1] < newInterval[0]) {
    result.push(intervals[i]);
    i++;
  }

  // 2. Merge overlapping intervals
  while (i < n && intervals[i][0] <= newInterval[1]) {
    newInterval[0] = Math.min(newInterval[0], intervals[i][0]);
    newInterval[1] = Math.max(newInterval[1], intervals[i][1]);
    i++;
  }
  result.push(newInterval);

  // 3. Add all intervals coming after newInterval
  while (i < n) {
    result.push(intervals[i]);
    i++;
  }

  return result;
}`,
    python: `def insert_interval(intervals, new_interval):
    result = []
    i = 0
    n = len(intervals)

    # 1. Add all intervals before new_interval
    while i < n and intervals[i][1] < new_interval[0]:
        result.append(intervals[i])
        i += 1

    # 2. Merge all overlapping intervals
    while i < n and intervals[i][0] <= new_interval[1]:
        new_interval[0] = min(new_interval[0], intervals[i][0])
        new_interval[1] = max(new_interval[1], intervals[i][1])
        i += 1
    result.append(new_interval)

    # 3. Add all remaining intervals after new_interval
    while i < n:
        result.append(intervals[i])
        i += 1

    return result`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(n) for result array',
    note: 'Single pass through the intervals array without needing any re-sorting.',
  },

  testSpec: {
    entry: 'insertInterval',
    entryByLanguage: { python: 'insert_interval' },
    cases: [
      {
        name: 'single overlap',
        args: [
          [
            [1, 3],
            [6, 9],
          ],
          [2, 5],
        ],
        expected: [
          [1, 5],
          [6, 9],
        ],
      },
      {
        name: 'multi interval merge',
        args: [
          [
            [1, 2],
            [3, 5],
            [6, 7],
            [8, 10],
            [12, 16],
          ],
          [4, 8],
        ],
        expected: [
          [1, 2],
          [3, 10],
          [12, 16],
        ],
      },
      {
        name: 'insert at beginning',
        args: [[[5, 7]], [1, 2]],
        expected: [
          [1, 2],
          [5, 7],
        ],
      },
      {
        name: 'insert into empty array',
        args: [[], [5, 7]],
        expected: [[5, 7]],
        hidden: true,
      },
    ],
  },
};
