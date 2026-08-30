import { and, eq, gte, sql } from 'drizzle-orm';
import { accounts, submissions } from '@/db/schema';
import { getDb } from '@/db/client';
import { getAllProgress } from '@/lib/progress';
import { getLessons, getProblems } from '@/content/registry';
import { exerciseId, type Difficulty } from '@/content/schema';
import { DIFFICULTIES } from '@/lib/catalog';

/**
 * What the account page needs, read in one place.
 *
 * Composed here rather than in the page so the numbers have a single
 * definition: "solved" appearing on the account page and the dashboard with two
 * different meanings is the kind of discrepancy a learner notices and cannot
 * explain.
 */

/** Solved against available, per difficulty — the LeetCode breakdown. */
export interface DifficultyTally {
  difficulty: Difficulty;
  solved: number;
  total: number;
}

/** One day of activity, for the heatmap. */
export interface ActivityDay {
  /** ISO date, `YYYY-MM-DD`, in UTC. */
  date: string;
  submissions: number;
  passed: number;
}

export interface AccountSummary {
  solvedProblems: number;
  totalProblems: number;
  byDifficulty: DifficultyTally[];
  activity: ActivityDay[];
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
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
  // No step argument: a problem's slug is its identity, and passing it as a
  // step yields `problems/two-sum/two-sum`, which matches nothing the runner
  // ever writes — so every count silently read zero.
  const problemIds = new Set(getProblems().map((p) => exerciseId(p)));
  const exerciseIds = new Set(
    getLessons().flatMap((l) => l.exercises.map((e) => exerciseId(l, e.slug))),
  );

  // Per difficulty, because "13 solved" says nothing about whether they were
  // the easy ones — which is the first thing anyone wants to know.
  const byDifficulty: DifficultyTally[] = DIFFICULTIES.map((difficulty) => {
    const inBand = getProblems().filter((p) => p.difficulty === difficulty);
    return {
      difficulty,
      solved: inBand.filter((p) => complete.has(exerciseId(p))).length,
      total: inBand.length,
    };
  });

  const activity = await getActivity(userId);

  return {
    byDifficulty,
    activity,
    activeDays: activity.filter((d) => d.submissions > 0).length,
    ...streaks(activity),
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

/** Days shown in the heatmap. A year, as the reference does. */
export const ACTIVITY_DAYS = 365;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Daily submission counts for the last year.
 *
 * Aggregated in SQL rather than by pulling every row: a learner with a year of
 * daily practice has thousands of submissions, and the page needs 365 numbers.
 *
 * Days with no activity are filled in here rather than omitted, because the
 * heatmap needs a cell for every day — a gap in the array would shift every
 * subsequent square into the wrong column.
 */
export async function getActivity(userId: string): Promise<ActivityDay[]> {
  const db = getDb();
  const since = new Date(Date.now() - (ACTIVITY_DAYS - 1) * 86_400_000);

  const rows = await db
    .select({
      day: sql<string>`to_char(${submissions.createdAt} at time zone 'utc', 'YYYY-MM-DD')`,
      total: sql<number>`count(*)::int`,
      passed: sql<number>`count(*) filter (where ${submissions.passed})::int`,
    })
    .from(submissions)
    .where(and(eq(submissions.userId, userId), gte(submissions.createdAt, since)))
    .groupBy(sql`1`);

  const byDay = new Map(rows.map((r) => [r.day, r]));

  return Array.from({ length: ACTIVITY_DAYS }, (_, i) => {
    const date = isoDay(new Date(since.getTime() + i * 86_400_000));
    const row = byDay.get(date);
    return { date, submissions: row?.total ?? 0, passed: row?.passed ?? 0 };
  });
}

/**
 * Current and longest run of consecutive active days.
 *
 * The current streak tolerates *today* being empty. Counting strictly back from
 * today would show a learner zero every morning until they practise, which
 * punishes them for the time of day rather than for missing a day — the
 * opposite of what a streak is for. Two consecutive empty days does end it.
 */
export function streaks(activity: readonly ActivityDay[]): {
  currentStreak: number;
  longestStreak: number;
} {
  let longest = 0;
  let run = 0;
  for (const day of activity) {
    run = day.submissions > 0 ? run + 1 : 0;
    longest = Math.max(longest, run);
  }

  // Walk back from the end, skipping at most a single trailing empty day.
  let index = activity.length - 1;
  if (index >= 0 && activity[index].submissions === 0) index--;

  let current = 0;
  for (; index >= 0 && activity[index].submissions > 0; index--) current++;

  return { currentStreak: current, longestStreak: longest };
}

/** How a sign-in method should read to a person. */
export function methodLabel(providerId: string): string {
  if (providerId === 'credential') return 'Email and password';
  return providerId.charAt(0).toUpperCase() + providerId.slice(1);
}
