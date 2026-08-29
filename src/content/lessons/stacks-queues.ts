import type { LessonInput } from '../schema';

export const stacksQueuesLesson: LessonInput = {
  tier: 'lesson',
  slug: "stacks-queues",
  order: 5,
  title: "Stacks & Queues",
  summary: "When the order you process things in is the whole problem.",

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
    args: [[1, 1, -1, 1, 1, -1, -1, -1]],
    caption: "A stack is just an array with a top. +1 pushes, -1 pops \u2014 watch the depth rise and fall.",
  },

  complexity: {
    time: "O(1) per push, pop, or peek",
    space: "O(n) for n held elements",
    note: "A monotonic stack processes each element exactly twice \u2014 once pushed, once popped \u2014 so the total is linear even though the code contains a loop inside a loop.",
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
