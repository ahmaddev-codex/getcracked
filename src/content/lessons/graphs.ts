import type { LessonInput } from '../schema';

export const graphsLesson: LessonInput = {
  tier: 'lesson',
  slug: "graphs",
  order: 9,
  title: "Graphs",
  summary: "Nodes, edges, and not visiting anything twice.",

  explainer: "A graph is nodes joined by edges. Trees are the special case with no cycles;\nthe general case is where the visited set becomes mandatory, because without it a\ncycle means traversal never terminates.\n\nRepresentation matters more than it first appears. An **adjacency list** \u2014 each\nnode mapped to its neighbours \u2014 is O(V + E) space and iterating a node's\nneighbours is proportional to how many it has. An **adjacency matrix** is O(V\u00b2)\nregardless of edge count, but answers \"is there an edge?\" in constant time. Sparse\ngraphs, which is most real ones, want the list.\n\nThe two traversals answer different questions:\n\n- **Depth-first** goes as deep as possible before backtracking. Natural\n  recursively. Good for connectivity, cycle detection, topological order.\n- **Breadth-first** explores by distance from the start. Needs a queue. It is the\n  only one of the two that finds the **shortest path** in an unweighted graph,\n  because it reaches every node in order of distance.\n\nReaching for DFS when the question asks for a shortest path is the single most\ncommon graph mistake.",

  walkthrough: {
    entry: "bfsOrder",
    source: {
      javascript: "function bfsOrder(cells) {\n  const visited = [];\n  for (let i = 0; i < cells.length; i++) {\n    visited.push(0);\n  }\n  const queue = [0];\n  let reached = 0;\n  while (queue.length > 0) {\n    const node = queue.shift();\n    if (node < 0 || node >= cells.length) {\n      continue;\n    }\n    if (visited[node] === 1 || cells[node] === 0) {\n      continue;\n    }\n    visited[node] = 1;\n    reached = reached + 1;\n    queue.push(node - 1);\n    queue.push(node + 1);\n  }\n  return reached;\n}",
    },
    args: [[0, 1, 1, 0, 1, 1, 0, 0]],
    caption: "Breadth-first over a row of cells: 1 is passable, 0 is a wall. Watch the frontier expand outward rather than diving deep.",
  },

  complexity: {
    time: "O(V + E) for either traversal",
    space: "O(V) for the visited set, plus the stack or queue",
    note: "Every node and edge is examined at most once \u2014 but only because of the visited set. Without it, a single cycle makes the traversal infinite.",
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
