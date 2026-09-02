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

export const SEED_ENTRIES: LeaderboardEntry[] = [];

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
