/**
 * Comprehensive Data Structure Simulation & Spatial Motion Engine.
 *
 * Simulates micro-step execution traces with real coordinate physics,
 * motion vectors, pointer labels, and algorithmic code line tracking for:
 *
 * 1. Arrays (Static, Dynamic Array with Doubling, Circular Buffer)
 * 2. Linked Lists (Singly, Doubly with prev/next, Circular)
 * 3. Stacks (Array LIFO, Linked Stack)
 * 4. Queues & Deques (FIFO, Double-ended Deque, Circular Queue)
 * 5. Trees (Binary Search Tree, Trie Prefix Tree, AVL Rotation)
 * 6. Heaps (Min Heap, Max Heap)
 * 7. Hash Tables (Separate Chaining with Buckets, Linear Probing)
 * 8. Graphs (Directed, Undirected, Weighted Adjacency Network)
 */

export type DataStructureCategory = 'foundations' | 'linear' | 'trees' | 'advanced';

export type DataStructureType =
  | 'array'
  | 'linked-list'
  | 'stack'
  | 'queue'
  | 'binary-search-tree'
  | 'min-heap'
  | 'hash-map'
  | 'graph';

export interface DataStructureSubType {
  id: string;
  name: string;
  description: string;
}

export interface DataStructureMeta {
  id: DataStructureType;
  name: string;
  category: DataStructureCategory;
  summary: string;
  subTypes: DataStructureSubType[];
  operations: string[];
  codeSnippets: Record<string, string>;
}

export const DATA_STRUCTURE_REGISTRY: DataStructureMeta[] = [
  {
    id: 'array',
    name: 'Array & Dynamic Buffer',
    category: 'foundations',
    summary: 'Contiguous memory slots with O(1) indexed random access and linear shifting.',
    subTypes: [
      { id: 'dynamic', name: 'Dynamic Array (ArrayList / Vector)', description: 'Automatically doubles capacity when full' },
      { id: 'static', name: 'Static Fixed Array', description: 'Fixed allocated capacity buffer' },
      { id: 'circular', name: 'Circular Ring Buffer', description: 'Head and tail wrap around modulo capacity' },
    ],
    operations: ['Push (Append)', 'Pop (Remove Last)', 'Insert at Index', 'Delete at Index', 'Two-Pointer Reverse', 'Linear Search'],
    codeSnippets: {
      'Push (Append)': `function push(arr, val) {\n  // Check capacity & append\n  arr[arr.length] = val;\n  return arr.length;\n}`,
      'Pop (Remove Last)': `function pop(arr) {\n  if (arr.length === 0) return undefined;\n  const val = arr[arr.length - 1];\n  arr.length--;\n  return val;\n}`,
      'Insert at Index': `function insertAt(arr, index, val) {\n  for (let i = arr.length; i > index; i--) {\n    arr[i] = arr[i - 1]; // Shift right\n  }\n  arr[index] = val;\n}`,
      'Delete at Index': `function deleteAt(arr, index) {\n  const removed = arr[index];\n  for (let i = index; i < arr.length - 1; i++) {\n    arr[i] = arr[i + 1]; // Shift left\n  }\n  arr.length--;\n  return removed;\n}`,
      'Two-Pointer Reverse': `function reverse(arr) {\n  let left = 0, right = arr.length - 1;\n  while (left < right) {\n    [arr[left], arr[right]] = [arr[right], arr[left]];\n    left++; right--;\n  }\n}`,
      'Linear Search': `function search(arr, target) {\n  for (let i = 0; i < arr.length; i++) {\n    if (arr[i] === target) return i;\n  }\n  return -1;\n}`,
    },
  },
  {
    id: 'linked-list',
    name: 'Linked Lists',
    category: 'linear',
    summary: 'Nodes dispersed in memory connected via directional pointers.',
    subTypes: [
      { id: 'singly', name: 'Singly Linked List', description: 'Nodes with next pointer references' },
      { id: 'doubly', name: 'Doubly Linked List', description: 'Nodes with both prev and next pointer references' },
      { id: 'circular', name: 'Circular Linked List', description: 'Tail next pointer loops back to head' },
    ],
    operations: ['Insert Head', 'Insert Tail', 'Insert at Index', 'Delete Value', 'Reverse (In-Place)', 'Search'],
    codeSnippets: {
      'Insert Head': `function insertHead(val) {\n  const node = new ListNode(val);\n  node.next = head;\n  head = node;\n}`,
      'Insert Tail': `function insertTail(val) {\n  const node = new ListNode(val);\n  let curr = head;\n  while (curr.next) curr = curr.next;\n  curr.next = node;\n}`,
      'Insert at Index': `function insertAt(index, val) {\n  let curr = head;\n  for (let i = 0; i < index - 1; i++) curr = curr.next;\n  const node = new ListNode(val);\n  node.next = curr.next;\n  curr.next = node;\n}`,
      'Delete Value': `function deleteVal(val) {\n  let prev = null, curr = head;\n  while (curr && curr.val !== val) {\n    prev = curr; curr = curr.next;\n  }\n  if (prev && curr) prev.next = curr.next;\n}`,
      'Reverse (In-Place)': `function reverseList(head) {\n  let prev = null, curr = head;\n  while (curr) {\n    let next = curr.next;\n    curr.next = prev;\n    prev = curr; curr = next;\n  }\n  return prev;\n}`,
      'Search': `function search(val) {\n  let curr = head;\n  while (curr) {\n    if (curr.val === val) return curr;\n    curr = curr.next;\n  }\n  return null;\n}`,
    },
  },
  {
    id: 'stack',
    name: 'Stack (LIFO)',
    category: 'linear',
    summary: 'Last-In, First-Out collection supporting constant-time push and pop from top.',
    subTypes: [
      { id: 'array-stack', name: 'Array Stack', description: 'Contiguous buffer with top index pointer' },
      { id: 'linked-stack', name: 'Linked Stack', description: 'Linked list nodes pushed to head' },
    ],
    operations: ['Push', 'Pop', 'Peek', 'Clear'],
    codeSnippets: {
      'Push': `function push(stack, val) {\n  // Place element on top\n  stack.push(val);\n}`,
      'Pop': `function pop(stack) {\n  if (stack.length === 0) return null;\n  return stack.pop();\n}`,
      'Peek': `function peek(stack) {\n  return stack[stack.length - 1];\n}`,
      'Clear': `function clear(stack) {\n  stack.length = 0;\n}`,
    },
  },
  {
    id: 'queue',
    name: 'Queue & Deque',
    category: 'linear',
    summary: 'First-In, First-Out sequences where elements enter at rear and leave at front.',
    subTypes: [
      { id: 'fifo', name: 'FIFO Queue', description: 'Standard enqueue at back, dequeue from front' },
      { id: 'deque', name: 'Double-Ended Queue (Deque)', description: 'Insert and remove from both ends in O(1)' },
      { id: 'circular-queue', name: 'Circular Buffer Queue', description: 'Fixed size array with wrapping modulo index' },
    ],
    operations: ['Enqueue (Rear)', 'Dequeue (Front)', 'Push Front (Deque)', 'Pop Back (Deque)', 'Peek Front'],
    codeSnippets: {
      'Enqueue (Rear)': `function enqueue(val) {\n  queue.push(val);\n  rear = (rear + 1) % capacity;\n}`,
      'Dequeue (Front)': `function dequeue() {\n  const val = queue.shift();\n  front = (front + 1) % capacity;\n  return val;\n}`,
      'Push Front (Deque)': `function pushFront(val) {\n  deque.unshift(val);\n}`,
      'Pop Back (Deque)': `function popBack() {\n  return deque.pop();\n}`,
      'Peek Front': `function peek() {\n  return queue[0];\n}`,
    },
  },
  {
    id: 'binary-search-tree',
    name: 'Binary Search Tree & Trie',
    category: 'trees',
    summary: 'Hierarchical branching structures where ordered invariants yield logarithmic operations.',
    subTypes: [
      { id: 'bst', name: 'Binary Search Tree (BST)', description: 'Left child < Parent <= Right child' },
      { id: 'trie', name: 'Trie (Prefix Tree)', description: 'Tree of character nodes for fast string search' },
      { id: 'avl', name: 'Balanced AVL Tree', description: 'Self-balancing BST with height rotations' },
    ],
    operations: ['Insert', 'Search', 'In-Order Traversal', 'Pre-Order Traversal', 'Delete Node'],
    codeSnippets: {
      'Insert': `function insert(root, val) {\n  if (!root) return new TreeNode(val);\n  if (val < root.val) root.left = insert(root.left, val);\n  else root.right = insert(root.right, val);\n  return root;\n}`,
      'Search': `function search(root, target) {\n  if (!root || root.val === target) return root;\n  if (target < root.val) return search(root.left, target);\n  return search(root.right, target);\n}`,
      'In-Order Traversal': `function inOrder(node, res = []) {\n  if (!node) return res;\n  inOrder(node.left, res);\n  res.push(node.val);\n  inOrder(node.right, res);\n  return res;\n}`,
      'Pre-Order Traversal': `function preOrder(node, res = []) {\n  if (!node) return res;\n  res.push(node.val);\n  preOrder(node.left, res);\n  preOrder(node.right, res);\n  return res;\n}`,
      'Delete Node': `function deleteNode(root, key) {\n  if (!root) return null;\n  if (key < root.val) root.left = deleteNode(root.left, key);\n  else if (key > root.val) root.right = deleteNode(root.right, key);\n  else {\n    // Node found: handle 0, 1, or 2 children\n    if (!root.left) return root.right;\n    if (!root.right) return root.left;\n    let successor = findMin(root.right);\n    root.val = successor.val;\n    root.right = deleteNode(root.right, successor.val);\n  }\n  return root;\n}`,
    },
  },
  {
    id: 'min-heap',
    name: 'Binary Heap (Priority Queue)',
    category: 'trees',
    summary: 'Complete binary tree where parent is always smaller/larger than children; mapped to contiguous array.',
    subTypes: [
      { id: 'min-heap', name: 'Min Heap', description: 'Parent <= Children; root holds smallest item' },
      { id: 'max-heap', name: 'Max Heap', description: 'Parent >= Children; root holds largest item' },
    ],
    operations: ['Insert (Bubble-Up)', 'Extract Root (Sift-Down)', 'Peek Root', 'Heapify Array'],
    codeSnippets: {
      'Insert (Bubble-Up)': `function insert(heap, val) {\n  heap.push(val);\n  let i = heap.length - 1;\n  while (i > 0) {\n    let p = Math.floor((i - 1) / 2);\n    if (heap[i] < heap[p]) {\n      [heap[i], heap[p]] = [heap[p], heap[i]];\n      i = p;\n    } else break;\n  }\n}`,
      'Extract Root (Sift-Down)': `function extractMin(heap) {\n  const min = heap[0];\n  heap[0] = heap.pop();\n  let i = 0;\n  while (2 * i + 1 < heap.length) {\n    let small = 2 * i + 1;\n    if (small + 1 < heap.length && heap[small + 1] < heap[small]) small++;\n    if (heap[small] < heap[i]) {\n      [heap[i], heap[small]] = [heap[small], heap[i]];\n      i = small;\n    } else break;\n  }\n  return min;\n}`,
      'Peek Root': `function peek(heap) {\n  return heap[0];\n}`,
      'Heapify Array': `function heapify(arr) {\n  for (let i = Math.floor(arr.length / 2); i >= 0; i--) {\n    siftDown(arr, i);\n  }\n}`,
    },
  },
  {
    id: 'hash-map',
    name: 'Hash Table & Map',
    category: 'advanced',
    summary: 'Key-value map computing hash indices over bucket slots with collision resolution.',
    subTypes: [
      { id: 'chaining', name: 'Separate Chaining (Linked Buckets)', description: 'Buckets store linked list chains for collisions' },
      { id: 'open-addressing', name: 'Open Addressing (Linear Probing)', description: 'Collisions search sequential contiguous slots' },
    ],
    operations: ['Put (Insert / Update)', 'Get (Search)', 'Remove (Delete)', 'Rehash / Resize'],
    codeSnippets: {
      'Put (Insert / Update)': `function put(key, val) {\n  const idx = hash(key) % BUCKET_COUNT;\n  let entry = buckets[idx].find(e => e.key === key);\n  if (entry) entry.val = val;\n  else buckets[idx].push({ key, val });\n}`,
      'Get (Search)': `function get(key) {\n  const idx = hash(key) % BUCKET_COUNT;\n  const entry = buckets[idx].find(e => e.key === key);\n  return entry ? entry.val : undefined;\n}`,
      'Remove (Delete)': `function remove(key) {\n  const idx = hash(key) % BUCKET_COUNT;\n  const i = buckets[idx].findIndex(e => e.key === key);\n  if (i !== -1) buckets[idx].splice(i, 1);\n}`,
      'Rehash / Resize': `function rehash() {\n  const old = buckets;\n  buckets = Array.from({ length: old.length * 2 }, () => []);\n  for (const b of old) for (const e of b) put(e.key, e.val);\n}`,
    },
  },
  {
    id: 'graph',
    name: 'Graph Network',
    category: 'advanced',
    summary: 'Vertices connected by edges representing networks, dependencies, or spatial maps.',
    subTypes: [
      { id: 'undirected', name: 'Undirected Graph', description: 'Bidirectional edges connecting vertices' },
      { id: 'directed', name: 'Directed Graph (DAG)', description: 'One-way arrows from source to target' },
      { id: 'weighted', name: 'Weighted Network', description: 'Edges carry cost / latency values' },
    ],
    operations: ['Breadth-First Search (BFS)', 'Depth-First Search (DFS)', 'Add Vertex', 'Add Edge', 'Shortest Path (Dijkstra)'],
    codeSnippets: {
      'Breadth-First Search (BFS)': `function bfs(graph, start) {\n  const visited = new Set([start]);\n  const queue = [start];\n  while (queue.length > 0) {\n    const u = queue.shift();\n    for (const v of graph[u]) {\n      if (!visited.has(v)) {\n        visited.add(v);\n        queue.push(v);\n      }\n    }\n  }\n}`,
      'Depth-First Search (DFS)': `function dfs(graph, u, visited = new Set()) {\n  visited.add(u);\n  for (const v of graph[u]) {\n    if (!visited.has(v)) dfs(graph, v, visited);\n  }\n}`,
      'Add Vertex': `function addVertex(graph, v) {\n  if (!graph[v]) graph[v] = [];\n}`,
      'Add Edge': `function addEdge(graph, u, v) {\n  graph[u].push(v);\n  graph[v].push(u);\n}`,
      'Shortest Path (Dijkstra)': `function dijkstra(graph, start) {\n  const dist = { [start]: 0 };\n  const pq = new PriorityQueue();\n  pq.push(start, 0);\n  while (!pq.isEmpty()) {\n    const [u, d] = pq.pop();\n    for (const [v, w] of graph[u]) {\n      if (d + w < (dist[v] ?? Infinity)) {\n        dist[v] = d + w;\n        pq.push(v, dist[v]);\n      }\n    }\n  }\n}`,
    },
  },
];

export interface SpatialMotion {
  type:
    | 'lift'
    | 'translate'
    | 'drop'
    | 'shift'
    | 'swap'
    | 'pulse'
    | 'pointer_move'
    | 'link'
    | 'slide-out'
    | 'branch-swap';
  fromIndex?: number;
  toIndex?: number;
  fromCoords?: { x: number; y: number };
  toCoords?: { x: number; y: number };
  nodeId?: string;
  targetNodeId?: string;
}

export interface VisualStep {
  id: string;
  stepIndex: number;
  totalSteps: number;
  title: string;
  description: string;
  highlightIndices?: number[];
  highlightNodeIds?: string[];
  pointers?: Record<string, string | number>;
  actionType: 'read' | 'write' | 'compare' | 'swap' | 'shift' | 'done' | 'error';
  complexity: string;
  codeSnippet: string;
  codeLine?: number; // 1-indexed line in canonical snippet
  motion?: SpatialMotion;
  state: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 1. ARRAY SIMULATION WITH PHYSICAL MOTION
// ---------------------------------------------------------------------------
export function simulateArray(
  initialArray: number[],
  operation: string,
  params: { value?: number; index?: number } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  const arr = [...initialArray];
  let stepCounter = 0;

  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    codeLine: number,
    highlights: number[] = [],
    pointers: Record<string, number> = {},
    motion?: SpatialMotion,
  ) => {
    stepCounter++;
    steps.push({
      id: `arr-${stepCounter}`,
      stepIndex: stepCounter,
      totalSteps: 0,
      title,
      description: desc,
      actionType: action,
      complexity,
      codeSnippet: code,
      codeLine,
      highlightIndices: highlights,
      pointers,
      motion,
      state: { array: [...arr] },
    });
  };

  if (operation.includes('Push')) {
    const val = params.value ?? 42;
    pushStep('Allocate Capacity', `Preparing to append ${val} to array end at index ${arr.length}.`, 'read', 'O(1) amortized', `arr[arr.length] = ${val};`, 2, [], { target: arr.length }, { type: 'lift', toIndex: arr.length });
    arr.push(val);
    pushStep('Insert at End', `Placed ${val} at index ${arr.length - 1}. Array length expanded to ${arr.length}.`, 'write', 'O(1) amortized', `arr[${arr.length - 1}] = ${val};`, 3, [arr.length - 1], { length: arr.length }, { type: 'drop', toIndex: arr.length - 1 });
  } else if (operation.includes('Pop')) {
    if (arr.length === 0) {
      pushStep('Underflow Error', 'Cannot pop from an empty array buffer.', 'error', 'O(1)', 'return undefined;', 2);
    } else {
      const idx = arr.length - 1;
      const popped = arr[idx];
      pushStep('Inspect Last Element', `Reading element ${popped} at index ${idx}.`, 'read', 'O(1)', `const val = arr[${idx}];`, 3, [idx], { top: idx }, { type: 'lift', fromIndex: idx });
      arr.pop();
      pushStep('Element Removed', `Popped ${popped}. Array resized to ${arr.length} elements.`, 'done', 'O(1)', 'return val;', 5, [], {}, { type: 'drop', fromIndex: idx });
    }
  } else if (operation.includes('Insert at Index')) {
    const targetIdx = Math.max(0, Math.min(params.index ?? 1, arr.length));
    const val = params.value ?? 99;
    pushStep('Open Slot at Index', `Need to place ${val} at index ${targetIdx}. Elements from ${targetIdx} to ${arr.length - 1} will shift right.`, 'read', 'O(n)', `// Insert ${val} at index ${targetIdx}`, 1, [targetIdx], { target: targetIdx }, { type: 'lift', fromIndex: targetIdx });

    arr.push(0);
    for (let i = arr.length - 1; i > targetIdx; i--) {
      arr[i] = arr[i - 1];
      pushStep('Shift Element Right', `Shifted element (${arr[i]}) from index ${i - 1} to index ${i}.`, 'shift', 'O(n)', `arr[${i}] = arr[${i - 1}];`, 3, [i - 1, i], { from: i - 1, to: i }, { type: 'shift', fromIndex: i - 1, toIndex: i });
    }
    arr[targetIdx] = val;
    pushStep('Drop New Value', `Placed ${val} directly into vacated index ${targetIdx}.`, 'write', 'O(1)', `arr[${targetIdx}] = ${val};`, 5, [targetIdx], { index: targetIdx }, { type: 'drop', toIndex: targetIdx });
  } else if (operation.includes('Delete at Index')) {
    const targetIdx = Math.max(0, Math.min(params.index ?? 1, arr.length - 1));
    if (arr.length === 0) {
      pushStep('Empty Buffer', 'Array is empty.', 'error', 'O(1)', 'return undefined;', 2);
    } else {
      const removed = arr[targetIdx];
      pushStep('Lift Target for Removal', `Lifting element ${removed} at index ${targetIdx}. Sibling elements will shift left.`, 'read', 'O(n)', `const removed = arr[${targetIdx}];`, 2, [targetIdx], { target: targetIdx }, { type: 'lift', fromIndex: targetIdx });
      for (let i = targetIdx; i < arr.length - 1; i++) {
        arr[i] = arr[i + 1];
        pushStep('Shift Element Left', `Shifted element (${arr[i]}) from index ${i + 1} to index ${i}.`, 'shift', 'O(n)', `arr[${i}] = arr[${i + 1}];`, 4, [i, i + 1], { index: i }, { type: 'shift', fromIndex: i + 1, toIndex: i });
      }
      arr.pop();
      pushStep('Deletion Complete', `Finished shift. Deleted value was ${removed}. Remaining count: ${arr.length}.`, 'done', 'O(n)', 'return removed;', 7, [], {});
    }
  } else if (operation.toLowerCase().includes('reverse')) {
    let left = 0;
    let right = arr.length - 1;
    pushStep('Position Pointers', `Left pointer at index 0 (${arr[left]}), Right pointer at index ${right} (${arr[right]}).`, 'read', 'O(n)', 'let left = 0, right = arr.length - 1;', 2, [left, right], { left, right }, { type: 'pointer_move', fromIndex: left, toIndex: right });
    while (left < right) {
      pushStep(
        'Lift & Cross Over',
        `Swapping arr[${left}] (${arr[left]}) and arr[${right}] (${arr[right]}). Both elements lift into the air and travel along opposite arcs to each other's slot.`,
        'swap',
        'O(n)',
        `[arr[${left}], arr[${right}]] = [arr[${right}], arr[${left}]];`,
        4,
        [left, right],
        { left, right },
        { type: 'swap', fromIndex: left, toIndex: right },
      );
      const temp = arr[left];
      arr[left] = arr[right];
      arr[right] = temp;
      pushStep(
        'Landed in Swapped Slots',
        `Completed swap: arr[${left}] is now ${arr[left]}, and arr[${right}] is now ${arr[right]}.`,
        'write',
        'O(1)',
        `// Landed: arr[${left}]=${arr[left]}, arr[${right}]=${arr[right]}`,
        4,
        [left, right],
        { left, right },
        { type: 'drop', toIndex: left },
      );
      left++;
      right--;
      pushStep('Advance Pointers Inward', `Moved left to ${left} and right to ${right}.`, 'read', 'O(n)', 'left++; right--;', 5, left <= right ? [left, right] : [], { left, right });
    }
    pushStep('Reversal Complete', 'Array successfully reversed in-place with O(1) space.', 'done', 'O(n)', '// Reversal finished', 7, []);
  } else if (operation.includes('Linear Search')) {
    const target = params.value ?? 30;
    pushStep('Start Search at 0', `Scanning array for target ${target} from index 0.`, 'read', 'O(n)', 'for (let i = 0; i < arr.length; i++)', 2, [0], { i: 0 });
    let found = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === target) {
        pushStep('Target Found!', `Match confirmed! Value ${target} found at index ${i}.`, 'done', 'O(n)', `return ${i};`, 3, [i], { found: i }, { type: 'pulse', fromIndex: i });
        found = true;
        break;
      } else {
        pushStep('Compare & Increment', `arr[${i}] = ${arr[i]} != ${target}. Advancing pointer.`, 'compare', 'O(n)', 'i++;', 2, [i], { i });
      }
    }
    if (!found) {
      pushStep('Target Not Found', `Scanned entire array. Value ${target} does not exist.`, 'done', 'O(n)', 'return -1;', 5, []);
    }
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 2. LINKED LIST SIMULATION (SINGLY & DOUBLY)
// ---------------------------------------------------------------------------
export interface ListNodeState {
  id: string;
  value: number;
  nextId: string | null;
  prevId?: string | null;
}

export function simulateLinkedList(
  initialValues: number[],
  operation: string,
  params: { value?: number } = {},
  isDoubly = false,
): VisualStep[] {
  const steps: VisualStep[] = [];
  let nodes: ListNodeState[] = initialValues.map((v, i) => ({
    id: `node-${i}`,
    value: v,
    nextId: i < initialValues.length - 1 ? `node-${i + 1}` : null,
    prevId: isDoubly && i > 0 ? `node-${i - 1}` : null,
  }));

  let stepCounter = 0;
  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    codeLine: number,
    highlightIds: string[] = [],
    pointers: Record<string, string> = {},
    motion?: SpatialMotion,
  ) => {
    stepCounter++;
    steps.push({
      id: `ll-${stepCounter}`,
      stepIndex: stepCounter,
      totalSteps: 0,
      title,
      description: desc,
      actionType: action,
      complexity,
      codeSnippet: code,
      codeLine,
      highlightNodeIds: highlightIds,
      pointers,
      motion,
      state: { nodes: JSON.parse(JSON.stringify(nodes)), isDoubly },
    });
  };

  if (operation.includes('Insert Head')) {
    const val = params.value ?? 5;
    const newId = `node-${Date.now()}`;
    const headId = nodes[0]?.id ?? null;
    pushStep('Allocate Node', `Created new ListNode with value ${val}.`, 'write', 'O(1)', `const node = new ListNode(${val});`, 2, [], { newNode: newId }, { type: 'lift', nodeId: newId });
    nodes = [{ id: newId, value: val, nextId: headId, prevId: null }, ...nodes];
    if (isDoubly && nodes[1]) nodes[1].prevId = newId;
    pushStep('Link as New Head', `Pointed newNode.next to former head (${headId ?? 'null'}). Updated head pointer.`, 'write', 'O(1)', 'node.next = head; head = node;', 3, [newId], { head: newId }, { type: 'link', nodeId: newId, targetNodeId: headId ?? undefined });
  } else if (operation.includes('Insert Tail')) {
    const val = params.value ?? 88;
    const newId = `node-${Date.now()}`;
    if (nodes.length === 0) {
      nodes = [{ id: newId, value: val, nextId: null, prevId: null }];
      pushStep('Initialize Head', `List empty. New node ${val} is now head and tail.`, 'write', 'O(1)', 'head = node;', 2, [newId], { head: newId });
    } else {
      pushStep('Traverse toward Tail', `Starting at head (${nodes[0].value}) and traversing next pointers.`, 'read', 'O(n)', 'let curr = head; while (curr.next) curr = curr.next;', 4, [nodes[0].id], { curr: nodes[0].id });
      const last = nodes[nodes.length - 1];
      last.nextId = newId;
      nodes.push({ id: newId, value: val, nextId: null, prevId: isDoubly ? last.id : null });
      pushStep('Connect Tail Pointer', `Linked last node (${last.value}).next to new node ${val}.`, 'write', 'O(1)', 'curr.next = node;', 5, [last.id, newId], { tail: newId }, { type: 'link', nodeId: last.id, targetNodeId: newId });
    }
  } else if (operation.includes('Reverse')) {
    pushStep('Initialize Three Pointers', 'Setting prev = null, curr = head.', 'read', 'O(n)', 'let prev = null, curr = head;', 2, nodes[0] ? [nodes[0].id] : [], nodes[0] ? { curr: nodes[0].id } : {});
    const reversed: ListNodeState[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const curr = nodes[i];
      const nextId = nodes[i + 1]?.id ?? null;
      pushStep('Invert Directional Link', `Reversed ${curr.value}'s next pointer to point backward.`, 'write', 'O(n)', 'curr.next = prev; prev = curr; curr = next;', 5, [curr.id], { curr: curr.id, next: nextId ?? 'null' }, { type: 'link', nodeId: curr.id });
      reversed.unshift({
        id: curr.id,
        value: curr.value,
        nextId: reversed[0]?.id ?? null,
      });
    }
    nodes = reversed;
    pushStep('Reversal Finished', `Single O(n) pass complete. Head is now ${nodes[0]?.value ?? 'null'}.`, 'done', 'O(n)', 'return prev;', 8, nodes[0] ? [nodes[0].id] : [], nodes[0] ? { head: nodes[0].id } : {});
  } else if (operation.includes('Search')) {
    const target = params.value ?? 20;
    pushStep('Start Search at Head', `Traversing linked chain searching for value ${target}.`, 'read', 'O(n)', 'let curr = head;', 2, nodes[0] ? [nodes[0].id] : [], nodes[0] ? { curr: nodes[0].id } : {});
    let found = false;
    for (const node of nodes) {
      if (node.value === target) {
        pushStep('Target Located!', `Found node with matching value ${target}!`, 'done', 'O(n)', 'return curr;', 4, [node.id], { found: node.id }, { type: 'pulse', nodeId: node.id });
        found = true;
        break;
      } else {
        pushStep('Advance to Next Node', `Node ${node.value} != ${target}. Following pointer to next node.`, 'compare', 'O(n)', 'curr = curr.next;', 5, [node.id], { curr: node.id });
      }
    }
    if (!found) {
      pushStep('Reached Null', `Reached end of linked list. Value ${target} not found.`, 'done', 'O(n)', 'return null;', 7, []);
    }
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 3. STACK & QUEUE SIMULATION WITH VERTICAL DROP & SLIDE
// ---------------------------------------------------------------------------
export function simulateStack(
  initialValues: number[],
  operation: string,
  params: { value?: number } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  const items = [...initialValues];
  let stepCounter = 0;

  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    codeLine: number,
    highlights: number[] = [],
    pointers: Record<string, number> = {},
    motion?: SpatialMotion,
  ) => {
    stepCounter++;
    steps.push({
      id: `stack-${stepCounter}`,
      stepIndex: stepCounter,
      totalSteps: 0,
      title,
      description: desc,
      actionType: action,
      complexity,
      codeSnippet: code,
      codeLine,
      highlightIndices: highlights,
      pointers,
      motion,
      state: { items: [...items] },
    });
  };

  if (operation.includes('Push')) {
    const val = params.value ?? 50;
    pushStep('Elevate Element Over Chamber', `Positioning ${val} directly above top of stack.`, 'write', 'O(1)', `stack.push(${val});`, 2, [], { top: items.length }, { type: 'lift', toIndex: items.length });
    items.push(val);
    pushStep('Drop into Stack Chamber', `Element ${val} drops down and settles as the new top element.`, 'done', 'O(1)', '// Top index updated', 3, [items.length - 1], { top: items.length - 1 }, { type: 'drop', toIndex: items.length - 1 });
  } else if (operation.includes('Pop')) {
    if (items.length === 0) {
      pushStep('Stack Underflow', 'Cannot pop from an empty stack.', 'error', 'O(1)', 'return null;', 2);
    } else {
      const topIdx = items.length - 1;
      const popped = items[topIdx];
      pushStep('Elevate Top Element', `Lifting element ${popped} out of stack top.`, 'read', 'O(1)', `const val = stack.pop();`, 3, [topIdx], { top: topIdx }, { type: 'lift', fromIndex: topIdx });
      items.pop();
      pushStep('Popped Off', `Removed ${popped}. Height is now ${items.length}.`, 'done', 'O(1)', 'return val;', 3, [], items.length > 0 ? { top: items.length - 1 } : {});
    }
  } else if (operation.includes('Peek')) {
    if (items.length === 0) {
      pushStep('Empty Stack', 'No items in stack.', 'read', 'O(1)', 'return null;', 2);
    } else {
      const topIdx = items.length - 1;
      pushStep('Inspect Top Element', `Top item is ${items[topIdx]} at index ${topIdx}.`, 'read', 'O(1)', `return stack[stack.length - 1];`, 2, [topIdx], { top: topIdx }, { type: 'pulse', fromIndex: topIdx });
    }
  } else if (operation.includes('Clear')) {
    items.length = 0;
    pushStep('Clear Stack', 'Reset stack chamber to empty.', 'done', 'O(1)', 'stack.length = 0;', 2, []);
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

export function simulateQueue(
  initialValues: number[],
  operation: string,
  params: { value?: number } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  const items = [...initialValues];
  let stepCounter = 0;

  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    codeLine: number,
    highlights: number[] = [],
    pointers: Record<string, number> = {},
    motion?: SpatialMotion,
  ) => {
    stepCounter++;
    steps.push({
      id: `queue-${stepCounter}`,
      stepIndex: stepCounter,
      totalSteps: 0,
      title,
      description: desc,
      actionType: action,
      complexity,
      codeSnippet: code,
      codeLine,
      highlightIndices: highlights,
      pointers,
      motion,
      state: { items: [...items] },
    });
  };

  if (operation.includes('Enqueue')) {
    const val = params.value ?? 77;
    pushStep('Enter Conveyor Pipeline', `Element ${val} slides into queue rear from the right.`, 'write', 'O(1)', `queue.push(${val});`, 2, [], { rear: items.length }, { type: 'slide-out', toIndex: items.length });
    items.push(val);
    pushStep('Enqueued at Rear', `Element ${val} docked at rear. Queue size: ${items.length}.`, 'done', 'O(1)', '// Rear advanced', 3, [items.length - 1], { front: 0, rear: items.length - 1 });
  } else if (operation.includes('Dequeue')) {
    if (items.length === 0) {
      pushStep('Queue Underflow', 'Cannot dequeue from empty queue.', 'error', 'O(1)', 'return null;', 2);
    } else {
      const val = items[0];
      pushStep('Slide out from Front', `Removing element ${val} through front exit on left.`, 'read', 'O(1)', `const val = queue.shift();`, 2, [0], { front: 0 }, { type: 'slide-out', fromIndex: 0 });
      items.shift();
      pushStep('Dequeued Successfully', `Element ${val} exited. Sibling elements advance toward front.`, 'done', 'O(1)', 'return val;', 4, [], items.length > 0 ? { front: 0, rear: items.length - 1 } : {});
    }
  } else if (operation.includes('Push Front')) {
    const val = params.value ?? 99;
    items.unshift(val);
    pushStep('Deque Push Front', `Inserted ${val} at front of Double-Ended Queue.`, 'write', 'O(1)', `deque.unshift(${val});`, 2, [0], { front: 0 });
  } else if (operation.includes('Pop Back')) {
    if (items.length === 0) {
      pushStep('Deque Empty', 'Deque has no elements.', 'error', 'O(1)', 'return null;', 2);
    } else {
      const val = items.pop()!;
      pushStep('Deque Pop Back', `Popped ${val} from rear of Double-Ended Queue.`, 'done', 'O(1)', 'return deque.pop();', 2, [], {});
    }
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 4. TREE SIMULATION WITH REAL 2D COORDINATES (BST)
// ---------------------------------------------------------------------------
export interface TreeNode {
  id: string;
  value: number;
  leftId: string | null;
  rightId: string | null;
  x: number; // percentage (10 to 90)
  y: number; // percentage (10 to 90)
}

export function simulateBST(
  initialValues: number[],
  operation: string,
  params: { value?: number } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  const nodesMap = new Map<string, TreeNode>();
  let rootId: string | null = null;

  // Compute 2D coordinates for visual layout
  const layoutTree = () => {
    if (!rootId) return;
    const assignCoords = (id: string | null, x: number, y: number, spread: number) => {
      if (!id) return;
      const node = nodesMap.get(id);
      if (!node) return;
      node.x = x;
      node.y = y;
      if (node.leftId) assignCoords(node.leftId, x - spread, y + 22, spread / 2);
      if (node.rightId) assignCoords(node.rightId, x + spread, y + 22, spread / 2);
    };
    assignCoords(rootId, 50, 15, 24);
  };

  const insertNode = (val: number): string => {
    const id = `node-${val}`;
    const newNode: TreeNode = { id, value: val, leftId: null, rightId: null, x: 50, y: 15 };
    nodesMap.set(id, newNode);
    if (!rootId) {
      rootId = id;
      layoutTree();
      return id;
    }
    let curr = nodesMap.get(rootId)!;
    while (true) {
      if (val < curr.value) {
        if (!curr.leftId) {
          curr.leftId = id;
          break;
        }
        curr = nodesMap.get(curr.leftId)!;
      } else {
        if (!curr.rightId) {
          curr.rightId = id;
          break;
        }
        curr = nodesMap.get(curr.rightId)!;
      }
    }
    layoutTree();
    return id;
  };

  initialValues.forEach(insertNode);
  let stepCounter = 0;

  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    codeLine: number,
    highlightIds: string[] = [],
    pointers: Record<string, string> = {},
    motion?: SpatialMotion,
  ) => {
    stepCounter++;
    steps.push({
      id: `bst-${stepCounter}`,
      stepIndex: stepCounter,
      totalSteps: 0,
      title,
      description: desc,
      actionType: action,
      complexity,
      codeSnippet: code,
      codeLine,
      highlightNodeIds: highlightIds,
      pointers,
      motion,
      state: { rootId, nodes: Object.fromEntries(nodesMap) },
    });
  };

  if (operation.includes('Insert')) {
    const val = params.value ?? 25;
    if (!rootId) {
      const id = insertNode(val);
      pushStep('Insert as Root', `Tree was empty. Node ${val} initialized as root.`, 'write', 'O(1)', 'root = new TreeNode(val);', 2, [id], { root: id });
    } else {
      let curr = nodesMap.get(rootId)!;
      pushStep('Begin Search at Root', `Evaluating insertion of ${val} at root (${curr.value}).`, 'read', 'O(log n)', 'if (!root) return new TreeNode(val);', 2, [curr.id], { curr: curr.id });
      while (true) {
        if (val < curr.value) {
          if (!curr.leftId) {
            const newId = insertNode(val);
            const parentNode = nodesMap.get(curr.id)!;
            const newNode = nodesMap.get(newId)!;
            pushStep('Attach Left Branch', `${val} < ${curr.value} and left child is empty. Attached ${val} as left child!`, 'write', 'O(log n)', 'root.left = insert(root.left, val);', 3, [newId, curr.id], { parent: curr.id, newNode: newId }, { type: 'branch-swap', fromCoords: { x: parentNode.x, y: parentNode.y }, toCoords: { x: newNode.x, y: newNode.y } });
            break;
          } else {
            pushStep('Descend Left Branch', `${val} < ${curr.value}. Moving down left branch vector.`, 'compare', 'O(log n)', 'return insert(root.left, val);', 3, [curr.leftId], { curr: curr.leftId });
            curr = nodesMap.get(curr.leftId)!;
          }
        } else {
          if (!curr.rightId) {
            const newId = insertNode(val);
            const parentNode = nodesMap.get(curr.id)!;
            const newNode = nodesMap.get(newId)!;
            pushStep('Attach Right Branch', `${val} >= ${curr.value} and right child is empty. Attached ${val} as right child!`, 'write', 'O(log n)', 'root.right = insert(root.right, val);', 4, [newId, curr.id], { parent: curr.id, newNode: newId }, { type: 'branch-swap', fromCoords: { x: parentNode.x, y: parentNode.y }, toCoords: { x: newNode.x, y: newNode.y } });
            break;
          } else {
            pushStep('Descend Right Branch', `${val} >= ${curr.value}. Moving down right branch vector.`, 'compare', 'O(log n)', 'return insert(root.right, val);', 4, [curr.rightId], { curr: curr.rightId });
            curr = nodesMap.get(curr.rightId)!;
          }
        }
      }
    }
  } else if (operation.includes('Search')) {
    const target = params.value ?? 30;
    if (!rootId) {
      pushStep('Tree Empty', 'BST has no nodes.', 'error', 'O(1)', 'return null;', 2);
    } else {
      let curr = nodesMap.get(rootId);
      pushStep('Check Root', `Inspecting root node (${curr!.value}) for target ${target}.`, 'read', 'O(log n)', 'if (root.val === target) return root;', 2, [curr!.id], { curr: curr!.id });
      let found = false;
      while (curr) {
        if (curr.value === target) {
          pushStep('Target Found (Match)!', `Node with value ${target} matched in BST!`, 'done', 'O(log n)', 'return root;', 2, [curr.id], { found: curr.id }, { type: 'pulse', nodeId: curr.id });
          found = true;
          break;
        } else if (target < curr.value) {
          pushStep('Branch Left', `${target} < ${curr.value}. Descending to left subtree.`, 'compare', 'O(log n)', 'return search(root.left, target);', 3, curr.leftId ? [curr.leftId] : [], curr.leftId ? { curr: curr.leftId } : {});
          curr = curr.leftId ? nodesMap.get(curr.leftId) : undefined;
        } else {
          pushStep('Branch Right', `${target} > ${curr.value}. Descending to right subtree.`, 'compare', 'O(log n)', 'return search(root.right, target);', 4, curr.rightId ? [curr.rightId] : [], curr.rightId ? { curr: curr.rightId } : {});
          curr = curr.rightId ? nodesMap.get(curr.rightId) : undefined;
        }
      }
      if (!found) {
        pushStep('Not Found', `Target ${target} does not exist in this BST.`, 'done', 'O(log n)', 'return null;', 2, []);
      }
    }
  } else if (operation.includes('In-Order Traversal')) {
    const visited: number[] = [];
    const traverse = (nodeId: string | null) => {
      if (!nodeId) return;
      const node = nodesMap.get(nodeId)!;
      traverse(node.leftId);
      visited.push(node.value);
      pushStep('In-Order Visit', `Left -> Node -> Right: visited ${node.value}. Sorted stream: [${visited.join(', ')}].`, 'read', 'O(n)', `res.push(${node.value});`, 4, [node.id], { curr: node.id }, { type: 'pulse', nodeId: node.id });
      traverse(node.rightId);
    };
    pushStep('Start In-Order Traversal', 'In-order traversal yields keys in strictly sorted ascending order.', 'read', 'O(n)', 'inOrder(root);', 1);
    traverse(rootId);
    pushStep('Traversal Complete', `Final sorted array: [${visited.join(', ')}].`, 'done', 'O(n)', 'return res;', 6, []);
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 5. MIN / MAX HEAP SIMULATION WITH VECTOR SWAPS
// ---------------------------------------------------------------------------
export function simulateHeap(
  initialHeap: number[],
  operation: string,
  params: { value?: number } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  const heap = [...initialHeap];
  let stepCounter = 0;

  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    codeLine: number,
    highlights: number[] = [],
    pointers: Record<string, number> = {},
    motion?: SpatialMotion,
  ) => {
    stepCounter++;
    steps.push({
      id: `heap-${stepCounter}`,
      stepIndex: stepCounter,
      totalSteps: 0,
      title,
      description: desc,
      actionType: action,
      complexity,
      codeSnippet: code,
      codeLine,
      highlightIndices: highlights,
      pointers,
      motion,
      state: { heap: [...heap] },
    });
  };

  if (operation.includes('Insert')) {
    const val = params.value ?? 7;
    heap.push(val);
    let idx = heap.length - 1;
    pushStep('Append at Leaf', `Appended ${val} at heap end (index ${idx}).`, 'write', 'O(log n)', `heap.push(${val});`, 2, [idx], { idx }, { type: 'lift', toIndex: idx });

    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      pushStep('Compare with Parent', `Comparing child at index ${idx} (${heap[idx]}) with parent at index ${parentIdx} (${heap[parentIdx]}).`, 'compare', 'O(log n)', `if (heap[${idx}] < heap[${parentIdx}]) swap();`, 5, [idx, parentIdx], { child: idx, parent: parentIdx });

      if (heap[idx] < heap[parentIdx]) {
        pushStep(
          'Bubble-Up Crossover Swap',
          `Child ${heap[idx]} is smaller than parent ${heap[parentIdx]}. Both elements lift into the air and cross over to swap positions.`,
          'swap',
          'O(log n)',
          `[heap[${idx}], heap[${parentIdx}]] = [heap[${parentIdx}], heap[${idx}]];`,
          6,
          [idx, parentIdx],
          { child: idx, parent: parentIdx },
          { type: 'swap', fromIndex: idx, toIndex: parentIdx },
        );
        const temp = heap[idx];
        heap[idx] = heap[parentIdx];
        heap[parentIdx] = temp;
        pushStep(
          'Landed in Heap Positions',
          `Swap confirmed: child elevated to parent position (${heap[parentIdx]}).`,
          'write',
          'O(1)',
          `// Landed in heap: index ${parentIdx} holds ${heap[parentIdx]}`,
          6,
          [idx, parentIdx],
          { child: idx, parent: parentIdx },
          { type: 'drop', toIndex: parentIdx },
        );
        idx = parentIdx;
      } else {
        pushStep('Invariant Restored', `Child ${heap[idx]} >= parent ${heap[parentIdx]}. Bubble-up complete.`, 'done', 'O(log n)', '// Invariant satisfied', 8, [idx]);
        break;
      }
    }
  } else if (operation.includes('Extract Root')) {
    if (heap.length === 0) {
      pushStep('Heap Empty', 'Cannot extract min from empty heap.', 'error', 'O(1)', 'return null;', 2);
    } else {
      const minVal = heap[0];
      const lastVal = heap.pop()!;
      pushStep('Extract Root Node', `Min element is ${minVal} at root index 0.`, 'read', 'O(log n)', 'const min = heap[0];', 2, [0], { min: 0 }, { type: 'lift', fromIndex: 0 });

      if (heap.length > 0) {
        heap[0] = lastVal;
        pushStep('Swap Last to Root', `Moved last leaf element (${lastVal}) to root. Sifting down.`, 'write', 'O(log n)', 'heap[0] = heap.pop();', 3, [0], { root: 0 });

        let idx = 0;
        while (true) {
          let smallest = idx;
          const left = 2 * idx + 1;
          const right = 2 * idx + 2;

          if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
          if (right < heap.length && heap[right] < heap[smallest]) smallest = right;

          if (smallest !== idx) {
            pushStep(
              'Sift-Down Crossover Swap',
              `Parent (${heap[idx]}) is larger than smaller child (${heap[smallest]}). Both elements lift and cross paths to swap.`,
              'swap',
              'O(log n)',
              `swap(${idx}, ${smallest});`,
              9,
              [idx, smallest],
              { parent: idx, child: smallest },
              { type: 'swap', fromIndex: idx, toIndex: smallest },
            );
            const temp = heap[idx];
            heap[idx] = heap[smallest];
            heap[smallest] = temp;
            pushStep(
              'Landed in Sifted Positions',
              `Sift-down swap landed: parent descended, smaller child elevated to root/parent.`,
              'write',
              'O(1)',
              `// Landed: index ${idx} holds ${heap[idx]}`,
              9,
              [idx, smallest],
              { parent: idx, child: smallest },
              { type: 'drop', toIndex: idx },
            );
            idx = smallest;
          } else {
            pushStep('Sift-Down Complete', 'Parent is smaller than both children. Heap property fully restored.', 'done', 'O(log n)', 'return min;', 13, [idx]);
            break;
          }
        }
      }
    }
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 6. HASH TABLE SIMULATION WITH BUCKET ARRAY & OVERFLOW CHAIN
// ---------------------------------------------------------------------------
export interface HashBucketEntry {
  key: string;
  value: string;
}

export function simulateHashMap(
  initialBuckets: Array<HashBucketEntry[]>,
  operation: string,
  params: { key?: string; value?: string } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  const BUCKET_COUNT = initialBuckets.length || 8;
  const buckets = initialBuckets.map((b) => [...b]);
  let stepCounter = 0;

  const hash = (key: string): number => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) % BUCKET_COUNT;
    return Math.abs(h);
  };

  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    codeLine: number,
    bucketIdx?: number,
    motion?: SpatialMotion,
  ) => {
    stepCounter++;
    steps.push({
      id: `map-${stepCounter}`,
      stepIndex: stepCounter,
      totalSteps: 0,
      title,
      description: desc,
      actionType: action,
      complexity,
      codeSnippet: code,
      codeLine,
      highlightIndices: bucketIdx !== undefined ? [bucketIdx] : [],
      pointers: bucketIdx !== undefined ? { bucket: bucketIdx } : {},
      motion,
      state: { buckets: JSON.parse(JSON.stringify(buckets)), lastHash: bucketIdx },
    });
  };

  const key = params.key ?? 'user';
  const val = params.value ?? 'alex';
  const bucketIdx = hash(key);

  if (operation.includes('Put')) {
    pushStep('Pass Key through Hash Function', `hash("${key}") % ${BUCKET_COUNT} = bucket [${bucketIdx}].`, 'read', 'O(1) average', `const idx = hash("${key}") % ${BUCKET_COUNT};`, 2, bucketIdx);
    const existing = buckets[bucketIdx].find((e) => e.key === key);
    if (existing) {
      existing.value = val;
      pushStep('Update Key in Bucket Chain', `Key "${key}" already present in bucket [${bucketIdx}]. Updated value to "${val}".`, 'write', 'O(1) average', `entry.val = "${val}";`, 4, bucketIdx);
    } else {
      buckets[bucketIdx].push({ key, value: val });
      pushStep('Link Entry in Overflow Chain', `Appended { "${key}": "${val}" } into bucket [${bucketIdx}] collision chain.`, 'write', 'O(1) average', `buckets[${bucketIdx}].push({ key, val });`, 5, bucketIdx, { type: 'link', fromIndex: bucketIdx });
    }
  } else if (operation.includes('Get')) {
    pushStep('Hash Key to Bucket Index', `hash("${key}") directly points to bucket [${bucketIdx}].`, 'read', 'O(1) average', `const idx = hash("${key}") % ${BUCKET_COUNT};`, 2, bucketIdx);
    const found = buckets[bucketIdx].find((e) => e.key === key);
    if (found) {
      pushStep('Found in Chain!', `Located key "${key}" with value "${found.value}" in bucket [${bucketIdx}].`, 'done', 'O(1) average', `return "${found.value}";`, 4, bucketIdx, { type: 'pulse', fromIndex: bucketIdx });
    } else {
      pushStep('Key Missing', `Scanned bucket [${bucketIdx}]. Key "${key}" does not exist.`, 'done', 'O(1) average', 'return undefined;', 4, bucketIdx);
    }
  } else if (operation.includes('Remove')) {
    pushStep('Compute Hash for Removal', `Locating bucket [${bucketIdx}] for key "${key}".`, 'read', 'O(1) average', `const idx = hash("${key}") % ${BUCKET_COUNT};`, 2, bucketIdx);
    const idx = buckets[bucketIdx].findIndex((e) => e.key === key);
    if (idx >= 0) {
      buckets[bucketIdx].splice(idx, 1);
      pushStep('Unlinked Entry', `Removed "${key}" from bucket [${bucketIdx}] collision chain.`, 'done', 'O(1) average', `buckets[${bucketIdx}].splice(i, 1);`, 4, bucketIdx);
    } else {
      pushStep('Key Not Found', `Key "${key}" was not in bucket [${bucketIdx}].`, 'error', 'O(1) average', 'return false;', 4, bucketIdx);
    }
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 7. GRAPH NETWORK SIMULATION (2D COORDINATES, VERTICES & EDGES)
// ---------------------------------------------------------------------------
export interface GraphVertex {
  id: string;
  label: string;
  x: number; // percentage (10 to 90)
  y: number; // percentage (10 to 90)
}

export interface GraphEdge {
  from: string;
  to: string;
  weight?: number;
}

export const INITIAL_GRAPH_VERTICES: GraphVertex[] = [
  { id: 'A', label: 'A', x: 20, y: 30 },
  { id: 'B', label: 'B', x: 50, y: 18 },
  { id: 'C', label: 'C', x: 80, y: 30 },
  { id: 'D', label: 'D', x: 30, y: 70 },
  { id: 'E', label: 'E', x: 70, y: 70 },
];

export const INITIAL_GRAPH_EDGES: GraphEdge[] = [
  { from: 'A', to: 'B', weight: 4 },
  { from: 'A', to: 'D', weight: 2 },
  { from: 'B', to: 'C', weight: 3 },
  { from: 'B', to: 'E', weight: 6 },
  { from: 'C', to: 'E', weight: 1 },
  { from: 'D', to: 'E', weight: 5 },
];

export function simulateGraph(
  operation: string,
  params: { startVertex?: string; from?: string; to?: string } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  const vertices = [...INITIAL_GRAPH_VERTICES];
  const edges = [...INITIAL_GRAPH_EDGES];
  let stepCounter = 0;

  // Build adjacency map
  const adj = new Map<string, string[]>();
  vertices.forEach((v) => adj.set(v.id, []));
  edges.forEach((e) => {
    adj.get(e.from)?.push(e.to);
    adj.get(e.to)?.push(e.from);
  });

  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    codeLine: number,
    highlightIds: string[] = [],
    pointers: Record<string, string> = {},
    motion?: SpatialMotion,
  ) => {
    stepCounter++;
    steps.push({
      id: `graph-${stepCounter}`,
      stepIndex: stepCounter,
      totalSteps: 0,
      title,
      description: desc,
      actionType: action,
      complexity,
      codeSnippet: code,
      codeLine,
      highlightNodeIds: highlightIds,
      pointers,
      motion,
      state: { vertices, edges },
    });
  };

  const start = params.startVertex ?? 'A';

  if (operation.includes('BFS')) {
    pushStep('Initialize BFS Queue', `Enqueued start vertex "${start}". Marking as visited.`, 'write', 'O(V + E)', `const queue = ["${start}"]; visited.add("${start}");`, 2, [start], { queue: start });
    const visited = new Set<string>([start]);
    const queue = [start];

    while (queue.length > 0) {
      const u = queue.shift()!;
      pushStep('Dequeue & Explore Neighbors', `Dequeued vertex "${u}". Inspecting outgoing edges.`, 'read', 'O(V + E)', 'const u = queue.shift();', 5, [u], { active: u }, { type: 'pulse', nodeId: u });

      for (const v of adj.get(u) ?? []) {
        if (!visited.has(v)) {
          visited.add(v);
          queue.push(v);
          pushStep('Wavefront Pulse to Neighbor', `Traversed edge (${u} -> ${v}). Enqueued unvisited neighbor "${v}".`, 'write', 'O(V + E)', `visited.add("${v}"); queue.push("${v}");`, 8, [u, v], { curr: u, neighbor: v }, { type: 'pulse', nodeId: v });
        }
      }
    }
    pushStep('BFS Traversal Complete', `All reachable vertices visited in level order.`, 'done', 'O(V + E)', '// BFS finished', 11, Array.from(visited));
  } else if (operation.includes('DFS')) {
    pushStep('Initialize DFS Stack', `Starting Depth-First Search at vertex "${start}".`, 'write', 'O(V + E)', `dfs(graph, "${start}");`, 1, [start], { curr: start });
    const visited = new Set<string>();

    const dfs = (u: string) => {
      visited.add(u);
      pushStep('Visit Vertex', `Pushed vertex "${u}" onto recursion call stack.`, 'read', 'O(V + E)', `visited.add("${u}");`, 2, [u], { curr: u }, { type: 'pulse', nodeId: u });

      for (const v of adj.get(u) ?? []) {
        if (!visited.has(v)) {
          pushStep('Dive Deeper', `Advancing along edge (${u} -> ${v}).`, 'write', 'O(V + E)', `dfs(graph, "${v}");`, 4, [u, v], { from: u, to: v });
          dfs(v);
          pushStep('Backtrack', `Backtracking to vertex "${u}".`, 'read', 'O(V + E)', '// Return from call', 5, [u], { curr: u });
        }
      }
    };

    dfs(start);
    pushStep('DFS Traversal Complete', `All connected components deeply explored.`, 'done', 'O(V + E)', '// DFS complete', 6, Array.from(visited));
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}
