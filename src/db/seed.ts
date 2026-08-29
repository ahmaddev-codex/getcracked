import { sql } from 'drizzle-orm';
import { users } from './schema';
import type { Database } from './client';

export const SEED_USER_EMAIL = 'dev@getcracked.local';

/** Stable so repeated seeds do not orphan progress rows created against it. */
const SEED_USER_ID = '00000000-0000-4000-8000-000000000001';

/**
 * Creates the local development user.
 *
 * Idempotent by design — a seed that fails on second run is a seed nobody runs
 * twice, and `pnpm db:seed` should be safe to repeat after any migration.
 */
export async function seed(db: Database): Promise<void> {
  await db
    .insert(users)
    .values({
      id: SEED_USER_ID,
      email: SEED_USER_EMAIL,
      name: 'Dev Learner',
      emailVerified: true,
    })
    .onConflictDoUpdate({
      target: users.email,
      set: { updatedAt: sql`now()` },
    });
}
