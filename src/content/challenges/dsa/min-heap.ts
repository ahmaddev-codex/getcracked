import type { ChallengeInput } from '../../schema';

/**
 * Build an array-backed Binary Min-Heap from scratch.
 *
 * **Why build a binary heap?**
 * Priority queues, Dijkstra's algorithm, task schedulers, and timer wheels all
 * rely on heap primitives for O(1) minimum lookups and O(log n) insertions
 * and extractions. Building it over a flat array reveals how complete binary
 * trees map directly into continuous memory without pointer overhead.
 */

const JS_HARNESS = `const { MinHeap } = require('./min_heap');

/**
 * Replays a sequence of operations against your binary min-heap. Read-only.
 *
 *   ["push", val]     -> null
 *   ["pop"]           -> extracted minimum value, or null if empty
 *   ["peek"]          -> minimum value without removal, or null if empty
 *   ["size"]          -> number of elements
 *   ["heapify", arr]  -> creates a new heap from array in-place, returns array
 *   ["elements"]      -> copy of the underlying array
 */
function runOps(ops) {
  const heap = new MinHeap();
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'push') {
      heap.push(op[1]);
      out.push(null);
    } else if (op[0] === 'pop') {
      out.push(heap.pop());
    } else if (op[0] === 'peek') {
      out.push(heap.peek());
    } else if (op[0] === 'size') {
      out.push(heap.size());
    } else if (op[0] === 'heapify') {
      heap.heapify(op[1]);
      out.push(heap.toArray());
    } else if (op[0] === 'elements') {
      out.push(heap.toArray());
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS = `from min_heap import MinHeap


def run_ops(ops):
    """Replay a sequence of operations against your binary min-heap. Read-only.

    ["push", val]     -> None
    ["pop"]           -> extracted minimum value, or None if empty
    ["peek"]          -> minimum value without removal, or None if empty
    ["size"]          -> number of elements
    ["heapify", arr]  -> creates a new heap from list in-place, returns list
    ["elements"]      -> copy of the underlying list
    """
    h = MinHeap()
    out = []

    for op in ops:
        if op[0] == "push":
            h.push(op[1])
            out.append(None)
        elif op[0] == "pop":
            out.append(h.pop())
        elif op[0] == "peek":
            out.append(h.peek())
        elif op[0] == "size":
            out.append(h.size())
        elif op[0] == "heapify":
            h.heapify(op[1])
            out.append(h.to_array())
        elif op[0] == "elements":
            out.append(h.to_array())
        else:
            raise ValueError(f"Unknown operation: {op[0]}")

    return out
`;

function jsMinHeap(methods: string): string {
  return `class MinHeap {
  constructor() {
    this.data = [];
  }

  parent(i) {
    return Math.floor((i - 1) / 2);
  }

  leftChild(i) {
    return 2 * i + 1;
  }

  rightChild(i) {
    return 2 * i + 2;
  }

  swap(i, j) {
    const tmp = this.data[i];
    this.data[i] = this.data[j];
    this.data[j] = tmp;
  }

  size() {
    return this.data.length;
  }

  toArray() {
    return [...this.data];
  }

${methods}
}

module.exports = { MinHeap };
`;
}

function pyMinHeap(methods: string): string {
  return `class MinHeap:
    def __init__(self):
        self.data = []

    def parent(self, i):
        return (i - 1) // 2

    def left_child(self, i):
        return 2 * i + 1

    def right_child(self, i):
        return 2 * i + 2

    def swap(self, i, j):
        self.data[i], self.data[j] = self.data[j], self.data[i]

    def size(self):
        return len(self.data)

    def to_array(self):
        return list(self.data)

${methods}
`;
}

// Step 1: Peek & Inspection
const JS_STEP_1_STARTER = `  peek() {
    // TODO: return minimum element (root at index 0) or null if empty
    return null;
  }

  push(val) {
    // Scaffolded for later steps
    this.data.push(val);
  }

  pop() {
    return null;
  }

  heapify(arr) {
    this.data = [...arr];
  }`;

const JS_STEP_1_SOLUTION = `  peek() {
    if (this.data.length === 0) return null;
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
  }

  pop() {
    return null;
  }

  heapify(arr) {
    this.data = [...arr];
  }`;

const PY_STEP_1_STARTER = `    def peek(self):
        # TODO: return minimum element (root at index 0) or None if empty
        return None

    def push(self, val):
        self.data.append(val)

    def pop(self):
        return None

    def heapify(self, arr):
        self.data = list(arr)`;

const PY_STEP_1_SOLUTION = `    def peek(self):
        if len(self.data) == 0:
            return None
        return self.data[0]

    def push(self, val):
        self.data.append(val)

    def pop(self):
        return None

    def heapify(self, arr):
        self.data = list(arr)`;

// Step 2: Push & SiftUp
const JS_STEP_2_STARTER = `  peek() {
    if (this.data.length === 0) return null;
    return this.data[0];
  }

  push(val) {
    // TODO: Append val to this.data, then siftUp from the last index
    this.data.push(val);
  }

  siftUp(idx) {
    // TODO: While idx > 0 and this.data[idx] < this.data[parent(idx)], swap and move up
  }

  pop() {
    return null;
  }

  heapify(arr) {
    this.data = [...arr];
  }`;

const JS_STEP_2_SOLUTION = `  peek() {
    if (this.data.length === 0) return null;
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
    this.siftUp(this.data.length - 1);
  }

  siftUp(idx) {
    let curr = idx;
    while (curr > 0) {
      const p = this.parent(curr);
      if (this.data[curr] < this.data[p]) {
        this.swap(curr, p);
        curr = p;
      } else {
        break;
      }
    }
  }

  pop() {
    return null;
  }

  heapify(arr) {
    this.data = [...arr];
  }`;

const PY_STEP_2_STARTER = `    def peek(self):
        if len(self.data) == 0:
            return None
        return self.data[0]

    def push(self, val):
        # TODO: Append val to self.data, then sift_up from the last index
        self.data.append(val)

    def sift_up(self, idx):
        # TODO: While idx > 0 and self.data[idx] < self.data[parent(idx)], swap and move up
        pass

    def pop(self):
        return None

    def heapify(self, arr):
        self.data = list(arr)`;

const PY_STEP_2_SOLUTION = `    def peek(self):
        if len(self.data) == 0:
            return None
        return self.data[0]

    def push(self, val):
        self.data.append(val)
        self.sift_up(len(self.data) - 1)

    def sift_up(self, idx):
        curr = idx
        while curr > 0:
            p = self.parent(curr)
            if self.data[curr] < self.data[p]:
                self.swap(curr, p)
                curr = p
            else:
                break

    def pop(self):
        return None

    def heapify(self, arr):
        self.data = list(arr)`;

// Step 3: Pop (extractMin) & SiftDown
const JS_STEP_3_STARTER = `  peek() {
    if (this.data.length === 0) return null;
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
    this.siftUp(this.data.length - 1);
  }

  siftUp(idx) {
    let curr = idx;
    while (curr > 0) {
      const p = this.parent(curr);
      if (this.data[curr] < this.data[p]) {
        this.swap(curr, p);
        curr = p;
      } else {
        break;
      }
    }
  }

  pop() {
    // TODO: If empty return null. If 1 item pop and return.
    // Otherwise swap root with last item, pop last item, siftDown(0), and return original min.
    return null;
  }

  siftDown(idx) {
    // TODO: Compare node with left and right children, swap with smallest child if smaller than current
  }

  heapify(arr) {
    this.data = [...arr];
  }`;

const JS_STEP_3_SOLUTION = `  peek() {
    if (this.data.length === 0) return null;
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
    this.siftUp(this.data.length - 1);
  }

  siftUp(idx) {
    let curr = idx;
    while (curr > 0) {
      const p = this.parent(curr);
      if (this.data[curr] < this.data[p]) {
        this.swap(curr, p);
        curr = p;
      } else {
        break;
      }
    }
  }

  pop() {
    if (this.data.length === 0) return null;
    if (this.data.length === 1) return this.data.pop();

    const min = this.data[0];
    this.data[0] = this.data.pop();
    this.siftDown(0);
    return min;
  }

  siftDown(idx) {
    let curr = idx;
    const len = this.data.length;

    while (true) {
      let smallest = curr;
      const left = this.leftChild(curr);
      const right = this.rightChild(curr);

      if (left < len && this.data[left] < this.data[smallest]) {
        smallest = left;
      }
      if (right < len && this.data[right] < this.data[smallest]) {
        smallest = right;
      }

      if (smallest !== curr) {
        this.swap(curr, smallest);
        curr = smallest;
      } else {
        break;
      }
    }
  }

  heapify(arr) {
    this.data = [...arr];
  }`;

const PY_STEP_3_STARTER = `    def peek(self):
        if len(self.data) == 0:
            return None
        return self.data[0]

    def push(self, val):
        self.data.append(val)
        self.sift_up(len(self.data) - 1)

    def sift_up(self, idx):
        curr = idx
        while curr > 0:
            p = self.parent(curr)
            if self.data[curr] < self.data[p]:
                self.swap(curr, p)
                curr = p
            else:
                break

    def pop(self):
        # TODO: Extract min, swap root with last item, sift_down(0), return min
        return None

    def sift_down(self, idx):
        # TODO: Sift element down with smaller child
        pass

    def heapify(self, arr):
        self.data = list(arr)`;

const PY_STEP_3_SOLUTION = `    def peek(self):
        if len(self.data) == 0:
            return None
        return self.data[0]

    def push(self, val):
        self.data.append(val)
        self.sift_up(len(self.data) - 1)

    def sift_up(self, idx):
        curr = idx
        while curr > 0:
            p = self.parent(curr)
            if self.data[curr] < self.data[p]:
                self.swap(curr, p)
                curr = p
            else:
                break

    def pop(self):
        if len(self.data) == 0:
            return None
        if len(self.data) == 1:
            return self.data.pop()

        min_val = self.data[0]
        self.data[0] = self.data.pop()
        self.sift_down(0)
        return min_val

    def sift_down(self, idx):
        curr = idx
        length = len(self.data)

        while True:
            smallest = curr
            left = self.left_child(curr)
            right = self.right_child(curr)

            if left < length and self.data[left] < self.data[smallest]:
                smallest = left
            if right < length and self.data[right] < self.data[smallest]:
                smallest = right

            if smallest != curr:
                self.swap(curr, smallest)
                curr = smallest
            else:
                break

    def heapify(self, arr):
        self.data = list(arr)`;

// Step 4: Linear-Time Heapify
const JS_STEP_4_STARTER = `  peek() {
    if (this.data.length === 0) return null;
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
    this.siftUp(this.data.length - 1);
  }

  siftUp(idx) {
    let curr = idx;
    while (curr > 0) {
      const p = this.parent(curr);
      if (this.data[curr] < this.data[p]) {
        this.swap(curr, p);
        curr = p;
      } else {
        break;
      }
    }
  }

  pop() {
    if (this.data.length === 0) return null;
    if (this.data.length === 1) return this.data.pop();

    const min = this.data[0];
    this.data[0] = this.data.pop();
    this.siftDown(0);
    return min;
  }

  siftDown(idx) {
    let curr = idx;
    const len = this.data.length;

    while (true) {
      let smallest = curr;
      const left = this.leftChild(curr);
      const right = this.rightChild(curr);

      if (left < len && this.data[left] < this.data[smallest]) {
        smallest = left;
      }
      if (right < len && this.data[right] < this.data[smallest]) {
        smallest = right;
      }

      if (smallest !== curr) {
        this.swap(curr, smallest);
        curr = smallest;
      } else {
        break;
      }
    }
  }

  heapify(arr) {
    // TODO: Copy arr to this.data, then call siftDown from Math.floor(len / 2) - 1 down to 0
    this.data = [...arr];
  }`;

const JS_STEP_4_SOLUTION = `  peek() {
    if (this.data.length === 0) return null;
    return this.data[0];
  }

  push(val) {
    this.data.push(val);
    this.siftUp(this.data.length - 1);
  }

  siftUp(idx) {
    let curr = idx;
    while (curr > 0) {
      const p = this.parent(curr);
      if (this.data[curr] < this.data[p]) {
        this.swap(curr, p);
        curr = p;
      } else {
        break;
      }
    }
  }

  pop() {
    if (this.data.length === 0) return null;
    if (this.data.length === 1) return this.data.pop();

    const min = this.data[0];
    this.data[0] = this.data.pop();
    this.siftDown(0);
    return min;
  }

  siftDown(idx) {
    let curr = idx;
    const len = this.data.length;

    while (true) {
      let smallest = curr;
      const left = this.leftChild(curr);
      const right = this.rightChild(curr);

      if (left < len && this.data[left] < this.data[smallest]) {
        smallest = left;
      }
      if (right < len && this.data[right] < this.data[smallest]) {
        smallest = right;
      }

      if (smallest !== curr) {
        this.swap(curr, smallest);
        curr = smallest;
      } else {
        break;
      }
    }
  }

  heapify(arr) {
    this.data = [...arr];
    const startIndex = Math.floor(this.data.length / 2) - 1;
    for (let i = startIndex; i >= 0; i--) {
      this.siftDown(i);
    }
  }`;

const PY_STEP_4_STARTER = `    def peek(self):
        if len(self.data) == 0:
            return None
        return self.data[0]

    def push(self, val):
        self.data.append(val)
        self.sift_up(len(self.data) - 1)

    def sift_up(self, idx):
        curr = idx
        while curr > 0:
            p = self.parent(curr)
            if self.data[curr] < self.data[p]:
                self.swap(curr, p)
                curr = p
            else:
                break

    def pop(self):
        if len(self.data) == 0:
            return None
        if len(self.data) == 1:
            return self.data.pop()

        min_val = self.data[0]
        self.data[0] = self.data.pop()
        self.sift_down(0)
        return min_val

    def sift_down(self, idx):
        curr = idx
        length = len(self.data)

        while True:
            smallest = curr
            left = self.left_child(curr)
            right = self.right_child(curr)

            if left < length and self.data[left] < self.data[smallest]:
                smallest = left
            if right < length and self.data[right] < self.data[smallest]:
                smallest = right

            if smallest != curr:
                self.swap(curr, smallest)
                curr = smallest
            else:
                break

    def heapify(self, arr):
        # TODO: Copy arr to self.data, then call sift_down from (len // 2) - 1 down to 0
        self.data = list(arr)`;

const PY_STEP_4_SOLUTION = `    def peek(self):
        if len(self.data) == 0:
            return None
        return self.data[0]

    def push(self, val):
        self.data.append(val)
        self.sift_up(len(self.data) - 1)

    def sift_up(self, idx):
        curr = idx
        while curr > 0:
            p = self.parent(curr)
            if self.data[curr] < self.data[p]:
                self.swap(curr, p)
                curr = p
            else:
                break

    def pop(self):
        if len(self.data) == 0:
            return None
        if len(self.data) == 1:
            return self.data.pop()

        min_val = self.data[0]
        self.data[0] = self.data.pop()
        self.sift_down(0)
        return min_val

    def sift_down(self, idx):
        curr = idx
        length = len(self.data)

        while True:
            smallest = curr
            left = self.left_child(curr)
            right = self.right_child(curr)

            if left < length and self.data[left] < self.data[smallest]:
                smallest = left
            if right < length and self.data[right] < self.data[smallest]:
                smallest = right

            if smallest != curr:
                self.swap(curr, smallest)
                curr = smallest
            else:
                break

    def heapify(self, arr):
        self.data = list(arr)
        start_idx = (len(self.data) // 2) - 1
        for i in range(start_idx, -1, -1):
            self.sift_down(i)`;

export const minHeapChallenge: ChallengeInput = {
  tier: 'challenge',
  slug: 'min-heap',
  title: 'Binary Min-Heap',
  category: 'dsa',
  difficulty: 'medium',
  summary:
    'Construct an array-backed binary min-heap with parent/child arithmetic, siftUp, siftDown, and linear-time heapify.',
  topics: ['heaps', 'arrays', 'sorting'],
  recommendedAfter: ['heaps'],

  brief: `A Binary Min-Heap is a complete binary tree where every parent node is smaller than or equal to its children.

Because the tree is always complete, we can store it directly in a flat array without pointer allocations:
- Node index: $i$
- Parent index: $\\lfloor (i - 1) / 2 \\rfloor$
- Left child index: $2i + 1$
- Right child index: $2i + 2$

In this build, you will construct a **Binary Min-Heap from scratch**:
1. Implement constant-time root inspection (\`peek\`).
2. Add elements with $O(\\log n)$ upward bubbling (\`push\` and \`siftUp\`).
3. Extract the minimum element with $O(\\log n)$ downward bubbling (\`pop\` and \`siftDown\`).
4. Transform an unsorted array into a valid min-heap in $O(n)$ linear time (\`heapify\`).`,

  steps: [
    {
      slug: 'peek-and-structure',
      title: 'Root Inspection & Array Representation',
      brief: `Start by understanding how the tree maps to array indices and implement \`peek()\`.

- \`peek()\`: Returns the minimum value (the root at index \`0\`) without removing it. If the heap is empty, return \`null\` / \`None\`.
- \`size()\`: Returns the number of elements in the heap.`,
      hints: [
        'In a min-heap, the smallest item is always at index `0`.',
        'Check if `this.data.length === 0` before returning `this.data[0]`.',
      ],
      entryFile: 'harness',
      focus: 'min_heap',
      files: [
        {
          name: 'min_heap',
          starterCode: {
            javascript: jsMinHeap(JS_STEP_1_STARTER),
            python: pyMinHeap(PY_STEP_1_STARTER),
          },
          solution: {
            javascript: jsMinHeap(JS_STEP_1_SOLUTION),
            python: pyMinHeap(PY_STEP_1_SOLUTION),
          },
        },
        {
          name: 'harness',
          label: 'harness (read-only)',
          editable: false,
          starterCode: { javascript: JS_HARNESS, python: PY_HARNESS },
        },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'peeks empty and non-empty heap',
            args: [
              [
                ['peek'],
                ['size'],
                ['push', 42],
                ['peek'],
                ['size'],
              ],
            ],
            expected: [null, 0, null, 42, 1],
          },
        ],
      },
    },
    {
      slug: 'push-and-sift-up',
      title: 'Insertion & Sift-Up',
      brief: `When inserting an element, we place it at the end of the array to maintain the complete tree structure, and then **bubble it up** until the min-heap property is restored.

Implement \`push(val)\` and \`siftUp(idx)\`:
- Append \`val\` to \`this.data\`.
- Call \`siftUp\` starting at the last index.
- While the current element is smaller than its parent, swap them and continue upward.`,
      hints: [
        'Parent index is `this.parent(curr)` which computes `Math.floor((curr - 1) / 2)`.',
        'Stop when `curr === 0` or when `this.data[curr] >= this.data[p]`.',
      ],
      entryFile: 'harness',
      focus: 'min_heap',
      files: [
        {
          name: 'min_heap',
          starterCode: {
            javascript: jsMinHeap(JS_STEP_2_STARTER),
            python: pyMinHeap(PY_STEP_2_STARTER),
          },
          solution: {
            javascript: jsMinHeap(JS_STEP_2_SOLUTION),
            python: pyMinHeap(PY_STEP_2_SOLUTION),
          },
        },
        {
          name: 'harness',
          label: 'harness (read-only)',
          editable: false,
          starterCode: { javascript: JS_HARNESS, python: PY_HARNESS },
        },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'maintains minimum at root after insertions',
            args: [
              [
                ['push', 10],
                ['push', 5],
                ['push', 15],
                ['push', 2],
                ['peek'],
                ['elements'],
              ],
            ],
            expected: [null, null, null, null, 2, [2, 5, 15, 10]],
          },
        ],
      },
    },
    {
      slug: 'pop-and-sift-down',
      title: 'Extract Minimum & Sift-Down',
      brief: `To remove the minimum element (\`pop\`), we cannot simply shift the array as that would take $O(n)$ time.

Instead:
1. Save the root element at index \`0\`.
2. Move the last element of the array to index \`0\` (\`this.data[0] = this.data.pop()\`).
3. Call \`siftDown(0)\` to bubble the element downward by swapping with its **smallest child** until the min-heap property holds.
4. Return the original minimum value.`,
      hints: [
        'A node may have 0, 1, or 2 children. Check that `left < length` and `right < length` before accessing.',
        'Find `smallest` among `curr`, `left`, and `right`, and swap with `smallest` if `smallest !== curr`.',
      ],
      entryFile: 'harness',
      focus: 'min_heap',
      files: [
        {
          name: 'min_heap',
          starterCode: {
            javascript: jsMinHeap(JS_STEP_3_STARTER),
            python: pyMinHeap(PY_STEP_3_STARTER),
          },
          solution: {
            javascript: jsMinHeap(JS_STEP_3_SOLUTION),
            python: pyMinHeap(PY_STEP_3_SOLUTION),
          },
        },
        {
          name: 'harness',
          label: 'harness (read-only)',
          editable: false,
          starterCode: { javascript: JS_HARNESS, python: PY_HARNESS },
        },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'extracts elements in sorted ascending order',
            args: [
              [
                ['push', 20],
                ['push', 5],
                ['push', 10],
                ['push', 1],
                ['push', 30],
                ['pop'],
                ['pop'],
                ['pop'],
                ['pop'],
                ['pop'],
                ['pop'],
              ],
            ],
            expected: [null, null, null, null, null, 1, 5, 10, 20, 30, null],
          },
        ],
      },
    },
    {
      slug: 'heapify',
      title: 'Linear-Time Heapify',
      brief: `Inserting $n$ elements one-by-one with \`push\` takes $O(n \\log n)$ time.

By running \`siftDown\` in reverse level order — starting at the last internal non-leaf node ($\\lfloor n/2 \\rfloor - 1$) down to index \`0\` — we can build a valid min-heap in **$O(n)$ linear time**!

Implement \`heapify(arr)\`:
- Store a copy of \`arr\` in \`this.data\`.
- Iterate from \`Math.floor(this.data.length / 2) - 1\` down to \`0\`, calling \`this.siftDown(i)\`.`,
      hints: [
        'All nodes at index `>= Math.floor(len / 2)` are leaf nodes with no children, so they already satisfy the heap property trivially.',
        'Sifting down bottom-up guarantees that when node `i` is sifted down, both of its subtrees are already valid heaps.',
      ],
      entryFile: 'harness',
      focus: 'min_heap',
      files: [
        {
          name: 'min_heap',
          starterCode: {
            javascript: jsMinHeap(JS_STEP_4_STARTER),
            python: pyMinHeap(PY_STEP_4_STARTER),
          },
          solution: {
            javascript: jsMinHeap(JS_STEP_4_SOLUTION),
            python: pyMinHeap(PY_STEP_4_SOLUTION),
          },
        },
        {
          name: 'harness',
          label: 'harness (read-only)',
          editable: false,
          starterCode: { javascript: JS_HARNESS, python: PY_HARNESS },
        },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'converts unsorted array into valid min-heap',
            args: [
              [
                ['heapify', [9, 4, 7, 1, 3, 6, 5]],
                ['peek'],
                ['pop'],
                ['pop'],
                ['pop'],
              ],
            ],
            expected: [
              [1, 3, 5, 4, 9, 6, 7],
              1,
              1,
              3,
              4,
            ],
          },
        ],
      },
    },
  ],
};
