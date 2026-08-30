import { eq } from 'drizzle-orm';
import { accounts } from '@/db/schema';
import { getDb } from '@/db/client';
import { getAllProgress } from '@/lib/progress';
import { getLessons, getProblems } from '@/content/registry';
import { exerciseId } from '@/content/schema';

/**
 * What the account page needs, read in one place.
 *
 * Composed here rather than in the page so the numbers have a single
 * definition: "solved" appearing on the account page and the dashboard with two
 * different meanings is the kind of discrepancy a learner notices and cannot
 * explain.
 */

export interface AccountSummary {
  solvedProblems: number;
  totalProblems: number;
  completedExercises: number;
  totalExercises: number;
  inProgress: number;
  languages: string[];
  /** Sign-in methods linked to this account. */
  methods: Array<{ providerId: string; linkedAt: Date }>;
}

export async function getAccountSummary(userId: string): Promise<AccountSummary> {
  const db = getDb();
  const progress = await getAllProgress(db, userId);

  const linked = await db
    .select({ providerId: accounts.providerId, createdAt: accounts.createdAt })
    .from(accounts)
    .where(eq(accounts.userId, userId));

  const complete = new Set(
    progress.filter((p) => p.state === 'complete').map((p) => p.exerciseId),
  );

  // Problems and lesson exercises are counted separately. Merging them into one
  // "solved" figure would let reading lessons inflate a practice number, which
  // is the metric a learner is actually judging themselves on.
  const problemIds = new Set(getProblems().map((p) => exerciseId(p, p.slug)));
  const exerciseIds = new Set(
    getLessons().flatMap((l) => l.exercises.map((e) => exerciseId(l, e.slug))),
  );

  return {
    solvedProblems: [...complete].filter((id) => problemIds.has(id)).length,
    totalProblems: problemIds.size,
    completedExercises: [...complete].filter((id) => exerciseIds.has(id)).length,
    totalExercises: exerciseIds.size,
    inProgress: progress.filter((p) => p.state === 'in_progress').length,
    languages: [...new Set(progress.map((p) => p.language))].sort(),
    methods: linked.map((row) => ({ providerId: row.providerId, createdAt: row.createdAt }))
      .map(({ providerId, createdAt }) => ({ providerId, linkedAt: createdAt })),
  };
}

/** How a sign-in method should read to a person. */
export function methodLabel(providerId: string): string {
  if (providerId === 'credential') return 'Email and password';
  return providerId.charAt(0).toUpperCase() + providerId.slice(1);
}
