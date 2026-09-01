import type { ChallengeInput } from '../../schema';

/**
 * Build an n-ary Prefix Tree (Trie) from scratch.
 *
 * **Why build a Trie?**
 * Search auto-complete, IP routing lookup tables, spellcheckers, and type-ahead
 * suggestions all rely on Tries to achieve O(k) lookups bounded strictly by
 * the length of the query string rather than the size of the dictionary.
 */

const JS_HARNESS = `const { Trie } = require('./trie');

/**
 * Replays a sequence of operations against your Trie. Read-only.
 *
 *   ["insert", word]       -> null
 *   ["search", word]       -> true or false
 *   ["startsWith", prefix] -> true or false
 *   ["autocomplete", prefix] -> sorted list of words with prefix
 */
function runOps(ops) {
  const trie = new Trie();
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'insert') {
      trie.insert(op[1]);
      out.push(null);
    } else if (op[0] === 'search') {
      out.push(trie.search(op[1]));
    } else if (op[0] === 'startsWith') {
      out.push(trie.startsWith(op[1]));
    } else if (op[0] === 'autocomplete') {
      const words = trie.autocomplete(op[1]);
      out.push(words.sort());
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS = `from trie import Trie


def run_ops(ops):
    """Replay a sequence of operations against your Trie. Read-only.

    ["insert", word]         -> None
    ["search", word]         -> True or False
    ["startsWith", prefix]   -> True or False
    ["autocomplete", prefix] -> sorted list of words with prefix
    """
    t = Trie()
    out = []

    for op in ops:
        if op[0] == "insert":
            t.insert(op[1])
            out.append(None)
        elif op[0] == "search":
            out.append(t.search(op[1]))
        elif op[0] == "startsWith":
            out.append(t.starts_with(op[1]))
        elif op[0] == "autocomplete":
            words = t.autocomplete(op[1])
            out.append(sorted(words))
        else:
            raise ValueError(f"Unknown operation: {op[0]}")

    return out
`;

function jsTrie(methods: string): string {
  return `class TrieNode {
  constructor() {
    this.children = {};
    this.isEndOfWord = false;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

${methods}
}

module.exports = { Trie, TrieNode };
`;
}

function pyTrie(methods: string): string {
  return `class TrieNode:
    def __init__(self):
        self.children = {}
        self.is_end_of_word = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

${methods}
`;
}

// Step 1: Word Insertion
const JS_STEP_1_STARTER = `  insert(word) {
    // TODO: Traverse nodes character by character, creating new TrieNodes as needed, and mark the final node as isEndOfWord = true
  }

  search(word) {
    return false;
  }

  startsWith(prefix) {
    return false;
  }

  autocomplete(prefix) {
    return [];
  }`;

const JS_STEP_1_SOLUTION = `  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) {
        curr.children[ch] = new TrieNode();
      }
      curr = curr.children[ch];
    }
    curr.isEndOfWord = true;
  }

  search(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return curr.isEndOfWord;
  }

  startsWith(prefix) {
    return false;
  }

  autocomplete(prefix) {
    return [];
  }`;

const PY_STEP_1_STARTER = `    def insert(self, word):
        # TODO: Traverse nodes character by character, creating new TrieNodes as needed, and mark the final node as is_end_of_word = True
        pass

    def search(self, word):
        return False

    def starts_with(self, prefix):
        return False

    def autocomplete(self, prefix):
        return []`;

const PY_STEP_1_SOLUTION = `    def insert(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True

    def search(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.is_end_of_word

    def starts_with(self, prefix):
        return False

    def autocomplete(self, prefix):
        return []`;

// Step 2: Search
const JS_STEP_2_STARTER = `  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) {
        curr.children[ch] = new TrieNode();
      }
      curr = curr.children[ch];
    }
    curr.isEndOfWord = true;
  }

  search(word) {
    // TODO: Traverse characters from root. Return true if all exist AND final node isEndOfWord === true.
    return false;
  }

  startsWith(prefix) {
    return false;
  }

  autocomplete(prefix) {
    return [];
  }`;

const JS_STEP_2_SOLUTION = `  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) {
        curr.children[ch] = new TrieNode();
      }
      curr = curr.children[ch];
    }
    curr.isEndOfWord = true;
  }

  search(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return curr.isEndOfWord;
  }

  startsWith(prefix) {
    return false;
  }

  autocomplete(prefix) {
    return [];
  }`;

const PY_STEP_2_STARTER = `    def insert(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True

    def search(self, word):
        # TODO: Traverse characters from root. Return True if all exist AND final node is_end_of_word == True.
        return False

    def starts_with(self, prefix):
        return False

    def autocomplete(self, prefix):
        return []`;

const PY_STEP_2_SOLUTION = `    def insert(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True

    def search(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.is_end_of_word

    def starts_with(self, prefix):
        return False

    def autocomplete(self, prefix):
        return []`;

// Step 3: Prefix Matching (startsWith)
const JS_STEP_3_STARTER = `  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) {
        curr.children[ch] = new TrieNode();
      }
      curr = curr.children[ch];
    }
    curr.isEndOfWord = true;
  }

  search(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return curr.isEndOfWord;
  }

  startsWith(prefix) {
    // TODO: Return true if there is any word in the trie starting with prefix
    return false;
  }

  autocomplete(prefix) {
    return [];
  }`;

const JS_STEP_3_SOLUTION = `  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) {
        curr.children[ch] = new TrieNode();
      }
      curr = curr.children[ch];
    }
    curr.isEndOfWord = true;
  }

  search(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return curr.isEndOfWord;
  }

  startsWith(prefix) {
    let curr = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const ch = prefix[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return true;
  }

  autocomplete(prefix) {
    return [];
  }`;

const PY_STEP_3_STARTER = `    def insert(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True

    def search(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.is_end_of_word

    def starts_with(self, prefix):
        # TODO: Return True if there is any word in the trie starting with prefix
        return False

    def autocomplete(self, prefix):
        return []`;

const PY_STEP_3_SOLUTION = `    def insert(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True

    def search(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.is_end_of_word

    def starts_with(self, prefix):
        curr = self.root
        for ch in prefix:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return True

    def autocomplete(self, prefix):
        return []`;

// Step 4: Auto-complete Word Collection
const JS_STEP_4_STARTER = `  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) {
        curr.children[ch] = new TrieNode();
      }
      curr = curr.children[ch];
    }
    curr.isEndOfWord = true;
  }

  search(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return curr.isEndOfWord;
  }

  startsWith(prefix) {
    let curr = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const ch = prefix[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return true;
  }

  autocomplete(prefix) {
    // TODO: Traverse to prefix node, then run DFS to collect all complete words in subtree
    return [];
  }`;

const JS_STEP_4_SOLUTION = `  insert(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) {
        curr.children[ch] = new TrieNode();
      }
      curr = curr.children[ch];
    }
    curr.isEndOfWord = true;
  }

  search(word) {
    let curr = this.root;
    for (let i = 0; i < word.length; i++) {
      const ch = word[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return curr.isEndOfWord;
  }

  startsWith(prefix) {
    let curr = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const ch = prefix[i];
      if (!curr.children[ch]) return false;
      curr = curr.children[ch];
    }
    return true;
  }

  autocomplete(prefix) {
    let curr = this.root;
    for (let i = 0; i < prefix.length; i++) {
      const ch = prefix[i];
      if (!curr.children[ch]) return [];
      curr = curr.children[ch];
    }

    const results = [];
    const dfs = (node, path) => {
      if (node.isEndOfWord) {
        results.push(path);
      }
      for (const [char, childNode] of Object.entries(node.children)) {
        dfs(childNode, path + char);
      }
    };

    dfs(curr, prefix);
    return results;
  }`;

const PY_STEP_4_STARTER = `    def insert(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True

    def search(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.is_end_of_word

    def starts_with(self, prefix):
        curr = self.root
        for ch in prefix:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return True

    def autocomplete(self, prefix):
        # TODO: Traverse to prefix node, then run DFS to collect all complete words in subtree
        return []`;

const PY_STEP_4_SOLUTION = `    def insert(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                curr.children[ch] = TrieNode()
            curr = curr.children[ch]
        curr.is_end_of_word = True

    def search(self, word):
        curr = self.root
        for ch in word:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return curr.is_end_of_word

    def starts_with(self, prefix):
        curr = self.root
        for ch in prefix:
            if ch not in curr.children:
                return False
            curr = curr.children[ch]
        return True

    def autocomplete(self, prefix):
        curr = self.root
        for ch in prefix:
            if ch not in curr.children:
                return []
            curr = curr.children[ch]

        results = []

        def dfs(node, path):
            if node.is_end_of_word:
                results.append(path)
            for char, child_node in node.children.items():
                dfs(child_node, path + char)

        dfs(curr, prefix)
        return results`;

export const trieChallenge: ChallengeInput = {
  tier: 'challenge',
  slug: 'trie',
  title: 'Prefix Tree (Trie)',
  category: 'dsa',
  difficulty: 'medium',
  summary:
    'Construct an n-ary Prefix Tree with character node branching, word insertion, prefix search, and auto-complete.',
  topics: ['tries', 'trees'],
  recommendedAfter: ['tries'],

  brief: `A Trie (derived from "re**trie**val") is an ordered tree data structure where each node represents a character along a shared prefix path.

Unlike a standard hash map, a Trie can search prefixes, list auto-complete recommendations, and match wildcards in $O(k)$ time proportional only to the word length $k$.

In this build, you will construct a **Trie from scratch**:
1. Implement node chaining and word insertion (\`insert\`).
2. Search for exact whole words (\`search\`).
3. Match prefix substrings (\`startsWith\`).
4. Implement recursive auto-complete suggestions (\`autocomplete\`).`,

  steps: [
    {
      slug: 'insert-and-nodes',
      title: 'TrieNode & Word Insertion',
      brief: `Start by understanding the \`TrieNode\` structure and implement \`insert(word)\`.

- Each \`TrieNode\` has a \`children\` dictionary/map and a boolean \`isEndOfWord\` / \`is_end_of_word\`.
- \`insert(word)\`: Walk down the tree starting at \`root\`. For each character, if a child node does not exist, create a new \`TrieNode\`. Finally, set \`isEndOfWord = true\` on the last node.`,
      hints: [
        'Iterate through each character `ch` of `word`.',
        'If `!curr.children[ch]`, initialize it with `new TrieNode()`.',
        'Mark `curr.isEndOfWord = true` once you finish the loop.',
      ],
      entryFile: 'harness',
      focus: 'trie',
      files: [
        {
          name: 'trie',
          starterCode: {
            javascript: jsTrie(JS_STEP_1_STARTER),
            python: pyTrie(PY_STEP_1_STARTER),
          },
          solution: {
            javascript: jsTrie(JS_STEP_1_SOLUTION),
            python: pyTrie(PY_STEP_1_SOLUTION),
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
            name: 'inserts single and overlapping words',
            args: [
              [
                ['insert', 'apple'],
                ['insert', 'app'],
                ['search', 'apple'],
                ['search', 'app'],
              ],
            ],
            expected: [null, null, true, true],
          },
        ],
      },
    },
    {
      slug: 'search-exact-words',
      title: 'Exact Word Search',
      brief: `Implement \`search(word)\` to verify if an exact word exists in the Trie.

- Start at the root and follow the character path for each letter in \`word\`.
- If any character node is missing, return \`false\`.
- If all characters exist, return \`true\` **only if** the final node is marked with \`isEndOfWord === true\` (a prefix alone is not a valid whole word).`,
      hints: [
        'If `!curr.children[ch]` at any point, immediately return `false`.',
        'At the end of the word, return `curr.isEndOfWord` (not just `true`).',
      ],
      entryFile: 'harness',
      focus: 'trie',
      files: [
        {
          name: 'trie',
          starterCode: {
            javascript: jsTrie(JS_STEP_2_STARTER),
            python: pyTrie(PY_STEP_2_STARTER),
          },
          solution: {
            javascript: jsTrie(JS_STEP_2_SOLUTION),
            python: pyTrie(PY_STEP_2_SOLUTION),
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
            name: 'distinguishes complete words from prefixes',
            args: [
              [
                ['insert', 'apple'],
                ['search', 'apple'],
                ['search', 'app'], // not inserted as whole word yet
                ['search', 'appl'],
                ['search', 'orange'],
              ],
            ],
            expected: [null, true, false, false, false],
          },
        ],
      },
    },
    {
      slug: 'prefix-matching',
      title: 'Prefix Matching (startsWith)',
      brief: `Implement \`startsWith(prefix)\` to determine whether any word in the Trie begins with the given prefix.

- Walk the path for each character in \`prefix\`.
- If all character nodes exist, return \`true\` immediately (the final node does not need to have \`isEndOfWord\` set).
- If any character node is missing, return \`false\`.`,
      hints: [
        'Unlike `search()`, `startsWith()` does not require `isEndOfWord === true` on the final node.',
        'Simply reaching the end of the prefix path confirms that words branch from this prefix.',
      ],
      entryFile: 'harness',
      focus: 'trie',
      files: [
        {
          name: 'trie',
          starterCode: {
            javascript: jsTrie(JS_STEP_3_STARTER),
            python: pyTrie(PY_STEP_3_STARTER),
          },
          solution: {
            javascript: jsTrie(JS_STEP_3_SOLUTION),
            python: pyTrie(PY_STEP_3_SOLUTION),
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
            name: 'verifies prefix existence without complete word requirement',
            args: [
              [
                ['insert', 'banana'],
                ['insert', 'band'],
                ['startsWith', 'ban'],
                ['startsWith', 'band'],
                ['startsWith', 'bar'],
              ],
            ],
            expected: [null, null, true, true, false],
          },
        ],
      },
    },
    {
      slug: 'autocomplete',
      title: 'Auto-Complete Suggestions',
      brief: `Search engines and code editors use Tries to power type-ahead suggestions.

Implement \`autocomplete(prefix)\`:
1. Traverse down to the node representing the end of \`prefix\`. If the prefix does not exist, return an empty array/list \`[]\`.
2. Run a depth-first search (DFS) starting from that node down the subtree.
3. Whenever a node with \`isEndOfWord === true\` is encountered, append the accumulated word to the results.
4. Return all completed words matching the prefix.`,
      hints: [
        'Reach the prefix node first: `let curr = this.root; ...`',
        'Use recursive DFS `(node, path)` that branches into `Object.entries(node.children)`.',
        'If `node.isEndOfWord`, add `path` to the results list.',
      ],
      entryFile: 'harness',
      focus: 'trie',
      files: [
        {
          name: 'trie',
          starterCode: {
            javascript: jsTrie(JS_STEP_4_STARTER),
            python: pyTrie(PY_STEP_4_STARTER),
          },
          solution: {
            javascript: jsTrie(JS_STEP_4_SOLUTION),
            python: pyTrie(PY_STEP_4_SOLUTION),
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
            name: 'collects all words matching a prefix',
            args: [
              [
                ['insert', 'cat'],
                ['insert', 'car'],
                ['insert', 'card'],
                ['insert', 'care'],
                ['insert', 'dog'],
                ['autocomplete', 'car'],
                ['autocomplete', 'ca'],
                ['autocomplete', 'z'],
              ],
            ],
            expected: [
              null,
              null,
              null,
              null,
              null,
              ['car', 'card', 'care'],
              ['car', 'card', 'care', 'cat'],
              [],
            ],
          },
        ],
      },
    },
  ],
};
