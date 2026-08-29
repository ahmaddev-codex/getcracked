import { drizzle } from 'drizzle-orm/postgres-js';
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Server-side database client (Neon Postgres, ADR 0001 §3).
 *
 * Typed against Drizzle's driver-agnostic base rather than the postgres-js
 * return type, so the PGlite-backed test database satisfies it too. That is
 * what lets `seed()` and every future query helper be exercised in tests
 * without a live Postgres while running unchanged against Neon.
 */
export type Database = PgDatabase<PgQueryResultHKT, typeof schema>;

declare global {
  // `var` is required here: a module-scoped binding would not survive HMR.
  var __getcrackedDb: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      'DATABASE_URL is not set. Copy .env.example to .env.local and point it at a Postgres instance.',
    );
  }
  // Neon pools on its side; a large local pool would exhaust its connection
  // limit across concurrent serverless invocations.
  return drizzle(postgres(url, { max: 1 }), { schema });
}

/**
 * Cached on `globalThis` so Next.js hot reloads reuse one connection rather
 * than opening a new pool on every edit until Postgres refuses them.
 */
export function getDb() {
  globalThis.__getcrackedDb ??= connect();
  return globalThis.__getcrackedDb;
}
