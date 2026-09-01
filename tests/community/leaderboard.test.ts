import { beforeEach, describe, expect, it } from 'vitest';
import {
  getLeaderboard,
  upsertLeaderboardEntry,
  SEED_ENTRIES,
} from '@/lib/community/leaderboard';

describe('Community Leaderboard Engine (Module G3)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retrieves seeded leaderboard entries sorted by problems solved', () => {
    const entries = getLeaderboard('problems_solved');
    expect(entries.length).toBe(SEED_ENTRIES.length);

    // Verify descending order
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1]!.problemsSolved).toBeGreaterThanOrEqual(entries[i]!.problemsSolved);
    }
  });

  it('sorts by streak correctly', () => {
    const entries = getLeaderboard('streak');
    for (let i = 1; i < entries.length; i++) {
      expect(entries[i - 1]!.currentStreak).toBeGreaterThanOrEqual(entries[i]!.currentStreak);
    }
  });

  it('upserts a new user entry and includes it in rankings', () => {
    const entry = upsertLeaderboardEntry({
      username: 'TestCandidate',
      problemsSolved: 50,
      challengesCompleted: 10,
      currentStreak: 60,
      longestStreak: 60,
      totalSubmissions: 500,
      languages: ['python', 'javascript'],
    });

    expect(entry.id).toBeDefined();
    expect(entry.lastActive).toBeDefined();

    const board = getLeaderboard('problems_solved');
    expect(board[0]!.username).toBe('TestCandidate');
    expect(board[0]!.problemsSolved).toBe(50);
  });

  it('updates an existing user entry instead of duplicating', () => {
    upsertLeaderboardEntry({
      username: 'TestCandidate',
      problemsSolved: 10,
      challengesCompleted: 1,
      currentStreak: 3,
      longestStreak: 3,
      totalSubmissions: 50,
      languages: ['python'],
    });

    upsertLeaderboardEntry({
      username: 'TestCandidate',
      problemsSolved: 20,
      challengesCompleted: 2,
      currentStreak: 5,
      longestStreak: 5,
      totalSubmissions: 100,
      languages: ['python', 'javascript'],
    });

    const board = getLeaderboard('problems_solved');
    const userEntries = board.filter((e) => e.username === 'TestCandidate');
    expect(userEntries).toHaveLength(1);
    expect(userEntries[0]!.problemsSolved).toBe(20);
  });
});
