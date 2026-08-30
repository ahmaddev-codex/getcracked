import type { LessonInput } from '../schema';

export const sortingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'sorting',
  title: 'Sorting',
  summary: 'Usually not the answer, but very often the step that makes the answer easy.',
  order: 5,
  track: 'algorithms',

  difficulty: 'core',

  operations: [
    {
      name: 'comparison sort',
      time: 'O(n log n)',
      note: 'A proven lower bound for anything that compares.',
    },
    {
      name: 'counting / radix sort',
      time: 'O(n + k)',
      note: 'Beats the bound by never comparing.',
    },
    {
      name: 'merge sort space',
      time: 'O(n)',
      note: 'The cost of a guaranteed worst case and stability.',
    },
    {
      name: 'quicksort space',
      time: 'O(log n)',
      note: 'Stack depth. In-place otherwise.',
    },
  ],

  variants: [
    {
      name: 'Insertion sort',
      what: 'O(n^2), but O(n) on nearly-sorted input and stable. Used for small runs inside real sorts.',
    },
    {
      name: 'Merge sort',
      what: 'O(n log n) guaranteed and stable, at O(n) extra space.',
    },
    {
      name: 'Quicksort',
      what: 'Fastest in practice; O(n^2) worst case, rare with a randomised pivot.',
    },
    {
      name: 'Heapsort',
      what: 'O(n log n) guaranteed and in place, but not stable.',
    },
    {
      name: 'Counting / radix sort',
      what: 'Linear for small integer keys.',
    },
  ],

  furtherReading: [
    {
      label: 'Sorting algorithm',
      url: 'https://en.wikipedia.org/wiki/Sorting_algorithm',
      source: 'Wikipedia',
    },
    {
      label: 'Sorting visualiser',
      url: 'https://visualgo.net/en/sorting',
      source: 'VisuAlgo',
    },
  ],

  explainer: `You will almost never write a sort in an interview. You will constantly *decide
to sort*, and that decision is the actual skill.

Sorting costs O(n log n). The question is always whether it buys you more than it
costs. It usually does, because a sorted array unlocks techniques that are
otherwise unavailable: binary search becomes possible, two pointers from both
ends becomes meaningful, duplicates become adjacent, and "closest pair" becomes
"neighbours".

The comparison sorts worth knowing by shape rather than by code:

- **Insertion sort** — O(n²), but O(n) on nearly-sorted input and stable. This is
  what production sorts fall back to for small runs, and it is the one animated
  below because every move is visible.
- **Merge sort** — O(n log n) guaranteed, stable, needs O(n) extra space. The one
  to reach for when worst case matters or stability is required.
- **Quicksort** — O(n log n) expected, O(n²) worst, in place. Fastest in practice;
  the worst case is real but rare with a randomised pivot.
- **Heapsort** — O(n log n) guaranteed and in place, but not stable and slower in
  practice than quicksort.

**Stability** — equal elements keeping their original order — matters more often
than people expect. Sorting by one field then another only works if the second
sort is stable.

And when the keys are small integers, comparison is not required at all: counting
sort is O(n + k), which beats the O(n log n) lower bound because it never
compares anything.`,

  walkthrough: {
    entry: 'insertionSort',
    entryByLanguage: { python: 'insertion_sort' },
    source: {
      javascript: `function insertionSort(nums) {
  for (let i = 1; i < nums.length; i++) {
    const key = nums[i];
    let j = i - 1;
    while (j >= 0 && nums[j] > key) {
      nums[j + 1] = nums[j];
      j = j - 1;
    }
    nums[j + 1] = key;
  }
  return nums;
}`,
      python: `def insertion_sort(nums):
    for i in range(1, len(nums)):
        key = nums[i]
        j = i - 1
        while j >= 0 and nums[j] > key:
            nums[j + 1] = nums[j]
            j = j - 1
        nums[j + 1] = key
    return nums`,
    },
    visual: 'array',
    args: [[5, 2, 9, 1, 6]],
    caption:
      'Insertion sort: each element is lifted out and the larger ones shuffle right to make room. The left of the array is always sorted — watch that boundary move.',
  },

  complexity: {
    time: 'O(n log n) for any comparison sort; O(n + k) for counting sort',
    space: 'O(1) for quicksort and heapsort, O(n) for merge sort',
    note: 'The O(n log n) bound applies only to sorts that compare. Counting and radix sorts beat it by not comparing at all, which is available whenever the keys are small integers.',
  },

  whenToUse: {
    reachFor: [
      'Sorting makes the real algorithm obvious — binary search, two pointers, or a sweep.',
      'You need the k largest or smallest and k is close to n. Below that, a heap is cheaper.',
      'Duplicates or near-duplicates need to be found, and sorting puts them next to each other.',
      'The problem is about intervals, which almost always begins with sorting by start or end.',
    ],
    insteadOf: [
      {
        alternative: 'A hash map',
        why: 'If you only need counts or membership, hashing is O(n) and sorting is O(n log n). Sorting earns its cost when you need *order* — the nearest value, the k-th, a range — which a hash map cannot give you.',
      },
      {
        alternative: 'A heap',
        why: 'For "top k out of n", a heap is O(n log k) against sorting\'s O(n log n). When k is 10 and n is ten million, that is the whole solution.',
      },
      {
        alternative: 'Quickselect',
        why: 'If you need only the k-th element and not the order of everything else, quickselect averages O(n). Sorting to find one element does far more work than asked.',
      },
    ],
  },

  patternCues: [
    'The problem mentions "sorted" in the input, or the answer is easier if you assume it.',
    'You are looking for pairs, duplicates, or the closest values.',
    'It is an interval problem — sort by start or end almost always comes first.',
    'A brute force compares every element with every other, and order would let you stop early.',
  ],

  pitfalls: [
    {
      title: 'Default comparators on numbers',
      body: "JavaScript's `.sort()` compares as strings by default, so `[10, 9, 1]` sorts to `[1, 10, 9]`. Always pass `(a, b) => a - b`.",
    },
    {
      title: 'Sorting when you only needed counts',
      body: 'Reaching for a sort out of habit turns an O(n) hash pass into O(n log n). Ask what the order is actually buying before paying for it.',
    },
    {
      title: 'Assuming stability',
      body: 'Not every language guarantees a stable sort. If a second sort must preserve the first, check — or sort once on a composite key.',
    },
    {
      title: 'Sorting a copy you then throw away',
      body: 'Sorting in place mutates the caller\'s array. In an interview, say which you are doing; in real code, it is a genuine source of bugs.',
    },
  ],

  exercises: [
    {
      slug: 'sorted-already',
      title: 'Is it already sorted?',
      brief:
        'Return `true` if `nums` is in non-decreasing order. One pass, no sorting.',
      hints: [
        'You only need to compare each element with the one before it.',
        'A single pair out of order is enough to answer — return early.',
      ],
      starterCode: {
        javascript: `function isSorted(nums) {
  // TODO: true when every element is >= the one before it.
  return false;
}`,
      },
      referenceSolution: {
        javascript: `function isSorted(nums) {
  for (let i = 1; i < nums.length; i++) {
    if (nums[i] < nums[i - 1]) return false;
  }
  return true;
}`,
      },
      testSpec: {
        entry: 'isSorted',
        cases: [
          { name: 'sorted', args: [[1, 2, 2, 5]], expected: true },
          { name: 'not sorted', args: [[1, 3, 2]], expected: false },
          { name: 'single element', args: [[7]], expected: true },
          { name: 'empty', args: [[]], expected: true, hidden: true },
          { name: 'descending', args: [[3, 2, 1]], expected: false, hidden: true },
        ],
      },
    },
  ],
};
