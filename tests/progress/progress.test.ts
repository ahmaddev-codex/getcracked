import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from '../db/helpers';
import {
  claimLocalProgress,
  getAllProgress,
  getLatestSubmission,
  getProgress,
  recordAttempt,
} from '@/lib/progress';
import * as s from '@/db/schema';

let db: TestDb;

const USER = 'learner-1';
const OTHER = 'learner-2';
const EXERCISE = 'problems/two-sum';

beforeEach(async () => {
  db = await createTestDb();
  await db.insert(s.users).values([
    { id: USER, email: 'a@e.com', name: 'A' },
    { id: OTHER, email: 'b@e.com', name: 'B' },
  ]);
});

function attempt(overrides: Partial<Parameters<typeof recordAttempt>[1]> = {}) {
  return recordAttempt(db, {
    userId: USER,
    exerciseId: EXERCISE,
    tier: 'problem',
    language: 'javascript',
    code: 'function twoSum() {}',
    passed: false,
    ...overrides,
  });
}

describe('recording an attempt', () => {
  it('marks the exercise complete when it passed', async () => {
    await attempt({ passed: true });

    const progress = await getProgress(db, USER, EXERCISE, 'javascript');
    expect(progress?.state).toBe('complete');
    expect(progress?.completedAt).toBeInstanceOf(Date);
  });

  it('marks it in progress when it failed', async () => {
    await attempt({ passed: false });

    const progress = await getProgress(db, USER, EXERCISE, 'javascript');
    expect(progress?.state).toBe('in_progress');
    expect(progress?.completedAt).toBeNull();
  });

  it('never demotes a solved exercise', async () => {
    await attempt({ passed: true });
    // Experimenting with a broken version afterwards does not un-solve it.
    await attempt({ passed: false, code: 'function twoSum() { return "oops"; }' });

    const progress = await getProgress(db, USER, EXERCISE, 'javascript');
    expect(progress?.state).toBe('complete');
  });

  it('keeps one progress row per exercise and language', async () => {
    await attempt({ passed: false });
    await attempt({ passed: true });

    const rows = await db.select().from(s.exerciseProgress);
    expect(rows).toHaveLength(1);
  });

  it('tracks languages independently', async () => {
    await attempt({ passed: true, language: 'javascript' });
    await attempt({ passed: false, language: 'python' });

    // Solving in one language must not mark the other done.
    expect((await getProgress(db, USER, EXERCISE, 'javascript'))?.state).toBe('complete');
    expect((await getProgress(db, USER, EXERCISE, 'python'))?.state).toBe('in_progress');
  });

  it('returns null for an exercise never attempted', async () => {
    expect(await getProgress(db, USER, 'problems/never-touched', 'javascript')).toBeNull();
  });
});

describe('submissions', () => {
  it('restores the most recent attempt, not the first', async () => {
    await attempt({ code: 'v1' });
    await new Promise((r) => setTimeout(r, 5));
    await attempt({ code: 'v2', passed: true });

    const latest = await getLatestSubmission(db, USER, EXERCISE, 'javascript');
    expect(latest?.code).toBe('v2');
    expect(latest?.passed).toBe(true);
  });

  it('keeps every attempt as history rather than overwriting', async () => {
    await attempt({ code: 'v1' });
    await attempt({ code: 'v2' });

    expect(await db.select().from(s.submissions)).toHaveLength(2);
  });

  it('returns null when there is nothing to restore', async () => {
    expect(await getLatestSubmission(db, USER, EXERCISE, 'javascript')).toBeNull();
  });
});

describe('isolation between learners', () => {
  it('does not leak one learner’s progress to another', async () => {
    await attempt({ passed: true });

    // The failure mode R-15 exists for: a query that forgot to scope by user.
    expect(await getProgress(db, OTHER, EXERCISE, 'javascript')).toBeNull();
    expect(await getAllProgress(db, OTHER)).toHaveLength(0);
  });

  it('does not leak one learner’s submissions to another', async () => {
    await attempt({ code: 'private work' });

    expect(await getLatestSubmission(db, OTHER, EXERCISE, 'javascript')).toBeNull();
  });
});

describe('claiming anonymous progress (A15)', () => {
  it('imports entries a signed-out learner accumulated', async () => {
    const claimed = await claimLocalProgress(db, USER, [
      { exerciseId: 'problems/two-sum', tier: 'problem', language: 'javascript', state: 'complete' },
      { exerciseId: 'problems/binary-search', tier: 'problem', language: 'javascript', state: 'in_progress' },
    ]);

    expect(claimed).toBe(2);
    expect(await getAllProgress(db, USER)).toHaveLength(2);
  });

  it('never overwrites existing server progress', async () => {
    await attempt({ passed: true });

    // Signing in on a second device must not let stale local state clobber
    // history the account already holds.
    const claimed = await claimLocalProgress(db, USER, [
      { exerciseId: EXERCISE, tier: 'problem', language: 'javascript', state: 'not_started' },
    ]);

    expect(claimed).toBe(0);
    expect((await getProgress(db, USER, EXERCISE, 'javascript'))?.state).toBe('complete');
  });

  it('is idempotent, so a repeated claim adds nothing', async () => {
    const entries = [
      { exerciseId: EXERCISE, tier: 'problem' as const, language: 'javascript' as const, state: 'complete' as const },
    ];

    expect(await claimLocalProgress(db, USER, entries)).toBe(1);
    expect(await claimLocalProgress(db, USER, entries)).toBe(0);
  });
});
