import type { ProblemInput } from '../../schema';

export const wordSearch: ProblemInput = {
  tier: 'problem',
  slug: 'word-search',
  topic: 'backtracking',
  difficulty: 'medium',
  title: 'Word Search',
  companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Bloomberg'],
  recommendedAfter: ['backtracking', 'graphs'],

  brief: `Given an \`m x n\` grid of characters \`board\` and a string \`word\`, return \`true\` if \`word\` exists in the grid.

The word can be constructed from letters of sequentially adjacent cells (horizontally or vertically neighboring). The same letter cell may not be used more than once in a single word path.

\`\`\`
exist([
  ["A","B","C","E"],
  ["S","F","C","S"],
  ["A","D","E","E"]
], "ABCCED") -> true

exist([
  ["A","B","C","E"],
  ["S","F","C","S"],
  ["A","D","E","E"]
], "SEE")    -> true

exist([
  ["A","B","C","E"],
  ["S","F","C","S"],
  ["A","D","E","E"]
], "ABCB")   -> false
\`\`\``,

  hints: [
    'Iterate over every cell `(r, c)` on the board to find candidates matching `word[0]`.',
    'From each starting cell, trigger a recursive backtracking DFS searching for the next character `word[k + 1]`.',
    'Temporarily mark the current cell as visited (e.g. `board[r][c] = "#"`) before recursing in 4 directions, and restore its original character upon returning (backtrack).',
  ],

  starterCode: {
    javascript: `function exist(board, word) {
  // TODO: return true if word exists on board.
  return false;
}`,
    python: `def exist(board, word):
    # TODO: return true if word exists on board.
    return False`,
  },

  referenceSolution: {
    javascript: `function exist(board, word) {
  const rows = board.length;
  const cols = board[0].length;

  function dfs(r, c, k) {
    if (k === word.length) return true;
    if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] !== word[k]) {
      return false;
    }

    const temp = board[r][c];
    board[r][c] = '#'; // Mark visited

    const found =
      dfs(r + 1, c, k + 1) ||
      dfs(r - 1, c, k + 1) ||
      dfs(r, c + 1, k + 1) ||
      dfs(r, c - 1, k + 1);

    board[r][c] = temp; // Backtrack
    return found;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c] === word[0] && dfs(r, c, 0)) {
        return true;
      }
    }
  }

  return false;
}`,
    python: `def exist(board, word):
    rows = len(board)
    cols = len(board[0])

    def dfs(r, c, k):
        if k == len(word):
            return True
        if r < 0 or r >= rows or c < 0 or c >= cols or board[r][c] != word[k]:
            return False

        temp = board[r][c]
        board[r][c] = '#'

        found = (
            dfs(r + 1, c, k + 1)
            or dfs(r - 1, c, k + 1)
            or dfs(r, c + 1, k + 1)
            or dfs(r, c - 1, k + 1)
        )

        board[r][c] = temp
        return found

    for r in range(rows):
        for c in range(cols):
            if board[r][c] == word[0] and dfs(r, c, 0):
                return True

    return False`,
  },

  complexity: {
    time: 'O(m × n × 4^L) where L is word length',
    space: 'O(L) recursion depth',
    note: 'In-place cell marking provides O(1) auxiliary matrix space while backtracking.',
  },

  testSpec: {
    entry: 'exist',
    cases: [
      {
        name: 'word exists horizontally and vertically',
        args: [
          [
            ['A', 'B', 'C', 'E'],
            ['S', 'F', 'C', 'S'],
            ['A', 'D', 'E', 'E'],
          ],
          'ABCCED',
        ],
        expected: true,
      },
      {
        name: 'word exists short',
        args: [
          [
            ['A', 'B', 'C', 'E'],
            ['S', 'F', 'C', 'S'],
            ['A', 'D', 'E', 'E'],
          ],
          'SEE',
        ],
        expected: true,
      },
      {
        name: 'reusing same cell invalid',
        args: [
          [
            ['A', 'B', 'C', 'E'],
            ['S', 'F', 'C', 'S'],
            ['A', 'D', 'E', 'E'],
          ],
          'ABCB',
        ],
        expected: false,
      },
      {
        name: 'single cell match',
        args: [[['A']], 'A'],
        expected: true,
        hidden: true,
      },
    ],
  },
};
