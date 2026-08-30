import type { ChallengeInput } from '../../schema';

/**
 * The first authored build challenge. Its shape is the template later ones
 * follow, so it is deliberately complete rather than minimal.
 *
 * **Why a class and not a function.** Everything in tiers 1 and 2 is one
 * function called with arguments. A cache is not that: it is a thing that holds
 * state between calls, and the interesting behaviour — eviction, recency — only
 * appears across a *sequence* of calls. So the spec drives a command replay
 * (`[["put", 1, 1], ["get", 1]]`) through a read-only `harness` module that
 * constructs the learner's class. That indirection is the whole reason tier 3
 * needs several files, and it is why `harness` must not be editable: a learner
 * who can rewrite the harness can satisfy the spec without writing a cache.
 *
 * **Why the class surface is fixed at step 1.** `keys()` exists from the first
 * step even though nothing needs it until step 3, and it is given away rather
 * than left as a TODO. Introducing a method later would mean replacing the whole
 * file mid-build and discarding the learner's own work — the one thing the
 * carry-forward model exists to avoid. Fixing the surface up front costs one
 * unused method and keeps every later step a behaviour change to code the
 * learner already owns.
 */

const JS_HARNESS = `const { LRUCache } = require('./lru_cache');

/**
 * Replays a sequence of operations against your cache and collects what each
 * one returned. This file is read-only — the tests drive your class through it.
 *
 *   ["put", key, value]  ->  null
 *   ["get", key]         ->  the value, or -1
 *   ["size"]             ->  how many entries are held
 *   ["keys"]             ->  the keys held, oldest use first
 */
function runOps(capacity, ops) {
  const cache = new LRUCache(capacity);
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'put') {
      cache.put(op[1], op[2]);
      out.push(null);
    } else if (op[0] === 'get') {
      out.push(cache.get(op[1]));
    } else if (op[0] === 'size') {
      out.push(cache.size());
    } else if (op[0] === 'keys') {
      out.push(cache.keys());
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS = `from lru_cache import LRUCache


def run_ops(capacity, ops):
    """Replay a sequence of operations against your cache.

    This file is read-only - the tests drive your class through it.

        ["put", key, value]  ->  None
        ["get", key]         ->  the value, or -1
        ["size"]             ->  how many entries are held
        ["keys"]             ->  the keys held, oldest use first
    """
    cache = LRUCache(capacity)
    out = []

    for op in ops:
        if op[0] == "put":
            cache.put(op[1], op[2])
            out.append(None)
        elif op[0] == "get":
            out.append(cache.get(op[1]))
        elif op[0] == "size":
            out.append(cache.size())
        elif op[0] == "keys":
            out.append(cache.keys())
        else:
            raise ValueError("Unknown operation: " + str(op[0]))

    return out
`;

/** Every version of the cache is this class with two methods rewritten. */
function jsCache(get: string, put: string): string {
  return `class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    // A Map remembers insertion order, which is the whole trick: the first key
    // it yields is the one inserted longest ago.
    this.map = new Map();
  }

${get}

${put}

  size() {
    return this.map.size;
  }

  keys() {
    // Oldest first. Given to you — once get and put maintain the order, this
    // reports it without any work of its own.
    return Array.from(this.map.keys());
  }
}

module.exports = { LRUCache };
`;
}

function pyCache(get: string, put: string): string {
  return `class LRUCache:
    def __init__(self, capacity):
        self.capacity = capacity
        # A dict remembers insertion order, which is the whole trick: the first
        # key it yields is the one inserted longest ago.
        self.map = {}

${get}

${put}

    def size(self):
        return len(self.map)

    def keys(self):
        # Oldest first. Given to you - once get and put maintain the order,
        # this reports it without any work of its own.
        return list(self.map.keys())
`;
}

const JS_GET_TODO = `  get(key) {
    // TODO: return the value stored under \`key\`, or -1 when there is none.
    return -1;
  }`;

const JS_PUT_TODO = `  put(key, value) {
    // TODO: store \`value\` under \`key\`.
  }`;

const JS_GET_PLAIN = `  get(key) {
    return this.map.has(key) ? this.map.get(key) : -1;
  }`;

const JS_GET_PROMOTING = `  get(key) {
    if (!this.map.has(key)) return -1;
    const value = this.map.get(key);
    // Deleting and re-inserting moves the key to the back of the Map's order,
    // which is what makes it the most recently used.
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }`;

const JS_PUT_PLAIN = `  put(key, value) {
    this.map.set(key, value);
  }`;

const JS_PUT_EVICTING = `  put(key, value) {
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }`;

const JS_PUT_REFRESHING = `  put(key, value) {
    // Writing to a key that is already there counts as using it, and Map.set
    // on an existing key updates the value without moving it. Deleting first
    // is what makes the write a use.
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, value);
    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      this.map.delete(oldest);
    }
  }`;

const PY_GET_TODO = `    def get(self, key):
        # TODO: return the value stored under \`key\`, or -1 when there is none.
        return -1`;

const PY_PUT_TODO = `    def put(self, key, value):
        # TODO: store \`value\` under \`key\`.
        pass`;

const PY_GET_PLAIN = `    def get(self, key):
        return self.map.get(key, -1)`;

const PY_GET_PROMOTING = `    def get(self, key):
        if key not in self.map:
            return -1
        value = self.map.pop(key)
        # Re-inserting moves the key to the back of the dict's order, which is
        # what makes it the most recently used.
        self.map[key] = value
        return value`;

const PY_PUT_PLAIN = `    def put(self, key, value):
        self.map[key] = value`;

const PY_PUT_EVICTING = `    def put(self, key, value):
        self.map[key] = value
        if len(self.map) > self.capacity:
            oldest = next(iter(self.map))
            del self.map[oldest]`;

const PY_PUT_REFRESHING = `    def put(self, key, value):
        # Writing to a key that is already there counts as using it, and a plain
        # assignment updates the value without moving it. Removing it first is
        # what makes the write a use.
        if key in self.map:
            del self.map[key]
        self.map[key] = value
        if len(self.map) > self.capacity:
            oldest = next(iter(self.map))
            del self.map[oldest]`;

export const lruCacheChallenge: ChallengeInput = {
  tier: 'challenge',
  slug: 'lru-cache',
  title: 'LRU Cache',
  category: 'dsa',
  difficulty: 'medium',
  summary: 'Build a fixed-size cache that throws away whatever was used least recently.',
  topics: ['hashing', 'linked-lists'],
  recommendedAfter: ['hashing'],

  brief: `Every cache has to answer one awkward question: it is full, something new
arrived, so **what gets thrown away?**

"Whatever was used least recently" is the answer that shows up in CPUs, in
databases, in HTTP proxies, and in the memory manager of the machine you are
reading this on. It is a good answer because it is a cheap bet on the near
future: what you touched a moment ago, you will probably touch again.

You will build one across four steps, each adding a single rule:

1. hold values and give them back
2. throw out the oldest when you run out of room
3. count *reads* as uses, not just writes
4. count *overwrites* as uses too

Nothing here needs a linked list. The trick — the one every real implementation
uses in some form — is that an insertion-ordered map already knows which key it
saw first, and moving a key to the back is a delete followed by an insert.`,

  steps: [
    {
      slug: 'store-and-retrieve',
      title: 'Hold values and give them back',
      brief: `Start with the boring half: \`put\` stores a value under a key, \`get\`
returns it, and \`get\` on a key you never stored returns \`-1\`.

Ignore \`capacity\` entirely for now — the cache is allowed to grow without
limit. Eviction is the next step, and building it before the storage works
means debugging two things at once.

\`\`\`
put(1, 10)   get(1)  ->  10
             get(7)  ->  -1
\`\`\`

\`size()\` and \`keys()\` are already written for you. Once \`put\` and \`get\`
maintain the order, those two report it without any work of their own.`,
      hints: [
        'A `Map` (JavaScript) or a `dict` (Python) already does everything this step asks for. The only question is what to return when the key is absent.',
        '`map.get(missing)` is `undefined` in JavaScript and raises in Python. Check membership first, or use the two-argument `dict.get`.',
        'JavaScript: `this.map.has(key) ? this.map.get(key) : -1`. Python: `self.map.get(key, -1)`.',
      ],
      entryFile: 'harness',
      focus: 'lru_cache',
      files: [
        {
          name: 'lru_cache',
          starterCode: {
            javascript: jsCache(JS_GET_TODO, JS_PUT_TODO),
            python: pyCache(PY_GET_TODO, PY_PUT_TODO),
          },
          solution: {
            javascript: jsCache(JS_GET_PLAIN, JS_PUT_PLAIN),
            python: pyCache(PY_GET_PLAIN, PY_PUT_PLAIN),
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
            name: 'stores a value and reads it back',
            args: [
              2,
              [
                ['put', 1, 10],
                ['get', 1],
              ],
            ],
            expected: [null, 10],
          },
          {
            name: 'a key that was never stored reads as -1',
            args: [2, [['get', 7]]],
            expected: [-1],
          },
          {
            name: 'size counts what is held',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['size'],
              ],
            ],
            expected: [null, null, 2],
          },
          {
            name: 'writing the same key twice keeps the newer value',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 1, 5],
                ['get', 1],
              ],
            ],
            expected: [null, null, 5],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'evict-the-oldest',
      title: 'Throw out the oldest when you run out of room',
      brief: `Now honour \`capacity\`. When a \`put\` would take the cache past it,
remove one entry first — for this step, whichever key was **inserted longest
ago**.

\`\`\`
capacity 2
put(1, 1)   put(2, 2)   put(3, 3)
get(1)  ->  -1          // 1 was inserted first, so 1 went
get(2)  ->  2
\`\`\`

\`size()\` must never exceed \`capacity\`, including when \`capacity\` is 1.

This is not yet a *least recently used* cache — it is a least recently
*written* one. Reads still count for nothing. That is the next step; get the
eviction machinery right first.`,
      hints: [
        'Insert first, then check whether you have gone over. Checking before you insert means handling the "key already present" case twice.',
        'You need the oldest key. A `Map` and a `dict` both yield their keys in insertion order, so the oldest one is simply the first they yield.',
        'JavaScript: `this.map.keys().next().value`. Python: `next(iter(self.map))`. Delete that key when `size > capacity`.',
      ],
      entryFile: 'harness',
      focus: 'lru_cache',
      files: [
        {
          name: 'lru_cache',
          solution: {
            javascript: jsCache(JS_GET_PLAIN, JS_PUT_EVICTING),
            python: pyCache(PY_GET_PLAIN, PY_PUT_EVICTING),
          },
        },
        { name: 'harness' },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'the oldest key is the one evicted',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 3, 3],
                ['get', 1],
                ['get', 2],
                ['get', 3],
              ],
            ],
            expected: [null, null, null, -1, 2, 3],
          },
          {
            name: 'size never exceeds capacity',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 3, 3],
                ['size'],
              ],
            ],
            expected: [null, null, null, 2],
          },
          {
            name: 'a cache of capacity 1 holds only the newest',
            args: [
              1,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['get', 1],
                ['get', 2],
              ],
            ],
            expected: [null, null, -1, 2],
          },
          {
            name: 'insertion order decides who goes',
            args: [
              3,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 3, 3],
                ['put', 4, 4],
                ['keys'],
              ],
            ],
            expected: [null, null, null, null, [2, 3, 4]],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'reads-count-as-uses',
      title: 'Count reads as uses, not just writes',
      brief: `Here is the step that makes it an *LRU* cache.

Right now a key you read a thousand times is evicted the moment something newer
arrives, because only writes move it. Fix that: a successful \`get\` should make
its key the most recently used one.

\`\`\`
capacity 2
put(1, 1)   put(2, 2)
get(1)  ->  1     // 1 is now the newest, 2 is the oldest
put(3, 3)         // so 2 is evicted, not 1
get(1)  ->  1
get(2)  ->  -1
\`\`\`

A \`get\` that misses must change nothing — no reordering, no insertion.

\`keys()\` reports the order you are maintaining, oldest first. Use it while you
work: if it does not read the way you expect, the order is wrong before the
eviction is.`,
      hints: [
        'You do not need a new data structure. You need to move an existing key to the position a freshly inserted key would occupy.',
        'Both a Map and a dict append on insert. So removing a key and putting it straight back moves it to the end — that is the whole promotion.',
        'JavaScript: read the value, `this.map.delete(key)`, `this.map.set(key, value)`, return it. Python: `value = self.map.pop(key)` then `self.map[key] = value`.',
      ],
      entryFile: 'harness',
      focus: 'lru_cache',
      files: [
        {
          name: 'lru_cache',
          solution: {
            javascript: jsCache(JS_GET_PROMOTING, JS_PUT_EVICTING),
            python: pyCache(PY_GET_PROMOTING, PY_PUT_EVICTING),
          },
        },
        { name: 'harness' },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'a read protects a key from the next eviction',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['get', 1],
                ['put', 3, 3],
                ['get', 1],
                ['get', 2],
              ],
            ],
            expected: [null, null, 1, null, 1, -1],
          },
          {
            name: 'keys report least recently used first',
            args: [
              3,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 3, 3],
                ['get', 1],
                ['keys'],
              ],
            ],
            expected: [null, null, null, 1, [2, 3, 1]],
          },
          {
            name: 'a read that misses changes nothing',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['get', 9],
                ['keys'],
              ],
            ],
            expected: [null, null, -1, [1, 2]],
          },
          {
            name: 'repeated reads keep reordering',
            args: [
              3,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 3, 3],
                ['get', 1],
                ['get', 2],
                ['keys'],
              ],
            ],
            expected: [null, null, null, 1, 2, [3, 1, 2]],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'writes-refresh-too',
      title: 'Count overwrites as uses too',
      brief: `One case is still wrong, and it is the one that bites in production.

Writing to a key that is **already in the cache** is a use of that key — but a
plain assignment updates the value in place and leaves the key exactly where it
was in the order. So a key that is written constantly can still be evicted for
being old.

\`\`\`
capacity 2
put(1, 1)   put(2, 2)
put(1, 99)        // 1 is used, so 1 should now be the newest
put(3, 3)         // 2 is the oldest, so 2 goes
get(1)  ->  99
get(2)  ->  -1
\`\`\`

Overwriting must also not grow the cache: two keys written three times are still
two keys.

With this step done you have a cache whose every operation is O(1), which is the
property that makes LRU usable at all — an eviction policy you have to scan for
is not a policy, it is a full table scan wearing one.`,
      hints: [
        'The bug is that your `put` has two different behaviours depending on whether the key is already there, and only one of them touches the order.',
        'You already wrote the move-to-the-back manoeuvre in the last step. `put` needs the same thing before it stores the new value.',
        'JavaScript: `if (this.map.has(key)) this.map.delete(key);` before the `set`. Python: `if key in self.map: del self.map[key]`. The eviction check afterwards then does the right thing on its own, because an update leaves the size unchanged.',
      ],
      entryFile: 'harness',
      focus: 'lru_cache',
      complexity: {
        time: 'O(1) per operation',
        space: 'O(capacity)',
        note: 'Every operation is a constant number of hash-map lookups, plus one delete-and-reinsert to move a key to the back. Nothing scans the cache — which is the point. A policy that had to search for the least recently used entry would be O(n) per eviction and would cost more than the cache saves.',
      },
      files: [
        {
          name: 'lru_cache',
          solution: {
            javascript: jsCache(JS_GET_PROMOTING, JS_PUT_REFRESHING),
            python: pyCache(PY_GET_PROMOTING, PY_PUT_REFRESHING),
          },
        },
        { name: 'harness' },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'overwriting does not grow the cache',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 1, 99],
                ['size'],
                ['get', 1],
              ],
            ],
            expected: [null, null, null, 2, 99],
          },
          {
            name: 'an overwrite counts as a use',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 1, 99],
                ['put', 3, 3],
                ['get', 1],
                ['get', 2],
                ['get', 3],
              ],
            ],
            expected: [null, null, null, null, 99, -1, 3],
          },
          {
            name: 'keys reflect the overwrite',
            args: [
              3,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 3, 3],
                ['put', 1, 10],
                ['keys'],
              ],
            ],
            expected: [null, null, null, null, [2, 3, 1]],
          },
          {
            name: 'overwrite, then evict',
            args: [
              2,
              [
                ['put', 1, 1],
                ['put', 2, 2],
                ['put', 2, 22],
                ['put', 3, 3],
                ['keys'],
                ['get', 2],
              ],
            ],
            expected: [null, null, null, null, [2, 3], 22],
            hidden: true,
          },
        ],
      },
    },
  ],
};
