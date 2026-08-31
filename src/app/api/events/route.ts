import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { getSession } from '@/lib/session';
import { InvalidEventError, recordEvent } from '@/lib/analytics/record';
import { checkRateLimit, clientIp, rateLimitKey } from '@/lib/rate-limit';

/**
 * Public analytics endpoint.
 *
 * Public by necessity: signed-out visitors are tracked (F6 tier two) and told so
 * by the A16 notice. That makes this one of the very few write endpoints
 * reachable without a session, so it defends itself on four fronts — a closed
 * event-name allowlist, a payload cap, a user id taken from the session rather
 * than the body, and a rate limit (R-17).
 *
 * The limit fails open: an unreachable Redis should not stop a learner's page
 * from working, and the downside is inflated counts rather than exposure.
 */
export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { name, props, route, deviceId } = (payload ?? {}) as Record<string, unknown>;
  const session = await getSession();

  const limit = await checkRateLimit(
    'events',
    rateLimitKey({
      userId: session?.user.id,
      deviceId: typeof deviceId === 'string' ? deviceId : null,
      ip: clientIp(request),
    }),
  );

  if (!limit.allowed) {
    return NextResponse.json(
      { ok: false, error: 'Rate limit exceeded' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000))),
          'RateLimit-Limit': String(limit.limit),
          'RateLimit-Remaining': String(limit.remaining),
        },
      },
    );
  }

  try {
    await recordEvent(getDb(), {
      name: String(name),
      userId: session?.user.id ?? null,
      deviceId: typeof deviceId === 'string' ? deviceId : null,
      route: typeof route === 'string' ? route : null,
      props: props && typeof props === 'object' ? (props as Record<string, unknown>) : null,
    });
  } catch (error) {
    /**
     * A bad payload is the client's problem; anything else is ours.
     *
     * This used to answer 400 for both, so a database outage reached the browser
     * as "Bad Request" — which sends whoever is debugging to look at the
     * request. The body stays deliberately thin either way, since this endpoint
     * is public and an error message is a free probe; the detail goes to the
     * server log, where it belongs.
     */
    if (error instanceof InvalidEventError) {
      return NextResponse.json({ ok: false, error: 'Invalid event' }, { status: 400 });
    }

    console.error('[events] write failed', error);
    return NextResponse.json({ ok: false, error: 'Event not recorded' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
