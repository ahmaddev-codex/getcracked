import { eq, and, isNull } from 'drizzle-orm';
import { events } from '@/db/schema';
import type { Database } from '@/db/client';
import { isKnownEvent } from './events';

/** Props are client-supplied; an unbounded blob would be a free write primitive. */
export const MAX_PROPS_BYTES = 4_096;

/**
 * The caller sent something invalid — as opposed to the write failing.
 *
 * The distinction exists because the endpoint could not previously make it: it
 * caught every throw and answered 400, so a database outage was reported to the
 * browser as "Bad Request". That is a lie in the most expensive direction —
 * it blames the client, so nobody goes looking at the server, and the console
 * fills with 400s while the real fault is elsewhere entirely.
 */
export class InvalidEventError extends Error {}

export interface EventInput {
  name: string;
  userId?: string | null;
  deviceId?: string | null;
  route?: string | null;
  props?: Record<string, unknown> | null;
}

/**
 * Writes one analytics event.
 *
 * Validation lives here rather than in the route handler so it applies to every
 * caller — the public endpoint, server components, and future server actions
 * alike. A route-level check would be bypassed by the first internal caller
 * that forgot about it.
 */
export async function recordEvent(db: Database, input: EventInput): Promise<void> {
  if (!isKnownEvent(input.name)) {
    throw new InvalidEventError(`Unknown event: ${input.name}`);
  }
  if (!input.userId && !input.deviceId) {
    throw new InvalidEventError('An event must be attributable to a user or a device.');
  }
  if (input.props && JSON.stringify(input.props).length > MAX_PROPS_BYTES) {
    throw new InvalidEventError(`Event props exceed ${MAX_PROPS_BYTES} bytes.`);
  }

  await db.insert(events).values({
    name: input.name,
    userId: input.userId ?? null,
    deviceId: input.deviceId ?? null,
    route: input.route ?? null,
    props: input.props ?? null,
  });
}

/**
 * Attributes a device's prior anonymous events to the account that just claimed
 * them (A15).
 *
 * Only unattributed rows are claimed, so a shared device cannot hand one
 * learner's history to the next person who signs up on it. The device id is
 * left in place, which keeps the pre-signup funnel reconstructable.
 */
export async function claimDeviceEvents(
  db: Database,
  deviceId: string,
  userId: string,
): Promise<void> {
  await db
    .update(events)
    .set({ userId })
    .where(and(eq(events.deviceId, deviceId), isNull(events.userId)));
}
