import { describe, expect, it } from 'vitest';
import { getDueProblems, scheduleProblemReview } from '@/lib/personalization/spaced-repetition';
import type { UserPersonalizationData } from '@/lib/personalization/storage';

describe('Phase 8: Personalization & Spaced Repetition (Module F)', () => {
  function createTestData(): UserPersonalizationData {
    return {
      streak: { current: 3, longest: 5, lastActiveDate: '2026-09-01' },
      reviews: {},
      mockScorecards: [],
      activityHistory: { '2026-09-01': 3 },
    };
  }

  it('promotes successful reviews to higher Leitner boxes', () => {
    let data = createTestData();

    // First attempt: box 1
    data = scheduleProblemReview('two-sum', true, data);
    expect(data.reviews['two-sum']?.box).toBe(1);

    // Second attempt: box 2
    data = scheduleProblemReview('two-sum', true, data);
    expect(data.reviews['two-sum']?.box).toBe(2);

    // Third attempt: box 3
    data = scheduleProblemReview('two-sum', true, data);
    expect(data.reviews['two-sum']?.box).toBe(3);
  });

  it('resets failed review back to box 1 for daily reinforcement', () => {
    let data = createTestData();

    data = scheduleProblemReview('lru-cache', true, data);
    data = scheduleProblemReview('lru-cache', true, data);
    expect(data.reviews['lru-cache']?.box).toBe(2);

    // Failure resets to box 1
    data = scheduleProblemReview('lru-cache', false, data);
    expect(data.reviews['lru-cache']?.box).toBe(1);
  });

  it('correctly returns items that are due for review', () => {
    const data = createTestData();
    const now = Date.now();

    // Overdue item
    data.reviews['overdue-problem'] = {
      problemSlug: 'overdue-problem',
      box: 2,
      lastReviewedAt: now - 5 * 24 * 60 * 60 * 1000,
      nextReviewAt: now - 1 * 24 * 60 * 60 * 1000, // Due yesterday
      reviewCount: 2,
    };

    // Future item
    data.reviews['future-problem'] = {
      problemSlug: 'future-problem',
      box: 3,
      lastReviewedAt: now,
      nextReviewAt: now + 7 * 24 * 60 * 60 * 1000, // Due in 7 days
      reviewCount: 1,
    };

    const due = getDueProblems(data);
    expect(due.length).toBe(1);
    expect(due[0]?.problemSlug).toBe('overdue-problem');
  });
});
