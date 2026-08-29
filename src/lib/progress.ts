import { and, desc, eq } from 'drizzle-orm';
import { exerciseProgress, submissions } from '@/db/schema';
import type { Database } from '@/db/client';
import type { Language, Tier } from '@/content/schema';

/**
 * Progress and submission storage — the single module everything reads from.
 *
 * Roadmap node state (I4), study-plan sequencing (F5), and the analytics funnel
 * (F6) all resolve through here, so the definition of "done" lives in one place
 * rather than being re-derived per surface.
 *
 * **Progress is client-attested (PRD B21, corrected).** Tests execute in the
 * learner's browser (AD-2), so the server has no independent view of a run and
 * records what the client reports. That is acceptable precisely because nothing
 * is locked: progress unlocks no content and avoids no cost, so forging it buys
 * nothing but a dishonest streak.
 *
 * What *is* enforced here: every write is scoped to a caller-supplied `userId`,
 * which handlers take from the session and never from the request body. A user
 * id is a required argument on every function below rather than something read
 * ambiently, so forgetting to scope a query is a type error rather than a
 * cross-account leak (R-15).
 */

export type ProgressState = 'not_started' | 'in_progress' | 'complete';

export interface AttemptInput {
  userId: string;
  exerciseId: string;
  tier: Tier;
  language: Language;
  code: string;
  passed: boolean;
}

export interface ExerciseProgressRecord {
  exerciseId: string;
  language: Language;
  state: ProgressState;
  completedAt: Date | null;
}

/**
 * Records one attempt: appends the submission, then advances progress.
 *
 * Progress only ever moves forward. A learner who solves a problem and then
 * experiments with a broken version has not become un-done, and demoting them
 * would make the roadmap flicker and the streak lie.
 */
export async function recordAttempt(db: Database, input: AttemptInput): Promise<void> {
  const { userId, exerciseId, tier, language, code, passed } = input;

  await db.insert(submissions).values({ userId, exerciseId, language, code, passed });

  const now = new Date();
  await db
    .insert(exerciseProgress)
    .values({
      userId,
      exerciseId,
      tier,
      language,
      state: passed ? 'complete' : 'in_progress',
      completedAt: passed ? now : null,
    })
    .onConflictDoUpdate({
      target: [exerciseProgress.userId, exerciseProgress.exerciseId, exerciseProgress.language],
      set: {
        // A failing attempt after a pass leaves the row complete.
        state: passed ? 'complete' : undefined,
        completedAt: passed ? now : undefined,
        updatedAt: now,
      },
    });
}

/** Progress for one exercise in one language, or null if never attempted. */
export async function getProgress(
  db: Database,
  userId: string,
  exerciseId: string,
  language: Language,
): Promise<ExerciseProgressRecord | null> {
  const [row] = await db
    .select()
    .from(exerciseProgress)
    .where(
      and(
        eq(exerciseProgress.userId, userId),
        eq(exerciseProgress.exerciseId, exerciseId),
        eq(exerciseProgress.language, language),
      ),
    )
    .limit(1);

  if (!row) return null;
  return {
    exerciseId: row.exerciseId,
    language: row.language,
    state: row.state,
    completedAt: row.completedAt,
  };
}

/** Everything a learner has touched, for the dashboard and roadmap. */
export async function getAllProgress(
  db: Database,
  userId: string,
): Promise<ExerciseProgressRecord[]> {
  const rows = await db
    .select()
    .from(exerciseProgress)
    .where(eq(exerciseProgress.userId, userId));

  return rows.map((row) => ({
    exerciseId: row.exerciseId,
    language: row.language,
    state: row.state,
    completedAt: row.completedAt,
  }));
}

/**
 * The learner's most recent submission, so returning to a problem restores the
 * work rather than the starter code (A10).
 */
export async function getLatestSubmission(
  db: Database,
  userId: string,
  exerciseId: string,
  language: Language,
): Promise<{ code: string; passed: boolean; createdAt: Date } | null> {
  const [row] = await db
    .select()
    .from(submissions)
    .where(
      and(
        eq(submissions.userId, userId),
        eq(submissions.exerciseId, exerciseId),
        eq(submissions.language, language),
      ),
    )
    .orderBy(desc(submissions.createdAt))
    .limit(1);

  return row ? { code: row.code, passed: row.passed, createdAt: row.createdAt } : null;
}

/**
 * Imports progress a learner accumulated before signing up (A15).
 *
 * Explicitly *claimed history*, not proof: local state is trivially forgeable,
 * and it is imported for the same reason the rest of progress is trusted —
 * because it unlocks nothing. Existing rows win, so signing in on a second
 * device cannot have stale local state overwrite real history.
 */
export async function claimLocalProgress(
  db: Database,
  userId: string,
  entries: ReadonlyArray<{
    exerciseId: string;
    tier: Tier;
    language: Language;
    state: ProgressState;
  }>,
): Promise<number> {
  let claimed = 0;

  for (const entry of entries) {
    const existing = await getProgress(db, userId, entry.exerciseId, entry.language);
    if (existing) continue;

    await db.insert(exerciseProgress).values({
      userId,
      exerciseId: entry.exerciseId,
      tier: entry.tier,
      language: entry.language,
      state: entry.state,
      completedAt: entry.state === 'complete' ? new Date() : null,
    });
    claimed++;
  }

  return claimed;
}
