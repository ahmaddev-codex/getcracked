import type { LessonInput } from '../schema';

export const linkedListsLesson: LessonInput = {
  tier: 'lesson',
  slug: 'linked-lists',
  title: 'Linked Lists',
  summary: 'Cheap insertion anywhere, at the price of ever finding anything.',
  order: 2,
  track: 'data-structures',

  difficulty: 'foundational',

  operations: [
    {
      name: 'access by position',
      time: 'O(n)',
      note: 'No index arithmetic — you follow pointers.',
    },
    {
      name: 'insert or remove at a known node',
      time: 'O(1)',
      note: 'Rewrite two pointers. The reason the structure exists.',
    },
    {
      name: 'insert at head',
      time: 'O(1)',
      note: 'Which is why a list makes a natural stack.',
    },
    {
      name: 'search',
      time: 'O(n)',
      note: 'Same as an array, but slower in practice from cache misses.',
    },
  ],

  variants: [
    {
      name: 'Singly linked',
      what: 'One next pointer. Cannot walk backwards.',
    },
    {
      name: 'Doubly linked',
      what: 'next and prev. Removal given a node is O(1) without tracking the predecessor.',
    },
    {
      name: 'Circular',
      what: 'The tail points back to the head. Useful for round-robin scheduling.',
    },
  ],

  furtherReading: [
    {
      label: 'Linked list',
      url: 'https://en.wikipedia.org/wiki/Linked_list',
      source: 'Wikipedia',
    },
    {
      label: 'Linked list visualiser',
      url: 'https://visualgo.net/en/list',
      source: 'VisuAlgo',
    },
  ],

  explainer: `A linked list stores each value in its own node, together with a pointer to the
next one. There is no block of memory holding them in order — the only thing
connecting the third element to the fourth is a pointer stored inside the third.

That single difference from an array decides everything else about it.

Because nothing is contiguous, there is **no index arithmetic**. You cannot jump
to the middle: reaching element *k* means following *k* pointers from the head.
Every lookup is O(n), and that is not an implementation detail you can optimise
away — it is what the structure is.

In exchange, **inserting or removing in the middle costs nothing beyond finding
the spot**. An array insertion shifts every element after it; a list insertion
rewrites two pointers. If you already hold a reference to the node, the operation
is O(1) no matter how long the list is.

The head is the only position you get for free, which is why a list makes a
natural stack, and why adding a tail pointer — and paying to keep it correct —
is what turns one into a queue.`,

  walkthrough: {
    entry: 'findNode',
    entryByLanguage: { python: 'find_node' },
    source: {
      javascript: `function findNode(nodes, target) {
  let index = 0;
  let steps = 0;
  while (index < nodes.length) {
    steps = steps + 1;
    if (nodes[index] === target) {
      return steps;
    }
    index = index + 1;
  }
  return -1;
}`,
      python: `def find_node(nodes, target):
    index = 0
    steps = 0
    while index < len(nodes):
        steps = steps + 1
        if nodes[index] == target:
            return steps
        index = index + 1
    return -1`,
    },
    visual: 'linked-list',
    args: [[22, 2, 77, 6, 43], 6],
    caption:
      'Searching for 6 by following the chain. There is no jumping ahead — every node before it has to be visited, which is the whole cost of the structure.',
  },

  complexity: {
    time: 'O(1) insert or remove at a known node, O(n) to find one',
    space: 'O(n), plus one pointer per element',
    note: 'The pointer is real overhead: a list of numbers can use twice the memory of the equivalent array, and it scatters them, so it also loses the cache locality that makes array scans fast in practice.',
  },

  whenToUse: {
    reachFor: [
      'You insert and remove in the middle constantly, and rarely look things up by position.',
      'You already hold a reference to the node you want to act on — then the edit is O(1).',
      'You need a stack or queue and never need to index into it.',
      'You are building something else out of it: an LRU cache, an adjacency list, a hash bucket chain.',
    ],
    insteadOf: [
      {
        alternative: 'An array or dynamic array',
        why: 'Almost always the better default. It gives O(1) access by index and scans far faster in practice because its elements sit together in memory. Only prefer a list when middle insertion genuinely dominates your workload — and measure, because shifting a few thousand contiguous elements is often faster than chasing a few hundred pointers.',
      },
      {
        alternative: 'A deque',
        why: 'If you only ever push and pop at the two ends, a deque gives you that in O(1) with none of the pointer overhead or cache misses.',
      },
    ],
  },

  patternCues: [
    'The problem hands you a `head` and never an index.',
    'You are asked to reverse, reorder, or detect a cycle in a sequence you can only walk forwards.',
    'Elements must keep their identity across moves — the node itself matters, not just its value.',
    'The problem forbids extra memory, which usually means rewiring pointers rather than rebuilding.',
  ],

  pitfalls: [
    {
      title: 'Losing the rest of the list',
      body: 'Reassigning `node.next` before saving the old value drops everything after it. Keep the next pointer in a temporary variable first — this is the bug behind nearly every failed reversal.',
    },
    {
      title: 'Forgetting the empty and single-node cases',
      body: 'A list of length 0 or 1 is valid input, and most pointer manipulation has a special case there. Check them before writing the loop, not after it fails.',
    },
    {
      title: 'Assuming you can go backwards',
      body: 'In a singly linked list you cannot. If an algorithm needs the previous node, either track it as you walk or use a doubly linked list — realising this halfway through is expensive.',
    },
  ],

  exercises: [
    {
      slug: 'count-nodes',
      title: 'Count the nodes',
      brief:
        'Return how many nodes are in `nodes` by walking it one step at a time. No `.length`.',
      hints: [
        'Start at the head and take one step at a time, counting as you go.',
        'You stop when you run off the end — that is what `null` means in a real list.',
      ],
      starterCode: {
        javascript: `function countNodes(nodes) {
  // TODO: walk the list and count the nodes. Do not use nodes.length.
  return 0;
}`,
      },
      referenceSolution: {
        javascript: `function countNodes(nodes) {
  let count = 0;
  let index = 0;
  while (nodes[index] !== undefined) {
    count = count + 1;
    index = index + 1;
  }
  return count;
}`,
      },
      testSpec: {
        entry: 'countNodes',
        cases: [
          { name: 'several nodes', args: [[4, 8, 15]], expected: 3 },
          { name: 'single node', args: [[9]], expected: 1 },
          { name: 'empty list', args: [[]], expected: 0 },
          { name: 'longer list', args: [[1, 2, 3, 4, 5, 6]], expected: 6, hidden: true },
        ],
      },
    },
  ],
};
