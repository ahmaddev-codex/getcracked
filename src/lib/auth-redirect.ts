/**
 * Where a learner lands after signing in or up.
 *
 * **The default is the curriculum, not the marketing page.** Someone who has
 * just created an account has already been sold; sending them to the landing
 * page makes them navigate to the thing they came for. `/learn/dsa` is the
 * front of the path and the surface everything else hangs off.
 *
 * **`next` still wins**, because the edge guard sets it: a signed-out visitor
 * who asks for `/account` is bounced to `/sign-in?next=/account` and has to end
 * up back at `/account`, or the redirect was pointless.
 */
export const DEFAULT_LANDING = '/learn/dsa';

/**
 * Validates a `next` parameter before it is navigated to.
 *
 * `next` arrives from the query string and is handed to `router.push()` and, on
 * the OAuth path, to the provider as `callbackURL`. Unvalidated, that is an open
 * redirect: `/sign-in?next=https://example.com` sends someone off-site *after*
 * authenticating, which is the shape of a credible phishing link because the
 * domain in the address bar is genuinely ours right up until it is not.
 *
 * Only a same-origin absolute path is accepted. The three rejected forms below
 * all look like paths and are not:
 *
 * - `//example.com` — protocol-relative, so a browser treats it as cross-origin
 *   despite the leading slash
 * - `/\example.com` — backslashes are normalised to slashes by browsers, so this
 *   escapes the same way
 * - `https://example.com` — the obvious one, and the only one most checks catch
 *
 * Anything rejected falls back to the default rather than erroring: a bad `next`
 * is not the learner's problem to solve, and refusing to sign them in over it
 * would be a worse outcome than ignoring it.
 */
export function safeNext(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith('/')) return DEFAULT_LANDING;
  if (raw.startsWith('//') || raw.startsWith('/\\')) return DEFAULT_LANDING;

  /**
   * Landing back on an auth page having just authenticated is a dead end that
   * reads as a failure. The guard never produces one — it only sets `next` for
   * account-scoped pages — but a hand-written link can.
   */
  const path = raw.split(/[?#]/)[0];
  if (path === '/sign-in' || path === '/sign-up') return DEFAULT_LANDING;

  return raw;
}
