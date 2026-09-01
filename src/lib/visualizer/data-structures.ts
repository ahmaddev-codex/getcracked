/**
 * Stepwise Data Structure Simulation Engine.
 *
 * Generates discrete micro-step animation traces for:
 * 1. Array / Dynamic Array
 * 2. Singly Linked List
 * 3. Stack (LIFO)
 * 4. Queue (FIFO)
 * 5. Binary Search Tree (BST)
 * 6. Min Heap (Priority Queue)
 * 7. Hash Map (Collision Chaining)
 * 8. Graph (Adjacency List BFS/DFS)
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

export interface DataStructureMeta {
  id: DataStructureType;
  name: string;
  category: DataStructureCategory;
  summary: string;
  operations: string[];
}

export const DATA_STRUCTURE_REGISTRY: DataStructureMeta[] = [
  {
    id: 'array',
    name: 'Array / Dynamic Array',
    category: 'foundations',
    summary: 'Contiguous memory buffer with constant-time indexed access and linear element shifting.',
    operations: ['Push', 'Pop', 'Insert at Index', 'Delete at Index', 'Search / Traverse', 'Reverse'],
  },
  {
    id: 'linked-list',
    name: 'Singly Linked List',
    category: 'linear',
    summary: 'Sequential nodes connected via pointer references; dynamic size with O(1) head operations.',
    operations: ['Insert Head', 'Insert Tail', 'Delete Value', 'Search', 'Reverse'],
  },
  {
    id: 'stack',
    name: 'Stack (LIFO)',
    category: 'linear',
    summary: 'Last-In, First-Out collection supporting constant-time Push and Pop from top.',
    operations: ['Push', 'Pop', 'Peek', 'Clear'],
  },
  {
    id: 'queue',
    name: 'Queue (FIFO)',
    category: 'linear',
    summary: 'First-In, First-Out sequence where elements enter at rear and exit at front.',
    operations: ['Enqueue', 'Dequeue', 'Peek', 'Clear'],
  },
  {
    id: 'binary-search-tree',
    name: 'Binary Search Tree',
    category: 'trees',
    summary: 'Hierarchical structure where left children < root < right children, offering O(log n) search.',
    operations: ['Insert', 'Search', 'In-Order Traversal', 'Pre-Order Traversal'],
  },
  {
    id: 'min-heap',
    name: 'Min Heap',
    category: 'trees',
    summary: 'Complete binary tree where every parent is <= its children; backing array mapped with bubble-up/down.',
    operations: ['Insert', 'Extract Min'],
  },
  {
    id: 'hash-map',
    name: 'Hash Map (Chaining)',
    category: 'advanced',
    summary: 'Key-value store using hash functions to index bucket arrays, with linked collision chaining.',
    operations: ['Put', 'Get', 'Remove'],
  },
  {
    id: 'graph',
    name: 'Graph (Adjacency List)',
    category: 'advanced',
    summary: 'Network of vertices connected by edges, traversed via Breadth-First or Depth-First search.',
    operations: ['Add Edge', 'Breadth-First Search (BFS)', 'Depth-First Search (DFS)'],
  },
];

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
  state: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 1. ARRAY SIMULATION
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
    highlights: number[] = [],
    pointers: Record<string, number> = {},
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
      highlightIndices: highlights,
      pointers,
      state: { array: [...arr] },
    });
  };

  if (operation === 'Push') {
    const val = params.value ?? 42;
    pushStep('Check Capacity', `Prepare to append value ${val} at the end of the array.`, 'read', 'O(1) amortized', 'arr.push(val);', [], { target: arr.length });
    arr.push(val);
    pushStep('Element Appended', `Inserted ${val} at index ${arr.length - 1}. Length is now ${arr.length}.`, 'write', 'O(1) amortized', `arr[${arr.length - 1}] = ${val};`, [arr.length - 1], { length: arr.length });
  } else if (operation === 'Pop') {
    if (arr.length === 0) {
      pushStep('Array Empty', 'Cannot pop from an empty array.', 'error', 'O(1)', '// Array is empty');
    } else {
      const idx = arr.length - 1;
      const popped = arr[idx];
      pushStep('Access Last Element', `Reading element ${popped} at index ${idx}.`, 'read', 'O(1)', `const val = arr[${idx}];`, [idx], { top: idx });
      arr.pop();
      pushStep('Remove Element', `Removed ${popped}. Array length reduced to ${arr.length}.`, 'done', 'O(1)', 'arr.pop();', [], {});
    }
  } else if (operation === 'Insert at Index') {
    const targetIdx = Math.max(0, Math.min(params.index ?? 1, arr.length));
    const val = params.value ?? 99;
    pushStep('Allocate Space', `Inserting ${val} at index ${targetIdx}. Elements from index ${targetIdx} must shift right.`, 'read', 'O(n)', `// Insert ${val} at ${targetIdx}`);

    arr.push(0); // expand
    for (let i = arr.length - 1; i > targetIdx; i--) {
      arr[i] = arr[i - 1];
      pushStep('Shift Right', `Shifted element from index ${i - 1} (${arr[i]}) to index ${i}.`, 'shift', 'O(n)', `arr[${i}] = arr[${i - 1}];`, [i - 1, i], { from: i - 1, to: i });
    }
    arr[targetIdx] = val;
    pushStep('Write New Value', `Placed ${val} directly at index ${targetIdx}.`, 'write', 'O(1)', `arr[${targetIdx}] = ${val};`, [targetIdx], { index: targetIdx });
  } else if (operation === 'Delete at Index') {
    const targetIdx = Math.max(0, Math.min(params.index ?? 1, arr.length - 1));
    if (arr.length === 0) {
      pushStep('Array Empty', 'Cannot delete from empty array.', 'error', 'O(1)', '// Empty');
    } else {
      const removed = arr[targetIdx];
      pushStep('Identify Target', `Targeting index ${targetIdx} (value ${removed}) for deletion.`, 'read', 'O(n)', `const removed = arr[${targetIdx}];`, [targetIdx], { target: targetIdx });
      for (let i = targetIdx; i < arr.length - 1; i++) {
        arr[i] = arr[i + 1];
        pushStep('Shift Left', `Shifted element from index ${i + 1} (${arr[i]}) to index ${i}.`, 'shift', 'O(n)', `arr[${i}] = arr[${i + 1}];`, [i, i + 1], { index: i });
      }
      arr.pop();
      pushStep('Complete Deletion', `Removed element. Remaining length: ${arr.length}.`, 'done', 'O(n)', 'arr.pop();', []);
    }
  } else if (operation === 'Search / Traverse') {
    const target = params.value ?? 30;
    pushStep('Start Scan', `Searching for value ${target} starting at index 0.`, 'read', 'O(n)', `let i = 0;`, [0], { i: 0 });
    let found = false;
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] === target) {
        pushStep('Match Found', `Target ${target} found at index ${i}!`, 'done', 'O(n)', `return ${i};`, [i], { found: i });
        found = true;
        break;
      } else {
        pushStep('Compare', `Index ${i} holds ${arr[i]} (not ${target}). Moving next.`, 'compare', 'O(n)', `i++;`, [i], { i });
      }
    }
    if (!found) {
      pushStep('Not Found', `Reached end of array. Value ${target} is not present.`, 'done', 'O(n)', `return -1;`, [], {});
    }
  } else if (operation === 'Reverse') {
    let left = 0;
    let right = arr.length - 1;
    pushStep('Initialize Two Pointers', `Setting left pointer at 0 and right pointer at ${right}.`, 'read', 'O(n)', `let left = 0, right = ${right};`, [left, right], { left, right });
    while (left < right) {
      pushStep('Compare & Swap', `Swapping arr[${left}] (${arr[left]}) with arr[${right}] (${arr[right]}).`, 'swap', 'O(n)', `[arr[${left}], arr[${right}]] = [arr[${right}], arr[${left}]];`, [left, right], { left, right });
      const temp = arr[left];
      arr[left] = arr[right];
      arr[right] = temp;
      left++;
      right--;
      pushStep('Advance Pointers', `Left pointer advanced to ${left}, right pointer decreased to ${right}.`, 'read', 'O(n)', `left++; right--;`, left <= right ? [left, right] : [], { left, right });
    }
    pushStep('Reversal Complete', 'Array successfully reversed in-place with O(1) extra space.', 'done', 'O(n)', '// Finished', []);
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 2. LINKED LIST SIMULATION
// ---------------------------------------------------------------------------
export interface ListNodeState {
  id: string;
  value: number;
  nextId: string | null;
}

export function simulateLinkedList(
  initialValues: number[],
  operation: string,
  params: { value?: number } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  let nodes: ListNodeState[] = initialValues.map((v, i) => ({
    id: `node-${i}`,
    value: v,
    nextId: i < initialValues.length - 1 ? `node-${i + 1}` : null,
  }));

  let stepCounter = 0;
  const pushStep = (
    title: string,
    desc: string,
    action: VisualStep['actionType'],
    complexity: string,
    code: string,
    highlightIds: string[] = [],
    pointers: Record<string, string> = {},
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
      highlightNodeIds: highlightIds,
      pointers,
      state: { nodes: JSON.parse(JSON.stringify(nodes)) },
    });
  };

  if (operation === 'Insert Head') {
    const val = params.value ?? 5;
    const newId = `node-${Date.now()}`;
    const headId = nodes[0]?.id ?? null;
    pushStep('Create New Node', `Allocated new ListNode with value ${val}.`, 'write', 'O(1)', `const newNode = new ListNode(${val});`, [], { newNode: newId });
    nodes = [{ id: newId, value: val, nextId: headId }, ...nodes];
    pushStep('Link to Previous Head', `Pointed newNode.next to existing head (${headId ?? 'null'}).`, 'write', 'O(1)', `newNode.next = head; head = newNode;`, [newId], { head: newId });
  } else if (operation === 'Insert Tail') {
    const val = params.value ?? 88;
    const newId = `node-${Date.now()}`;
    if (nodes.length === 0) {
      nodes = [{ id: newId, value: val, nextId: null }];
      pushStep('Initialize Head', `List was empty. newNode ${val} becomes head and tail.`, 'write', 'O(1)', `head = new ListNode(${val});`, [newId], { head: newId });
    } else {
      pushStep('Traverse to Tail', `Starting traversal at head (${nodes[0].value}) to locate the tail.`, 'read', 'O(n)', `let curr = head; while (curr.next) curr = curr.next;`, [nodes[0].id], { curr: nodes[0].id });
      for (let i = 1; i < nodes.length; i++) {
        pushStep('Traverse Step', `Visited node ${nodes[i].value}.`, 'read', 'O(n)', `curr = curr.next;`, [nodes[i].id], { curr: nodes[i].id });
      }
      const last = nodes[nodes.length - 1];
      last.nextId = newId;
      nodes.push({ id: newId, value: val, nextId: null });
      pushStep('Link Tail', `Updated tail node (${last.value}).next to point to new node ${val}.`, 'write', 'O(1)', `curr.next = new ListNode(${val});`, [last.id, newId], { tail: newId });
    }
  } else if (operation === 'Search') {
    const target = params.value ?? 20;
    pushStep('Start Traversal', `Searching for value ${target} starting at head.`, 'read', 'O(n)', `let curr = head;`, nodes[0] ? [nodes[0].id] : [], nodes[0] ? { curr: nodes[0].id } : {});
    let found = false;
    for (const node of nodes) {
      if (node.value === target) {
        pushStep('Node Found', `Found matching value ${target} at node!`, 'done', 'O(n)', `return curr;`, [node.id], { found: node.id });
        found = true;
        break;
      } else {
        pushStep('Advance Pointer', `Node value ${node.value} != ${target}. Following next pointer.`, 'compare', 'O(n)', `curr = curr.next;`, [node.id], { curr: node.id });
      }
    }
    if (!found) {
      pushStep('End of List', `Reached null. Value ${target} does not exist in the list.`, 'done', 'O(n)', `return null;`, [], {});
    }
  } else if (operation === 'Reverse') {
    pushStep('Initialize Pointers', 'Setting prev = null, curr = head.', 'read', 'O(n)', 'let prev = null, curr = head;', nodes[0] ? [nodes[0].id] : [], nodes[0] ? { curr: nodes[0].id } : {});
    const reversed: ListNodeState[] = [];
    for (let i = 0; i < nodes.length; i++) {
      const curr = nodes[i];
      const next = nodes[i + 1]?.id ?? null;
      pushStep('Reverse Pointer', `Flipping ${curr.value}'s pointer to point to previous node.`, 'write', 'O(n)', `let nxt = curr.next; curr.next = prev; prev = curr; curr = nxt;`, [curr.id], { curr: curr.id, next: next ?? 'null' });
      reversed.unshift({
        id: curr.id,
        value: curr.value,
        nextId: reversed[0]?.id ?? null,
      });
    }
    nodes = reversed;
    pushStep('Reversal Complete', `Head is now ${nodes[0]?.value ?? 'null'}. Finished in single O(n) pass.`, 'done', 'O(n)', 'return prev;', nodes[0] ? [nodes[0].id] : [], nodes[0] ? { head: nodes[0].id } : {});
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 3. STACK & QUEUE SIMULATION
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
    highlights: number[] = [],
    pointers: Record<string, number> = {},
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
      highlightIndices: highlights,
      pointers,
      state: { items: [...items] },
    });
  };

  if (operation === 'Push') {
    const val = params.value ?? 50;
    pushStep('Push Element', `Pushing ${val} onto top of the stack.`, 'write', 'O(1)', `stack.push(${val});`, [], { top: items.length });
    items.push(val);
    pushStep('Pushed', `Element ${val} is now the top of the stack.`, 'done', 'O(1)', `// Top is now index ${items.length - 1}`, [items.length - 1], { top: items.length - 1 });
  } else if (operation === 'Pop') {
    if (items.length === 0) {
      pushStep('Stack Underflow', 'Cannot pop from an empty stack.', 'error', 'O(1)', '// Empty');
    } else {
      const topIdx = items.length - 1;
      const popped = items[topIdx];
      pushStep('Inspect Top', `Inspecting top item ${popped} at index ${topIdx}.`, 'read', 'O(1)', `const val = stack.pop();`, [topIdx], { top: topIdx });
      items.pop();
      pushStep('Popped', `Removed ${popped}. Stack height is now ${items.length}.`, 'done', 'O(1)', '// Item removed', [], items.length > 0 ? { top: items.length - 1 } : {});
    }
  } else if (operation === 'Peek') {
    if (items.length === 0) {
      pushStep('Empty Stack', 'Stack has no items to peek.', 'read', 'O(1)', 'return null;');
    } else {
      const topIdx = items.length - 1;
      pushStep('Peek Top', `Top item is ${items[topIdx]} at index ${topIdx}.`, 'read', 'O(1)', `return stack[stack.length - 1];`, [topIdx], { top: topIdx });
    }
  } else if (operation === 'Clear') {
    items.length = 0;
    pushStep('Clear Stack', 'Reset all elements in stack.', 'done', 'O(1)', 'stack.length = 0;', []);
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
    highlights: number[] = [],
    pointers: Record<string, number> = {},
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
      highlightIndices: highlights,
      pointers,
      state: { items: [...items] },
    });
  };

  if (operation === 'Enqueue') {
    const val = params.value ?? 77;
    pushStep('Enqueue Request', `Adding element ${val} to the rear of the queue.`, 'write', 'O(1)', `queue.push(${val});`, [], { rear: items.length });
    items.push(val);
    pushStep('Enqueued', `Element ${val} placed at rear. Queue size: ${items.length}.`, 'done', 'O(1)', `// Rear index: ${items.length - 1}`, [items.length - 1], { front: 0, rear: items.length - 1 });
  } else if (operation === 'Dequeue') {
    if (items.length === 0) {
      pushStep('Queue Underflow', 'Cannot dequeue from an empty queue.', 'error', 'O(1)', '// Empty');
    } else {
      const val = items[0];
      pushStep('Inspect Front', `Removing element ${val} from front (index 0).`, 'read', 'O(1)', `const val = queue.shift();`, [0], { front: 0 });
      items.shift();
      pushStep('Dequeued', `Element ${val} dequeued. Remaining queue size: ${items.length}.`, 'done', 'O(1)', '// Front advanced', [], items.length > 0 ? { front: 0, rear: items.length - 1 } : {});
    }
  } else if (operation === 'Peek') {
    if (items.length === 0) {
      pushStep('Empty Queue', 'Queue has no items to peek.', 'read', 'O(1)', 'return null;');
    } else {
      pushStep('Peek Front', `Front element is ${items[0]}.`, 'read', 'O(1)', 'return queue[0];', [0], { front: 0 });
    }
  } else if (operation === 'Clear') {
    items.length = 0;
    pushStep('Clear Queue', 'Queue cleared.', 'done', 'O(1)', 'queue.length = 0;', []);
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 4. BINARY SEARCH TREE (BST) SIMULATION
// ---------------------------------------------------------------------------
export interface TreeNode {
  id: string;
  value: number;
  leftId: string | null;
  rightId: string | null;
}

export function simulateBST(
  initialValues: number[],
  operation: string,
  params: { value?: number } = {},
): VisualStep[] {
  const steps: VisualStep[] = [];
  const nodesMap = new Map<string, TreeNode>();
  let rootId: string | null = null;

  const insertNode = (val: number): string => {
    const id = `node-${val}`;
    const newNode: TreeNode = { id, value: val, leftId: null, rightId: null };
    nodesMap.set(id, newNode);
    if (!rootId) {
      rootId = id;
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
    highlightIds: string[] = [],
    pointers: Record<string, string> = {},
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
      highlightNodeIds: highlightIds,
      pointers,
      state: { rootId, nodes: Object.fromEntries(nodesMap) },
    });
  };

  if (operation === 'Insert') {
    const val = params.value ?? 25;
    if (!rootId) {
      const id = insertNode(val);
      pushStep('Insert as Root', `Tree was empty. Node ${val} becomes root.`, 'write', 'O(1)', 'root = new TreeNode(val);', [id], { root: id });
    } else {
      pushStep('Start at Root', `Beginning BST search for insertion of ${val} at root (${nodesMap.get(rootId)!.value}).`, 'read', 'O(log n)', 'let curr = root;', [rootId], { curr: rootId });
      let curr = nodesMap.get(rootId)!;
      while (true) {
        if (val < curr.value) {
          if (!curr.leftId) {
            const newId = insertNode(val);
            pushStep('Insert Left Child', `${val} < ${curr.value} and left child is null. Attached ${val} as left child!`, 'write', 'O(log n)', `curr.left = new TreeNode(${val});`, [newId, curr.id], { parent: curr.id, newNode: newId });
            break;
          } else {
            pushStep('Descend Left', `${val} < ${curr.value}. Moving to left child.`, 'compare', 'O(log n)', 'curr = curr.left;', [curr.leftId], { curr: curr.leftId });
            curr = nodesMap.get(curr.leftId)!;
          }
        } else {
          if (!curr.rightId) {
            const newId = insertNode(val);
            pushStep('Insert Right Child', `${val} >= ${curr.value} and right child is null. Attached ${val} as right child!`, 'write', 'O(log n)', `curr.right = new TreeNode(${val});`, [newId, curr.id], { parent: curr.id, newNode: newId });
            break;
          } else {
            pushStep('Descend Right', `${val} >= ${curr.value}. Moving to right child.`, 'compare', 'O(log n)', 'curr = curr.right;', [curr.rightId], { curr: curr.rightId });
            curr = nodesMap.get(curr.rightId)!;
          }
        }
      }
    }
  } else if (operation === 'Search') {
    const target = params.value ?? 30;
    if (!rootId) {
      pushStep('Tree Empty', 'Cannot search empty tree.', 'error', 'O(1)', 'return null;');
    } else {
      let curr = nodesMap.get(rootId);
      pushStep('Check Root', `Starting BST search for ${target} at root (${curr!.value}).`, 'read', 'O(log n)', 'let curr = root;', [curr!.id], { curr: curr!.id });
      let found = false;
      while (curr) {
        if (curr.value === target) {
          pushStep('Found Match', `Target ${target} matches node!`, 'done', 'O(log n)', 'return curr;', [curr.id], { found: curr.id });
          found = true;
          break;
        } else if (target < curr.value) {
          pushStep('Go Left', `${target} < ${curr.value}. Searching left subtree.`, 'compare', 'O(log n)', 'curr = curr.left;', curr.leftId ? [curr.leftId] : [], curr.leftId ? { curr: curr.leftId } : {});
          curr = curr.leftId ? nodesMap.get(curr.leftId) : undefined;
        } else {
          pushStep('Go Right', `${target} > ${curr.value}. Searching right subtree.`, 'compare', 'O(log n)', 'curr = curr.right;', curr.rightId ? [curr.rightId] : [], curr.rightId ? { curr: curr.rightId } : {});
          curr = curr.rightId ? nodesMap.get(curr.rightId) : undefined;
        }
      }
      if (!found) {
        pushStep('Not Found', `Target ${target} does not exist in BST.`, 'done', 'O(log n)', 'return null;', []);
      }
    }
  } else if (operation === 'In-Order Traversal') {
    const visited: number[] = [];
    const traverse = (nodeId: string | null) => {
      if (!nodeId) return;
      const node = nodesMap.get(nodeId)!;
      traverse(node.leftId);
      visited.push(node.value);
      pushStep('Visit Node', `In-order visit (Left -> Node -> Right): Visited ${node.value}. Current sorted output: [${visited.join(', ')}].`, 'read', 'O(n)', `visited.push(${node.value});`, [node.id], { curr: node.id });
      traverse(node.rightId);
    };
    pushStep('Start In-Order Traversal', 'In-order traversal yields nodes in strictly ascending order.', 'read', 'O(n)', 'inorder(root);');
    traverse(rootId);
    pushStep('Traversal Complete', `Final sorted array: [${visited.join(', ')}].`, 'done', 'O(n)', 'return result;', []);
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 5. MIN HEAP SIMULATION
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
    highlights: number[] = [],
    pointers: Record<string, number> = {},
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
      highlightIndices: highlights,
      pointers,
      state: { heap: [...heap] },
    });
  };

  if (operation === 'Insert') {
    const val = params.value ?? 7;
    heap.push(val);
    let idx = heap.length - 1;
    pushStep('Append at End', `Placed new element ${val} at the end of the heap (index ${idx}).`, 'write', 'O(log n)', `heap.push(${val});`, [idx], { idx });

    while (idx > 0) {
      const parentIdx = Math.floor((idx - 1) / 2);
      pushStep('Compare with Parent', `Comparing node at index ${idx} (${heap[idx]}) with parent at index ${parentIdx} (${heap[parentIdx]}).`, 'compare', 'O(log n)', `if (heap[${idx}] < heap[${parentIdx}]) swap();`, [idx, parentIdx], { child: idx, parent: parentIdx });

      if (heap[idx] < heap[parentIdx]) {
        const temp = heap[idx];
        heap[idx] = heap[parentIdx];
        heap[parentIdx] = temp;
        pushStep('Bubble Up (Swap)', `Swapped ${temp} with parent ${heap[idx]} to maintain min-heap invariant.`, 'swap', 'O(log n)', `swap(${idx}, ${parentIdx});`, [idx, parentIdx], { child: idx, parent: parentIdx });
        idx = parentIdx;
      } else {
        pushStep('Heap Property Satisfied', `Child ${heap[idx]} >= parent ${heap[parentIdx]}. Bubble-up complete.`, 'done', 'O(log n)', '// Invariant restored', [idx]);
        break;
      }
    }
  } else if (operation === 'Extract Min') {
    if (heap.length === 0) {
      pushStep('Heap Empty', 'Cannot extract min from empty heap.', 'error', 'O(1)', 'return null;');
    } else {
      const minVal = heap[0];
      const lastVal = heap.pop()!;
      pushStep('Extract Root', `Min element is ${minVal} at root index 0.`, 'read', 'O(log n)', `const min = heap[0];`, [0], { min: 0 });

      if (heap.length > 0) {
        heap[0] = lastVal;
        pushStep('Move Last to Root', `Moved last element (${lastVal}) to root. Now bubbling down.`, 'write', 'O(log n)', `heap[0] = heap.pop();`, [0], { root: 0 });

        let idx = 0;
        while (true) {
          let smallest = idx;
          const left = 2 * idx + 1;
          const right = 2 * idx + 2;

          if (left < heap.length && heap[left] < heap[smallest]) smallest = left;
          if (right < heap.length && heap[right] < heap[smallest]) smallest = right;

          if (smallest !== idx) {
            pushStep('Compare Children', `Parent (${heap[idx]}) is larger than child (${heap[smallest]}). Swapping.`, 'swap', 'O(log n)', `swap(${idx}, ${smallest});`, [idx, smallest], { parent: idx, child: smallest });
            const temp = heap[idx];
            heap[idx] = heap[smallest];
            heap[smallest] = temp;
            idx = smallest;
          } else {
            pushStep('Bubble Down Done', 'Parent is smaller than both children. Min-heap invariant restored.', 'done', 'O(log n)', '// Sift-down finished', [idx]);
            break;
          }
        }
      }
    }
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}

// ---------------------------------------------------------------------------
// 6. HASH MAP SIMULATION
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
    bucketIdx?: number,
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
      highlightIndices: bucketIdx !== undefined ? [bucketIdx] : [],
      pointers: bucketIdx !== undefined ? { bucket: bucketIdx } : {},
      state: { buckets: JSON.parse(JSON.stringify(buckets)) },
    });
  };

  const key = params.key ?? 'user';
  const val = params.value ?? 'alex';
  const bucketIdx = hash(key);

  if (operation === 'Put') {
    pushStep('Compute Hash Code', `Hash("${key}") % ${BUCKET_COUNT} = bucket ${bucketIdx}.`, 'read', 'O(1) average', `const index = hash("${key}") % ${BUCKET_COUNT};`, bucketIdx);
    const existing = buckets[bucketIdx].find((e) => e.key === key);
    if (existing) {
      existing.value = val;
      pushStep('Update Existing Key', `Found key "${key}" in bucket ${bucketIdx}. Updated value to "${val}".`, 'write', 'O(1) average', `entry.value = "${val}";`, bucketIdx);
    } else {
      buckets[bucketIdx].push({ key, value: val });
      pushStep('Insert in Chain', `Key "${key}" not in bucket. Appended to linked collision chain in bucket ${bucketIdx}.`, 'write', 'O(1) average', `buckets[${bucketIdx}].push({ key, value });`, bucketIdx);
    }
  } else if (operation === 'Get') {
    pushStep('Compute Hash', `Hash("${key}") locates bucket index ${bucketIdx}.`, 'read', 'O(1) average', `const bucket = buckets[hash("${key}")];`, bucketIdx);
    const found = buckets[bucketIdx].find((e) => e.key === key);
    if (found) {
      pushStep('Key Found', `Located key "${key}" in bucket ${bucketIdx} with value "${found.value}".`, 'done', 'O(1) average', `return "${found.value}";`, bucketIdx);
    } else {
      pushStep('Key Not Found', `Scanned bucket ${bucketIdx} chain. Key "${key}" does not exist.`, 'done', 'O(1) average', 'return undefined;', bucketIdx);
    }
  } else if (operation === 'Remove') {
    pushStep('Locate Bucket', `Hashing "${key}" directs to bucket ${bucketIdx}.`, 'read', 'O(1) average', `const bucket = buckets[${bucketIdx}];`, bucketIdx);
    const idx = buckets[bucketIdx].findIndex((e) => e.key === key);
    if (idx >= 0) {
      buckets[bucketIdx].splice(idx, 1);
      pushStep('Unlinked Entry', `Removed "${key}" from bucket ${bucketIdx}.`, 'done', 'O(1) average', 'bucket.splice(index, 1);', bucketIdx);
    } else {
      pushStep('Key Not Found', `Key "${key}" was not present in bucket ${bucketIdx}.`, 'error', 'O(1) average', 'return false;', bucketIdx);
    }
  }

  return steps.map((s) => ({ ...s, totalSteps: steps.length }));
}
