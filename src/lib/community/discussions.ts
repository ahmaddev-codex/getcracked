/**
 * Community Discussion & Q&A Engine (Module G1).
 *
 * Provides contextual comment threads, edge-case inquiries, and peer discussions
 * per exercise and lab.
 */

export interface DiscussionComment {
  id: string;
  exerciseId: string;
  author: string;
  authorBadge?: string;
  content: string;
  upvotes: number;
  createdAt: string;
  parentId?: string; // If set, this is a reply to another comment
  tag?: 'question' | 'edge_case' | 'optimization' | 'intuition';
}

const STORAGE_KEY = 'getcracked_discussions';
const UPVOTES_KEY = 'getcracked_discussion_upvotes';

/** Curated seed discussion threads covering common interview edge cases. */
export const SEED_COMMENTS: DiscussionComment[] = [
  {
    id: 'disc-two-sum-1',
    exerciseId: 'problem:two-sum',
    author: 'PrincipalEng',
    authorBadge: 'Interviewer',
    content:
      'Always clarify: Can the same element be used twice? (The prompt says no). Also clarify if the array is guaranteed to have exactly one solution, and whether numbers can be negative.',
    upvotes: 45,
    createdAt: '2026-08-16T11:00:00Z',
    tag: 'edge_case',
  },
  {
    id: 'disc-two-sum-1-reply',
    exerciseId: 'problem:two-sum',
    author: 'JuniorDev',
    content:
      'Great callout! When target is negative (e.g., target = -5 and nums = [-2, -3]), the hash map approach still works identically because `target - num` preserves sign arithmetic.',
    upvotes: 19,
    createdAt: '2026-08-16T13:30:00Z',
    parentId: 'disc-two-sum-1',
    tag: 'intuition',
  },
  {
    id: 'disc-two-sum-2',
    exerciseId: 'problem:two-sum',
    author: 'SystemDesigner',
    authorBadge: 'Staff',
    content:
      'What if the input array is 500GB and cannot fit in memory? Interview follow-up: External sorting (multi-way merge sort on disk blocks) followed by two-pointer search on the streaming sorted segments.',
    upvotes: 38,
    createdAt: '2026-08-19T15:45:00Z',
    tag: 'optimization',
  },
  {
    id: 'disc-lru-1',
    exerciseId: 'challenge:build-lru-cache',
    author: 'CacheWizard',
    authorBadge: 'Infra Lead',
    content:
      'Why doubly-linked list instead of singly-linked? Because deleting a node when updating MRU requires $O(1)$ access to its predecessor (`node.prev`). A singly linked list would require an $O(n)$ traversal to find the previous pointer.',
    upvotes: 62,
    createdAt: '2026-08-23T14:10:00Z',
    tag: 'intuition',
  },
  {
    id: 'disc-invert-tree-1',
    exerciseId: 'problem:invert-binary-tree',
    author: 'RecursionPro',
    content:
      'Watch out for call stack overflow if the binary tree is severely skewed (degenerate linked list with $N = 10^5$). In that case, an iterative BFS using a queue or DFS with explicit heap stack avoids exceeding recursion limits.',
    upvotes: 27,
    createdAt: '2026-08-25T17:00:00Z',
    tag: 'edge_case',
  },
];

/** Retrieves all discussion comments for an exercise, structured with seed comments. */
export function getDiscussionComments(exerciseId: string): DiscussionComment[] {
  const seedMatches = SEED_COMMENTS.filter((c) => c.exerciseId === exerciseId);

  if (typeof window === 'undefined') {
    return seedMatches;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const localComments: DiscussionComment[] = raw ? JSON.parse(raw) : [];
    const matchedLocal = localComments.filter((c) => c.exerciseId === exerciseId);
    return [...matchedLocal, ...seedMatches];
  } catch {
    return seedMatches;
  }
}

/** Posts a new discussion comment or nested reply. */
export function postDiscussionComment(
  comment: Omit<DiscussionComment, 'id' | 'createdAt' | 'upvotes'>,
): DiscussionComment {
  const newComment: DiscussionComment = {
    ...comment,
    id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    upvotes: 1,
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: DiscussionComment[] = raw ? JSON.parse(raw) : [];
      list.unshift(newComment);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Gracefully ignore storage quota errors
    }
  }

  return newComment;
}

/** Toggles an upvote on a discussion comment. */
export function toggleCommentUpvote(commentId: string): { upvoted: boolean; countDelta: number } {
  if (typeof window === 'undefined') {
    return { upvoted: false, countDelta: 0 };
  }

  try {
    const rawVotes = localStorage.getItem(UPVOTES_KEY);
    const upvotedIds: string[] = rawVotes ? JSON.parse(rawVotes) : [];
    const hasUpvoted = upvotedIds.includes(commentId);

    let updatedVotes: string[];
    let delta = 0;

    if (hasUpvoted) {
      updatedVotes = upvotedIds.filter((id) => id !== commentId);
      delta = -1;
    } else {
      updatedVotes = [...upvotedIds, commentId];
      delta = 1;
    }

    localStorage.setItem(UPVOTES_KEY, JSON.stringify(updatedVotes));
    return { upvoted: !hasUpvoted, countDelta: delta };
  } catch {
    return { upvoted: false, countDelta: 0 };
  }
}

/** Checks whether the user has upvoted a comment. */
export function hasUserUpvotedComment(commentId: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const raw = localStorage.getItem(UPVOTES_KEY);
    const ids: string[] = raw ? JSON.parse(raw) : [];
    return ids.includes(commentId);
  } catch {
    return false;
  }
}
