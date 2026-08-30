'use client';

import type { EventName } from './events';
import { getDeviceId } from './device';

/**
 * Fire-and-forget client event.
 *
 * Never blocks navigation and never surfaces an error: analytics failing is not
 * a reason for a learner's page to break.
 *
 * **Blocked analytics is an expected outcome, not a bug.** Content blockers stop
 * requests to `/api/events`, and that is a preference to respect rather than
 * route around — renaming the endpoint to something a blocker does not
 * recognise would be deliberately circumventing a choice the person made, which
 * is the opposite of what the A16 notice promises them.
 *
 * So the first failure disables sending for the rest of the session. That
 * respects the preference, and it stops a blocked browser logging a failed
 * request for every event that follows.
 *
 * **`fetch` with `keepalive`, not `sendBeacon`.** They survive a page unload
 * equally well — that is what `keepalive` is for, and it is the modern
 * replacement for the beacon — but only one of them can tell you it failed.
 * `sendBeacon` returns `true` once the request is *queued*, and a content
 * blocker kills it after that, at the network layer, where nothing observable
 * happens. So the disable-on-first-failure rule above silently never fired: a
 * blocked browser logged `ERR_BLOCKED_BY_CLIENT` for every single event, and
 * this comment described behaviour the code did not have.
 */

let enabled = true;

export function track(
  name: EventName,
  props?: Record<string, unknown>,
  route?: string,
): void {
  if (!enabled) return;

  try {
    const body = JSON.stringify({
      name,
      props,
      route: route ?? window.location.pathname,
      deviceId: getDeviceId(),
    });

    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      // Outlives the page, which is the whole reason a beacon was used here.
      keepalive: true,
    }).catch(() => {
      /**
       * Blocked, offline, or refused before a response existed.
       *
       * Only a *transport* failure disables. An HTTP response — a 429 from the
       * rate limiter, a 400 on an event name we got wrong — means the request
       * arrived, so the transport works and there is nothing to give up on;
       * killing analytics for the session over one refused event would be a far
       * bigger loss than the event itself.
       */
      enabled = false;
    });
  } catch {
    enabled = false;
  }
}

/** Test seam: analytics is disabled for the session after a failure. */
export function resetTrackingForTests(): void {
  enabled = true;
}
