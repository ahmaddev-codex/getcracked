import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from './helpers';
import { seed, SEED_USER_EMAIL } from '@/db/seed';
import * as s from '@/db/schema';

let db: TestDb;

beforeEach(async () => {
  db = await createTestDb();
});

describe('seed', () => {
  it('creates the development user', async () => {
    await seed(db);

    const users = await db.select().from(s.users);
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe(SEED_USER_EMAIL);
  });

  it('is idempotent — running twice leaves exactly one user', async () => {
    await seed(db);
    await seed(db);

    expect(await db.select().from(s.users)).toHaveLength(1);
  });

  it('keeps the same user id across runs so local progress is not orphaned', async () => {
    await seed(db);
    const [first] = await db.select().from(s.users);
    await seed(db);
    const [second] = await db.select().from(s.users);

    expect(second.id).toBe(first.id);
  });
});
