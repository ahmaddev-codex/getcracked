/**
 * Community Leaderboard Engine (Module G3).
 *
 * Tracks and ranks learners by problems solved, streak length, challenge
 * completions, and activity volume. Operates on client-side localStorage
 * for the initial launch, mirroring the pattern used in the rest of the
 * community modules (solutions, discussions).
 *
 * The leaderboard is seeded with plausible phantom entries so the board
 * is never empty at launch — an empty leaderboard discourages rather
 * than motivates.
 */

export interface LeaderboardEntry {
  id: string;
  username: string;
  badge?: string;
  /** Total unique exercises passed. */
  problemsSolved: number;
  /** Multi-step build challenge completions. */
  challengesCompleted: number;
  /** Current daily practice streak. */
  currentStreak: number;
  /** Longest streak ever recorded. */
  longestStreak: number;
  /** Total submissions across all exercises. */
  totalSubmissions: number;
  /** Languages used. */
  languages: string[];
  /** ISO timestamp of last activity. */
  lastActive: string;
}

export type LeaderboardSort =
  | 'problems_solved'
  | 'streak'
  | 'challenges'
  | 'submissions';

export type LeaderboardTimeframe = 'all_time' | 'this_week' | 'this_month';

const STORAGE_KEY = 'getcracked_leaderboard';

/**
 * Seeded phantom entries — visible immediately so the leaderboard
 * feels alive from day one. Names are fictional but plausible.
 */
export const SEED_ENTRIES: LeaderboardEntry[] = [
  {
    id: 'lb-seed-1',
    username: 'AlgoAlchemist',
    badge: 'Top Contributor',
    problemsSolved: 47,
    challengesCompleted: 6,
    currentStreak: 23,
    longestStreak: 45,
    totalSubmissions: 312,
    languages: ['python', 'javascript'],
    lastActive: '2026-09-01T10:30:00Z',
  },
  {
    id: 'lb-seed-2',
    username: 'RecursionPro',
    badge: 'Streak Master',
    problemsSolved: 39,
    challengesCompleted: 5,
    currentStreak: 31,
    longestStreak: 31,
    totalSubmissions: 248,
    languages: ['python'],
    lastActive: '2026-09-01T08:15:00Z',
  },
  {
    id: 'lb-seed-3',
    username: 'SystemBuilder',
    problemsSolved: 34,
    challengesCompleted: 8,
    currentStreak: 14,
    longestStreak: 28,
    totalSubmissions: 195,
    languages: ['javascript', 'typescript'],
    lastActive: '2026-08-31T22:45:00Z',
  },
  {
    id: 'lb-seed-4',
    username: 'GraphNinja',
    problemsSolved: 28,
    challengesCompleted: 4,
    currentStreak: 9,
    longestStreak: 19,
    totalSubmissions: 167,
    languages: ['python', 'javascript'],
    lastActive: '2026-08-31T19:20:00Z',
  },
  {
    id: 'lb-seed-5',
    username: 'StackOverflow_',
    badge: 'Challenge Crusher',
    problemsSolved: 25,
    challengesCompleted: 7,
    currentStreak: 5,
    longestStreak: 16,
    totalSubmissions: 143,
    languages: ['javascript'],
    lastActive: '2026-08-30T14:55:00Z',
  },
  {
    id: 'lb-seed-6',
    username: 'HeapQueenBee',
    problemsSolved: 22,
    challengesCompleted: 3,
    currentStreak: 12,
    longestStreak: 22,
    totalSubmissions: 134,
    languages: ['python'],
    lastActive: '2026-09-01T07:00:00Z',
  },
  {
    id: 'lb-seed-7',
    username: 'TreeTraverser',
    problemsSolved: 19,
    challengesCompleted: 2,
    currentStreak: 7,
    longestStreak: 14,
    totalSubmissions: 98,
    languages: ['javascript', 'python'],
    lastActive: '2026-08-29T16:30:00Z',
  },
  {
    id: 'lb-seed-8',
    username: 'DPDynamo',
    problemsSolved: 16,
    challengesCompleted: 3,
    currentStreak: 3,
    longestStreak: 11,
    totalSubmissions: 87,
    languages: ['python'],
    lastActive: '2026-08-28T21:10:00Z',
  },
  {
    id: 'lb-seed-9',
    username: 'LinkedListLee',
    problemsSolved: 12,
    challengesCompleted: 2,
    currentStreak: 1,
    longestStreak: 8,
    totalSubmissions: 64,
    languages: ['javascript'],
    lastActive: '2026-08-27T11:40:00Z',
  },
  {
    id: 'lb-seed-10',
    username: 'BinaryBoss',
    problemsSolved: 9,
    challengesCompleted: 1,
    currentStreak: 2,
    longestStreak: 5,
    totalSubmissions: 42,
    languages: ['python', 'javascript'],
    lastActive: '2026-08-26T09:15:00Z',
  },
];

/** Retrieves all leaderboard entries (seeds + local user entries), sorted. */
export function getLeaderboard(
  sortBy: LeaderboardSort = 'problems_solved',
): LeaderboardEntry[] {
  const all = [...SEED_ENTRIES, ...getLocalEntries()];
  return sortEntries(all, sortBy);
}

/** Registers or updates the current user's leaderboard entry. */
export function upsertLeaderboardEntry(
  entry: Omit<LeaderboardEntry, 'id' | 'lastActive'>,
): LeaderboardEntry {
  const updated: LeaderboardEntry = {
    ...entry,
    id: `lb-user-${entry.username.toLowerCase().replace(/\s+/g, '-')}`,
    lastActive: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const list: LeaderboardEntry[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex((e) => e.id === updated.id);
      if (idx >= 0) {
        list[idx] = updated;
      } else {
        list.push(updated);
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // Gracefully ignore storage quota errors
    }
  }

  return updated;
}

function getLocalEntries(): LeaderboardEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function sortEntries(entries: LeaderboardEntry[], sortBy: LeaderboardSort): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    switch (sortBy) {
      case 'problems_solved':
        return b.problemsSolved - a.problemsSolved;
      case 'streak':
        return b.currentStreak - a.currentStreak || b.longestStreak - a.longestStreak;
      case 'challenges':
        return b.challengesCompleted - a.challengesCompleted;
      case 'submissions':
        return b.totalSubmissions - a.totalSubmissions;
      default:
        return b.problemsSolved - a.problemsSolved;
    }
  });
}
