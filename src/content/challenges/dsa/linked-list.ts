import type { ChallengeInput } from '../../schema';

/**
 * Build a Singly Linked List from scratch.
 *
 * **Why build a linked list?**
 * Singly and doubly linked lists form the backbone of dynamic queues, LRU cache
 * recency lists, adjacency lists in graphs, and memory allocators. Building it
 * with pointers cements how node references and pointer manipulation work.
 */

const JS_HARNESS = `const { LinkedList } = require('./linked_list');

/**
 * Replays a sequence of operations against your linked list. Read-only.
 *
 *   ["append", val]        -> null
 *   ["prepend", val]       -> null
 *   ["getAt", index]       -> value or null
 *   ["insertAt", idx, val] -> true or false
 *   ["deleteAt", index]    -> value removed or null
 *   ["reverse"]            -> null
 *   ["toArray"]            -> array of all elements from head to tail
 *   ["size"]               -> number of nodes
 */
function runOps(ops) {
  const list = new LinkedList();
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'append') {
      list.append(op[1]);
      out.push(null);
    } else if (op[0] === 'prepend') {
      list.prepend(op[1]);
      out.push(null);
    } else if (op[0] === 'getAt') {
      out.push(list.getAt(op[1]));
    } else if (op[0] === 'insertAt') {
      out.push(list.insertAt(op[1], op[2]));
    } else if (op[0] === 'deleteAt') {
      out.push(list.deleteAt(op[1]));
    } else if (op[0] === 'reverse') {
      list.reverse();
      out.push(null);
    } else if (op[0] === 'toArray') {
      out.push(list.toArray());
    } else if (op[0] === 'size') {
      out.push(list.size());
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS = `from linked_list import LinkedList


def run_ops(ops):
    """Replay a sequence of operations against your linked list. Read-only.

    ["append", val]        -> None
    ["prepend", val]       -> None
    ["getAt", index]       -> value or None
    ["insertAt", idx, val] -> True or False
    ["deleteAt", index]    -> value removed or None
    ["reverse"]            -> None
    ["toArray"]            -> list of all elements from head to tail
    ["size"]               -> number of nodes
    """
    lst = LinkedList()
    out = []

    for op in ops:
        if op[0] == "append":
            lst.append(op[1])
            out.append(None)
        elif op[0] == "prepend":
            lst.prepend(op[1])
            out.append(None)
        elif op[0] == "getAt":
            out.append(lst.get_at(op[1]))
        elif op[0] == "insertAt":
            out.append(lst.insert_at(op[1], op[2]))
        elif op[0] == "deleteAt":
            out.append(lst.delete_at(op[1]))
        elif op[0] == "reverse":
            lst.reverse()
            out.append(None)
        elif op[0] == "toArray":
            out.append(lst.to_array())
        elif op[0] == "size":
            out.append(lst.size())
        else:
            raise ValueError(f"Unknown operation: {op[0]}")

    return out
`;

function jsLinkedList(methods: string): string {
  return `class ListNode {
  constructor(value) {
    this.value = value;
    this.next = null;
  }
}

class LinkedList {
  constructor() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  size() {
    return this.length;
  }

  toArray() {
    const result = [];
    let curr = this.head;
    while (curr !== null) {
      result.push(curr.value);
      curr = curr.next;
    }
    return result;
  }

${methods}
}

module.exports = { LinkedList, ListNode };
`;
}

function pyLinkedList(methods: string): string {
  return `class ListNode:
    def __init__(self, value):
        self.value = value
        self.next = None


class LinkedList:
    def __init__(self):
        self.head = None
        self.tail = None
        self.length = 0

    def size(self):
        return self.length

    def to_array(self):
        result = []
        curr = self.head
        while curr is not None:
            result.append(curr.value)
            curr = curr.next
        return result

${methods}
`;
}

// Step 1: Prepend and Append
const JS_STEP_1_STARTER = `  append(val) {
    // TODO: Create new node and attach to tail in O(1) time
  }

  prepend(val) {
    // TODO: Create new node and attach to head in O(1) time
  }

  getAt(index) {
    return null;
  }

  insertAt(index, val) {
    return false;
  }

  deleteAt(index) {
    return null;
  }

  reverse() {
    // Scaffolded for Step 4
  }`;

const JS_STEP_1_SOLUTION = `  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  getAt(index) {
    return null;
  }

  insertAt(index, val) {
    return false;
  }

  deleteAt(index) {
    return null;
  }

  reverse() {
  }`;

const PY_STEP_1_STARTER = `    def append(self, val):
        # TODO: Create new node and attach to tail in O(1) time
        pass

    def prepend(self, val):
        # TODO: Create new node and attach to head in O(1) time
        pass

    def get_at(self, index):
        return None

    def insert_at(self, index, val):
        return False

    def delete_at(self, index):
        return None

    def reverse(self):
        pass`;

const PY_STEP_1_SOLUTION = `    def append(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.length += 1

    def prepend(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            node.next = self.head
            self.head = node
        self.length += 1

    def get_at(self, index):
        return None

    def insert_at(self, index, val):
        return False

    def delete_at(self, index):
        return None

    def reverse(self):
        pass`;

// Step 2: Index Access and Insertion
const JS_STEP_2_STARTER = `  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  getAt(index) {
    // TODO: Return value at 0-indexed position, or null if index < 0 or index >= length
    return null;
  }

  insertAt(index, val) {
    // TODO: Insert node at index. Return true if successful, false if out of bounds (index < 0 or index > length)
    return false;
  }

  deleteAt(index) {
    return null;
  }

  reverse() {
  }`;

const JS_STEP_2_SOLUTION = `  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  getAt(index) {
    if (index < 0 || index >= this.length) return null;
    let curr = this.head;
    for (let i = 0; i < index; i++) {
      curr = curr.next;
    }
    return curr.value;
  }

  insertAt(index, val) {
    if (index < 0 || index > this.length) return false;
    if (index === 0) {
      this.prepend(val);
      return true;
    }
    if (index === this.length) {
      this.append(val);
      return true;
    }

    const node = new ListNode(val);
    let prev = this.head;
    for (let i = 0; i < index - 1; i++) {
      prev = prev.next;
    }
    node.next = prev.next;
    prev.next = node;
    this.length++;
    return true;
  }

  deleteAt(index) {
    return null;
  }

  reverse() {
  }`;

const PY_STEP_2_STARTER = `    def append(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.length += 1

    def prepend(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            node.next = self.head
            self.head = node
        self.length += 1

    def get_at(self, index):
        # TODO: Return value at index, or None if out of bounds
        return None

    def insert_at(self, index, val):
        # TODO: Insert node at index, return True if successful, False if out of bounds
        return False

    def delete_at(self, index):
        return None

    def reverse(self):
        pass`;

const PY_STEP_2_SOLUTION = `    def append(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.length += 1

    def prepend(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            node.next = self.head
            self.head = node
        self.length += 1

    def get_at(self, index):
        if index < 0 or index >= self.length:
            return None
        curr = self.head
        for _ in range(index):
            curr = curr.next
        return curr.value

    def insert_at(self, index, val):
        if index < 0 or index > self.length:
            return False
        if index == 0:
            self.prepend(val)
            return True
        if index == self.length:
            self.append(val)
            return True

        node = ListNode(val)
        prev = self.head
        for _ in range(index - 1):
            prev = prev.next
        node.next = prev.next
        prev.next = node
        self.length += 1
        return True

    def delete_at(self, index):
        return None

    def reverse(self):
        pass`;

// Step 3: Deletion
const JS_STEP_3_STARTER = `  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  getAt(index) {
    if (index < 0 || index >= this.length) return null;
    let curr = this.head;
    for (let i = 0; i < index; i++) {
      curr = curr.next;
    }
    return curr.value;
  }

  insertAt(index, val) {
    if (index < 0 || index > this.length) return false;
    if (index === 0) {
      this.prepend(val);
      return true;
    }
    if (index === this.length) {
      this.append(val);
      return true;
    }

    const node = new ListNode(val);
    let prev = this.head;
    for (let i = 0; i < index - 1; i++) {
      prev = prev.next;
    }
    node.next = prev.next;
    prev.next = node;
    this.length++;
    return true;
  }

  deleteAt(index) {
    // TODO: Remove node at index, update head/tail/length, and return removed value (or null if out of bounds)
    return null;
  }

  reverse() {
  }`;

const JS_STEP_3_SOLUTION = `  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  getAt(index) {
    if (index < 0 || index >= this.length) return null;
    let curr = this.head;
    for (let i = 0; i < index; i++) {
      curr = curr.next;
    }
    return curr.value;
  }

  insertAt(index, val) {
    if (index < 0 || index > this.length) return false;
    if (index === 0) {
      this.prepend(val);
      return true;
    }
    if (index === this.length) {
      this.append(val);
      return true;
    }

    const node = new ListNode(val);
    let prev = this.head;
    for (let i = 0; i < index - 1; i++) {
      prev = prev.next;
    }
    node.next = prev.next;
    prev.next = node;
    this.length++;
    return true;
  }

  deleteAt(index) {
    if (index < 0 || index >= this.length) return null;

    let removedValue;
    if (index === 0) {
      removedValue = this.head.value;
      this.head = this.head.next;
      if (this.length === 1) {
        this.tail = null;
      }
    } else {
      let prev = this.head;
      for (let i = 0; i < index - 1; i++) {
        prev = prev.next;
      }
      removedValue = prev.next.value;
      prev.next = prev.next.next;
      if (index === this.length - 1) {
        this.tail = prev;
      }
    }

    this.length--;
    return removedValue;
  }

  reverse() {
  }`;

const PY_STEP_3_STARTER = `    def append(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.length += 1

    def prepend(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            node.next = self.head
            self.head = node
        self.length += 1

    def get_at(self, index):
        if index < 0 or index >= self.length:
            return None
        curr = self.head
        for _ in range(index):
            curr = curr.next
        return curr.value

    def insert_at(self, index, val):
        if index < 0 or index > self.length:
            return False
        if index == 0:
            self.prepend(val)
            return True
        if index == self.length:
            self.append(val)
            return True

        node = ListNode(val)
        prev = self.head
        for _ in range(index - 1):
            prev = prev.next
        node.next = prev.next
        prev.next = node
        self.length += 1
        return True

    def delete_at(self, index):
        # TODO: Remove node at index, update head/tail/length, and return removed value (or None if out of bounds)
        return None

    def reverse(self):
        pass`;

const PY_STEP_3_SOLUTION = `    def append(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.length += 1

    def prepend(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            node.next = self.head
            self.head = node
        self.length += 1

    def get_at(self, index):
        if index < 0 or index >= self.length:
            return None
        curr = self.head
        for _ in range(index):
            curr = curr.next
        return curr.value

    def insert_at(self, index, val):
        if index < 0 or index > self.length:
            return False
        if index == 0:
            self.prepend(val)
            return True
        if index == self.length:
            self.append(val)
            return True

        node = ListNode(val)
        prev = self.head
        for _ in range(index - 1):
            prev = prev.next
        node.next = prev.next
        prev.next = node
        self.length += 1
        return True

    def delete_at(self, index):
        if index < 0 or index >= self.length:
            return None

        if index == 0:
            removed_value = self.head.value
            self.head = self.head.next
            if self.length == 1:
                self.tail = None
        else:
            prev = self.head
            for _ in range(index - 1):
                prev = prev.next
            removed_value = prev.next.value
            prev.next = prev.next.next
            if index == self.length - 1:
                self.tail = prev

        self.length -= 1
        return removed_value

    def reverse(self):
        pass`;

// Step 4: In-Place Reversal
const JS_STEP_4_STARTER = `  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  getAt(index) {
    if (index < 0 || index >= this.length) return null;
    let curr = this.head;
    for (let i = 0; i < index; i++) {
      curr = curr.next;
    }
    return curr.value;
  }

  insertAt(index, val) {
    if (index < 0 || index > this.length) return false;
    if (index === 0) {
      this.prepend(val);
      return true;
    }
    if (index === this.length) {
      this.append(val);
      return true;
    }

    const node = new ListNode(val);
    let prev = this.head;
    for (let i = 0; i < index - 1; i++) {
      prev = prev.next;
    }
    node.next = prev.next;
    prev.next = node;
    this.length++;
    return true;
  }

  deleteAt(index) {
    if (index < 0 || index >= this.length) return null;

    let removedValue;
    if (index === 0) {
      removedValue = this.head.value;
      this.head = this.head.next;
      if (this.length === 1) {
        this.tail = null;
      }
    } else {
      let prev = this.head;
      for (let i = 0; i < index - 1; i++) {
        prev = prev.next;
      }
      removedValue = prev.next.value;
      prev.next = prev.next.next;
      if (index === this.length - 1) {
        this.tail = prev;
      }
    }

    this.length--;
    return removedValue;
  }

  reverse() {
    // TODO: In-place reversal of pointers using prev, curr, next. Update head and tail!
  }`;

const JS_STEP_4_SOLUTION = `  append(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      this.tail.next = node;
      this.tail = node;
    }
    this.length++;
  }

  prepend(val) {
    const node = new ListNode(val);
    if (!this.head) {
      this.head = node;
      this.tail = node;
    } else {
      node.next = this.head;
      this.head = node;
    }
    this.length++;
  }

  getAt(index) {
    if (index < 0 || index >= this.length) return null;
    let curr = this.head;
    for (let i = 0; i < index; i++) {
      curr = curr.next;
    }
    return curr.value;
  }

  insertAt(index, val) {
    if (index < 0 || index > this.length) return false;
    if (index === 0) {
      this.prepend(val);
      return true;
    }
    if (index === this.length) {
      this.append(val);
      return true;
    }

    const node = new ListNode(val);
    let prev = this.head;
    for (let i = 0; i < index - 1; i++) {
      prev = prev.next;
    }
    node.next = prev.next;
    prev.next = node;
    this.length++;
    return true;
  }

  deleteAt(index) {
    if (index < 0 || index >= this.length) return null;

    let removedValue;
    if (index === 0) {
      removedValue = this.head.value;
      this.head = this.head.next;
      if (this.length === 1) {
        this.tail = null;
      }
    } else {
      let prev = this.head;
      for (let i = 0; i < index - 1; i++) {
        prev = prev.next;
      }
      removedValue = prev.next.value;
      prev.next = prev.next.next;
      if (index === this.length - 1) {
        this.tail = prev;
      }
    }

    this.length--;
    return removedValue;
  }

  reverse() {
    let prev = null;
    let curr = this.head;
    this.tail = this.head;

    while (curr !== null) {
      const nextNode = curr.next;
      curr.next = prev;
      prev = curr;
      curr = nextNode;
    }

    this.head = prev;
  }`;

const PY_STEP_4_STARTER = `    def append(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.length += 1

    def prepend(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            node.next = self.head
            self.head = node
        self.length += 1

    def get_at(self, index):
        if index < 0 or index >= self.length:
            return None
        curr = self.head
        for _ in range(index):
            curr = curr.next
        return curr.value

    def insert_at(self, index, val):
        if index < 0 or index > self.length:
            return False
        if index == 0:
            self.prepend(val)
            return True
        if index == self.length:
            self.append(val)
            return True

        node = ListNode(val)
        prev = self.head
        for _ in range(index - 1):
            prev = prev.next
        node.next = prev.next
        prev.next = node
        self.length += 1
        return True

    def delete_at(self, index):
        if index < 0 or index >= self.length:
            return None

        if index == 0:
            removed_value = self.head.value
            self.head = self.head.next
            if self.length == 1:
                self.tail = None
        else:
            prev = self.head
            for _ in range(index - 1):
                prev = prev.next
            removed_value = prev.next.value
            prev.next = prev.next.next
            if index == self.length - 1:
                self.tail = prev

        self.length -= 1
        return removed_value

    def reverse(self):
        # TODO: In-place reversal of pointers using prev, curr, next. Update head and tail!
        pass`;

const PY_STEP_4_SOLUTION = `    def append(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            self.tail.next = node
            self.tail = node
        self.length += 1

    def prepend(self, val):
        node = ListNode(val)
        if not self.head:
            self.head = node
            self.tail = node
        else:
            node.next = self.head
            self.head = node
        self.length += 1

    def get_at(self, index):
        if index < 0 or index >= self.length:
            return None
        curr = self.head
        for _ in range(index):
            curr = curr.next
        return curr.value

    def insert_at(self, index, val):
        if index < 0 or index > self.length:
            return False
        if index == 0:
            self.prepend(val)
            return True
        if index == self.length:
            self.append(val)
            return True

        node = ListNode(val)
        prev = self.head
        for _ in range(index - 1):
            prev = prev.next
        node.next = prev.next
        prev.next = node
        self.length += 1
        return True

    def delete_at(self, index):
        if index < 0 or index >= self.length:
            return None

        if index == 0:
            removed_value = self.head.value
            self.head = self.head.next
            if self.length == 1:
                self.tail = None
        else:
            prev = self.head
            for _ in range(index - 1):
                prev = prev.next
            removed_value = prev.next.value
            prev.next = prev.next.next
            if index == self.length - 1:
                self.tail = prev

        self.length -= 1
        return removed_value

    def reverse(self):
        prev = None
        curr = self.head
        self.tail = self.head

        while curr is not None:
            next_node = curr.next
            curr.next = prev
            prev = curr
            curr = next_node

        self.head = prev`;

export const linkedListChallenge: ChallengeInput = {
  tier: 'challenge',
  slug: 'linked-list',
  title: 'Singly Linked List',
  category: 'dsa',
  difficulty: 'easy',
  summary:
    'Construct a Singly Linked List with ListNode pointers, append, prepend, index-based insertion, deletion, and in-place reversal.',
  topics: ['linked-lists'],
  recommendedAfter: ['linked-lists'],

  brief: `Unlike arrays that allocate contiguous memory blocks, a Linked List stores elements across independent nodes joined by memory pointers.

In this build, you will construct a **Singly Linked List from scratch**:
1. Implement \`ListNode\` pointer chaining with $O(1)$ \`append\` and \`prepend\`.
2. Implement index-based node access (\`getAt\`) and insertion (\`insertAt\`).
3. Safely unlink and delete nodes while maintaining boundary references (\`deleteAt\`).
4. Reverse the entire chain in-place with $O(1)$ auxiliary space (\`reverse\`).`,

  steps: [
    {
      slug: 'append-and-prepend',
      title: 'Node Pointers & Boundary Insertion',
      brief: `Start by implementing \`append(val)\` and \`prepend(val)\`.

- When the list is empty (\`this.head === null\`), both \`head\` and \`tail\` point to the newly created \`ListNode\`.
- \`append(val)\`: Attach the new node to \`this.tail.next\` and update \`this.tail\` in $O(1)$ time.
- \`prepend(val)\`: Point \`node.next\` to \`this.head\` and update \`this.head\` in $O(1)$ time.
- Increment \`this.length\`.`,
      hints: [
        'Always check if `this.head` is null first.',
        'Don\'t forget to increment `this.length` / `self.length` on every successful insertion.',
      ],
      entryFile: 'harness',
      focus: 'linked_list',
      files: [
        {
          name: 'linked_list',
          starterCode: {
            javascript: jsLinkedList(JS_STEP_1_STARTER),
            python: pyLinkedList(PY_STEP_1_STARTER),
          },
          solution: {
            javascript: jsLinkedList(JS_STEP_1_SOLUTION),
            python: pyLinkedList(PY_STEP_1_SOLUTION),
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
            name: 'appends and prepends nodes',
            args: [
              [
                ['append', 10],
                ['append', 20],
                ['prepend', 5],
                ['toArray'],
                ['size'],
              ],
            ],
            expected: [null, null, null, [5, 10, 20], 3],
          },
        ],
      },
    },
    {
      slug: 'index-access-and-insert',
      title: 'Index Access & Insertion',
      brief: `Implement sequential index traversal with \`getAt(index)\` and \`insertAt(index, val)\`.

- \`getAt(index)\`: Walk \`index\` steps from \`head\` and return the node's value. If \`index < 0\` or \`index >= length\`, return \`null\` / \`None\`.
- \`insertAt(index, val)\`:
  - If \`index === 0\`, delegate to \`prepend(val)\`.
  - If \`index === length\`, delegate to \`append(val)\`.
  - Otherwise, traverse to \`index - 1\` and rewire \`prev.next\` to insert the new node.
  - Return \`true\` on success, or \`false\` if index is out of bounds.`,
      hints: [
        'Iterate up to `index - 1` to get reference to the predecessor node.',
        'Set `node.next = prev.next`, then `prev.next = node`.',
      ],
      entryFile: 'harness',
      focus: 'linked_list',
      files: [
        {
          name: 'linked_list',
          starterCode: {
            javascript: jsLinkedList(JS_STEP_2_STARTER),
            python: pyLinkedList(PY_STEP_2_STARTER),
          },
          solution: {
            javascript: jsLinkedList(JS_STEP_2_SOLUTION),
            python: pyLinkedList(PY_STEP_2_SOLUTION),
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
            name: 'gets and inserts at arbitrary indices',
            args: [
              [
                ['append', 1],
                ['append', 3],
                ['insertAt', 1, 2],
                ['toArray'],
                ['getAt', 1],
                ['getAt', 99],
                ['insertAt', -1, 0],
              ],
            ],
            expected: [null, null, true, [1, 2, 3], 2, null, false],
          },
        ],
      },
    },
    {
      slug: 'node-deletion',
      title: 'Node Deletion',
      brief: `Implement \`deleteAt(index)\` to unlink and remove nodes.

- If \`index < 0\` or \`index >= length\`, return \`null\` / \`None\`.
- If deleting head (\`index === 0\`), update \`this.head = this.head.next\`. If the list only had 1 node, also clear \`this.tail = null\`.
- If deleting an internal or tail node, traverse to \`index - 1\` and rewire \`prev.next = prev.next.next\`. If deleting the last node, update \`this.tail = prev\`.
- Decrement \`this.length\` and return the removed node's value.`,
      hints: [
        'Save `removedValue = prev.next.value` before updating pointer links.',
        'Remember to update `this.tail` if `index === this.length - 1`.',
      ],
      entryFile: 'harness',
      focus: 'linked_list',
      files: [
        {
          name: 'linked_list',
          starterCode: {
            javascript: jsLinkedList(JS_STEP_3_STARTER),
            python: pyLinkedList(PY_STEP_3_STARTER),
          },
          solution: {
            javascript: jsLinkedList(JS_STEP_3_SOLUTION),
            python: pyLinkedList(PY_STEP_3_SOLUTION),
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
            name: 'deletes nodes from head, middle, and tail',
            args: [
              [
                ['append', 'A'],
                ['append', 'B'],
                ['append', 'C'],
                ['deleteAt', 1], // deletes B
                ['toArray'],
                ['deleteAt', 0], // deletes A
                ['toArray'],
                ['deleteAt', 0], // deletes C
                ['toArray'],
                ['size'],
              ],
            ],
            expected: [
              null,
              null,
              null,
              'B',
              ['A', 'C'],
              'A',
              ['C'],
              'C',
              [],
              0,
            ],
          },
        ],
      },
    },
    {
      slug: 'in-place-reversal',
      title: 'In-Place Reversal',
      brief: `Reversing a linked list is one of the classic interview questions.

Implement \`reverse()\` in-place using three pointers (\`prev\`, \`curr\`, \`next\`):
1. Initialize \`prev = null\` and \`curr = this.head\`.
2. Save \`this.tail = this.head\` (the original head becomes the new tail).
3. Loop while \`curr !== null\`:
   - Store \`next = curr.next\`.
   - Reverse the pointer: \`curr.next = prev\`.
   - Advance: \`prev = curr\`, \`curr = next\`.
4. Finally, set \`this.head = prev\`.`,
      hints: [
        'Draw the pointers out step-by-step: saving `curr.next` before overwriting it is critical.',
        'When the loop terminates, `curr` is null and `prev` points to the new head.',
      ],
      entryFile: 'harness',
      focus: 'linked_list',
      files: [
        {
          name: 'linked_list',
          starterCode: {
            javascript: jsLinkedList(JS_STEP_4_STARTER),
            python: pyLinkedList(PY_STEP_4_STARTER),
          },
          solution: {
            javascript: jsLinkedList(JS_STEP_4_SOLUTION),
            python: pyLinkedList(PY_STEP_4_SOLUTION),
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
            name: 'reverses non-empty linked list in-place',
            args: [
              [
                ['append', 1],
                ['append', 2],
                ['append', 3],
                ['append', 4],
                ['reverse'],
                ['toArray'],
                ['getAt', 0],
                ['getAt', 3],
              ],
            ],
            expected: [
              null,
              null,
              null,
              null,
              null,
              [4, 3, 2, 1],
              4,
              1,
            ],
          },
        ],
      },
    },
  ],
};
