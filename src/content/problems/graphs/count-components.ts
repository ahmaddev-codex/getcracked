import type { ProblemInput } from '../../schema';

export const countComponents: ProblemInput = {
  tier: 'problem',
  slug: "count-components",
  topic: "graphs",
  difficulty: "medium",
  title: "Count Connected Components",
  companies: ["Amazon", "Google"],
  recommendedAfter: ["graphs"],

  brief: "`graph` maps each node to its neighbours. Return how many connected components it has.\n\n```\ncountComponents({ \"a\": [\"b\"], \"b\": [\"a\"], \"c\": [] })  ->  2\n```",

  hints: [
    "Start a traversal from every node you have not already visited. Each new start is one component.",
    "Mark nodes visited as you reach them, or a cycle will loop forever.",
    "Depth-first or breadth-first \u2014 either works, since you only care what is reachable, not how far.",
  ],

  starterCode: {
    javascript: "function countComponents(graph) {\n  // TODO: number of connected components.\n  return 0;\n}",
    python: "def count_components(graph):\n    # TODO: number of connected components.\n    return 0",
  },

  referenceSolution: {
    javascript: "function countComponents(graph) {\n  const visited = {};\n  let components = 0;\n  for (const start of Object.keys(graph)) {\n    if (visited[start]) continue;\n    components++;\n    const stack = [start];\n    while (stack.length > 0) {\n      const node = stack.pop();\n      if (visited[node]) continue;\n      visited[node] = true;\n      for (const next of graph[node] || []) {\n        if (!visited[next]) stack.push(next);\n      }\n    }\n  }\n  return components;\n}",
    python: "def count_components(graph):\n    visited = {}\n    components = 0\n    for start in graph.keys():\n        if visited.get(start):\n            continue\n        components += 1\n        stack = [start]\n        while stack:\n            node = stack.pop()\n            if visited.get(node):\n                continue\n            visited[node] = True\n            for nxt in graph.get(node, []):\n                if not visited.get(nxt):\n                    stack.append(nxt)\n    return components",
  },

  complexity: {
    time: "O(V + E)",
    space: "O(V)",
    note: "Every node and edge is examined once. The visited set is what makes that true \u2014 without it a cycle never terminates.",
  },

  testSpec: {
    entry: "countComponents",
    entryByLanguage: { python: "count_components" },
    cases: [
        { name: "two components", args: [{"a": ["b"], "b": ["a"], "c": []}], expected: 2 },
        { name: "one component", args: [{"a": ["b"], "b": ["a", "c"], "c": ["b"]}], expected: 1 },
        { name: "empty graph", args: [{}], expected: 0 },
        { name: "all isolated", args: [{"a": [], "b": [], "c": []}], expected: 3, hidden: true },
    ],
  },
};
