import type { LessonInput } from '../schema';

export const heapsLesson: LessonInput = {
  tier: 'lesson',
  slug: "heaps",
  order: 10,
  title: "Heaps & Priority Queues",
  summary: "Keep the best element to hand without sorting everything.",

  explainer: "A heap keeps the smallest \u2014 or largest \u2014 element instantly available while\nleaving everything else only loosely ordered. That partial order is the point:\nfull sorting is O(n log n), and most problems never need it.\n\nThe operations are peek in O(1), and push and pop in O(log k) for a heap of size\nk. It is usually stored as an array, with a node's children at `2i+1` and `2i+2`,\nso there are no pointers and no allocation per node.\n\nThe pattern that shows up constantly is **top-k**: keep a heap of size k while\nstreaming through n elements. For the k largest, use a *min*-heap \u2014 the smallest\nof your current best sits on top, ready to be evicted the moment something better\narrives. That is O(n log k), which beats sorting when k is much smaller than n,\nand needs O(k) memory rather than O(n).\n\nThe same structure is a priority queue, which is what makes Dijkstra's algorithm\nwork: always expand the nearest unvisited node.",

  complexity: {
    time: "O(log k) push and pop, O(1) peek",
    space: "O(k)",
    note: "Top-k in O(n log k) rather than O(n log n). When k is 10 and n is ten million, that difference is the whole solution.",
  },

  patternCues: [
    "The problem says 'k largest', 'k smallest', 'k most frequent', or 'median'.",
    "You need repeated access to the current best without caring about the rest.",
    "Data arrives as a stream and cannot all be held at once.",
    "You are always expanding the cheapest option next \u2014 Dijkstra, A*, scheduling.",
  ],

  pitfalls: [
    {
      title: "The wrong heap direction",
      body: "For the k *largest*, you want a *min*-heap. It feels backwards; the top is the weakest of the ones you are keeping, which is exactly what you want to evict.",
    },
    {
      title: "Sorting when a heap would do",
      body: "Sorting to take the top 5 is correct and wasteful. Fine at small n, the wrong answer in an interview.",
    },
    {
      title: "Expecting sorted output",
      body: "A heap is not sorted. Only the root is guaranteed \u2014 reading the underlying array gives you nothing meaningful.",
    },
  ],

  recommendedAfter: ["arrays"],
};
