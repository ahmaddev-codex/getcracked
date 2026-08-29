import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb, type TestDb } from './helpers';
import * as s from '@/db/schema';

/**
 * Runs against a real Postgres (PGlite, embedded) rather than a mock, so the
 * migrations, constraints, and cascades under test are the ones that will run
 * against Neon. A mocked database would assert nothing about any of them.
 */

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
});

async function insertUser(email = 'learner@example.com') {
  const [user] = await db
    .insert(s.users)
    .values({ id: crypto.randomUUID(), email, name: 'Test Learner' })
    .returning();
  return user;
}

describe('migrations', () => {
  it('creates every table the platform needs', async () => {
    const rows = await db.$client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema = 'public'`,
    );
    const tables = rows.rows.map((r) => r.table_name).sort();

    expect(tables).toEqual(
      expect.arrayContaining([
        'events',
        'exercise_progress',
        'sessions',
        'submissions',
        'users',
      ]),
    );
  });
});

describe('users and sessions', () => {
  it('rejects a duplicate email', async () => {
    await insertUser('dup@example.com');
    await expect(insertUser('dup@example.com')).rejects.toThrow();
  });

  it('deletes a user’s sessions when the user is deleted', async () => {
    const user = await insertUser();
    await db.insert(s.sessions).values({
      id: crypto.randomUUID(),
      userId: user.id,
      token: 'tok-1',
      expiresAt: new Date(Date.now() + 3_600_000),
    });

    await db.delete(s.users).where(eq(s.users.id, user.id));

    expect(await db.select().from(s.sessions)).toHaveLength(0);
  });
});

describe('exercise progress', () => {
  it('tracks state per user, exercise, and language independently', async () => {
    const user = await insertUser();
    await db.insert(s.exerciseProgress).values([
      {
        userId: user.id,
        exerciseId: 'problems/hashing/two-sum',
        tier: 'problem',
        language: 'python',
        state: 'complete',
      },
      {
        userId: user.id,
        exerciseId: 'problems/hashing/two-sum',
        tier: 'problem',
        language: 'javascript',
        state: 'in_progress',
      },
    ]);

    const rows = await db.select().from(s.exerciseProgress);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.state).sort()).toEqual(['complete', 'in_progress']);
  });

  it('rejects a second row for the same user, exercise, and language', async () => {
    const user = await insertUser();
    const row = {
      userId: user.id,
      exerciseId: 'problems/hashing/two-sum',
      tier: 'problem' as const,
      language: 'python' as const,
      state: 'in_progress' as const,
    };
    await db.insert(s.exerciseProgress).values(row);

    await expect(db.insert(s.exerciseProgress).values(row)).rejects.toThrow();
  });

  it('supports all three content tiers', async () => {
    const user = await insertUser();
    await db.insert(s.exerciseProgress).values([
      { userId: user.id, exerciseId: 'a', tier: 'lesson', language: 'python', state: 'complete' },
      { userId: user.id, exerciseId: 'b', tier: 'problem', language: 'python', state: 'complete' },
      { userId: user.id, exerciseId: 'c', tier: 'challenge', language: 'python', state: 'complete' },
    ]);

    const rows = await db.select().from(s.exerciseProgress);
    expect(rows.map((r) => r.tier).sort()).toEqual(['challenge', 'lesson', 'problem']);
  });

  it('rejects a state outside the allowed set', async () => {
    const user = await insertUser();
    await expect(
      db.insert(s.exerciseProgress).values({
        userId: user.id,
        exerciseId: 'x',
        tier: 'problem',
        // Deliberately invalid: the enum is the guard against typo'd states.
        state: 'finished' as unknown as 'complete',
        language: 'python',
      }),
    ).rejects.toThrow();
  });
});

describe('submissions', () => {
  it('keeps a history rather than overwriting, so a learner never loses work', async () => {
    const user = await insertUser();
    const base = {
      userId: user.id,
      exerciseId: 'problems/hashing/two-sum',
      language: 'python' as const,
    };

    await db.insert(s.submissions).values({ ...base, code: 'v1', passed: false });
    await db.insert(s.submissions).values({ ...base, code: 'v2', passed: true });

    const rows = await db.select().from(s.submissions);
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.code).sort()).toEqual(['v1', 'v2']);
  });
});

describe('events', () => {
  it('stores arbitrary typed props as JSON', async () => {
    const user = await insertUser();
    await db.insert(s.events).values({
      userId: user.id,
      name: 'test_run',
      route: '/problems/hashing/two-sum',
      props: { outcome: 'pass', language: 'python', durationMs: 42 },
    });

    const [row] = await db.select().from(s.events);
    expect(row.props).toEqual({ outcome: 'pass', language: 'python', durationMs: 42 });
  });

  it('survives the user being deleted, because analytics must not vanish with an account', async () => {
    const user = await insertUser();
    await db.insert(s.events).values({ userId: user.id, name: 'sign_in' });

    await db.delete(s.users).where(eq(s.users.id, user.id));

    const rows = await db.select().from(s.events);
    expect(rows).toHaveLength(1);
    expect(rows[0].userId).toBeNull();
  });
});
