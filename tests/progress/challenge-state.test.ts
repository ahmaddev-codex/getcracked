import { describe, expect, it } from 'vitest';
import { deriveChallengeState, type ExerciseProgressRecord } from '@/lib/progress';
import { getChallenges } from '@/content/registry';
import { stepIds } from '@/content/challenge';

/**
 * Per-step progress for a build challenge (tier 3, I4's third state).
 *
 * The storage shape is unchanged from the other tiers: a step is addressed
 * exactly as a lesson exercise is, so nothing about the schema or the API had to
 * move. What is new is which ids get grouped, and that is what these cover.
 */

const record = (
  exerciseId: string,
  state: ExerciseProgressRecord['state'],
): ExerciseProgressRecord => ({
  exerciseId,
  language: 'javascript',
  state,
  completedAt: state === 'complete' ? new Date() : null,
});

const STEPS = ['challenges/x/one', 'challenges/x/two', 'challenges/x/three'];

describe('deriveChallengeState', () => {
  it('is not started when nothing has been touched', () => {
    expect(deriveChallengeState(STEPS, [])).toBe('not_started');
  });

  it('is in progress once any step has been attempted', () => {
    expect(deriveChallengeState(STEPS, [record(STEPS[1], 'in_progress')])).toBe('in_progress');
  });

  it('is in progress when some steps pass and others have not been opened', () => {
    expect(deriveChallengeState(STEPS, [record(STEPS[0], 'complete')])).toBe('in_progress');
  });

  it('is complete only when every step passes', () => {
    expect(deriveChallengeState(STEPS, STEPS.map((id) => record(id, 'complete')))).toBe(
      'complete',
    );
  });

  it('does not care what order the steps were done in', () => {
    // Steps are independently solvable by construction — an unfinished step
    // hands over the author's build of everything before it — so a learner who
    // starts at step 3 is as complete as one who started at step 1.
    const reversed = [...STEPS].reverse().map((id) => record(id, 'complete'));
    expect(deriveChallengeState(STEPS, reversed)).toBe('complete');
  });

  it('ignores progress on exercises that are not this build‘s steps', () => {
    const other = [record('problems/two-sum', 'complete'), record('challenges/y/one', 'complete')];
    expect(deriveChallengeState(STEPS, other)).toBe('not_started');
  });

  it('reports a build with no steps as not started, never as done', () => {
    // The same rule a lesson with no exercises follows: an empty group cannot
    // be complete, and counting it as done would inflate every roadmap node
    // that contains it.
    expect(deriveChallengeState([], [])).toBe('not_started');
  });
});

describe('against the real catalog', () => {
  it('reports a finished build as complete from its own step ids', () => {
    // The ids used here are the ones the workspace writes, so a rename that
    // broke the join would fail this rather than silently reading zero.
    for (const challenge of getChallenges()) {
      const ids = stepIds(challenge);
      expect(deriveChallengeState(ids, ids.map((id) => record(id, 'complete')))).toBe(
        'complete',
      );
      expect(deriveChallengeState(ids, [])).toBe('not_started');
    }
  });
});
