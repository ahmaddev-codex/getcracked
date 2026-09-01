import type { ProblemInput } from '../../schema';

export const bestTimeToBuyAndSellStock: ProblemInput = {
  tier: 'problem',
  slug: 'best-time-stock',
  topic: 'greedy',
  difficulty: 'easy',
  title: 'Best Time to Buy and Sell Stock',
  companies: ['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple', 'Goldman Sachs'],
  recommendedAfter: ['greedy', 'arrays'],

  brief: `You are given an array \`prices\` where \`prices[i]\` is the price of a given stock on the \`i\`-th day.

You want to maximize your profit by choosing a single day to buy one stock and choosing a different day in the future to sell that stock.

Return the maximum profit you can achieve from this transaction. If you cannot achieve any profit, return \`0\`.

\`\`\`
maxProfit([7, 1, 5, 3, 6, 4]) -> 5
// Buy on day 2 (price = 1) and sell on day 5 (price = 6), profit = 6 - 1 = 5.

maxProfit([7, 6, 4, 3, 1])    -> 0
// Prices strictly decrease, so no profitable transaction is possible.
\`\`\``,

  hints: [
    'Track the minimum price seen so far as you iterate through the list.',
    'At each day, calculate the profit if you sold today: `currentPrice - minPrice`.',
    'Update the maximum profit if today’s potential profit exceeds the previous best.',
  ],

  starterCode: {
    javascript: `function maxProfit(prices) {
  // TODO: find maximum profit from a single buy and sell transaction.
  return 0;
}`,
    python: `def max_profit(prices):
    # TODO: find maximum profit from a single buy and sell transaction.
    return 0`,
  },

  referenceSolution: {
    javascript: `function maxProfit(prices) {
  let minPrice = Infinity;
  let maxProfit = 0;

  for (const price of prices) {
    if (price < minPrice) {
      minPrice = price;
    } else if (price - minPrice > maxProfit) {
      maxProfit = price - minPrice;
    }
  }

  return maxProfit;
}`,
    python: `def max_profit(prices):
    min_price = float('inf')
    max_profit = 0

    for price in prices:
        if price < min_price:
            min_price = price
        elif price - min_price > max_profit:
            max_profit = price - min_price

    return max_profit`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(1)',
    note: 'Greedy single-pass scan maintaining running minimum and maximum profit.',
  },

  testSpec: {
    entry: 'maxProfit',
    entryByLanguage: { python: 'max_profit' },
    cases: [
      { name: 'standard profitable case', args: [[7, 1, 5, 3, 6, 4]], expected: 5 },
      { name: 'strictly decreasing prices', args: [[7, 6, 4, 3, 1]], expected: 0 },
      { name: 'two days profitable', args: [[1, 4]], expected: 3 },
      { name: 'single day no transactions', args: [[5]], expected: 0 },
      { name: 'lowest price on last day', args: [[3, 8, 2, 4, 1]], expected: 5, hidden: true },
    ],
  },
};
