import { beforeEach, describe, expect, it } from 'vitest';
import {
  getCommunitySolutions,
  publishCommunitySolution,
  toggleSolutionUpvote,
  hasUserUpvoted,
  SEED_SOLUTIONS,
} from '@/lib/community/solutions';

describe('Community Solutions Engine (Modules G2 & C10)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retrieves seeded community solutions for launch exercises', () => {
    const twoSumSolutions = getCommunitySolutions('problem:two-sum');
    expect(twoSumSolutions.length).toBeGreaterThanOrEqual(2);

    const hasPython = twoSumSolutions.some((s) => s.language === 'python');
    const hasJs = twoSumSolutions.some((s) => s.language === 'javascript');
    expect(hasPython).toBe(true);
    expect(hasJs).toBe(true);
  });

  it('publishes and stores a new user solution', () => {
    const published = publishCommunitySolution({
      exerciseId: 'problem:two-sum',
      title: 'Optimal Two-Pointer on Sorted Copy',
      author: 'CandidateX',
      language: 'python',
      code: 'def two_sum(): pass',
      explanation: 'Sort and use two pointers meeting in the middle.',
      timeComplexity: 'O(n log n)',
      spaceComplexity: 'O(n)',
    });

    expect(published.id).toBeDefined();
    expect(published.upvotes).toBe(1);
    expect(published.createdAt).toBeDefined();

    const allSolutions = getCommunitySolutions('problem:two-sum');
    const found = allSolutions.find((s) => s.id === published.id);
    expect(found).toBeDefined();
    expect(found?.title).toBe('Optimal Two-Pointer on Sorted Copy');
  });

  it('toggles solution upvotes and prevents duplicate voting', () => {
    const targetId = SEED_SOLUTIONS[0]!.id;

    expect(hasUserUpvoted(targetId)).toBe(false);

    // First upvote
    const vote1 = toggleSolutionUpvote(targetId);
    expect(vote1.upvoted).toBe(true);
    expect(vote1.countDelta).toBe(1);
    expect(hasUserUpvoted(targetId)).toBe(true);

    // Toggle off upvote
    const vote2 = toggleSolutionUpvote(targetId);
    expect(vote2.upvoted).toBe(false);
    expect(vote2.countDelta).toBe(-1);
    expect(hasUserUpvoted(targetId)).toBe(false);
  });
});
