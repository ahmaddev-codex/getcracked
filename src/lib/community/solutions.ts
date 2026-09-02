/**
 * Community Solution Sharing Engine (Module G2 & C10).
 *
 * Provides opt-in solution sharing, curated peer approaches, and completion-gated
 * community galleries for exercises and build challenges.
 */

export interface CommunitySolution {
  id: string;
  exerciseId: string;
  title: string;
  author: string;
  authorBadge?: string;
  language: 'python' | 'javascript' | 'typescript';
  code: string;
  explanation: string;
  timeComplexity: string;
  spaceComplexity: string;
  upvotes: number;
  createdAt: string;
  tags?: string[];
}

const STORAGE_KEY = 'getcracked_community_solutions';
const UPVOTES_KEY = 'getcracked_solution_upvotes';

export const SEED_SOLUTIONS: CommunitySolution[] = [
  {
    id: 'editorial-two-sum-py',
    exerciseId: 'problem:two-sum',
    title: 'One-Pass Hash Map with Complement Lookup',
    author: 'GetCracked Staff',
    authorBadge: 'Editorial',
    language: 'python',
    code: `def two_sum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    explanation:
      'By inserting each number into a hash map as we iterate, we can query whether its complement (`target - num`) has already been seen in O(1) amortized time.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    upvotes: 42,
    createdAt: '2026-08-15T10:00:00Z',
    tags: ['Hash Map', 'One-Pass', 'Optimal'],
  },
  {
    id: 'editorial-two-sum-js',
    exerciseId: 'problem:two-sum',
    title: 'Idiomatic JavaScript Map Solution',
    author: 'GetCracked Staff',
    authorBadge: 'Editorial',
    language: 'javascript',
    code: `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`,
    explanation:
      'Using JavaScript Map avoids prototype collision pitfalls and provides predictable key-value storage across primitive and numeric types.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(n)',
    upvotes: 28,
    createdAt: '2026-08-18T14:30:00Z',
    tags: ['Hash Map', 'ES6 Map'],
  },
  {
    id: 'editorial-invert-tree-py',
    exerciseId: 'problem:invert-binary-tree',
    title: 'Recursive Depth-First Swap',
    author: 'GetCracked Staff',
    authorBadge: 'Editorial',
    language: 'python',
    code: `def invert_tree(root):
    if not root:
        return None
    root.left, root.right = invert_tree(root.right), invert_tree(root.left)
    return root`,
    explanation:
      'Bottom-up recursion swapping the inverted subtrees in a single tuple assignment. Base case returns None on leaf children.',
    timeComplexity: 'O(n)',
    spaceComplexity: 'O(h) where h is tree height',
    upvotes: 35,
    createdAt: '2026-08-20T09:15:00Z',
    tags: ['DFS', 'Recursion', 'Binary Tree'],
  },
  {
    id: 'editorial-lru-cache-py',
    exerciseId: 'challenge:build-lru-cache',
    title: 'Doubly-Linked List + Hash Map Decomposition',
    author: 'GetCracked Staff',
    authorBadge: 'Editorial',
    language: 'python',
    code: `class Node:
    def __init__(self, key=0, val=0):
        self.key, self.val = key, val
        self.prev = self.next = None

class LRUCache:
    def __init__(self, capacity: int):
        self.cap = capacity
        self.cache = {}
        self.head, self.tail = Node(), Node()
        self.head.next, self.tail.prev = self.tail, self.head

    def _remove(self, node):
        prev, nxt = node.prev, node.next
        prev.next, nxt.prev = nxt, prev

    def _insert_mru(self, node):
        node.prev, node.next = self.head, self.head.next
        self.head.next.prev = node
        self.head.next = node`,
    explanation:
      'Sentinel dummy nodes (head and tail) eliminate edge cases when inserting and removing from the doubly-linked list. Hash map points directly to Node references.',
    timeComplexity: 'O(1) get and put',
    spaceComplexity: 'O(capacity)',
    upvotes: 56,
    createdAt: '2026-08-22T16:00:00Z',
    tags: ['Doubly Linked List', 'Design', 'LRU'],
  },
];

/** Retrieves all solutions for an exercise, combining seeds and local submissions. */
export function getCommunitySolutions(exerciseId: string): CommunitySolution[] {
  const seedMatches = SEED_SOLUTIONS.filter((s) => s.exerciseId === exerciseId);

  if (typeof window === 'undefined') {
    return seedMatches;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const localSolutions: CommunitySolution[] = raw ? JSON.parse(raw) : [];
    const matchedLocal = localSolutions.filter((s) => s.exerciseId === exerciseId);
    return [...matchedLocal, ...seedMatches];
  } catch {
    return seedMatches;
  }
}

/** Retrieves all community solutions across all exercises. */
export function getAllCommunitySolutions(): CommunitySolution[] {
  if (typeof window === 'undefined') {
    return [...SEED_SOLUTIONS];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const localSolutions: CommunitySolution[] = raw ? JSON.parse(raw) : [];
    return [...localSolutions, ...SEED_SOLUTIONS];
  } catch {
    return [...SEED_SOLUTIONS];
  }
}

/** Publishes an opt-in solution to local storage. */
export function publishCommunitySolution(
  solution: Omit<CommunitySolution, 'id' | 'createdAt' | 'upvotes'>,
): CommunitySolution {
  const newSolution: CommunitySolution = {
    ...solution,
    id: `sol-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    upvotes: 1,
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: CommunitySolution[] = raw ? JSON.parse(raw) : [];
      list.unshift(newSolution);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Gracefully ignore storage quota errors
    }
  }

  return newSolution;
}

/** Toggles an upvote on a solution. Returns true if upvoted, false if un-upvoted. */
export function toggleSolutionUpvote(solutionId: string): { upvoted: boolean; countDelta: number } {
  if (typeof window === 'undefined') {
    return { upvoted: false, countDelta: 0 };
  }

  try {
    const rawVotes = localStorage.getItem(UPVOTES_KEY);
    const upvotedIds: string[] = rawVotes ? JSON.parse(rawVotes) : [];
    const hasUpvoted = upvotedIds.includes(solutionId);

    let updatedVotes: string[];
    let delta = 0;

    if (hasUpvoted) {
      updatedVotes = upvotedIds.filter((id) => id !== solutionId);
      delta = -1;
    } else {
      updatedVotes = [...upvotedIds, solutionId];
      delta = 1;
    }

    localStorage.setItem(UPVOTES_KEY, JSON.stringify(updatedVotes));
    return { upvoted: !hasUpvoted, countDelta: delta };
  } catch {
    return { upvoted: false, countDelta: 0 };
  }
}

/** Checks whether the user has upvoted a solution. */
export function hasUserUpvoted(solutionId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(UPVOTES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(solutionId);
  } catch {
    return false;
  }
}
