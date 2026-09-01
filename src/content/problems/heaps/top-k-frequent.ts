import type { ProblemInput } from '../../schema';

export const topKFrequent: ProblemInput = {
  tier: 'problem',
  slug: 'top-k-frequent',
  topic: 'heaps',
  difficulty: 'medium',
  title: 'Top K Frequent Elements',
  companies: ['Amazon', 'Meta', 'Google', 'Microsoft', 'Netflix'],
  recommendedAfter: ['heaps', 'hashing'],

  brief: `Given an integer array \`nums\` and an integer \`k\`, return the \`k\` most frequent elements. Return the result sorted in descending order of frequency (or ascending value if tied).

\`\`\`
topKFrequent([1, 1, 1, 2, 2, 3], 2) -> [1, 2]
topKFrequent([1], 1)                -> [1]
topKFrequent([4, 1, -1, 2, -1, 2, 3], 2) -> [-1, 2]
\`\`\``,

  hints: [
    'First count the frequency of each number using a Hash Map.',
    'You can use a Min-Heap of size k (storing elements prioritized by frequency) or Bucket Sort where array indices represent frequencies.',
    'Extract the top k elements from the heap or from the highest frequency buckets down.',
  ],

  starterCode: {
    javascript: `function topKFrequent(nums, k) {
  // TODO: return the k most frequent elements.
  return [];
}`,
    python: `def top_k_frequent(nums, k):
    # TODO: return the k most frequent elements.
    return []`,
  },

  referenceSolution: {
    javascript: `function topKFrequent(nums, k) {
  const map = new Map();
  for (const n of nums) {
    map.set(n, (map.get(n) || 0) + 1);
  }

  // Bucket sort by frequency
  const buckets = Array.from({ length: nums.length + 1 }, () => []);
  for (const [num, freq] of map.entries()) {
    buckets[freq].push(num);
  }

  const result = [];
  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--) {
    if (buckets[i].length > 0) {
      buckets[i].sort((a, b) => a - b);
      for (const num of buckets[i]) {
        result.push(num);
        if (result.length === k) break;
      }
    }
  }

  return result;
}`,
    python: `def top_k_frequent(nums, k):
    counts = {}
    for n in nums:
        counts[n] = counts.get(n, 0) + 1

    buckets = [[] for _ in range(len(nums) + 1)]
    for num, freq in counts.items():
        buckets[freq].append(num)

    result = []
    for freq in range(len(buckets) - 1, -1, -1):
        if buckets[freq]:
            buckets[freq].sort()
            for num in buckets[freq]:
                result.append(num)
                if len(result) == k:
                    return result
    return result`,
  },

  complexity: {
    time: 'O(n)',
    space: 'O(n)',
    note: 'Using bucket sort achieves O(n) linear time complexity; min-heap approach achieves O(n log k).',
  },

  testSpec: {
    entry: 'topKFrequent',
    entryByLanguage: { python: 'top_k_frequent' },
    cases: [
      { name: 'top 2 frequent', args: [[1, 1, 1, 2, 2, 3], 2], expected: [1, 2] },
      { name: 'single element', args: [[1], 1], expected: [1] },
      { name: 'negative numbers tied', args: [[4, 1, -1, 2, -1, 2, 3], 2], expected: [-1, 2] },
      { name: 'all unique top 1', args: [[5, 3, 1, 4, 2], 1], expected: [1], hidden: true },
    ],
  },
};
