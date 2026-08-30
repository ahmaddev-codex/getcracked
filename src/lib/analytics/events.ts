/**
 * The event vocabulary (PRD F6).
 *
 * A closed union, not free-form strings. `/api/events` accepts writes from
 * signed-out visitors — it has to, or the anonymous funnel cannot exist — which
 * makes it a public write endpoint. An allowlist means the worst a hostile
 * client can do is inflate counts for events we already expected, rather than
 * writing arbitrary rows into the analytics table.
 */
export const EVENT_NAMES = [
  // Navigation
  'page_view',
  // Auth
  'sign_up',
  'sign_in',
  'sign_out',
  // Exercise lifecycle
  'exercise_started',
  'test_run',
  'exercise_solved',
  'hint_revealed',
  // Learn surface
  'lesson_started',
  'lesson_completed',
  // Build challenges (tier 3). Steps report through the exercise lifecycle
  // above, exactly as a problem does; this is the milestone that has no
  // equivalent there — the whole thing built.
  'challenge_completed',
  // Free-play sandbox (B7). Separate from `test_run` because nothing here is
  // graded — counting it as a test run would inflate the practice funnel with
  // people who were experimenting.
  'sandbox_opened',
  'sandbox_run',
  'sandbox_shared',
  // Anonymous -> account (A15/A16)
  'signed_out_notice_shown',
  'signed_out_notice_dismissed',
  'anonymous_progress_claimed',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

const KNOWN = new Set<string>(EVENT_NAMES);

export function isKnownEvent(name: string): name is EventName {
  return KNOWN.has(name);
}
