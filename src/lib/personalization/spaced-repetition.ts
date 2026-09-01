import type { SpacedReviewRecord, UserPersonalizationData } from './storage';
import { loadPersonalizationData, savePersonalizationData } from './storage';

// Leitner intervals in milliseconds: 1 day, 3 days, 7 days, 14 days, 30 days
const INTERVALS_MS = [
  1 * 24 * 60 * 60 * 1000,
  3 * 24 * 60 * 60 * 1000,
  7 * 24 * 60 * 60 * 1000,
  14 * 24 * 60 * 60 * 1000,
  30 * 24 * 60 * 60 * 1000,
];

export function scheduleProblemReview(
  problemSlug: string,
  wasSuccess: boolean,
  data?: UserPersonalizationData,
): UserPersonalizationData {
  const currentData = data ?? loadPersonalizationData();
  const existing = currentData.reviews[problemSlug];

  let nextBox = 1;
  let reviewCount = 1;

  if (existing) {
    reviewCount = existing.reviewCount + 1;
    if (wasSuccess) {
      nextBox = Math.min(5, existing.box + 1);
    } else {
      nextBox = 1; // reset back to daily review on error
    }
  }

  const intervalMs = INTERVALS_MS[nextBox - 1] ?? INTERVALS_MS[0]!;
  const now = Date.now();

  currentData.reviews[problemSlug] = {
    problemSlug,
    box: nextBox,
    lastReviewedAt: now,
    nextReviewAt: now + intervalMs,
    reviewCount,
  };

  savePersonalizationData(currentData);
  return currentData;
}

export function getDueProblems(data?: UserPersonalizationData): SpacedReviewRecord[] {
  const currentData = data ?? loadPersonalizationData();
  const now = Date.now();

  return Object.values(currentData.reviews)
    .filter((record) => record.nextReviewAt <= now)
    .sort((a, b) => a.nextReviewAt - b.nextReviewAt);
}
