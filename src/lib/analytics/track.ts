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
 * request for every keystroke-adjacent event.
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

    // `sendBeacon` survives the page being unloaded, which a plain fetch does
    // not, and it fails by returning false rather than by throwing.
    if (navigator.sendBeacon) {
      const queued = navigator.sendBeacon(
        '/api/events',
        new Blob([body], { type: 'application/json' }),
      );
      if (!queued) enabled = false;
      return;
    }

    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {
      // Blocked, offline, or refused. Stop trying for this session.
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
