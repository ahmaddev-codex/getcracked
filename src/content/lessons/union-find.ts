import type { LessonInput } from '../schema';

export const unionFindLesson: LessonInput = {
  tier: 'lesson',
  slug: 'union-find',
  title: 'Union-Find',
  summary: 'Answering "are these two in the same group?" in almost constant time.',
  order: 9,
  track: 'data-structures',

  difficulty: 'advanced',

  operations: [
    {
      name: 'find',
      time: 'O(alpha(n)) amortised',
      note: 'Inverse Ackermann — under 5 for any real input.',
    },
    {
      name: 'union',
      time: 'O(alpha(n)) amortised',
    },
    {
      name: 'connected?',
      time: 'O(alpha(n)) amortised',
      note: 'Two finds and a comparison.',
    },
    {
      name: 'list a group',
      time: 'not supported',
      note: 'It tracks membership, not contents.',
    },
  ],

  variants: [
    {
      name: 'Quick find',
      what: 'Root stored directly. O(1) find, O(n) union.',
    },
    {
      name: 'Quick union',
      what: 'Parent pointers. Fast union, potentially deep chains.',
    },
    {
      name: 'Path compression',
      what: 'Repoint every node walked past straight at the root.',
    },
    {
      name: 'Union by size or rank',
      what: 'Hang the smaller tree under the larger.',
    },
  ],

  furtherReading: [
    {
      label: 'Disjoint-set data structure',
      url: 'https://en.wikipedia.org/wiki/Disjoint-set_data_structure',
      source: 'Wikipedia',
    },
    {
      label: 'Union-Find visualiser',
      url: 'https://visualgo.net/en/ufds',
      source: 'VisuAlgo',
    },
  ],

  explainer: `Union-Find — also called a disjoint-set union, or DSU — does exactly two things:
merge two groups, and answer whether two elements are in the same group.

The whole structure is **one array**. \`parent[i]\` holds the index of *i*'s
parent, and an element that is its own parent is the root of its group. Two
elements belong to the same group when following parents from each leads to the
same root.

That is the entire idea. The cleverness is in keeping the chains short.

**Path compression**: after finding a root, point every node you walked past
straight at it. The next query on any of them is one hop.

**Union by size or rank**: when merging, hang the smaller tree under the larger
one, so the depth grows as slowly as possible.

With both, the amortised cost per operation is the inverse Ackermann function —
under 5 for any input that fits in the universe. It is not technically O(1), and
it is close enough that treating it as constant is fair.

What it cannot do is tell you *how* two elements are connected. There is no path,
no distance, no ordering. If you need any of that, you need a graph traversal.`,

  walkthrough: {
    entry: 'countRoots',
    entryByLanguage: { python: 'count_roots' },
    source: {
      javascript: `function countRoots(parent) {
  let roots = 0;
  for (let i = 0; i < parent.length; i++) {
    let node = i;
    while (parent[node] !== node) {
      node = parent[node];
    }
    parent[i] = node;
    if (node === i) {
      roots = roots + 1;
    }
  }
  return roots;
}`,
      python: `def count_roots(parent):
    roots = 0
    for i in range(len(parent)):
        node = i
        while parent[node] != node:
            node = parent[node]
        parent[i] = node
        if node == i:
            roots = roots + 1
    return roots`,
    },
    visual: 'array',
    args: [[0, 0, 1, 3, 3]],
    caption:
      'The parent array is the structure. Watch each element get repointed straight at its root — that write is path compression, and it is why the next query is one hop.',
  },

  complexity: {
    time: 'O(α(n)) amortised per union or find — effectively constant',
    space: 'O(n) for the parent array, plus O(n) if you track sizes',
    note: 'α is the inverse Ackermann function, which is below 5 for any n you can store. Without path compression and union by size, a bad merge order degrades this to O(n) per operation.',
  },

  whenToUse: {
    reachFor: [
      'The question is only "same group or not?", asked many times as groups merge.',
      'Connections arrive incrementally and you need connectivity after each one.',
      'You are counting connected components, detecting a cycle while adding edges, or running Kruskal for a minimum spanning tree.',
      'Grid problems about islands or regions, where each cell unions with its neighbours.',
    ],
    insteadOf: [
      {
        alternative: 'BFS or DFS over a graph',
        why: 'A traversal recomputes connectivity from scratch each time — O(V + E) per query. Union-Find answers each in near-constant time. Choose the traversal when you need the actual path or distance, which Union-Find cannot give you.',
      },
      {
        alternative: 'A hash map of group id to members',
        why: 'Merging two groups means rewriting every member of one of them, which is O(n) per union. Union-Find changes a single pointer.',
      },
    ],
  },

  patternCues: [
    'The problem merges things and asks about membership, never about routes.',
    'Edges arrive one at a time and each one may join two groups.',
    'You are asked to count groups, or to find the edge that first connects everything.',
    'Adding an edge between two nodes already in the same group would create a cycle — and detecting that is the question.',
  ],

  pitfalls: [
    {
      title: 'Comparing elements instead of roots',
      body: 'Two elements are in the same group when their *roots* match. Comparing the elements themselves, or their immediate parents, silently reports the wrong answer for anything deeper than one level.',
    },
    {
      title: 'Union without find',
      body: '`parent[a] = b` merges the wrong things unless a and b are already roots. Always find both roots first, then link one root to the other.',
    },
    {
      title: 'Skipping the balancing',
      body: 'Path compression alone is usually enough in practice, but unioning without regard to size can build a chain, and a chain is a linked list with extra steps.',
    },
  ],

  exercises: [
    {
      slug: 'same-group',
      title: 'Same group?',
      brief:
        'Given a `parent` array, return `true` if `a` and `b` share a root. Follow parents until an element is its own parent.',
      hints: [
        'Write the walk once and use it twice — the root of a, then the root of b.',
        'An element is a root exactly when `parent[x] === x`. That is your stopping condition.',
      ],
      starterCode: {
        javascript: `function sameGroup(parent, a, b) {
  // TODO: follow parents from a and from b, then compare the roots.
  return false;
}`,
      },
      referenceSolution: {
        javascript: `function sameGroup(parent, a, b) {
  function root(x) {
    let node = x;
    while (parent[node] !== node) {
      node = parent[node];
    }
    return node;
  }
  return root(a) === root(b);
}`,
      },
      testSpec: {
        entry: 'sameGroup',
        cases: [
          { name: 'same group, one hop', args: [[0, 0, 2], 0, 1], expected: true },
          { name: 'different groups', args: [[0, 0, 2], 1, 2], expected: false },
          { name: 'same element', args: [[0, 0, 2], 2, 2], expected: true },
          { name: 'deeper chain', args: [[0, 0, 1, 2], 3, 0], expected: true, hidden: true },
        ],
      },
    },
  ],
};
