import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import { migrate } from 'drizzle-orm/pglite/migrator';
import * as schema from '@/db/schema';

export type TestDb = ReturnType<typeof drizzle<typeof schema, PGlite>>;

/**
 * A fresh in-memory Postgres per test, migrated from the same SQL files that
 * run against Neon.
 *
 * PGlite rather than a container: there is no Docker or local Postgres in this
 * environment, and requiring one would mean these tests silently stop running
 * in CI — which is exactly when constraint regressions slip through.
 */
export async function createTestDb(): Promise<TestDb> {
  const client = new PGlite();
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: 'db/migrations' });
  return db;
}
