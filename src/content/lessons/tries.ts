import type { LessonInput } from '../schema';

export const triesLesson: LessonInput = {
  tier: 'lesson',
  slug: 'tries',
  title: 'Tries',
  summary: 'A tree where the path spells the key, so shared prefixes are stored once.',
  order: 8,
  track: 'data-structures',

  difficulty: 'advanced',

  operations: [
    {
      name: 'insert',
      time: 'O(k)',
      note: 'k is the key length, independent of how many keys are stored.',
    },
    {
      name: 'search',
      time: 'O(k)',
    },
    {
      name: 'prefix search',
      time: 'O(k + matches)',
      note: 'The operation nothing else does well.',
    },
    {
      name: 'memory',
      time: 'O(total characters)',
      note: 'Shared prefixes reduce it; per-node child arrays inflate it.',
    },
  ],

  variants: [
    {
      name: 'Standard trie',
      what: 'One node per character.',
    },
    {
      name: 'Compressed trie / radix tree',
      what: 'Chains of single children collapse into one edge.',
    },
    {
      name: 'Binary trie',
      what: 'Alphabet of two, one bit per level. XOR problems run on this.',
    },
    {
      name: 'Suffix tree',
      what: 'Every suffix inserted. Substring search in linear time.',
    },
  ],

  furtherReading: [
    {
      label: 'Trie',
      url: 'https://en.wikipedia.org/wiki/Trie',
      source: 'Wikipedia',
    },
    {
      label: 'Trie visualiser',
      url: 'https://visualgo.net/en/trie',
      source: 'VisuAlgo',
    },
  ],

  explainer: `A trie stores keys in the *shape of the tree* rather than inside the nodes. To
look up "car", you start at the root and follow the edge labelled \`c\`, then
\`a\`, then \`r\`. The key is the path.

Two consequences follow immediately.

**Shared prefixes are stored once.** "car", "card" and "care" occupy one chain of
three nodes plus two leaves. A hash set of the same three words stores all
thirteen characters, three times over.

**Prefix questions become cheap.** "Which words start with 'car'?" is a walk of
three edges followed by whatever hangs below — a hash set cannot answer it at all
without scanning every key it holds. That is the one thing a trie does that
nothing else does well, and it is the reason to reach for one.

Lookup costs O(length of the key), independent of how many keys are stored.
That sounds better than a hash map's O(1) until you notice the hash also has to
read the whole key to hash it — the two are closer than the notation suggests,
and the hash map usually wins on constants and memory.

The walkthrough below uses a **binary trie**: the same idea with an alphabet of
two, where each level is one bit of the key. It is a real and widely used variant
— XOR and maximum-pair problems run on it — and it is small enough to see whole.`,

  walkthrough: {
    entry: 'walkBits',
    entryByLanguage: { python: 'walk_bits' },
    source: {
      javascript: `function walkBits(trie, key) {
  let node = 0;
  let depth = 0;
  while (depth < 3) {
    const bit = key % 2;
    const child = 2 * node + 1 + bit;
    if (child >= trie.length) {
      return -1;
    }
    if (trie[child] === -1) {
      return -1;
    }
    node = child;
    depth = depth + 1;
    key = (key - bit) / 2;
  }
  return trie[node];
}`,
      python: `def walk_bits(trie, key):
    node = 0
    depth = 0
    while depth < 3:
        bit = key % 2
        child = 2 * node + 1 + bit
        if child >= len(trie):
            return -1
        if trie[child] == -1:
            return -1
        node = child
        depth = depth + 1
        key = (key - bit) // 2
    return trie[node]`,
    },
    visual: 'tree',
    args: [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], 5],
    caption:
      'A binary trie, one bit per level. The path taken *is* the key — watch the walk turn left or right according to the next bit rather than comparing values.',
  },

  complexity: {
    time: 'O(k) for insert, lookup, or prefix search, where k is the key length',
    space: 'O(total characters stored), which shared prefixes reduce',
    note: 'Independent of how many keys are held — a million words cost the same per lookup as ten. The space constant is the weak point: a node per character with a child slot per alphabet letter is heavy, which is why real implementations compress chains.',
  },

  whenToUse: {
    reachFor: [
      'You need prefix queries: autocomplete, "all words starting with…", longest common prefix.',
      'Your keys share long prefixes, so storing each in full would repeat the same characters many times.',
      'You need keys in sorted order for free — an in-order walk of a trie yields exactly that.',
      'Bitwise problems about maximum or minimum XOR pairs, which are a binary trie in disguise.',
    ],
    insteadOf: [
      {
        alternative: 'A hash set or hash map',
        why: 'The right default for exact-match lookup: simpler, less memory, and faster in practice. It cannot answer prefix questions at all without scanning every key, which is the only reason to give it up.',
      },
      {
        alternative: 'A sorted array with binary search',
        why: 'It does support prefix queries, in O(log n · k), and uses far less memory. Prefer it when the set is static; prefer the trie when keys are inserted and removed as you go.',
      },
    ],
  },

  patternCues: [
    'The problem says "prefix", "starts with", "autocomplete", or "dictionary".',
    'You are matching many keys against one text, or one key against many stored keys.',
    'The input is a set of words with heavy overlap.',
    'The problem is about XOR of pairs, which becomes a walk down a binary trie.',
  ],

  pitfalls: [
    {
      title: 'Forgetting the end-of-word marker',
      body: 'Reaching a node does not mean a word ends there. Without an explicit flag, "car" is reported as present in a trie that only holds "card".',
    },
    {
      title: 'Confusing "prefix exists" with "word exists"',
      body: 'These are different queries and most trie bugs are one answering as the other. Decide which you need before writing the walk.',
    },
    {
      title: 'A child array per node, for a large alphabet',
      body: '26 slots per node is already wasteful; Unicode is impossible. Use a map per node, or compress chains, once the alphabet grows.',
    },
  ],

  exercises: [
    {
      slug: 'shared-prefix',
      title: 'Longest shared prefix length',
      brief:
        'Given two equal-length arrays of character codes, return how many leading positions match — the depth their paths would share in a trie.',
      hints: [
        'Walk both from the front and stop at the first difference.',
        'Running off the end of either one also stops the walk.',
      ],
      starterCode: {
        javascript: `function sharedPrefix(a, b) {
  // TODO: count matching leading positions.
  return 0;
}`,
      },
      referenceSolution: {
        javascript: `function sharedPrefix(a, b) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i = i + 1;
  }
  return i;
}`,
      },
      testSpec: {
        entry: 'sharedPrefix',
        cases: [
          { name: 'partial overlap', args: [[99, 97, 114], [99, 97, 116]], expected: 2 },
          { name: 'no overlap', args: [[1, 2], [3, 4]], expected: 0 },
          { name: 'identical', args: [[5, 6, 7], [5, 6, 7]], expected: 3 },
          { name: 'one empty', args: [[], [1]], expected: 0, hidden: true },
        ],
      },
    },
  ],
};
