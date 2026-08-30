import type { LessonInput } from '../schema';

export const graphsLesson: LessonInput = {
  tier: 'lesson',
  slug: "graphs",
  order: 7,
  track: 'data-structures',
  title: "Graphs",
  summary: "Nodes, edges, and not visiting anything twice.",

  difficulty: 'core',

  operations: [
    {
      name: 'BFS or DFS',
      time: 'O(V + E)',
      note: 'Every vertex and edge once — but only because of the visited set.',
    },
    {
      name: 'adjacency list memory',
      time: 'O(V + E)',
      note: 'The right default for sparse graphs.',
    },
    {
      name: 'adjacency matrix memory',
      time: 'O(V^2)',
      note: 'Constant-time edge lookup, at a cost that ignores sparsity.',
    },
    {
      name: 'Dijkstra with a binary heap',
      time: 'O((V + E) log V)',
      note: 'Non-negative weights only.',
    },
    {
      name: 'topological sort',
      time: 'O(V + E)',
      note: 'Directed acyclic graphs only.',
    },
  ],

  variants: [
    {
      name: 'Directed / undirected',
      what: 'Whether edges go one way.',
    },
    {
      name: 'Weighted / unweighted',
      what: 'BFS finds shortest paths only when every edge costs the same.',
    },
    {
      name: 'DAG',
      what: 'No cycles. Unlocks topological order and DP over the graph.',
    },
    {
      name: 'Adjacency list vs matrix',
      what: 'The representation choice, decided by density.',
    },
  ],

  furtherReading: [
    {
      label: 'Graph (abstract data type)',
      url: 'https://en.wikipedia.org/wiki/Graph_(abstract_data_type)',
      source: 'Wikipedia',
    },
    {
      label: 'Graph traversal visualiser',
      url: 'https://visualgo.net/en/dfsbfs',
      source: 'VisuAlgo',
    },
  ],

  explainer: "A graph is nodes joined by edges. Trees are the special case with no cycles;\nthe general case is where the visited set becomes mandatory, because without it a\ncycle means traversal never terminates.\n\nRepresentation matters more than it first appears. An **adjacency list** \u2014 each\nnode mapped to its neighbours \u2014 is O(V + E) space and iterating a node's\nneighbours is proportional to how many it has. An **adjacency matrix** is O(V\u00b2)\nregardless of edge count, but answers \"is there an edge?\" in constant time. Sparse\ngraphs, which is most real ones, want the list.\n\nThe two traversals answer different questions:\n\n- **Depth-first** goes as deep as possible before backtracking. Natural\n  recursively. Good for connectivity, cycle detection, topological order.\n- **Breadth-first** explores by distance from the start. Needs a queue. It is the\n  only one of the two that finds the **shortest path** in an unweighted graph,\n  because it reaches every node in order of distance.\n\nReaching for DFS when the question asks for a shortest path is the single most\ncommon graph mistake.",

  walkthrough: {
    entry: "bfsOrder",
    entryByLanguage: { python: 'bfs_order' },
    source: {
      javascript: `function bfsOrder(cells) {
  const queue = [0];
  let reached = 0;
  while (queue.length > 0) {
    const node = queue.shift();
    if (node < 0 || node >= cells.length) {
      continue;
    }
    if (cells[node] !== 1) {
      continue;
    }
    cells[node] = 2;
    reached = reached + 1;
    queue.push(node - 1);
    queue.push(node + 1);
  }
  return reached;
}`,
      python: `def bfs_order(cells):
    queue = [0]
    reached = 0
    while len(queue) > 0:
        node = queue.pop(0)
        if node < 0 or node >= len(cells):
            continue
        if cells[node] != 1:
            continue
        cells[node] = 2
        reached = reached + 1
        queue.append(node - 1)
        queue.append(node + 1)
    return reached`,
    },
    visual: 'graph',
    args: [[1, 1, 1, 0, 1, 1, 0, 0]],
    caption:
      "Breadth-first over a row of cells: 1 is open, 0 is a wall. Each cell flips to 2 as it is reached, so the frontier is visible spreading outward until the wall stops it.",
  },

  complexity: {
    time: "O(V + E) for either traversal",
    space: "O(V) for the visited set, plus the stack or queue",
    note: "Every node and edge is examined at most once \u2014 but only because of the visited set. Without it, a single cycle makes the traversal infinite.",
  },

  whenToUse: {
    reachFor: [
      'The data is a network: friends, routes, dependencies, links.',
      'The question is about reachability, connectivity, or a path between two things.',
      'There are prerequisites or ordering constraints, which is a topological sort.',
      'It looks like a tree problem but the structure can contain cycles.',
    ],
    insteadOf: [
      {
        alternative: 'Union-Find',
        why: 'Near-constant time for "same group?" but it cannot give you a path or a distance. Use it when connectivity is all you need; use a traversal when the route matters.',
      },
      {
        alternative: 'A tree',
        why: 'Simpler and needs no visited set — but only valid when the structure genuinely has no cycles. One cycle makes a tree traversal run forever.',
      },
      {
        alternative: 'A matrix of distances',
        why: 'Adjacency matrices cost O(V²) memory regardless of how many edges exist. For a sparse graph an adjacency list is dramatically smaller.',
      },
    ],
  },

  patternCues: [
    "The data is a network: friends, routes, dependencies, links.",
    "The problem asks about reachability, connectivity, or a path.",
    "There are prerequisites or ordering constraints, which is topological sort.",
    "It looks like a tree problem but the structure can contain cycles.",
  ],

  pitfalls: [
    {
      title: "No visited set",
      body: "The defining difference from a tree. One cycle and the traversal never ends.",
    },
    {
      title: "Marking visited too late",
      body: "Mark on enqueue, not on dequeue. Otherwise the same node is queued several times before any of them is processed.",
    },
    {
      title: "DFS for shortest paths",
      body: "Depth-first finds *a* path, not the shortest. Unweighted shortest path is BFS; weighted is Dijkstra.",
    },
  ],

  recommendedAfter: ["trees"],
};
