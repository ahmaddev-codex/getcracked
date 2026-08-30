import { NextResponse, type NextRequest } from 'next/server';
import { getSessionCookie } from 'better-auth/cookies';
import { isPublicPath } from '@/lib/access';

/**
 * Edge layer of the two-layer guard (AD-5, ADR 0001 §4).
 *
 * Named `proxy`, not `middleware`: Next.js 16 deprecated the `middleware` file
 * convention and renamed it. With a `src/` layout the file must sit beside
 * `app/` — at `src/proxy.ts`. A root-level `middleware.ts` is silently ignored,
 * which looks exactly like a working guard until you test an unauthenticated
 * request.
 *
 * This checks the session cookie's **presence and signature only**. It does not
 * and cannot look up the session record: the edge runtime has no TCP socket, so
 * it cannot reach Postgres. The authoritative check lives in `requireSession()`.
 *
 * So this is a cheap fast-path rejection, **not the security boundary**. A
 * forged-but-well-formed cookie passes here and is rejected by the server layer.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (isPublicPath(pathname)) return NextResponse.next();

  if (getSessionCookie(request)) return NextResponse.next();

  // APIs get a status; pages get a redirect that returns the visitor to where
  // they were headed once they have signed in.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const signIn = new URL('/sign-in', request.url);
  signIn.searchParams.set('next', pathname + request.nextUrl.search);
  return NextResponse.redirect(signIn);
}

export const config = {
  /**
   * Static assets, image optimization and platform telemetry never need the
   * check.
   *
   * `_vercel` covers the Analytics and Speed Insights endpoints. They are not
   * ours to authorise — they carry no session and read no user row — and
   * running an auth guard on every beacon is work with no possible outcome.
   */
  matcher: [
    '/((?!_next/static|_next/image|_vercel|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
