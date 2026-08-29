import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from '../db/helpers';
import { deriveLessonState, getLessonState, recordAttempt } from '@/lib/progress';
import * as s from '@/db/schema';

/**
 * Lesson state (B12) — the single definition of "done" that the recommendation
 * engine, roadmap nodes, and the analytics funnel all read.
 */

const IDS = ['lessons/hashing/a', 'lessons/hashing/b'];

describe('deriveLessonState', () => {
  const record = (exerciseId: string, state: 'not_started' | 'in_progress' | 'complete') => ({
    exerciseId,
    language: 'javascript' as const,
    state,
    completedAt: null,
  });

  it('is not started when nothing has been attempted', () => {
    expect(deriveLessonState(IDS, [])).toBe('not_started');
  });

  it('is in progress when some but not all are done', () => {
    expect(deriveLessonState(IDS, [record(IDS[0], 'complete')])).toBe('in_progress');
  });

  it('is in progress when an exercise was attempted but not solved', () => {
    expect(deriveLessonState(IDS, [record(IDS[0], 'in_progress')])).toBe('in_progress');
  });

  it('is complete only when every exercise is', () => {
    expect(
      deriveLessonState(IDS, [record(IDS[0], 'complete'), record(IDS[1], 'complete')]),
    ).toBe('complete');
  });

  it('ignores progress on exercises from other lessons', () => {
    // Otherwise finishing one lesson could mark another complete.
    expect(deriveLessonState(IDS, [record('lessons/other/a', 'complete')])).toBe('not_started');
  });

  it('never calls a lesson with no exercises complete', () => {
    // There is nothing to complete; counting it as done inflates every roadmap
    // that contains it.
    expect(deriveLessonState([], [])).toBe('not_started');
  });
});

describe('getLessonState against the database', () => {
  let db: TestDb;
  const USER = 'u1';

  beforeEach(async () => {
    db = await createTestDb();
    await db.insert(s.users).values({ id: USER, email: 'a@e.com', name: 'A' });
  });

  it('advances as the learner solves each exercise', async () => {
    expect(await getLessonState(db, USER, IDS)).toBe('not_started');

    await recordAttempt(db, {
      userId: USER, exerciseId: IDS[0], tier: 'lesson',
      language: 'javascript', code: 'x', passed: true,
    });
    expect(await getLessonState(db, USER, IDS)).toBe('in_progress');

    await recordAttempt(db, {
      userId: USER, exerciseId: IDS[1], tier: 'lesson',
      language: 'javascript', code: 'x', passed: true,
    });
    expect(await getLessonState(db, USER, IDS)).toBe('complete');
  });

  it('is scoped to the learner', async () => {
    await db.insert(s.users).values({ id: 'u2', email: 'b@e.com', name: 'B' });
    await recordAttempt(db, {
      userId: USER, exerciseId: IDS[0], tier: 'lesson',
      language: 'javascript', code: 'x', passed: true,
    });

    expect(await getLessonState(db, 'u2', IDS)).toBe('not_started');
  });
});
