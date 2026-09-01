import type { ProblemInput } from '../../schema';

export const longestPalindromicSubstring: ProblemInput = {
  tier: 'problem',
  slug: 'longest-palindromic-substring',
  topic: 'dynamic-programming',
  difficulty: 'medium',
  title: 'Longest Palindromic Substring',
  companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Bloomberg'],
  recommendedAfter: ['dynamic-programming', 'two-pointers'],

  brief: `Given a string \`s\`, return the longest palindromic substring in \`s\`.

A **palindrome** is a string that reads the same forward and backward.

\`\`\`
longestPalindrome("babad") -> "bab" // "aba" is also valid
longestPalindrome("cbbd")  -> "bb"
longestPalindrome("a")     -> "a"
\`\`\``,

  hints: [
    'A palindrome mirrors around its center. There are 2n - 1 potential centers (n single-character centers like "aba", and n - 1 between-character centers like "abba").',
    'For each possible center, expand outward with two pointers (`left` and `right`) as long as characters match and indices remain within bounds.',
    'Keep track of the starting index and maximum length found across all center expansions.',
  ],

  starterCode: {
    javascript: `function longestPalindrome(s) {
  // TODO: return longest palindromic substring.
  return "";
}`,
    python: `def longest_palindrome(s):
    # TODO: return longest palindromic substring.
    return ""`,
  },

  referenceSolution: {
    javascript: `function longestPalindrome(s) {
  if (!s || s.length <= 1) return s;
  let start = 0;
  let maxLen = 0;

  function expand(left, right) {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      left--;
      right++;
    }
    const len = right - left - 1;
    if (len > maxLen) {
      maxLen = len;
      start = left + 1;
    }
  }

  for (let i = 0; i < s.length; i++) {
    expand(i, i);     // Odd-length palindromes (single center)
    expand(i, i + 1); // Even-length palindromes (double center)
  }

  return s.substring(start, start + maxLen);
}`,
    python: `def longest_palindrome(s):
    if not s or len(s) <= 1:
        return s
    start = 0
    max_len = 0

    def expand(left, right):
        nonlocal start, max_len
        while left >= 0 and right < len(s) and s[left] == s[right]:
            left -= 1
            right += 1
        length = right - left - 1
        if length > max_len:
            max_len = length
            start = left + 1

    for i in range(len(s)):
        expand(i, i)      # Odd length
        expand(i, i + 1)  # Even length

    return s[start:start + max_len]`,
  },

  complexity: {
    time: 'O(n²)',
    space: 'O(1) extra space',
    note: 'Expanding around all 2n-1 centers takes O(n) per center, achieving O(n²) time with constant auxiliary space.',
  },

  testSpec: {
    entry: 'longestPalindrome',
    entryByLanguage: { python: 'longest_palindrome' },
    cases: [
      { name: 'odd length palindrome', args: ['babad'], expected: 'bab' },
      { name: 'even length palindrome', args: ['cbbd'], expected: 'bb' },
      { name: 'single character', args: ['a'], expected: 'a' },
      { name: 'entire string palindrome', args: ['racecar'], expected: 'racecar' },
      { name: 'repeating characters', args: ['aaaaa'], expected: 'aaaaa', hidden: true },
    ],
  },
};
