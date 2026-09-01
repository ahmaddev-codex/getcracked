import type { ChallengeInput } from '../../schema';

/**
 * Build a Binary Search Tree (BST) from scratch.
 *
 * **Why build a binary search tree?**
 * Binary search trees bridge arrays and linked lists: they offer dynamic
 * insertions without shifting memory blocks, while maintaining sorted order
 * and O(log n) search performance. Implementing the 3-case node deletion
 * algorithm cements recursive tree manipulation.
 */

const JS_HARNESS = `const { BinarySearchTree } = require('./binary_search_tree');

/**
 * Replays a sequence of operations against your BST. Read-only.
 *
 *   ["insert", val]    -> null
 *   ["search", val]    -> true or false
 *   ["delete", val]    -> true if deleted, false if absent
 *   ["inOrder"]        -> sorted array of elements
 *   ["min"]            -> minimum element or null
 *   ["max"]            -> maximum element or null
 *   ["size"]           -> number of nodes
 */
function runOps(ops) {
  const bst = new BinarySearchTree();
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'insert') {
      bst.insert(op[1]);
      out.push(null);
    } else if (op[0] === 'search') {
      out.push(bst.search(op[1]));
    } else if (op[0] === 'delete') {
      out.push(bst.delete(op[1]));
    } else if (op[0] === 'inOrder') {
      out.push(bst.inOrder());
    } else if (op[0] === 'min') {
      out.push(bst.min());
    } else if (op[0] === 'max') {
      out.push(bst.max());
    } else if (op[0] === 'size') {
      out.push(bst.size());
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS = `from binary_search_tree import BinarySearchTree


def run_ops(ops):
    """Replay a sequence of operations against your BST. Read-only.

    ["insert", val]    -> None
    ["search", val]    -> True or False
    ["delete", val]    -> True if deleted, False if absent
    ["inOrder"]        -> sorted list of elements
    ["min"]            -> minimum element or None
    ["max"]            -> maximum element or None
    ["size"]           -> number of nodes
    """
    bst = BinarySearchTree()
    out = []

    for op in ops:
        if op[0] == "insert":
            bst.insert(op[1])
            out.append(None)
        elif op[0] == "search":
            out.append(bst.search(op[1]))
        elif op[0] == "delete":
            out.append(bst.delete(op[1]))
        elif op[0] == "inOrder":
            out.append(bst.in_order())
        elif op[0] == "min":
            out.append(bst.min())
        elif op[0] == "max":
            out.append(bst.max())
        elif op[0] == "size":
            out.append(bst.size())
        else:
            raise ValueError(f"Unknown operation: {op[0]}")

    return out
`;

function jsBST(methods: string): string {
  return `class BSTNode {
  constructor(value) {
    this.value = value;
    this.left = null;
    this.right = null;
  }
}

class BinarySearchTree {
  constructor() {
    this.root = null;
    this.count = 0;
  }

  size() {
    return this.count;
  }

${methods}
}

module.exports = { BinarySearchTree, BSTNode };
`;
}

function pyBST(methods: string): string {
  return `class BSTNode:
    def __init__(self, value):
        self.value = value
        self.left = None
        self.right = None


class BinarySearchTree:
    def __init__(self):
        self.root = None
        self.count = 0

    def size(self):
        return self.count

${methods}
`;
}

// Step 1: Insertion
const JS_STEP_1_STARTER = `  insert(val) {
    // TODO: Insert node maintaining the BST invariant (left < val < right). Ignore duplicate values.
  }

  search(val) {
    return false;
  }

  inOrder() {
    return [];
  }

  min() {
    return null;
  }

  max() {
    return null;
  }

  delete(val) {
    return false;
  }`;

const JS_STEP_1_SOLUTION = `  insert(val) {
    const node = new BSTNode(val);
    if (!this.root) {
      this.root = node;
      this.count++;
      return;
    }

    let curr = this.root;
    while (true) {
      if (val === curr.value) return; // ignore duplicates
      if (val < curr.value) {
        if (!curr.left) {
          curr.left = node;
          this.count++;
          return;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = node;
          this.count++;
          return;
        }
        curr = curr.right;
      }
    }
  }

  search(val) {
    let curr = this.root;
    while (curr) {
      if (val === curr.value) return true;
      curr = val < curr.value ? curr.left : curr.right;
    }
    return false;
  }

  inOrder() {
    return [];
  }

  min() {
    return null;
  }

  max() {
    return null;
  }

  delete(val) {
    return false;
  }`;

const PY_STEP_1_STARTER = `    def insert(self, val):
        # TODO: Insert node maintaining the BST invariant (left < val < right). Ignore duplicates.
        pass

    def search(self, val):
        return False

    def in_order(self):
        return []

    def min(self):
        return None

    def max(self):
        return None

    def delete(self, val):
        return False`;

const PY_STEP_1_SOLUTION = `    def insert(self, val):
        node = BSTNode(val)
        if not self.root:
            self.root = node
            self.count += 1
            return

        curr = self.root
        while True:
            if val == curr.value:
                return
            if val < curr.value:
                if not curr.left:
                    curr.left = node
                    self.count += 1
                    return
                curr = curr.left
            else:
                if not curr.right:
                    curr.right = node
                    self.count += 1
                    return
                curr = curr.right

    def search(self, val):
        curr = self.root
        while curr:
            if val == curr.value:
                return True
            curr = curr.left if val < curr.value else curr.right
        return False

    def in_order(self):
        return []

    def min(self):
        return None

    def max(self):
        return None

    def delete(self, val):
        return False`;

// Step 2: Search
const JS_STEP_2_STARTER = `  insert(val) {
    const node = new BSTNode(val);
    if (!this.root) {
      this.root = node;
      this.count++;
      return;
    }

    let curr = this.root;
    while (true) {
      if (val === curr.value) return;
      if (val < curr.value) {
        if (!curr.left) {
          curr.left = node;
          this.count++;
          return;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = node;
          this.count++;
          return;
        }
        curr = curr.right;
      }
    }
  }

  search(val) {
    // TODO: Search for val in O(log n) time. Return true if found, false otherwise.
    return false;
  }

  inOrder() {
    return [];
  }

  min() {
    return null;
  }

  max() {
    return null;
  }

  delete(val) {
    return false;
  }`;

const JS_STEP_2_SOLUTION = `  insert(val) {
    const node = new BSTNode(val);
    if (!this.root) {
      this.root = node;
      this.count++;
      return;
    }

    let curr = this.root;
    while (true) {
      if (val === curr.value) return;
      if (val < curr.value) {
        if (!curr.left) {
          curr.left = node;
          this.count++;
          return;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = node;
          this.count++;
          return;
        }
        curr = curr.right;
      }
    }
  }

  search(val) {
    let curr = this.root;
    while (curr) {
      if (val === curr.value) return true;
      curr = val < curr.value ? curr.left : curr.right;
    }
    return false;
  }

  inOrder() {
    return [];
  }

  min() {
    return null;
  }

  max() {
    return null;
  }

  delete(val) {
    return false;
  }`;

const PY_STEP_2_STARTER = `    def insert(self, val):
        node = BSTNode(val)
        if not self.root:
            self.root = node
            self.count += 1
            return

        curr = self.root
        while True:
            if val == curr.value:
                return
            if val < curr.value:
                if not curr.left:
                    curr.left = node
                    self.count += 1
                    return
                curr = curr.left
            else:
                if not curr.right:
                    curr.right = node
                    self.count += 1
                    return
                curr = curr.right

    def search(self, val):
        # TODO: Search for val in O(log n) time. Return True if found, False otherwise.
        return False

    def in_order(self):
        return []

    def min(self):
        return None

    def max(self):
        return None

    def delete(self, val):
        return False`;

const PY_STEP_2_SOLUTION = `    def insert(self, val):
        node = BSTNode(val)
        if not self.root:
            self.root = node
            self.count += 1
            return

        curr = self.root
        while True:
            if val == curr.value:
                return
            if val < curr.value:
                if not curr.left:
                    curr.left = node
                    self.count += 1
                    return
                curr = curr.left
            else:
                if not curr.right:
                    curr.right = node
                    self.count += 1
                    return
                curr = curr.right

    def search(self, val):
        curr = self.root
        while curr:
            if val == curr.value:
                return True
            curr = curr.left if val < curr.value else curr.right
        return False

    def in_order(self):
        return []

    def min(self):
        return None

    def max(self):
        return None

    def delete(self, val):
        return False`;

// Step 3: In-Order Traversal & Min/Max
const JS_STEP_3_STARTER = `  insert(val) {
    const node = new BSTNode(val);
    if (!this.root) {
      this.root = node;
      this.count++;
      return;
    }

    let curr = this.root;
    while (true) {
      if (val === curr.value) return;
      if (val < curr.value) {
        if (!curr.left) {
          curr.left = node;
          this.count++;
          return;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = node;
          this.count++;
          return;
        }
        curr = curr.right;
      }
    }
  }

  search(val) {
    let curr = this.root;
    while (curr) {
      if (val === curr.value) return true;
      curr = val < curr.value ? curr.left : curr.right;
    }
    return false;
  }

  inOrder() {
    // TODO: Left -> Root -> Right traversal returning array of sorted values
    return [];
  }

  min() {
    // TODO: Follow left pointers to the minimum value, or return null if empty
    return null;
  }

  max() {
    // TODO: Follow right pointers to the maximum value, or return null if empty
    return null;
  }

  delete(val) {
    return false;
  }`;

const JS_STEP_3_SOLUTION = `  insert(val) {
    const node = new BSTNode(val);
    if (!this.root) {
      this.root = node;
      this.count++;
      return;
    }

    let curr = this.root;
    while (true) {
      if (val === curr.value) return;
      if (val < curr.value) {
        if (!curr.left) {
          curr.left = node;
          this.count++;
          return;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = node;
          this.count++;
          return;
        }
        curr = curr.right;
      }
    }
  }

  search(val) {
    let curr = this.root;
    while (curr) {
      if (val === curr.value) return true;
      curr = val < curr.value ? curr.left : curr.right;
    }
    return false;
  }

  inOrder() {
    const res = [];
    const traverse = (node) => {
      if (!node) return;
      traverse(node.left);
      res.push(node.value);
      traverse(node.right);
    };
    traverse(this.root);
    return res;
  }

  min() {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.left) {
      curr = curr.left;
    }
    return curr.value;
  }

  max() {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.right) {
      curr = curr.right;
    }
    return curr.value;
  }

  delete(val) {
    return false;
  }`;

const PY_STEP_3_STARTER = `    def insert(self, val):
        node = BSTNode(val)
        if not self.root:
            self.root = node
            self.count += 1
            return

        curr = self.root
        while True:
            if val == curr.value:
                return
            if val < curr.value:
                if not curr.left:
                    curr.left = node
                    self.count += 1
                    return
                curr = curr.left
            else:
                if not curr.right:
                    curr.right = node
                    self.count += 1
                    return
                curr = curr.right

    def search(self, val):
        curr = self.root
        while curr:
            if val == curr.value:
                return True
            curr = curr.left if val < curr.value else curr.right
        return False

    def in_order(self):
        # TODO: Left -> Root -> Right traversal returning list of sorted values
        return []

    def min(self):
        # TODO: Follow left pointers to the minimum value, or return None if empty
        return None

    def max(self):
        # TODO: Follow right pointers to the maximum value, or return None if empty
        return None

    def delete(self, val):
        return False`;

const PY_STEP_3_SOLUTION = `    def insert(self, val):
        node = BSTNode(val)
        if not self.root:
            self.root = node
            self.count += 1
            return

        curr = self.root
        while True:
            if val == curr.value:
                return
            if val < curr.value:
                if not curr.left:
                    curr.left = node
                    self.count += 1
                    return
                curr = curr.left
            else:
                if not curr.right:
                    curr.right = node
                    self.count += 1
                    return
                curr = curr.right

    def search(self, val):
        curr = self.root
        while curr:
            if val == curr.value:
                return True
            curr = curr.left if val < curr.value else curr.right
        return False

    def in_order(self):
        res = []
        def traverse(node):
            if not node:
                return
            traverse(node.left)
            res.append(node.value)
            traverse(node.right)
        traverse(self.root)
        return res

    def min(self):
        if not self.root:
            return None
        curr = self.root
        while curr.left:
            curr = curr.left
        return curr.value

    def max(self):
        if not self.root:
            return None
        curr = self.root
        while curr.right:
            curr = curr.right
        return curr.value

    def delete(self, val):
        return False`;

// Step 4: Deletion (3 cases)
const JS_STEP_4_STARTER = `  insert(val) {
    const node = new BSTNode(val);
    if (!this.root) {
      this.root = node;
      this.count++;
      return;
    }

    let curr = this.root;
    while (true) {
      if (val === curr.value) return;
      if (val < curr.value) {
        if (!curr.left) {
          curr.left = node;
          this.count++;
          return;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = node;
          this.count++;
          return;
        }
        curr = curr.right;
      }
    }
  }

  search(val) {
    let curr = this.root;
    while (curr) {
      if (val === curr.value) return true;
      curr = val < curr.value ? curr.left : curr.right;
    }
    return false;
  }

  inOrder() {
    const res = [];
    const traverse = (node) => {
      if (!node) return;
      traverse(node.left);
      res.push(node.value);
      traverse(node.right);
    };
    traverse(this.root);
    return res;
  }

  min() {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.left) {
      curr = curr.left;
    }
    return curr.value;
  }

  max() {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.right) {
      curr = curr.right;
    }
    return curr.value;
  }

  delete(val) {
    // TODO: Handle 0 children (leaf), 1 child, and 2 children (replace with in-order successor). Return true if deleted, false if not found.
    return false;
  }`;

const JS_STEP_4_SOLUTION = `  insert(val) {
    const node = new BSTNode(val);
    if (!this.root) {
      this.root = node;
      this.count++;
      return;
    }

    let curr = this.root;
    while (true) {
      if (val === curr.value) return;
      if (val < curr.value) {
        if (!curr.left) {
          curr.left = node;
          this.count++;
          return;
        }
        curr = curr.left;
      } else {
        if (!curr.right) {
          curr.right = node;
          this.count++;
          return;
        }
        curr = curr.right;
      }
    }
  }

  search(val) {
    let curr = this.root;
    while (curr) {
      if (val === curr.value) return true;
      curr = val < curr.value ? curr.left : curr.right;
    }
    return false;
  }

  inOrder() {
    const res = [];
    const traverse = (node) => {
      if (!node) return;
      traverse(node.left);
      res.push(node.value);
      traverse(node.right);
    };
    traverse(this.root);
    return res;
  }

  min() {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.left) {
      curr = curr.left;
    }
    return curr.value;
  }

  max() {
    if (!this.root) return null;
    let curr = this.root;
    while (curr.right) {
      curr = curr.right;
    }
    return curr.value;
  }

  delete(val) {
    let deleted = false;

    const removeNode = (node, target) => {
      if (!node) return null;

      if (target < node.value) {
        node.left = removeNode(node.left, target);
        return node;
      } else if (target > node.value) {
        node.right = removeNode(node.right, target);
        return node;
      } else {
        deleted = true;
        // Case 1: No children (leaf)
        if (!node.left && !node.right) {
          return null;
        }
        // Case 2: One child
        if (!node.left) return node.right;
        if (!node.right) return node.left;

        // Case 3: Two children -> find successor (min in right subtree)
        let successor = node.right;
        while (successor.left) {
          successor = successor.left;
        }
        node.value = successor.value;
        node.right = removeNode(node.right, successor.value);
        return node;
      }
    };

    this.root = removeNode(this.root, val);
    if (deleted) {
      this.count--;
    }
    return deleted;
  }`;

const PY_STEP_4_STARTER = `    def insert(self, val):
        node = BSTNode(val)
        if not self.root:
            self.root = node
            self.count += 1
            return

        curr = self.root
        while True:
            if val == curr.value:
                return
            if val < curr.value:
                if not curr.left:
                    curr.left = node
                    self.count += 1
                    return
                curr = curr.left
            else:
                if not curr.right:
                    curr.right = node
                    self.count += 1
                    return
                curr = curr.right

    def search(self, val):
        curr = self.root
        while curr:
            if val == curr.value:
                return True
            curr = curr.left if val < curr.value else curr.right
        return False

    def in_order(self):
        res = []
        def traverse(node):
            if not node:
                return
            traverse(node.left)
            res.append(node.value)
            traverse(node.right)
        traverse(self.root)
        return res

    def min(self):
        if not self.root:
            return None
        curr = self.root
        while curr.left:
            curr = curr.left
        return curr.value

    def max(self):
        if not self.root:
            return None
        curr = self.root
        while curr.right:
            curr = curr.right
        return curr.value

    def delete(self, val):
        # TODO: Handle 0, 1, and 2 children (replace with successor). Return True if deleted, False if not found.
        return False`;

const PY_STEP_4_SOLUTION = `    def insert(self, val):
        node = BSTNode(val)
        if not self.root:
            self.root = node
            self.count += 1
            return

        curr = self.root
        while True:
            if val == curr.value:
                return
            if val < curr.value:
                if not curr.left:
                    curr.left = node
                    self.count += 1
                    return
                curr = curr.left
            else:
                if not curr.right:
                    curr.right = node
                    self.count += 1
                    return
                curr = curr.right

    def search(self, val):
        curr = self.root
        while curr:
            if val == curr.value:
                return True
            curr = curr.left if val < curr.value else curr.right
        return False

    def in_order(self):
        res = []
        def traverse(node):
            if not node:
                return
            traverse(node.left)
            res.append(node.value)
            traverse(node.right)
        traverse(self.root)
        return res

    def min(self):
        if not self.root:
            return None
        curr = self.root
        while curr.left:
            curr = curr.left
        return curr.value

    def max(self):
        if not self.root:
            return None
        curr = self.root
        while curr.right:
            curr = curr.right
        return curr.value

    def delete(self, val):
        deleted = False

        def remove_node(node, target):
            nonlocal deleted
            if not node:
                return None

            if target < node.value:
                node.left = remove_node(node.left, target)
                return node
            elif target > node.value:
                node.right = remove_node(node.right, target)
                return node
            else:
                deleted = True
                if not node.left and not node.right:
                    return None
                if not node.left:
                    return node.right
                if not node.right:
                    return node.left

                successor = node.right
                while successor.left:
                    successor = successor.left
                node.value = successor.value
                node.right = remove_node(node.right, successor.value)
                return node

        self.root = remove_node(self.root, val)
        if deleted:
            self.count -= 1
        return deleted`;

export const binarySearchTreeChallenge: ChallengeInput = {
  tier: 'challenge',
  slug: 'binary-search-tree',
  title: 'Binary Search Tree',
  category: 'dsa',
  difficulty: 'medium',
  summary:
    'Construct a Binary Search Tree with node pointers, recursive insertion, lookup, in-order traversal, and 3-case deletion.',
  topics: ['trees', 'recursion'],
  recommendedAfter: ['trees'],

  brief: `A Binary Search Tree (BST) is a node-based binary tree where every node satisfies the **BST Invariant**:
- All keys in the **left subtree** are strictly less than the node's key.
- All keys in the **right subtree** are strictly greater than the node's key.

In this build, you will construct a **Binary Search Tree from scratch**:
1. Implement ordered node insertion (\`insert\`).
2. Search keys with $O(\\log n)$ branching (\`search\`).
3. Traverse keys in sorted order (\`inOrder\`) and find extremes (\`min\` / \`max\`).
4. Implement recursive **3-case node deletion** (\`delete\`).`,

  steps: [
    {
      slug: 'insert-and-invariants',
      title: 'BSTNode & Ordered Insertion',
      brief: `Start by implementing \`insert(val)\` to place nodes according to the BST invariant.

- If the tree is empty (\`this.root === null\`), set \`this.root = new BSTNode(val)\`.
- Otherwise, traverse down from root:
  - If \`val === curr.value\`, ignore duplicate values and return.
  - If \`val < curr.value\`, branch left. If \`!curr.left\`, attach the new node.
  - If \`val > curr.value\`, branch right. If \`!curr.right\`, attach the new node.
- Increment \`this.count\` when a node is added.`,
      hints: [
        'You can implement `insert` iteratively with a `while(true)` loop or recursively.',
        'Don\'t increment `this.count` if the value is a duplicate.',
      ],
      entryFile: 'harness',
      focus: 'binary_search_tree',
      files: [
        {
          name: 'binary_search_tree',
          starterCode: {
            javascript: jsBST(JS_STEP_1_STARTER),
            python: pyBST(PY_STEP_1_STARTER),
          },
          solution: {
            javascript: jsBST(JS_STEP_1_SOLUTION),
            python: pyBST(PY_STEP_1_SOLUTION),
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
            name: 'inserts values into BST without duplicates',
            args: [
              [
                ['insert', 10],
                ['insert', 5],
                ['insert', 15],
                ['insert', 5], // duplicate
                ['size'],
                ['search', 5],
                ['search', 99],
              ],
            ],
            expected: [null, null, null, null, 3, true, false],
          },
        ],
      },
    },
    {
      slug: 'search-lookup',
      title: 'Binary Search Lookup',
      brief: `Implement \`search(val)\` to locate values in $O(\\log n)$ average time.

- Starting at \`root\`:
  - If node is null, return \`false\`.
  - If \`val === node.value\`, return \`true\`.
  - If \`val < node.value\`, continue search in left subtree.
  - If \`val > node.value\`, continue search in right subtree.`,
      hints: [
        'A single `while(curr)` loop can walk from root to leaf in O(height) steps.',
        'At each step, compare `val` to `curr.value`: if equal return `true`, else branch `curr = val < curr.value ? curr.left : curr.right`.',
      ],
      entryFile: 'harness',
      focus: 'binary_search_tree',
      files: [
        {
          name: 'binary_search_tree',
          starterCode: {
            javascript: jsBST(JS_STEP_2_STARTER),
            python: pyBST(PY_STEP_2_STARTER),
          },
          solution: {
            javascript: jsBST(JS_STEP_2_SOLUTION),
            python: pyBST(PY_STEP_2_SOLUTION),
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
            name: 'finds existing and absent values across tree',
            args: [
              [
                ['insert', 50],
                ['insert', 30],
                ['insert', 70],
                ['insert', 20],
                ['insert', 40],
                ['search', 40],
                ['search', 70],
                ['search', 25],
              ],
            ],
            expected: [null, null, null, null, null, true, true, false],
          },
        ],
      },
    },
    {
      slug: 'in-order-and-extremes',
      title: 'In-Order Traversal & Extremes',
      brief: `In-order traversal of a BST (Left $\\to$ Root $\\to$ Right) always yields elements in strictly ascending sorted order.

- \`inOrder()\`: Returns an array/list of all values in ascending order.
- \`min()\`: Follows left pointers to find the smallest value (or \`null\` / \`None\` if empty).
- \`max()\`: Follows right pointers to find the largest value (or \`null\` / \`None\` if empty).`,
      hints: [
        'Use recursive DFS: `traverse(node.left)`, then `push(node.value)`, then `traverse(node.right)`.',
        '`min` is simply the leftmost node; `max` is the rightmost node.',
      ],
      entryFile: 'harness',
      focus: 'binary_search_tree',
      files: [
        {
          name: 'binary_search_tree',
          starterCode: {
            javascript: jsBST(JS_STEP_3_STARTER),
            python: pyBST(PY_STEP_3_STARTER),
          },
          solution: {
            javascript: jsBST(JS_STEP_3_SOLUTION),
            python: pyBST(PY_STEP_3_SOLUTION),
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
            name: 'produces sorted in-order traversal and finds min/max',
            args: [
              [
                ['insert', 20],
                ['insert', 10],
                ['insert', 30],
                ['insert', 5],
                ['insert', 15],
                ['inOrder'],
                ['min'],
                ['max'],
              ],
            ],
            expected: [
              null,
              null,
              null,
              null,
              null,
              [5, 10, 15, 20, 30],
              5,
              30,
            ],
          },
        ],
      },
    },
    {
      slug: 'three-case-deletion',
      title: 'Three-Case Node Deletion',
      brief: `Node deletion is the most subtle BST operation because removing a node must preserve the binary search invariant for all subtrees.

Implement \`delete(val)\` handling all 3 cases:
1. **Case 1: Leaf Node (0 children)** $\\to$ Remove node reference by returning \`null\`.
2. **Case 2: 1 Child** $\\to$ Replace node with its single non-null child.
3. **Case 3: 2 Children** $\\to$ Find the **in-order successor** (the minimum node in the right subtree), copy its value into the current node, and recursively delete the successor from the right subtree.

Return \`true\` if the node was deleted, or \`false\` if it was not found.`,
      hints: [
        'A recursive helper `removeNode(node, val)` returning the updated subtree root is the standard approach.',
        'Successor: `let s = node.right; while(s.left) s = s.left;`',
        'Decrement `this.count` / `self.count` only if a node was actually found and deleted.',
      ],
      entryFile: 'harness',
      focus: 'binary_search_tree',
      files: [
        {
          name: 'binary_search_tree',
          starterCode: {
            javascript: jsBST(JS_STEP_4_STARTER),
            python: pyBST(PY_STEP_4_STARTER),
          },
          solution: {
            javascript: jsBST(JS_STEP_4_SOLUTION),
            python: pyBST(PY_STEP_4_SOLUTION),
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
            name: 'deletes leaf, single-child, and two-child nodes',
            args: [
              [
                ['insert', 50],
                ['insert', 30],
                ['insert', 70],
                ['insert', 20],
                ['insert', 40],
                ['insert', 60],
                ['insert', 80],
                ['delete', 20], // Case 1: Leaf
                ['inOrder'],
                ['delete', 30], // Case 2: One child (40)
                ['inOrder'],
                ['delete', 50], // Case 3: Root with 2 children (successor is 60)
                ['inOrder'],
                ['delete', 999], // Not found
                ['size'],
              ],
            ],
            expected: [
              null,
              null,
              null,
              null,
              null,
              null,
              null,
              true,
              [30, 40, 50, 60, 70, 80],
              true,
              [40, 50, 60, 70, 80],
              true,
              [40, 60, 70, 80],
              false,
              4,
            ],
          },
        ],
      },
    },
  ],
};
