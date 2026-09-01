import type { ChallengeInput } from '../../schema';

/**
 * Build a Hash Map from scratch with bucket arrays, modular hashing,
 * collision chaining, and dynamic load-factor rehashing.
 *
 * **Why build a hash map?**
 * Almost every high-performance algorithm and distributed cache is built on
 * the principle of hashing. Building it from raw arrays reveals how O(1)
 * lookups work, why collisions occur, and why resizing is necessary.
 */

const JS_HARNESS = `const { HashMap } = require('./hash_map');

/**
 * Replays a sequence of operations against your hash map. Read-only.
 *
 *   ["set", key, value]  -> null
 *   ["get", key]         -> the value, or null if absent
 *   ["has", key]         -> true or false
 *   ["delete", key]      -> true if deleted, false if absent
 *   ["size"]             -> number of key-value pairs
 *   ["capacity"]         -> current number of buckets
 *   ["keys"]             -> sorted list of all keys
 */
function runOps(initialCapacity, ops) {
  const map = new HashMap(initialCapacity);
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'set') {
      map.set(op[1], op[2]);
      out.push(null);
    } else if (op[0] === 'get') {
      out.push(map.get(op[1]));
    } else if (op[0] === 'has') {
      out.push(map.has(op[1]));
    } else if (op[0] === 'delete') {
      out.push(map.delete(op[1]));
    } else if (op[0] === 'size') {
      out.push(map.size());
    } else if (op[0] === 'capacity') {
      out.push(map.capacity);
    } else if (op[0] === 'keys') {
      const keys = map.keys();
      out.push(keys.sort());
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS = `from hash_map import HashMap


def run_ops(initial_capacity, ops):
    """Replay a sequence of operations against your hash map. Read-only.

    ["set", key, value]  -> None
    ["get", key]         -> the value, or None if absent
    ["has", key]         -> True or False
    ["delete", key]      -> True if deleted, False if absent
    ["size"]             -> number of key-value pairs
    ["capacity"]         -> current number of buckets
    ["keys"]             -> sorted list of all keys
    """
    m = HashMap(initial_capacity)
    out = []

    for op in ops:
        if op[0] == "set":
            m.set(op[1], op[2])
            out.append(None)
        elif op[0] == "get":
            out.append(m.get(op[1]))
        elif op[0] == "has":
            out.append(m.has(op[1]))
        elif op[0] == "delete":
            out.append(m.delete(op[1]))
        elif op[0] == "size":
            out.append(m.size())
        elif op[0] == "capacity":
            out.append(m.capacity)
        elif op[0] == "keys":
            out.append(sorted(m.keys()))
        else:
            raise ValueError(f"Unknown operation: {op[0]}")

    return out
`;

function jsHashMap(methods: string): string {
  return `class HashMap {
  constructor(initialCapacity = 8) {
    this.capacity = initialCapacity;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.count = 0;
  }

  /**
   * Computes a deterministic bucket index for a string key.
   */
  hash(key) {
    let h = 0;
    const strKey = String(key);
    for (let i = 0; i < strKey.length; i++) {
      h = (h * 31 + strKey.charCodeAt(i)) % this.capacity;
    }
    return Math.abs(h);
  }

${methods}
}

module.exports = { HashMap };
`;
}

function pyHashMap(methods: string): string {
  return `class HashMap:
    def __init__(self, initial_capacity=8):
        self.capacity = initial_capacity
        self.buckets = [[] for _ in range(self.capacity)]
        self.count = 0

    def hash(self, key):
        """Computes a deterministic bucket index for a string key."""
        h = 0
        str_key = str(key)
        for char in str_key:
            h = (h * 31 + ord(char)) % self.capacity
        return abs(h)

${methods}
`;
}

// Step 1: Basic Store & Retrieve (No collisions)
const JS_STEP_1_STARTER = `  set(key, value) {
    // TODO: Hash the key to find the bucket index, and store [key, value]
  }

  get(key) {
    // TODO: Hash the key to find the bucket index, and return value or null
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return false;
  }

  size() {
    return this.count;
  }

  keys() {
    return [];
  }`;

const JS_STEP_1_SOLUTION = `  set(key, value) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;
  }

  get(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    return false;
  }

  size() {
    return this.count;
  }

  keys() {
    return [];
  }`;

const PY_STEP_1_STARTER = `    def set(self, key, value):
        # TODO: Hash the key to find the bucket index, and store [key, value]
        pass

    def get(self, key):
        # TODO: Hash the key to find the bucket index, and return value or None
        return None

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        return False

    def size(self):
        return self.count

    def keys(self):
        return []`;

const PY_STEP_1_SOLUTION = `    def set(self, key, value):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                bucket[i][1] = value
                return
        bucket.append([key, value])
        self.count += 1

    def get(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for pair in bucket:
            if pair[0] == key:
                return pair[1]
        return None

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        return False

    def size(self):
        return self.count

    def keys(self):
        return []`;

// Step 2: Separate Chaining & Deletion
const JS_STEP_2_STARTER = `  set(key, value) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;
  }

  get(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    // TODO: Search for key in bucket, remove if present, decrement count, and return true.
    return false;
  }

  size() {
    return this.count;
  }

  keys() {
    return [];
  }`;

const JS_STEP_2_SOLUTION = `  set(key, value) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;
  }

  get(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  size() {
    return this.count;
  }

  keys() {
    return [];
  }`;

const PY_STEP_2_STARTER = `    def set(self, key, value):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                bucket[i][1] = value
                return
        bucket.append([key, value])
        self.count += 1

    def get(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for pair in bucket:
            if pair[0] == key:
                return pair[1]
        return None

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        # TODO: Search for key in bucket, remove if present, decrement count, and return True.
        return False

    def size(self):
        return self.count

    def keys(self):
        return []`;

const PY_STEP_2_SOLUTION = `    def set(self, key, value):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                bucket[i][1] = value
                return
        bucket.append([key, value])
        self.count += 1

    def get(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for pair in bucket:
            if pair[0] == key:
                return pair[1]
        return None

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                del bucket[i]
                self.count -= 1
                return True
        return False

    def size(self):
        return self.count

    def keys(self):
        return []`;

// Step 3: Keys & Traversal
const JS_STEP_3_STARTER = `  set(key, value) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;
  }

  get(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  size() {
    return this.count;
  }

  keys() {
    // TODO: Iterate over all buckets and collect every key into an array
    return [];
  }`;

const JS_STEP_3_SOLUTION = `  set(key, value) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;
  }

  get(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  size() {
    return this.count;
  }

  keys() {
    const result = [];
    for (let i = 0; i < this.buckets.length; i++) {
      const bucket = this.buckets[i];
      for (let j = 0; j < bucket.length; j++) {
        result.push(bucket[j][0]);
      }
    }
    return result;
  }`;

const PY_STEP_3_STARTER = `    def set(self, key, value):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                bucket[i][1] = value
                return
        bucket.append([key, value])
        self.count += 1

    def get(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for pair in bucket:
            if pair[0] == key:
                return pair[1]
        return None

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                del bucket[i]
                self.count -= 1
                return True
        return False

    def size(self):
        return self.count

    def keys(self):
        # TODO: Iterate over all buckets and collect every key into a list
        return []`;

const PY_STEP_3_SOLUTION = `    def set(self, key, value):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                bucket[i][1] = value
                return
        bucket.append([key, value])
        self.count += 1

    def get(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for pair in bucket:
            if pair[0] == key:
                return pair[1]
        return None

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                del bucket[i]
                self.count -= 1
                return True
        return False

    def size(self):
        return self.count

    def keys(self):
        result = []
        for bucket in self.buckets:
            for pair in bucket:
                result.append(pair[0])
        return result`;

// Step 4: Dynamic Resizing & Rehashing
const JS_STEP_4_STARTER = `  set(key, value) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;

    // TODO: If load factor (count / capacity) >= 0.75, double capacity and rehash!
  }

  rehash() {
    // TODO: Create new buckets array with 2 * capacity, and re-insert all entries
  }

  get(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  size() {
    return this.count;
  }

  keys() {
    const result = [];
    for (let i = 0; i < this.buckets.length; i++) {
      const bucket = this.buckets[i];
      for (let j = 0; j < bucket.length; j++) {
        result.push(bucket[j][0]);
      }
    }
    return result;
  }`;

const JS_STEP_4_SOLUTION = `  set(key, value) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket[i][1] = value;
        return;
      }
    }
    bucket.push([key, value]);
    this.count++;

    if (this.count / this.capacity >= 0.75) {
      this.rehash();
    }
  }

  rehash() {
    const oldBuckets = this.buckets;
    this.capacity = this.capacity * 2;
    this.buckets = Array.from({ length: this.capacity }, () => []);
    this.count = 0;

    for (let i = 0; i < oldBuckets.length; i++) {
      const bucket = oldBuckets[i];
      for (let j = 0; j < bucket.length; j++) {
        this.set(bucket[j][0], bucket[j][1]);
      }
    }
  }

  get(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        return bucket[i][1];
      }
    }
    return null;
  }

  has(key) {
    return this.get(key) !== null;
  }

  delete(key) {
    const idx = this.hash(key);
    const bucket = this.buckets[idx];
    for (let i = 0; i < bucket.length; i++) {
      if (bucket[i][0] === key) {
        bucket.splice(i, 1);
        this.count--;
        return true;
      }
    }
    return false;
  }

  size() {
    return this.count;
  }

  keys() {
    const result = [];
    for (let i = 0; i < this.buckets.length; i++) {
      const bucket = this.buckets[i];
      for (let j = 0; j < bucket.length; j++) {
        result.push(bucket[j][0]);
      }
    }
    return result;
  }`;

const PY_STEP_4_STARTER = `    def set(self, key, value):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                bucket[i][1] = value
                return
        bucket.append([key, value])
        self.count += 1

        # TODO: If load factor (count / capacity) >= 0.75, double capacity and rehash!

    def rehash(self):
        # TODO: Create new buckets array with 2 * capacity, and re-insert all entries
        pass

    def get(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for pair in bucket:
            if pair[0] == key:
                return pair[1]
        return None

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                del bucket[i]
                self.count -= 1
                return True
        return False

    def size(self):
        return self.count

    def keys(self):
        result = []
        for bucket in self.buckets:
            for pair in bucket:
                result.append(pair[0])
        return result`;

const PY_STEP_4_SOLUTION = `    def set(self, key, value):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                bucket[i][1] = value
                return
        bucket.append([key, value])
        self.count += 1

        if self.count / self.capacity >= 0.75:
            self.rehash()

    def rehash(self):
        old_buckets = self.buckets
        self.capacity = self.capacity * 2
        self.buckets = [[] for _ in range(self.capacity)]
        self.count = 0

        for bucket in old_buckets:
            for pair in bucket:
                self.set(pair[0], pair[1])

    def get(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for pair in bucket:
            if pair[0] == key:
                return pair[1]
        return None

    def has(self, key):
        return self.get(key) is not None

    def delete(self, key):
        idx = self.hash(key)
        bucket = self.buckets[idx]
        for i in range(len(bucket)):
            if bucket[i][0] == key:
                del bucket[i]
                self.count -= 1
                return True
        return False

    def size(self):
        return self.count

    def keys(self):
        result = []
        for bucket in self.buckets:
            for pair in bucket:
                result.append(pair[0])
        return result`;

export const hashMapChallenge: ChallengeInput = {
  tier: 'challenge',
  slug: 'hash-map',
  title: 'Hash Map',
  category: 'dsa',
  difficulty: 'medium',
  summary:
    'Construct a high-performance hash map with bucket arrays, modular hashing, collision chaining, and dynamic rehashing.',
  topics: ['hashing', 'arrays', 'caching'],
  recommendedAfter: ['hashing'],

  brief: `How do hash tables achieve average $O(1)$ lookups and insertions across millions of items?

In this build, you will construct a **Hash Map from raw bucket arrays**. You will:
1. Implement bucket indexing and polynomial string hashing.
2. Resolve hash collisions using **separate chaining**.
3. Implement $O(1)$ key deletion and iteration.
4. Add **dynamic load-factor rehashing** to prevent performance degradation as the table fills up.`,

  steps: [
    {
      slug: 'store-and-retrieve',
      title: 'Bucket Storage & Basic Hashing',
      brief: `Start by implementing \`set(key, value)\` and \`get(key)\` over the initial bucket array.

The \`hash(key)\` method is provided to convert keys to a valid bucket index ($0 \\le \\text{index} < \\text{capacity}$).
- \`set(key, value)\`: Place the \`[key, value]\` pair into the appropriate bucket. If the key already exists in that bucket, update its value.
- \`get(key)\`: Retrieve the value stored under \`key\`, or return \`null\` / \`None\` if not found.`,
      hints: [
        'Calculate `idx = this.hash(key)` to find which bucket to inspect.',
        'Each bucket is an array of `[key, value]` pairs.',
        'Scan the bucket: if an entry with matching key exists, update its value in-place.',
      ],
      entryFile: 'harness',
      focus: 'hash_map',
      files: [
        {
          name: 'hash_map',
          starterCode: {
            javascript: jsHashMap(JS_STEP_1_STARTER),
            python: pyHashMap(PY_STEP_1_STARTER),
          },
          solution: {
            javascript: jsHashMap(JS_STEP_1_SOLUTION),
            python: pyHashMap(PY_STEP_1_SOLUTION),
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
            name: 'sets and gets unique keys',
            args: [
              8,
              [
                ['set', 'apple', 10],
                ['set', 'banana', 20],
                ['get', 'apple'],
                ['get', 'banana'],
                ['get', 'cherry'],
              ],
            ],
            expected: [null, null, 10, 20, null],
          },
          {
            name: 'updates existing key value',
            args: [
              8,
              [
                ['set', 'user_1', 'Alice'],
                ['get', 'user_1'],
                ['set', 'user_1', 'Alicia'],
                ['get', 'user_1'],
              ],
            ],
            expected: [null, 'Alice', null, 'Alicia'],
          },
        ],
      },
    },
    {
      slug: 'collision-chaining-and-delete',
      title: 'Collision Chaining & Deletion',
      brief: `When two different keys hash to the exact same bucket index, a **collision** occurs.

Using **separate chaining**, each bucket holds a list of entries.
- Ensure \`set\` and \`get\` work correctly when multiple keys occupy the same bucket.
- Implement \`delete(key)\`:
  - If the key exists, remove its \`[key, value]\` pair from the bucket, decrement the item count, and return \`true\`.
  - If the key does not exist, return \`false\`.`,
      hints: [
        'Iterate through the bucket with a loop so you have the index `i` if you need to delete it.',
        'JavaScript: `bucket.splice(i, 1)` removes the item. Python: `del bucket[i]`.',
        'Remember to decrement `this.count` / `self.count` only when a key is actually deleted.',
      ],
      entryFile: 'harness',
      focus: 'hash_map',
      files: [
        {
          name: 'hash_map',
          starterCode: {
            javascript: jsHashMap(JS_STEP_2_STARTER),
            python: pyHashMap(PY_STEP_2_STARTER),
          },
          solution: {
            javascript: jsHashMap(JS_STEP_2_SOLUTION),
            python: pyHashMap(PY_STEP_2_SOLUTION),
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
            name: 'handles deliberate bucket collisions',
            args: [
              2, // Small capacity forcing collisions
              [
                ['set', 'k1', 100],
                ['set', 'k2', 200],
                ['set', 'k3', 300],
                ['get', 'k1'],
                ['get', 'k2'],
                ['get', 'k3'],
              ],
            ],
            expected: [null, null, null, 100, 200, 300],
          },
          {
            name: 'deletes existing and missing keys',
            args: [
              4,
              [
                ['set', 'alpha', 1],
                ['set', 'beta', 2],
                ['delete', 'alpha'],
                ['get', 'alpha'],
                ['delete', 'alpha'],
                ['get', 'beta'],
              ],
            ],
            expected: [null, null, true, null, false, 2],
          },
        ],
      },
    },
    {
      slug: 'keys-and-size-tracking',
      title: 'Size Tracking & Key Listing',
      brief: `Ensure \`size()\` and \`keys()\` accurately report table state.

- \`size()\`: Returns the exact number of key-value pairs stored.
- \`keys()\`: Collects and returns an array/list of all keys currently present across all buckets.`,
      hints: [
        'Iterate across all buckets: `for (const bucket of this.buckets)` and gather each `pair[0]`.',
        'Check that updating an existing key does NOT increment size.',
      ],
      entryFile: 'harness',
      focus: 'hash_map',
      files: [
        {
          name: 'hash_map',
          starterCode: {
            javascript: jsHashMap(JS_STEP_3_STARTER),
            python: pyHashMap(PY_STEP_3_STARTER),
          },
          solution: {
            javascript: jsHashMap(JS_STEP_3_SOLUTION),
            python: pyHashMap(PY_STEP_3_SOLUTION),
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
            name: 'tracks size across sets, updates, and deletes',
            args: [
              4,
              [
                ['size'],
                ['set', 'a', 1],
                ['set', 'b', 2],
                ['size'],
                ['set', 'a', 99],
                ['size'],
                ['delete', 'b'],
                ['size'],
              ],
            ],
            expected: [0, null, null, 2, null, 2, true, 1],
          },
          {
            name: 'lists all stored keys',
            args: [
              4,
              [
                ['set', 'foo', 10],
                ['set', 'bar', 20],
                ['set', 'baz', 30],
                ['keys'],
              ],
            ],
            expected: [null, null, null, ['bar', 'baz', 'foo']],
          },
        ],
      },
    },
    {
      slug: 'dynamic-rehashing',
      title: 'Dynamic Load-Factor Rehashing',
      brief: `As more entries are added to a fixed bucket array, chain lengths grow longer, degrading lookup performance from $O(1)$ down to $O(n)$.

To maintain constant-time guarantees, the hash map must **dynamically rehash**:
1. After inserting a new key, check the **load factor**: $\\alpha = \\frac{\\text{size}}{\\text{capacity}}$.
2. If $\\alpha \\ge 0.75$:
   - Double the capacity ($2 \\times \\text{capacity}$).
   - Allocate new empty buckets.
   - Re-insert all existing entries so their positions are recomputed under the new capacity.`,
      hints: [
        'Save the old buckets array before resetting `this.buckets = Array.from({ length: this.capacity * 2 }, () => [])`.',
        'Iterate through every entry in the old buckets and call `this.set(pair[0], pair[1])`.',
        'Make sure `this.count` is reset or maintained accurately during rehash.',
      ],
      entryFile: 'harness',
      focus: 'hash_map',
      files: [
        {
          name: 'hash_map',
          starterCode: {
            javascript: jsHashMap(JS_STEP_4_STARTER),
            python: pyHashMap(PY_STEP_4_STARTER),
          },
          solution: {
            javascript: jsHashMap(JS_STEP_4_SOLUTION),
            python: pyHashMap(PY_STEP_4_SOLUTION),
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
            name: 'triggers rehash when load factor reaches 0.75',
            args: [
              4, // initial capacity 4, threshold is 4 * 0.75 = 3 items
              [
                ['capacity'],
                ['set', 'k1', 1],
                ['set', 'k2', 2],
                ['capacity'],
                ['set', 'k3', 3], // Triggers rehash! Capacity becomes 8
                ['capacity'],
                ['get', 'k1'],
                ['get', 'k2'],
                ['get', 'k3'],
                ['size'],
              ],
            ],
            expected: [4, null, null, 4, null, 8, 1, 2, 3, 3],
          },
          {
            name: 'maintains correctness through multiple rehashes',
            args: [
              2,
              [
                ['set', 'a', 1],
                ['set', 'b', 2], // Rehash -> 4
                ['set', 'c', 3],
                ['set', 'd', 4], // Rehash -> 8
                ['capacity'],
                ['get', 'a'],
                ['get', 'b'],
                ['get', 'c'],
                ['get', 'd'],
                ['size'],
              ],
            ],
            expected: [null, null, null, null, 8, 1, 2, 3, 4, 4],
          },
        ],
      },
    },
  ],
};
