'use client';

import type { Language, Tier } from '@/content/schema';
import { deriveLessonState, type ProgressState } from '@/lib/progress';

/**
 * Progress for a signed-out learner (A15).
 *
 * Mirrors the server shape so the two can be merged on sign-up without a
 * translation layer. Deliberately separate from `lib/progress.ts`: that module
 * is server-only and touches the database, and importing it here would drag
 * Drizzle into the client bundle.
 */

/**
 * Exported so a reader can cache against the same raw string this writes.
 * A second copy of the key is a bug that only shows as "progress silently
 * missing", which is exactly what happened while writing `useSolved`.
 */
export const LOCAL_PROGRESS_KEY = 'gc.progress';
const KEY = LOCAL_PROGRESS_KEY;

export interface LocalProgressEntry {
  exerciseId: string;
  tier: Tier;
  language: Language;
  state: ProgressState;
}

export function readLocalProgress(): LocalProgressEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as LocalProgressEntry[]) : [];
  } catch {
    return [];
  }
}

/** Progress only moves forward, matching the server's rule. */
export function recordLocalAttempt(entry: LocalProgressEntry): void {
  try {
    const all = readLocalProgress();
    const index = all.findIndex(
      (e) => e.exerciseId === entry.exerciseId && e.language === entry.language,
    );

    if (index === -1) {
      all.push(entry);
    } else if (all[index].state !== 'complete') {
      all[index] = entry;
    }

    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // Storage refused; the attempt still ran and the result is on screen.
  }
}

/**
 * Lesson state for a signed-out learner.
 *
 * Uses the same `deriveLessonState` the server does, so the two tiers cannot
 * drift on what "complete" means — the bug this would otherwise produce is a
 * lesson that reads as done signed out and not-started signed in.
 */
export function readLocalLessonState(exerciseIds: readonly string[]): ProgressState {
  return deriveLessonState(
    exerciseIds,
    readLocalProgress().map((e) => ({
      exerciseId: e.exerciseId,
      language: e.language,
      state: e.state,
      completedAt: null,
    })),
  );
}

/**
 * Challenge state for a signed-out learner, from the same derivation the server
 * uses. Named for the tier so a caller cannot pass a challenge's steps to
 * something that means "lesson" and get an answer that reads plausibly.
 */
export function readLocalChallengeState(stepIds: readonly string[]): ProgressState {
  return readLocalLessonState(stepIds);
}

export function clearLocalProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
