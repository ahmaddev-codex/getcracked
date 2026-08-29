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

const KEY = 'gc.progress';

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

export function clearLocalProgress(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // Nothing to do.
  }
}
