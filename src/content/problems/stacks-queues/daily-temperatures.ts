import type { ProblemInput } from '../../schema';

export const dailyTemperatures: ProblemInput = {
  tier: 'problem',
  slug: "daily-temperatures",
  topic: "stacks-queues",
  difficulty: "core",
  title: "Daily Temperatures",
  companies: ["Amazon", "Google"],
  recommendedAfter: ["stacks-queues"],

  brief: "For each day, return how many days you must wait for a warmer temperature. Use `0` where none comes.\n\n```\ndailyTemperatures([73, 74, 75, 71, 69, 72, 76, 73])\n  ->  [1, 1, 4, 2, 1, 1, 0, 0]\n```",

  hints: [
    "Comparing every later day against every earlier one is O(n\u00b2). The stack removes the inner loop.",
    "Keep a stack of indices whose answer is still unknown, with decreasing temperatures.",
    "When today is warmer than the top of the stack, today is that day's answer \u2014 pop and record.",
  ],

  starterCode: {
    javascript: "function dailyTemperatures(temps) {\n  // TODO: days until a warmer temperature.\n  return [];\n}",
    python: "def daily_temperatures(temps):\n    # TODO: days until a warmer temperature.\n    return []",
  },

  referenceSolution: {
    javascript: "function dailyTemperatures(temps) {\n  const out = new Array(temps.length).fill(0);\n  const stack = [];\n  for (let i = 0; i < temps.length; i++) {\n    while (stack.length > 0 && temps[i] > temps[stack[stack.length - 1]]) {\n      const j = stack.pop();\n      out[j] = i - j;\n    }\n    stack.push(i);\n  }\n  return out;\n}",
    python: "def daily_temperatures(temps):\n    out = [0] * len(temps)\n    stack = []\n    for i in range(len(temps)):\n        while stack and temps[i] > temps[stack[-1]]:\n            j = stack.pop()\n            out[j] = i - j\n        stack.append(i)\n    return out",
  },

  complexity: {
    time: "O(n)",
    space: "O(n)",
    note: "A monotonic stack. Each index is pushed once and popped once, so it is linear despite the nested while.",
  },

  testSpec: {
    entry: "dailyTemperatures",
    entryByLanguage: { python: "daily_temperatures" },
    cases: [
        { name: "classic", args: [[73, 74, 75, 71, 69, 72, 76, 73]], expected: [1, 1, 4, 2, 1, 1, 0, 0] },
        { name: "increasing", args: [[30, 40, 50, 60]], expected: [1, 1, 1, 0] },
        { name: "decreasing", args: [[50, 40, 30]], expected: [0, 0, 0] },
        { name: "single", args: [[42]], expected: [0], hidden: true },
    ],
  },
};
