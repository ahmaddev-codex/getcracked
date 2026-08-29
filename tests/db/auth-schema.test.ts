import { beforeEach, describe, expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { createTestDb, type TestDb } from './helpers';
import * as s from '@/db/schema';

/**
 * Guards the T0.3 -> T0.4 reconciliation: these tables must match what Better
 * Auth's adapter expects, or auth fails at runtime with the schema looking fine.
 * Field names checked against @better-auth/core get-tables.mjs (v1.7.2).
 */

let db: TestDb;
beforeEach(async () => {
  db = await createTestDb();
});

async function columns(table: string) {
  const r = await db.$client.query<{ column_name: string; is_nullable: string }>(
    `select column_name, is_nullable from information_schema.columns where table_name = $1`,
    [table],
  );
  return Object.fromEntries(r.rows.map((c) => [c.column_name, c.is_nullable === 'YES']));
}

describe('Better Auth core tables', () => {
  it('creates all four tables Better Auth requires', async () => {
    const r = await db.$client.query<{ table_name: string }>(
      `select table_name from information_schema.tables where table_schema='public'`,
    );
    const tables = r.rows.map((t) => t.table_name);

    expect(tables).toEqual(
      expect.arrayContaining(['users', 'sessions', 'accounts', 'verifications']),
    );
  });

  it('requires user.name, which Better Auth always supplies and never omits', async () => {
    const cols = await columns('users');
    expect(cols.name).toBe(false); // not nullable
  });

  it('carries every account column the adapter writes', async () => {
    const cols = await columns('accounts');

    expect(Object.keys(cols)).toEqual(
      expect.arrayContaining([
        'id',
        'issuer',
        'account_id',
        'provider_id',
        'user_id',
        'access_token',
        'refresh_token',
        'id_token',
        'access_token_expires_at',
        'refresh_token_expires_at',
        'scope',
        'password',
        'created_at',
        'updated_at',
      ]),
    );
  });

  it('enforces the unique (issuer, accountId) pair Better Auth declares', async () => {
    const [user] = await db
      .insert(s.users)
      .values({ id: 'u1', email: 'a@b.c', name: 'A' })
      .returning();
    const row = {
      issuer: 'local:credential',
      accountId: user.id,
      providerId: 'credential',
      userId: user.id,
    };
    // Better Auth mints these ids itself; the column has no default on purpose.
    await db.insert(s.accounts).values({ id: 'acc-1', ...row });

    await expect(db.insert(s.accounts).values({ id: 'acc-2', ...row })).rejects.toThrow();
  });

  it('cascades accounts and verifications correctly when a user is deleted', async () => {
    await db.insert(s.users).values({ id: 'u2', email: 'd@e.f', name: 'D' });
    await db.insert(s.accounts).values({
      id: 'acc-cascade',
      issuer: 'local:credential',
      accountId: 'u2',
      providerId: 'credential',
      userId: 'u2',
    });

    await db.delete(s.users).where(eq(s.users.id, 'u2'));

    expect(await db.select().from(s.accounts)).toHaveLength(0);
  });

  it('stores verification records independently of any user', async () => {
    await db.insert(s.verifications).values({
      id: 'ver-1',
      identifier: 'a@b.c',
      value: 'token-123',
      expiresAt: new Date(Date.now() + 600_000),
    });

    expect(await db.select().from(s.verifications)).toHaveLength(1);
  });
});
