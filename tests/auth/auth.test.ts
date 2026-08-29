import { beforeEach, describe, expect, it } from 'vitest';
import { createTestDb, type TestDb } from '../db/helpers';
import { createAuth } from '@/lib/auth';
import * as s from '@/db/schema';

/**
 * Exercises Better Auth against a real Postgres with our own schema, which is
 * the only way to prove the T0.4 reconciliation actually holds. A mocked
 * adapter would pass whether or not the columns match.
 */

let db: TestDb;
let auth: ReturnType<typeof createAuth>;

beforeEach(async () => {
  db = await createTestDb();
  auth = createAuth(db);
});

const CREDS = {
  email: 'learner@example.com',
  password: 'correct-horse-battery-staple',
  name: 'Test Learner',
};

describe('Better Auth against our schema', () => {
  it('signs a user up and persists them to our users table', async () => {
    await auth.api.signUpEmail({ body: CREDS });

    const users = await db.select().from(s.users);
    expect(users).toHaveLength(1);
    expect(users[0].email).toBe(CREDS.email);
    expect(users[0].name).toBe(CREDS.name);
  });

  it('stores the credential in accounts, never as plaintext', async () => {
    await auth.api.signUpEmail({ body: CREDS });

    const [account] = await db.select().from(s.accounts);
    expect(account.providerId).toBe('credential');
    expect(account.password).toBeTruthy();
    expect(account.password).not.toBe(CREDS.password);
  });

  it('creates a session row on sign-in', async () => {
    await auth.api.signUpEmail({ body: CREDS });
    await db.delete(s.sessions);

    await auth.api.signInEmail({
      body: { email: CREDS.email, password: CREDS.password },
    });

    expect(await db.select().from(s.sessions)).toHaveLength(1);
  });

  it('rejects a wrong password', async () => {
    await auth.api.signUpEmail({ body: CREDS });

    await expect(
      auth.api.signInEmail({ body: { email: CREDS.email, password: 'wrong-password' } }),
    ).rejects.toThrow();
  });

  it('rejects a duplicate email rather than creating a second account', async () => {
    await auth.api.signUpEmail({ body: CREDS });

    await expect(auth.api.signUpEmail({ body: CREDS })).rejects.toThrow();
    expect(await db.select().from(s.users)).toHaveLength(1);
  });
});
