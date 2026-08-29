import type { ProblemInput } from '../../schema';

export const firstUniqueChar: ProblemInput = {
  tier: 'problem',
  slug: "first-unique-char",
  topic: "hashing",
  difficulty: "core",
  title: "First Unique Character",
  companies: ["Amazon", "Bloomberg"],
  recommendedAfter: ["hashing"],

  brief: "Return the index of the first character in `s` that appears exactly once, or `-1` if there is none.\n\n```\nfirstUniqChar(\"leetcode\")  ->  0\nfirstUniqChar(\"aabb\")      ->  -1\n```",

  hints: [
    "You cannot know a character is unique until you have seen the whole string \u2014 so make two passes.",
    "First pass counts every character. Second pass finds the earliest one whose count is 1.",
  ],

  starterCode: {
    javascript: "function firstUniqChar(s) {\n  // TODO: index of the first non-repeating character.\n  return -1;\n}",
    python: "def first_uniq_char(s):\n    # TODO: index of the first non-repeating character.\n    return -1",
  },

  referenceSolution: {
    javascript: "function firstUniqChar(s) {\n  const counts = {};\n  for (const ch of s) counts[ch] = (counts[ch] || 0) + 1;\n  for (let i = 0; i < s.length; i++) {\n    if (counts[s[i]] === 1) return i;\n  }\n  return -1;\n}",
    python: "def first_uniq_char(s):\n    counts = {}\n    for ch in s:\n        counts[ch] = counts.get(ch, 0) + 1\n    for i in range(len(s)):\n        if counts[s[i]] == 1:\n            return i\n    return -1",
  },

  complexity: {
    time: "O(n)",
    space: "O(k) for k distinct characters",
    note: "Two passes are still linear. One pass cannot work: uniqueness is only knowable once the whole string has been seen.",
  },

  testSpec: {
    entry: "firstUniqChar",
    entryByLanguage: { python: "first_uniq_char" },
    cases: [
        { name: "first is unique", args: ["leetcode"], expected: 0 },
        { name: "later unique", args: ["loveleetcode"], expected: 2 },
        { name: "none unique", args: ["aabb"], expected: -1 },
        { name: "empty", args: [""], expected: -1, hidden: true },
    ],
  },
};
