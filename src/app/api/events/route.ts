import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { getSession } from '@/lib/session';
import { recordEvent } from '@/lib/analytics/record';

/**
 * Public analytics endpoint.
 *
 * Public by necessity: signed-out visitors are tracked (F6 tier two), and they
 * are told so by the A16 notice rather than by a buried policy. That makes this
 * one of the very few write endpoints reachable without a session, so
 * `recordEvent` validates the event name against a closed allowlist and caps
 * payload size.
 *
 * The user id comes from the server session, never from the request body — a
 * client that could name its own user could write events as anyone.
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

  try {
    await recordEvent(getDb(), {
      name: String(name),
      userId: session?.user.id ?? null,
      deviceId: typeof deviceId === 'string' ? deviceId : null,
      route: typeof route === 'string' ? route : null,
      props: props && typeof props === 'object' ? (props as Record<string, unknown>) : null,
    });
  } catch {
    // Rejected events are a client bug or an abuse attempt; neither deserves a
    // detailed error, and analytics must never break the caller.
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
