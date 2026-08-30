import { beforeEach, describe, expect, it } from 'vitest';
import { LOCAL_PROGRESS_KEY, readLocalProgress, recordLocalAttempt } from '@/lib/progress-local';
import { getProblems } from '@/content/registry';
import { exerciseId } from '@/content/schema';

/**
 * The storage key, shared rather than restated.
 *
 * `useSolved` caches its parse against the same raw string this module writes,
 * so that it can return a stable reference for `useSyncExternalStore`. While
 * writing it I hardcoded a second, wrong key — which silently meant local
 * progress was never read at all, and looked exactly like "no progress yet".
 * Exporting the key is what makes that unrepresentable; this pins it.
 */
describe('local progress key', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('is the key the writer actually uses', () => {
    recordLocalAttempt({
      exerciseId: 'problems/two-sum',
      tier: 'problem',
      language: 'javascript',
      state: 'complete',
    });

    // If these disagree, a reader caching on LOCAL_PROGRESS_KEY sees nothing.
    expect(globalThis.localStorage.getItem(LOCAL_PROGRESS_KEY)).toBeTruthy();
    expect(readLocalProgress()).toHaveLength(1);
  });

  it('round-trips a completed exercise', () => {
    recordLocalAttempt({
      exerciseId: 'problems/two-sum',
      tier: 'problem',
      language: 'javascript',
      state: 'complete',
    });

    const solved = readLocalProgress()
      .filter((e) => e.state === 'complete')
      .map((e) => e.exerciseId);

    expect(solved).toEqual(['problems/two-sum']);
  });

  it('does not report an attempt that has not passed as solved', () => {
    // A tick claiming something is done when it is not is the error a learner
    // would act on, so absence is the safe direction.
    recordLocalAttempt({
      exerciseId: 'problems/two-sum',
      tier: 'problem',
      language: 'javascript',
      state: 'in_progress',
    });

    expect(readLocalProgress().filter((e) => e.state === 'complete')).toEqual([]);
  });
});

/**
 * The id a listing looks up must be the id the runner writes.
 *
 * These are computed in different files — the problem page records
 * `exerciseId(problem)`, the table and the account summary look one up — and
 * while writing them I passed the slug as a *step*, producing
 * `problems/two-sum/two-sum`. Nothing matched, so every tick and every count
 * silently read zero, which looks exactly like "no progress yet".
 */
describe('problem exercise ids', () => {
  it('takes no step, because the slug is the identity', () => {
    const problem = getProblems()[0];
    expect(exerciseId(problem)).toBe(`problems/${problem.slug}`);
  });

  it('never contains the slug twice', () => {
    for (const problem of getProblems()) {
      const id = exerciseId(problem);
      expect(id, `${id} repeats its slug`).not.toBe(
        `problems/${problem.slug}/${problem.slug}`,
      );
    }
  });

  it('is unique across the catalogue', () => {
    // Two problems sharing an id would tick each other.
    const ids = getProblems().map((p) => exerciseId(p));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('matches what a completed local entry records', () => {
    const problem = getProblems()[0];
    recordLocalAttempt({
      exerciseId: exerciseId(problem),
      tier: 'problem',
      language: 'javascript',
      state: 'complete',
    });

    const solved = new Set(
      readLocalProgress().filter((e) => e.state === 'complete').map((e) => e.exerciseId),
    );
    expect(solved.has(exerciseId(problem))).toBe(true);
  });
});
