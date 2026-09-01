import type { ProblemInput } from '../../schema';

export const numberOfIslands: ProblemInput = {
  tier: 'problem',
  slug: 'number-of-islands',
  topic: 'graphs',
  difficulty: 'medium',
  title: 'Number of Islands',
  companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Bloomberg'],
  recommendedAfter: ['graphs'],

  brief: `Given an \`m x n\` 2D binary grid representing a map of \`"1"\`s (land) and \`"0"\`s (water), return the total number of distinct islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically (4-directional connectivity). You may assume all four edges of the grid are entirely surrounded by water.

\`\`\`
numIslands([
  ["1","1","1","1","0"],
  ["1","1","0","1","0"],
  ["1","1","0","0","0"],
  ["0","0","0","0","0"]
]) -> 1

numIslands([
  ["1","1","0","0","0"],
  ["1","1","0","0","0"],
  ["0","0","1","0","0"],
  ["0","0","0","1","1"]
]) -> 3
\`\`\``,

  hints: [
    'Iterate through every cell in the 2D grid.',
    'When you encounter a `"1"`, increment your island count and trigger a depth-first search (DFS) or breadth-first search (BFS) starting from that cell.',
    'During the traversal, sink visited land by mutating `"1"` into `"0"` (or tracking visited cells in a set) to prevent counting the same island twice.',
  ],

  starterCode: {
    javascript: `function numIslands(grid) {
  // TODO: count connected components of "1"s.
  return 0;
}`,
    python: `def num_islands(grid):
    # TODO: count connected components of "1"s.
    return 0`,
  },

  referenceSolution: {
    javascript: `function numIslands(grid) {
  if (!grid || grid.length === 0) return 0;
  const rows = grid.length;
  const cols = grid[0].length;
  let count = 0;

  function dfs(r, c) {
    if (r < 0 || r >= rows || c < 0 || c >= cols || grid[r][c] !== '1') {
      return;
    }
    grid[r][c] = '0';
    dfs(r + 1, c);
    dfs(r - 1, c);
    dfs(r, c + 1);
    dfs(r, c - 1);
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (grid[r][c] === '1') {
        count++;
        dfs(r, c);
      }
    }
  }

  return count;
}`,
    python: `def num_islands(grid):
    if not grid or not grid[0]:
        return 0
    rows, cols = len(grid), len(grid[0])
    count = 0

    def dfs(r, c):
        if r < 0 or r >= rows or c < 0 or c >= cols or grid[r][c] != "1":
            return
        grid[r][c] = "0"
        dfs(r + 1, c)
        dfs(r - 1, c)
        dfs(r, c + 1)
        dfs(r, c - 1)

    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == "1":
                count += 1
                dfs(r, c)

    return count`,
  },

  complexity: {
    time: 'O(m × n)',
    space: 'O(m × n) call stack in the worst case (e.g. grid filled entirely with land)',
    note: 'Every cell in the matrix is visited at most twice (once in outer iteration, once during DFS traversal).',
  },

  testSpec: {
    entry: 'numIslands',
    entryByLanguage: { python: 'num_islands' },
    cases: [
      {
        name: 'single island',
        args: [
          [
            ['1', '1', '1', '1', '0'],
            ['1', '1', '0', '1', '0'],
            ['1', '1', '0', '0', '0'],
            ['0', '0', '0', '0', '0'],
          ],
        ],
        expected: 1,
      },
      {
        name: 'three islands',
        args: [
          [
            ['1', '1', '0', '0', '0'],
            ['1', '1', '0', '0', '0'],
            ['0', '0', '1', '0', '0'],
            ['0', '0', '0', '1', '1'],
          ],
        ],
        expected: 3,
      },
      {
        name: 'all water',
        args: [
          [
            ['0', '0', '0'],
            ['0', '0', '0'],
          ],
        ],
        expected: 0,
      },
      {
        name: 'diagonal disconnected',
        args: [
          [
            ['1', '0'],
            ['0', '1'],
          ],
        ],
        expected: 2,
        hidden: true,
      },
    ],
  },
};
