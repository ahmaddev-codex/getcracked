import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '@/db/schema';
import { getDb, type Database } from '@/db/client';

/**
 * Authentication (ADR 0001 §4).
 *
 * Better Auth with sessions in our own Postgres, rather than a per-MAU vendor:
 * monthly active users is the metric §8 exists to maximise, and §2.6 removes
 * any revenue that would scale alongside it.
 *
 * **This gates account-scoped data, not the product.** Content routes render
 * for signed-out visitors (PRD §2.6, AD-5); only handlers touching a user row
 * require a session.
 */

/** Dev-only fallback so `pnpm dev` works before secrets are configured. */
const DEV_SECRET = 'dev-only-insecure-secret-change-me';

function resolveSecret(): string {
  const secret = process.env.BETTER_AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('BETTER_AUTH_SECRET must be set in production.');
  }
  return DEV_SECRET;
}

/**
 * Builds an auth instance against a given database.
 *
 * Takes the database as an argument rather than reaching for the singleton so
 * tests can run it against an ephemeral Postgres — which is what makes the
 * Better Auth reconciliation genuinely testable instead of assumed.
 */
export function createAuth(db: Database) {
  return betterAuth({
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema,
      // Our tables are plural and snake_case; snake_case is the adapter's
      // default, so only the pluralisation needs declaring. Keeps auth tables
      // in the same naming convention as the app tables rather than splitting
      // the database across two styles.
      usePlural: true,
    }),
    secret: resolveSecret(),
    baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3000',
    emailAndPassword: {
      enabled: true,
      // Verification is a Phase 1 concern; blocking sign-in on it now would
      // require mail infrastructure that nothing else needs yet.
      requireEmailVerification: false,
    },
  });
}

let cached: ReturnType<typeof createAuth> | undefined;

/** The application's auth instance, bound to the real database. */
export function getAuth() {
  cached ??= createAuth(getDb());
  return cached;
}
