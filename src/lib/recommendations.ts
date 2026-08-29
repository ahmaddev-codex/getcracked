import type { ProgressState } from '@/lib/progress';

/**
 * The guidance layer (B16).
 *
 * **This is not access control, and the distinction is the whole design.**
 * Prerequisites produce a *suggestion* — never a lock. There is deliberately no
 * `canAccess` here and no boolean any caller could mistake for one: the only
 * output is a recommendation a learner can read and dismiss.
 *
 * Guidance has to earn attention rather than compel it (PRD §6.6), so it has
 * three chances to be useful and then stops:
 *
 *  1. **On arrival** — a set whose lesson is unread says so, once.
 *  2. **On struggle** — repeated failures or exhausted hints surface the lesson
 *     at the moment it is actually wanted, which is where a lock would have been
 *     merely annoying.
 *  3. **Never again** — a dismissal is remembered per topic. A learner who has
 *     said "I know this" is not asked twice.
 */

export type RecommendationReason = 'prerequisite-unread' | 'struggling';

export interface Recommendation {
  reason: RecommendationReason;
  /** Lesson slug to link to. */
  lessonSlug: string;
  message: string;
}

export interface RecommendationInput {
  /** Lessons this set reads best after, in curriculum order. */
  recommendedAfter: readonly string[];
  /** State of each of those lessons, keyed by slug. */
  lessonStates: Readonly<Record<string, ProgressState>>;
  /** Topics the learner has dismissed guidance for. */
  dismissed: readonly string[];
  /** Consecutive failed runs on the current exercise. */
  consecutiveFailures?: number;
  /** Whether every hint on the current exercise has been opened. */
  hintsExhausted?: boolean;
}

/** Failures before the struggle nudge appears. */
export const STRUGGLE_THRESHOLD = 3;

function lessonTitle(slug: string): string {
  return slug
    .split('-')
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Returns at most one recommendation, or null.
 *
 * One at a time on purpose: a stack of suggestions is noise, and noise is what
 * makes a learner stop reading them — at which point the guidance layer has
 * failed at the only job it has.
 */
export function recommend(input: RecommendationInput): Recommendation | null {
  const {
    recommendedAfter,
    lessonStates,
    dismissed,
    consecutiveFailures = 0,
    hintsExhausted = false,
  } = input;

  const unread = recommendedAfter.filter(
    (slug) => (lessonStates[slug] ?? 'not_started') !== 'complete' && !dismissed.includes(slug),
  );
  if (unread.length === 0) return null;

  // Earliest in curriculum order: sending someone to the third unread lesson
  // when they have not read the first is worse than not suggesting at all.
  const target = unread[0];
  const struggling = consecutiveFailures >= STRUGGLE_THRESHOLD || hintsExhausted;

  return struggling
    ? {
        reason: 'struggling',
        lessonSlug: target,
        message: `Stuck? The ${lessonTitle(target)} lesson covers the pattern this problem uses.`,
      }
    : {
        reason: 'prerequisite-unread',
        lessonSlug: target,
        message: `Most people read ${lessonTitle(target)} first — but you're welcome to dive straight in.`,
      };
}
