import type { ProblemInput } from '../../schema';

export const groupAnagrams: ProblemInput = {
  tier: 'problem',
  slug: "group-anagrams",
  topic: "hashing",
  difficulty: "stretch",
  title: "Group Anagrams",
  companies: ["Amazon", "Meta", "Uber"],
  recommendedAfter: ["hashing"],

  brief: "Group the words in `strs` so that anagrams end up together. Return the groups sorted by their first element, with each group sorted alphabetically.\n\n```\ngroupAnagrams([\"eat\",\"tea\",\"tan\",\"ate\",\"nat\",\"bat\"])\n  ->  [[\"ate\",\"eat\",\"tea\"],[\"bat\"],[\"nat\",\"tan\"]]\n```",

  hints: [
    "Anagrams share something that is identical between them. What can you compute from a word that is the same for every anagram of it?",
    "Sorting a word's letters gives a canonical form. Use that as a map key.",
    "The sorting at the end is only to make the output deterministic \u2014 build the groups first, then sort.",
  ],

  starterCode: {
    javascript: "function groupAnagrams(strs) {\n  // TODO: group anagrams together.\n  return [];\n}",
    python: "def group_anagrams(strs):\n    # TODO: group anagrams together.\n    return []",
  },

  referenceSolution: {
    javascript: "function groupAnagrams(strs) {\n  const groups = {};\n  for (const word of strs) {\n    const key = word.split('').sort().join('');\n    if (!groups[key]) groups[key] = [];\n    groups[key].push(word);\n  }\n  const out = Object.values(groups).map((g) => g.sort());\n  out.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));\n  return out;\n}",
    python: "def group_anagrams(strs):\n    groups = {}\n    for word in strs:\n        key = ''.join(sorted(word))\n        groups.setdefault(key, []).append(word)\n    out = [sorted(g) for g in groups.values()]\n    out.sort(key=lambda g: g[0])\n    return out",
  },

  complexity: {
    time: "O(n\u00b7k log k) for n words of length k",
    space: "O(n\u00b7k)",
    note: "The sort per word dominates. A character-count key gets it to O(n\u00b7k) at the cost of a clumsier key.",
  },

  testSpec: {
    entry: "groupAnagrams",
    entryByLanguage: { python: "group_anagrams" },
    cases: [
        { name: "classic", args: [["eat", "tea", "tan", "ate", "nat", "bat"]], expected: [["ate", "eat", "tea"], ["bat"], ["nat", "tan"]] },
        { name: "no anagrams", args: [["abc", "def"]], expected: [["abc"], ["def"]] },
        { name: "empty", args: [[]], expected: [] },
        { name: "single word", args: [["a"]], expected: [["a"]], hidden: true },
    ],
  },
};
