import type { ProblemInput } from '../../schema';

export const validAnagram: ProblemInput = {
  tier: 'problem',
  slug: 'valid-anagram',
  topic: 'hashing',
  difficulty: 'easy',
  title: 'Valid Anagram',
  companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Uber'],
  recommendedAfter: ['hashing'],

  brief: `Given two strings \`s\` and \`t\`, return \`true\` if \`t\` is an anagram of \`s\`, and \`false\` otherwise.

An **Anagram** is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.

\`\`\`
isAnagram("anagram", "nagaram") -> true
isAnagram("rat", "car")         -> false
isAnagram("a", "ab")            -> false
\`\`\``,

  hints: [
    'If the lengths of `s` and `t` are different, they cannot be anagrams.',
    'Count the frequency of each character in `s` and decrement for each character in `t`.',
    'If all frequency counts return to zero, the strings are valid anagrams.',
  ],

  starterCode: {
    javascript: `function isAnagram(s, t) {
  // TODO: return true if s and t are anagrams.
  return false;
}`,
    python: `def is_anagram(s, t):
    # TODO: return true if s and t are anagrams.
    return False`,
  },

  referenceSolution: {
    javascript: `function isAnagram(s, t) {
  if (s.length !== t.length) return false;
  const counts = new Map();
  for (const char of s) {
    counts.set(char, (counts.get(char) || 0) + 1);
  }
  for (const char of t) {
    if (!counts.has(char) || counts.get(char) === 0) {
      return false;
    }
    counts.set(char, counts.get(char) - 1);
  }
  return true;
}`,
    python: `def is_anagram(s, t):
    if len(s) != len(t):
        return False
    counts = {}
    for char in s:
        counts[char] = counts.get(char, 0) + 1
    for char in t:
        if char not in counts or counts[char] == 0:
            return False
        counts[char] -= 1
    return True`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(1) auxiliary space (bounded by character set size: 26 lowercase English letters)',
    note: 'Single pass counting through both strings with constant space table lookup.',
  },

  testSpec: {
    entry: 'isAnagram',
    entryByLanguage: { python: 'is_anagram' },
    cases: [
      { name: 'valid anagram', args: ['anagram', 'nagaram'], expected: true },
      { name: 'different characters', args: ['rat', 'car'], expected: false },
      { name: 'different lengths', args: ['a', 'ab'], expected: false },
      { name: 'identical strings', args: ['listen', 'silent'], expected: true },
      { name: 'empty strings', args: ['', ''], expected: true, hidden: true },
    ],
  },
};
