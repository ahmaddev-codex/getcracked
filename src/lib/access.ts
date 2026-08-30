/**
 * What requires a session, and what does not (PRD §2.6, AD-5).
 *
 * **Content is public. Anything that can touch data fails closed.**
 *
 * The default differs by route type, and that asymmetry is the whole design:
 *
 * | Route | Default | Why |
 * |---|---|---|
 * | Pages (`/learn/...`, `/problems/...`) | **public** | Content is the product. These are added constantly — every lesson, problem, and roadmap — and an allowlist would mean a forgotten entry makes a lesson unreadable. The pressure to avoid that is what widens an allowlist until it means nothing. |
 * | API (`/api/...`) | **denied** | APIs are where user data lives. They are few, slow-changing, and enumerable, so an explicit public list is maintainable — and a new endpoint added without thought is refused rather than exposed. |
 *
 * A single denylist across both would be fail-*open* for APIs: `/api/billing`
 * added tomorrow would be public until someone remembered to list it. A single
 * allowlist across both would be fail-*closed* for content, breaking lessons.
 *
 * This decides **routing**. `requireSession()` decides **access**. A handler
 * that reads user data without asserting a session is a bug this file cannot
 * catch — see R-15 in tasks/plan.md.
 */

/** API endpoints that must work without a session. */
const PUBLIC_API_PREFIXES = [
  // Better Auth's own routes — sign-in could never happen otherwise.
  '/api/auth',
  // Signed-out visitors are tracked (F6 tier two) and told so (A16), so this
  // must accept writes without a session. It is the only public write endpoint,
  // and it defends itself: closed event-name allowlist, payload cap, and a user
  // id taken from the session rather than the request body.
  '/api/events',
  /**
   * The search index (I6). Content, not user data — it is derived entirely from
   * the repo-authored catalogue and is identical for every visitor, signed in or
   * not. Listed explicitly rather than moved off `/api` to dodge the default,
   * because the default exists to catch routes nobody thought about and this one
   * has been thought about.
   */
  '/api/search',
] as const;

/** Page subtrees that are account-scoped despite not being APIs. */
export const ACCOUNT_SCOPED_PAGE_PREFIXES = ['/account', '/admin'] as const;

/**
 * Segment-aware prefix match.
 *
 * `startsWith` alone would treat `/api/authorize-payment` as being under
 * `/api/auth`, quietly exposing an unrelated route. A prefix only matches when
 * followed by `/` or the end of the path.
 */
function isUnder(path: string, prefix: string): boolean {
  return path === prefix || path.startsWith(`${prefix}/`);
}

/** True when a request may proceed without a session. */
export function isPublicPath(path: string): boolean {
  if (path === '/api' || path.startsWith('/api/')) {
    return PUBLIC_API_PREFIXES.some((prefix) => isUnder(path, prefix));
  }
  return !ACCOUNT_SCOPED_PAGE_PREFIXES.some((prefix) => isUnder(path, prefix));
}
