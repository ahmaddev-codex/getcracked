import { describe, expect, it } from 'vitest';
import { DIFFICULTIES, catalogCounts, filterProblems } from '@/lib/catalog';
import { getProblems, getTopics, getChallenges } from '@/content/registry';

/** Catalog filtering (A4). Pure over content — no session, no progress. */

describe('filtering', () => {
  it('returns everything with no filter', () => {
    expect(filterProblems({}).length).toBe(getProblems().length);
  });

  it('filters by difficulty', () => {
    const out = filterProblems({ difficulty: 'easy' });
    expect(out.every((p) => p.difficulty === 'easy')).toBe(true);
  });

  it('filters by topic', () => {
    const out = filterProblems({ topic: 'hashing' });
    expect(out.every((p) => p.topic === 'hashing')).toBe(true);
    expect(out.length).toBeGreaterThan(0);
  });

  it('combines filters rather than treating them as alternatives', () => {
    const out = filterProblems({ topic: 'hashing', difficulty: 'easy' });
    expect(out.every((p) => p.topic === 'hashing' && p.difficulty === 'easy')).toBe(true);
  });

  it('returns empty rather than throwing for an unknown value', () => {
    // Filters come from the URL, so any string can arrive.
    expect(filterProblems({ topic: 'not-a-topic' })).toHaveLength(0);
    expect(filterProblems({ difficulty: 'impossible' })).toHaveLength(0);
  });

  it('returns empty for a valid pair that matches nothing', () => {
    // Derived rather than hardcoded: any fixed pair eventually gains content
    // and the test starts asserting the opposite of what it was written for.
    const topic = getTopics()[0];
    const used = new Set(filterProblems({ topic }).map((p) => p.difficulty));
    const unused = DIFFICULTIES.find((d) => !used.has(d));

    if (!unused) return; // Every difficulty is covered — nothing to assert.
    expect(filterProblems({ topic, difficulty: unused })).toHaveLength(0);
  });
});

describe('counts', () => {
  it('derives from content rather than being hardcoded', () => {
    const counts = catalogCounts();
    expect(counts.problems).toBe(getProblems().length);
  });

  it('counts every tier from content, including build challenges', () => {
    const counts = catalogCounts();
    expect(counts.challenges).toBe(getChallenges().length);
    // Steps as well as builds: three challenges are twelve sittings, and
    // reporting only the first would make tier 3 look smaller than tier 2.
    expect(counts.challengeSteps).toBe(
      getChallenges().reduce((n, c) => n + c.steps.length, 0),
    );
  });
});

describe('filter vocabulary', () => {
  it('offers every difficulty the content actually uses', () => {
    for (const problem of getProblems()) {
      expect(DIFFICULTIES).toContain(problem.difficulty);
    }
  });

  it('offers every topic the content actually uses', () => {
    const topics = getTopics();
    for (const problem of getProblems()) {
      expect(topics).toContain(problem.topic);
    }
  });
});
