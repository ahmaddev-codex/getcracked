'use client';

import type { Language, Tier } from '@/content/schema';
import { recordLocalAttempt } from '@/lib/progress-local';

/**
 * Recording one attempt, from wherever it was made.
 *
 * Extracted so the problem workspace and the build-challenge workspace cannot
 * drift on what happens when a learner presses Submit. They are two different
 * editing surfaces — one file versus a workspace of them — but "an attempt was
 * made" must mean exactly one thing, or the roadmap, the streak and the funnel
 * start disagreeing depending on which page the work happened on.
 *
 * Local always, server best-effort: a signed-in learner whose network drops
 * should still find their work when they come back, and a failed sync must never
 * surface as an error on top of their test results.
 */
export interface Attempt {
  exerciseId: string;
  tier: Tier;
  language: Language;
  code: string;
  passed: boolean;
}

/**
 * The local half, synchronously.
 *
 * Exposed on its own because a caller sometimes needs to *read back* the
 * progress it just wrote — "was that the last step of the build?" can only be
 * answered once this has run. Folding it into an async function would make the
 * answer depend on how far a promise had got, which is the kind of ordering bug
 * that shows up as a milestone firing one step late.
 */
export function recordAttemptLocally(attempt: Attempt): void {
  recordLocalAttempt({
    exerciseId: attempt.exerciseId,
    tier: attempt.tier,
    language: attempt.language,
    state: attempt.passed ? 'complete' : 'in_progress',
  });
}

/** The account half. Best-effort: a failed sync is never surfaced. */
export async function syncAttempt(attempt: Attempt): Promise<void> {
  try {
    // 401 for a signed-out learner is the expected case, not an error.
    await fetch('/api/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attempt),
      keepalive: true,
    });
  } catch {
    // Offline or blocked; local progress already holds the attempt.
  }
}

export async function persistAttempt(attempt: Attempt): Promise<void> {
  recordAttemptLocally(attempt);
  await syncAttempt(attempt);
}
