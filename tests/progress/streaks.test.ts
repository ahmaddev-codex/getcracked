import { describe, expect, it } from 'vitest';
import { streaks } from '@/lib/account';

/**
 * Streak counting.
 *
 * The interesting case is the boundary at *today*: a learner opening the site
 * at 9am has not practised yet, and showing them zero would punish them for the
 * time of day rather than for missing a day. That tolerance is the whole design
 * decision here, so it is what these pin.
 */
const days = (pattern: number[]) =>
  pattern.map((submissions, i) => ({
    date: `2026-01-${String(i + 1).padStart(2, '0')}`,
    submissions,
    passed: submissions,
  }));

describe('streaks', () => {
  it('counts a run ending today', () => {
    expect(streaks(days([1, 1, 1])).currentStreak).toBe(3);
  });

  it('survives today being empty, since the day is not over', () => {
    // Practised the two days before; today has not happened yet.
    expect(streaks(days([1, 1, 0])).currentStreak).toBe(2);
  });

  it('ends on two consecutive empty days', () => {
    expect(streaks(days([1, 1, 0, 0])).currentStreak).toBe(0);
  });

  it('reports zero for no activity at all', () => {
    expect(streaks(days([0, 0, 0]))).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('remembers the longest run even after it is broken', () => {
    const result = streaks(days([1, 1, 1, 1, 0, 0, 1]));
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(1);
  });

  it('handles an empty history', () => {
    expect(streaks([])).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it('does not let a gap earlier in the year inflate the current streak', () => {
    expect(streaks(days([1, 1, 1, 0, 0, 1, 1])).currentStreak).toBe(2);
  });
});
