import type { ProblemInput } from '../../schema';

export const longestUniqueSubstring: ProblemInput = {
  tier: 'problem',
  slug: "longest-unique-substring",
  topic: "sliding-window",
  difficulty: "medium",
  title: "Longest Substring Without Repeats",
  companies: ["Amazon", "Google", "Meta", "Bloomberg"],
  recommendedAfter: ["sliding-window", "hashing"],

  brief: "Return the length of the longest substring of `s` containing no repeated character.\n\n```\nlengthOfLongestSubstring(\"abcabcbb\")  ->  3\n```",

  hints: [
    "The window grows from the right and shrinks from the left \u2014 its size is not fixed.",
    "When the incoming character is already inside the window, move the left edge past its previous position.",
    "A map from character to last index lets you jump the left edge rather than crawl it.",
  ],

  starterCode: {
    javascript: "function lengthOfLongestSubstring(s) {\n  // TODO: longest run with no repeated character.\n  return 0;\n}",
    python: "def length_of_longest_substring(s):\n    # TODO: longest run with no repeated character.\n    return 0",
  },

  referenceSolution: {
    javascript: "function lengthOfLongestSubstring(s) {\n  const lastSeen = {};\n  let best = 0;\n  let start = 0;\n  for (let i = 0; i < s.length; i++) {\n    const ch = s[i];\n    if (lastSeen[ch] !== undefined && lastSeen[ch] >= start) {\n      start = lastSeen[ch] + 1;\n    }\n    lastSeen[ch] = i;\n    const length = i - start + 1;\n    if (length > best) best = length;\n  }\n  return best;\n}",
    python: "def length_of_longest_substring(s):\n    last_seen = {}\n    best = 0\n    start = 0\n    for i in range(len(s)):\n        ch = s[i]\n        if ch in last_seen and last_seen[ch] >= start:\n            start = last_seen[ch] + 1\n        last_seen[ch] = i\n        length = i - start + 1\n        if length > best:\n            best = length\n    return best",
  },

  complexity: {
    time: "O(n)",
    space: "O(k) for k distinct characters",
    note: "Variable-size window. Each index is visited by the right edge once and the left edge at most once, so it stays linear despite the nested feel.",
  },

  testSpec: {
    entry: "lengthOfLongestSubstring",
    entryByLanguage: { python: "length_of_longest_substring" },
    cases: [
        { name: "classic", args: ["abcabcbb"], expected: 3 },
        { name: "all same", args: ["bbbbb"], expected: 1 },
        { name: "mixed", args: ["pwwkew"], expected: 3 },
        { name: "empty", args: [""], expected: 0 },
        { name: "all unique", args: ["abcdef"], expected: 6, hidden: true },
    ],
  },
};
