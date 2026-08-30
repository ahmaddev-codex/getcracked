import type { LessonInput } from '../schema';

export const intervalsLesson: LessonInput = {
  tier: 'lesson',
  slug: 'intervals',
  title: 'Intervals',
  summary: 'Sort by the right endpoint, then sweep — almost every interval problem.',
  order: 10,
  track: 'algorithms',

  difficulty: 'core',

  operations: [
    {
      name: 'sort',
      time: 'O(n log n)',
      note: 'Dominates everything.',
    },
    {
      name: 'merge sweep',
      time: 'O(n)',
      note: 'After sorting by start.',
    },
    {
      name: 'max non-overlapping',
      time: 'O(n)',
      note: 'After sorting by end.',
    },
    {
      name: 'max concurrent (sweep line)',
      time: 'O(n log n)',
      note: 'Sorting the +1 / -1 events.',
    },
  ],

  variants: [
    {
      name: 'Merge overlapping',
      what: 'Sort by start, extend the current end.',
    },
    {
      name: 'Activity selection',
      what: 'Sort by end, take greedily.',
    },
    {
      name: 'Sweep line',
      what: 'Split into +1 and -1 events; the running total is how many are active.',
    },
    {
      name: 'Interval tree',
      what: 'For repeated queries against a changing set.',
    },
  ],

  furtherReading: [
    {
      label: 'Interval scheduling',
      url: 'https://en.wikipedia.org/wiki/Interval_scheduling',
      source: 'Wikipedia',
    },
  ],

  explainer: `Interval problems are a small family with a shared opening move: **sort, then
sweep**. What you sort by decides which problem you are solving, and getting that
wrong is the most common failure here.

**Sort by start** for merging. Walk the list holding the current merged interval;
if the next one begins before the current one ends, extend the end. Otherwise
emit and start fresh.

**Sort by end** for scheduling. To keep as many non-overlapping intervals as
possible, repeatedly take the one that finishes earliest — it leaves the most
room for whatever comes next. Sorting by start, or by duration, gives a
plausible algorithm with wrong answers.

**Split into events** for anything about simultaneity. Turn each interval into a
\`+1\` at its start and a \`-1\` at its end, sort all the events by time, and
sweep: the running total is how many intervals are active. That is the meeting
rooms problem, and it generalises to any "how many at once" question.

Two overlap tests worth memorising, because getting them backwards produces
off-by-one bugs that survive testing:

    overlap:     a.start < b.end && b.start < a.end
    no overlap:  a.end <= b.start || b.end <= a.start

Whether touching endpoints count as overlapping is a question to ask, not to
assume — \`[1, 2]\` and \`[2, 3]\` are adjacent for meeting rooms and overlapping
for some other problems.`,

  walkthrough: {
    entry: 'maxNonOverlapping',
    entryByLanguage: { python: 'max_non_overlapping' },
    source: {
      javascript: `function maxNonOverlapping(bounds) {
  let kept = 0;
  let lastEnd = -1;
  for (let i = 0; i < bounds.length; i = i + 2) {
    const start = bounds[i];
    const end = bounds[i + 1];
    if (start >= lastEnd) {
      kept = kept + 1;
      lastEnd = end;
    }
  }
  return kept;
}`,
      python: `def max_non_overlapping(bounds):
    kept = 0
    last_end = -1
    i = 0
    while i < len(bounds):
        start = bounds[i]
        end = bounds[i + 1]
        if start >= last_end:
            kept = kept + 1
            last_end = end
        i = i + 2
    return kept`,
    },
    visual: 'array',
    args: [[1, 3, 2, 4, 3, 5, 6, 7]],
    caption:
      'Intervals stored flat as start, end, start, end — already sorted by end time. Each pair is kept only if it begins after the last one finished.',
  },

  complexity: {
    time: 'O(n log n), all of it the sort — the sweep itself is O(n)',
    space: 'O(1) beyond the sort, or O(n) if you build an event list',
    note: 'Once the input is already sorted, every problem in this family drops to a single linear pass. It is worth checking the constraints for that, because it is often stated.',
  },

  whenToUse: {
    reachFor: [
      'Ranges that may overlap: bookings, meetings, time windows, numeric spans.',
      'Merging overlapping ranges, or inserting one into a sorted set of them.',
      'Counting how many things are active at once — the sweep-line count.',
      'Choosing the largest set of non-conflicting items, which is the greedy earliest-end rule.',
    ],
    insteadOf: [
      {
        alternative: 'A nested loop comparing every pair',
        why: 'O(n²) and the obvious first idea. Sorting removes the need to compare anything but neighbours, which is the entire gain.',
      },
      {
        alternative: 'A min-heap of end times',
        why: 'The right tool for meeting rooms if you want the rooms themselves rather than just a count — the heap holds each active interval. The sweep is cheaper when only the maximum count is asked for.',
      },
      {
        alternative: 'A segment tree',
        why: 'Needed when intervals are inserted and removed between queries. For a fixed set processed once, it is far more machinery than the problem requires.',
      },
    ],
  },

  patternCues: [
    'The input is pairs of numbers that represent ranges.',
    'The words are "merge", "overlap", "conflict", "meeting rooms", or "booking".',
    'You are asked for the minimum number of removals to make everything disjoint.',
    'The question is how many things are happening at the same time.',
  ],

  pitfalls: [
    {
      title: 'Sorting by start when the problem needs end',
      body: 'Merging sorts by start; maximising non-overlapping count sorts by end. The two are one character apart in code and give different answers.',
    },
    {
      title: 'Guessing about touching endpoints',
      body: 'Whether `[1, 2]` and `[2, 3]` overlap is a property of the problem, not of intervals. Ask, or state your assumption explicitly.',
    },
    {
      title: 'Extending with the wrong end',
      body: 'When merging, the new end is `max(current.end, next.end)` — not `next.end`. An interval fully contained in the current one would otherwise shrink it.',
    },
  ],

  exercises: [
    {
      slug: 'any-overlap',
      title: 'Do any overlap?',
      brief:
        'Given intervals flat as `[s, e, s, e, ...]` sorted by start, return `true` if any two overlap.',
      hints: [
        'Sorted by start means you only ever need to compare neighbours.',
        'Two neighbours overlap when the next one starts before the current one ends.',
      ],
      starterCode: {
        javascript: `function anyOverlap(bounds) {
  // TODO: compare each interval with the one before it.
  return false;
}`,
      },
      referenceSolution: {
        javascript: `function anyOverlap(bounds) {
  for (let i = 2; i < bounds.length; i = i + 2) {
    if (bounds[i] < bounds[i - 1]) return true;
  }
  return false;
}`,
      },
      testSpec: {
        entry: 'anyOverlap',
        cases: [
          { name: 'overlapping', args: [[1, 4, 2, 5]], expected: true },
          { name: 'disjoint', args: [[1, 2, 3, 4]], expected: false },
          { name: 'touching endpoints', args: [[1, 2, 2, 3]], expected: false },
          { name: 'single interval', args: [[1, 9]], expected: false, hidden: true },
        ],
      },
    },
  ],
};
