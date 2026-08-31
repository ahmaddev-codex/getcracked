import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import * as schema from '@/db/schema';
import { getDb, type Database } from '@/db/client';
import { socialProviderConfig } from './oauth';

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
 * Where this deployment thinks it lives.
 *
 * **This used to fall back to `http://localhost:3000` unconditionally**, which
 * meant a production deployment missing `BETTER_AUTH_URL` did not fail — it
 * quietly built OAuth callback URLs pointing at the developer's own machine.
 * Social sign-in then returned a 500 from `/api/auth/sign-in/social` with
 * nothing in it to suggest the cause was a missing variable.
 *
 * The secret two functions up has always refused to guess in production. This
 * now holds the same line, because a wrong base URL is not a milder failure than
 * a missing secret — it is the one that produces a broken redirect a learner
 * sees rather than an error a deploy log does.
 *
 * `VERCEL_*` are provided automatically, so a deployment that forgot the
 * variable still gets its own origin rather than localhost. It is a fallback,
 * not the recommendation: **OAuth providers match redirect URIs exactly**, so
 * the URL has to be stable and registered with Google and GitHub. A per-deploy
 * preview URL satisfies this function and will still be rejected by the
 * provider, which is why `BETTER_AUTH_URL` should be set explicitly.
 */
export function resolveBaseUrl(env: NodeJS.ProcessEnv = process.env): string {
  if (env.BETTER_AUTH_URL) return env.BETTER_AUTH_URL;

  // The stable production domain, where Vercel knows one.
  if (env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  // This deployment's own URL. Correct origin, but per-deploy on previews.
  if (env.VERCEL_URL) return `https://${env.VERCEL_URL}`;

  if (env.NODE_ENV === 'production') {
    throw new Error(
      'BETTER_AUTH_URL must be set in production. Without it, OAuth callback ' +
        'URLs would point at localhost and social sign-in fails with a 500. ' +
        'Set it to this deployment\'s origin and register ' +
        '<BETTER_AUTH_URL>/api/auth/callback/{google,github} with each provider.',
    );
  }

  return 'http://localhost:3000';
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
    baseURL: resolveBaseUrl(),
    emailAndPassword: {
      enabled: true,
      // Verification is a Phase 1 concern; blocking sign-in on it now would
      // require mail infrastructure that nothing else needs yet.
      requireEmailVerification: false,
    },
    /**
     * Only providers whose credentials are actually present (see oauth.ts).
     * Declaring one with an empty client id renders a button that leads to an
     * OAuth error page, which reads as the product being broken.
     */
    socialProviders: socialProviderConfig(),
    account: {
      accountLinking: {
        /**
         * Link a social identity to an existing account when the email matches.
         *
         * Without this, signing up with a password and later clicking "Continue
         * with Google" on the same address creates a *second* account, and the
         * learner's progress silently splits in two.
         *
         * Restricted to providers that verify email addresses themselves.
         * Trusting an unverified one would let anyone who can assert an address
         * at that provider take over the account holding it.
         */
        enabled: true,
        trustedProviders: ['google', 'github'],
      },
    },
  });
}

let cached: ReturnType<typeof createAuth> | undefined;

/** The application's auth instance, bound to the real database. */
export function getAuth() {
  cached ??= createAuth(getDb());
  return cached;
}
