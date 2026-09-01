import type { ProblemInput } from '../../schema';

export const longestCommonSubsequence: ProblemInput = {
  tier: 'problem',
  slug: 'longest-common-subsequence',
  topic: 'dynamic-programming',
  difficulty: 'medium',
  title: 'Longest Common Subsequence',
  companies: ['Amazon', 'Google', 'Netflix', 'Microsoft'],
  recommendedAfter: ['dynamic-programming'],

  brief:
    'Given two strings `text1` and `text2`, return the length of their longest common subsequence. If there is no common subsequence, return `0`.\n\nA subsequence of a string is a new string generated from the original string with some characters (can be none) deleted without changing the relative order of the remaining characters.\n\n```\nlongestCommonSubsequence("abcde", "ace")  ->  3  // "ace"\nlongestCommonSubsequence("abc", "abc")    ->  3  // "abc"\nlongestCommonSubsequence("abc", "def")    ->  0\n```',

  hints: [
    'Try comparing characters from the beginning or end of both strings.',
    'If `text1[i] == text2[j]`, the character contributes 1 to the length plus the LCS of the remainder: `1 + lcs(i+1, j+1)`.',
    'If characters differ, take the maximum of skipping either character: `max(lcs(i+1, j), lcs(i, j+1))`. Tabulate this in a 2D matrix of size `(m+1) x (n+1)`.',
  ],

  starterCode: {
    javascript:
      'function longestCommonSubsequence(text1, text2) {\n  // TODO: length of longest common subsequence\n  return 0;\n}',
    python:
      'def longest_common_subsequence(text1, text2):\n    # TODO: length of longest common subsequence\n    return 0',
  },

  referenceSolution: {
    javascript: `function longestCommonSubsequence(text1, text2) {
  const m = text1.length;
  const n = text2.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (text1[i - 1] === text2[j - 1]) {
        dp[i][j] = 1 + dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  return dp[m][n];
}`,
    python: `def longest_common_subsequence(text1, text2):
    m = len(text1)
    n = len(text2)
    dp = [[0] * (n + 1) for _ in range(m + 1)]

    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if text1[i - 1] == text2[j - 1]:
                dp[i][j] = 1 + dp[i - 1][j - 1]
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])

    return dp[m][n]`,
  },

  complexity: {
    time: 'O(m * n)',
    space: 'O(m * n)',
    note: 'Iterating over the 2D grid of size (m+1) x (n+1) where each subproblem takes O(1) state transitions.',
  },

  testSpec: {
    entry: 'longestCommonSubsequence',
    entryByLanguage: { python: 'longest_common_subsequence' },
    cases: [
      {
        name: 'standard subsequence',
        args: ['abcde', 'ace'],
        expected: 3,
      },
      {
        name: 'identical strings',
        args: ['abc', 'abc'],
        expected: 3,
      },
      {
        name: 'no common characters',
        args: ['abc', 'def'],
        expected: 0,
      },
      {
        name: 'repeated characters',
        args: ['ezupkr', 'ubmrapg'],
        expected: 2,
        hidden: true,
      },
      {
        name: 'single character match',
        args: ['a', 'bca'],
        expected: 1,
        hidden: true,
      },
    ],
  },
};
