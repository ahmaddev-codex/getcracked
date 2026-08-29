import type { ProblemInput } from '../../schema';

export const coinChange: ProblemInput = {
  tier: 'problem',
  slug: "coin-change",
  topic: "dynamic-programming",
  difficulty: "stretch",
  title: "Coin Change",
  companies: ["Amazon", "Google", "Uber"],
  recommendedAfter: ["dynamic-programming"],

  brief: "Return the fewest coins from `coins` that sum to `amount`, or `-1` if it cannot be made.\n\n```\ncoinChange([1, 2, 5], 11)  ->  3\n```",

  hints: [
    "Greedily taking the largest coin fails \u2014 try coins [1, 3, 4] and amount 6.",
    "Build up from 0: the best for amount a is one more than the best for a minus some coin.",
    "Use a sentinel larger than any real answer for 'unreachable', and check for it at the end.",
  ],

  starterCode: {
    javascript: "function coinChange(coins, amount) {\n  // TODO: fewest coins summing to amount, or -1.\n  return -1;\n}",
    python: "def coin_change(coins, amount):\n    # TODO: fewest coins summing to amount, or -1.\n    return -1",
  },

  referenceSolution: {
    javascript: "function coinChange(coins, amount) {\n  const unreachable = amount + 1;\n  const best = new Array(amount + 1).fill(unreachable);\n  best[0] = 0;\n  for (let a = 1; a <= amount; a++) {\n    for (const coin of coins) {\n      if (coin <= a && best[a - coin] + 1 < best[a]) {\n        best[a] = best[a - coin] + 1;\n      }\n    }\n  }\n  return best[amount] === unreachable ? -1 : best[amount];\n}",
    python: "def coin_change(coins, amount):\n    unreachable = amount + 1\n    best = [unreachable] * (amount + 1)\n    best[0] = 0\n    for a in range(1, amount + 1):\n        for coin in coins:\n            if coin <= a and best[a - coin] + 1 < best[a]:\n                best[a] = best[a - coin] + 1\n    return -1 if best[amount] == unreachable else best[amount]",
  },

  complexity: {
    time: "O(amount \u00d7 coins)",
    space: "O(amount)",
    note: "The greedy-trap case is the point: [1,3,4] for 6 is 3+3, but greedy takes 4 then two 1s. Greedy only works for special coin systems.",
  },

  testSpec: {
    entry: "coinChange",
    entryByLanguage: { python: "coin_change" },
    cases: [
        { name: "classic", args: [[1, 2, 5], 11], expected: 3 },
        { name: "impossible", args: [[2], 3], expected: -1 },
        { name: "zero amount", args: [[1], 0], expected: 0 },
        { name: "greedy trap", args: [[1, 3, 4], 6], expected: 2, hidden: true },
    ],
  },
};
