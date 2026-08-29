import { headers } from 'next/headers';
import { getAuth } from '@/lib/auth';

/**
 * Server layer of the two-layer guard (AD-5) — the **authoritative** check.
 *
 * Middleware only proves a cookie is present and well-formed. This proves the
 * session record actually exists and has not expired or been revoked, which
 * requires the database and therefore cannot happen at the edge.
 */
export async function getSession() {
  return getAuth().api.getSession({ headers: await headers() });
}

/**
 * Returns the session or throws.
 *
 * Every query touching a user row should take the resulting user id as an
 * argument rather than reading it ambiently, so that forgetting to scope a
 * query is a type error rather than a silent cross-account leak (R-15).
 */
export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error('UNAUTHENTICATED');
  return session;
}
