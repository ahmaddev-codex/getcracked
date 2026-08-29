import type { LessonInput } from '../schema';

export const graphsLesson: LessonInput = {
  tier: 'lesson',
  slug: "graphs",
  order: 9,
  title: "Graphs",
  summary: "Nodes, edges, and not visiting anything twice.",

  explainer: "A graph is nodes joined by edges. Trees are the special case with no cycles;\nthe general case is where the visited set becomes mandatory, because without it a\ncycle means traversal never terminates.\n\nRepresentation matters more than it first appears. An **adjacency list** \u2014 each\nnode mapped to its neighbours \u2014 is O(V + E) space and iterating a node's\nneighbours is proportional to how many it has. An **adjacency matrix** is O(V\u00b2)\nregardless of edge count, but answers \"is there an edge?\" in constant time. Sparse\ngraphs, which is most real ones, want the list.\n\nThe two traversals answer different questions:\n\n- **Depth-first** goes as deep as possible before backtracking. Natural\n  recursively. Good for connectivity, cycle detection, topological order.\n- **Breadth-first** explores by distance from the start. Needs a queue. It is the\n  only one of the two that finds the **shortest path** in an unweighted graph,\n  because it reaches every node in order of distance.\n\nReaching for DFS when the question asks for a shortest path is the single most\ncommon graph mistake.",

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
