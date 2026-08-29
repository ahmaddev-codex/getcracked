import type { ProblemInput } from '../../schema';

export const validParentheses: ProblemInput = {
  tier: 'problem',
  slug: "valid-parentheses",
  topic: "stacks-queues",
  difficulty: "warm-up",
  title: "Valid Parentheses",
  companies: ["Amazon", "Meta", "Google"],
  recommendedAfter: ["stacks-queues"],

  brief: "Return `true` if every bracket in `s` is closed by the matching type in the right order.\n\n```\nisValid(\"()[]{}\")  ->  true\nisValid(\"(]\")      ->  false\n```",

  hints: [
    "The most recently opened bracket must be the first one closed. That ordering is exactly a stack.",
    "Push openers. On a closer, pop and check the pair matches.",
    "Two ways to fail beyond a mismatch: closing when the stack is empty, and finishing with it non-empty.",
  ],

  starterCode: {
    javascript: "function isValid(s) {\n  // TODO: true if the brackets are balanced.\n  return false;\n}",
    python: "def is_valid(s):\n    # TODO: true if the brackets are balanced.\n    return False",
  },

  referenceSolution: {
    javascript: "function isValid(s) {\n  const pairs = { ')': '(', ']': '[', '}': '{' };\n  const stack = [];\n  for (const ch of s) {\n    if (ch === '(' || ch === '[' || ch === '{') {\n      stack.push(ch);\n    } else if (pairs[ch]) {\n      if (stack.pop() !== pairs[ch]) return false;\n    }\n  }\n  return stack.length === 0;\n}",
    python: "def is_valid(s):\n    pairs = {')': '(', ']': '[', '}': '{'}\n    stack = []\n    for ch in s:\n        if ch in '([{':\n            stack.append(ch)\n        elif ch in pairs:\n            if not stack or stack.pop() != pairs[ch]:\n                return False\n    return len(stack) == 0",
  },

  complexity: {
    time: "O(n)",
    space: "O(n) worst case",
    note: "The stack holds at most every character, which happens when the string is all openers.",
  },

  testSpec: {
    entry: "isValid",
    entryByLanguage: { python: "is_valid" },
    cases: [
        { name: "all types", args: ["()[]{}"], expected: true },
        { name: "mismatch", args: ["(]"], expected: false },
        { name: "nested", args: ["([{}])"], expected: true },
        { name: "unclosed", args: ["("], expected: false },
        { name: "closer first", args: [")("], expected: false, hidden: true },
    ],
  },
};
