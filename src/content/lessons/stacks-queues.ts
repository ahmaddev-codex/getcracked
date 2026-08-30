import type { LessonInput } from '../schema';

export const stacksQueuesLesson: LessonInput = {
  tier: 'lesson',
  slug: "stacks-queues",
  order: 3,
  track: 'data-structures',
  title: "Stacks & Queues",
  summary: "When the order you process things in is the whole problem.",

  difficulty: 'foundational',

  operations: [
    {
      name: 'push / enqueue',
      time: 'O(1)',
    },
    {
      name: 'pop / dequeue',
      time: 'O(1)',
      note: 'On a real queue. Array.shift() is O(n) and quietly ruins a BFS.',
    },
    {
      name: 'peek',
      time: 'O(1)',
    },
    {
      name: 'search',
      time: 'O(n)',
      note: 'Neither structure is for searching.',
    },
  ],

  variants: [
    {
      name: 'Stack',
      what: 'Last in, first out. Function calls, undo, matching brackets.',
    },
    {
      name: 'Queue',
      what: 'First in, first out. BFS, task scheduling, buffering.',
    },
    {
      name: 'Deque',
      what: 'Both ends in O(1). Sliding-window maximum runs on one.',
    },
    {
      name: 'Monotonic stack',
      what: 'Kept sorted as you push. Answers next-greater-element in O(n) total.',
    },
    {
      name: 'Priority queue',
      what: 'Not a queue by arrival — see Heaps.',
    },
  ],

  furtherReading: [
    {
      label: 'Stack (abstract data type)',
      url: 'https://en.wikipedia.org/wiki/Stack_(abstract_data_type)',
      source: 'Wikipedia',
    },
    {
      label: 'Stack and queue visualiser',
      url: 'https://visualgo.net/en/list',
      source: 'VisuAlgo',
    },
  ],

  explainer: "A stack is last-in-first-out; a queue is first-in-first-out. Both are trivial\nto implement. What is worth learning is recognising the problems whose *structure*\nis one of them.\n\n**Stack** appears whenever the most recent unresolved thing must be resolved\nfirst \u2014 matching brackets, undo history, evaluating nested expressions, and\ndepth-first traversal. If you find yourself saying \"the last one I saw\", it is a\nstack.\n\nThe subtler use is the **monotonic stack**: keep the stack sorted by holding only\nelements that are still candidates, popping any that the current element makes\nirrelevant. That is how \"next greater element\" problems collapse from O(n\u00b2) to\nO(n) \u2014 each index is pushed once and popped once, however nested the loops look.\n\n**Queue** appears when things must be handled in arrival order \u2014 breadth-first\ntraversal, scheduling, rate limiting, buffering between a fast producer and a\nslow consumer.",

  walkthrough: {
    entry: "stackDepth",
    entryByLanguage: { python: 'stack_depth' },
    source: {
      javascript: "function stackDepth(operations) {\n  const stack = [];\n  let deepest = 0;\n  for (let i = 0; i < operations.length; i++) {\n    if (operations[i] > 0) {\n      stack.push(i);\n      if (stack.length > deepest) {\n        deepest = stack.length;\n      }\n    } else {\n      stack.pop();\n    }\n  }\n  return deepest;\n}",
      python: `def stack_depth(operations):
    stack = []
    deepest = 0
    for i in range(len(operations)):
        if operations[i] > 0:
            stack.append(i)
            if len(stack) > deepest:
                deepest = len(stack)
        else:
            stack.pop()
    return deepest`,
    },
    visual: 'stack',
    args: [[1, 1, -1, 1, 1, -1, -1, -1]],
    caption: "A stack is just an array with a top. +1 pushes, -1 pops \u2014 watch the depth rise and fall.",
  },

  complexity: {
    time: "O(1) per push, pop, or peek",
    space: "O(n) for n held elements",
    note: "A monotonic stack processes each element exactly twice \u2014 once pushed, once popped \u2014 so the total is linear even though the code contains a loop inside a loop.",
  },

  whenToUse: {
    reachFor: [
      'The most recently seen item is the first one you need to resolve — that is a stack.',
      'Items must be handled in arrival order, or you are exploring level by level — that is a queue.',
      'You are matching pairs or tracking nesting.',
      'You need the next greater or next smaller element, which is a monotonic stack.',
    ],
    insteadOf: [
      {
        alternative: 'Recursion',
        why: 'A stack is what recursion uses underneath. Making it explicit is how you avoid stack overflow on deep inputs, and how you pause and resume a traversal.',
      },
      {
        alternative: 'An array with shift()',
        why: 'Removing from the front of an array is O(n) because everything shifts. A real queue or deque makes it O(1), which matters inside a BFS loop.',
      },
      {
        alternative: 'Sorting',
        why: 'For next-greater-element problems a monotonic stack is O(n) where sorting is O(n log n) and loses the positions you needed.',
      },
    ],
  },

  patternCues: [
    "The most recently seen item is the first one you need to resolve.",
    "You are matching pairs, or tracking nesting.",
    "The problem asks for the next greater, next smaller, or nearest element.",
    "You are traversing level by level, which is a queue rather than a stack.",
  ],

  pitfalls: [
    {
      title: "Popping an empty stack",
      body: "A closing bracket with nothing open is a valid input, not an impossible one. Check before popping.",
    },
    {
      title: "Forgetting the leftovers",
      body: "Finishing the input with a non-empty stack usually means unmatched openers. The loop ending is not the same as the answer being valid.",
    },
    {
      title: "Using an array as a queue in JavaScript",
      body: "`shift()` is O(n) because it re-indexes everything. Fine for small inputs, quietly quadratic for large ones.",
    },
  ],

  recommendedAfter: ["arrays"],
};
