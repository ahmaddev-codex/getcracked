'use client';

import type { EventName } from './events';
import { getDeviceId } from './device';

/**
 * Fire-and-forget client event.
 *
 * Never blocks navigation and never surfaces an error: analytics failing is not
 * a reason for a learner's page to break. `sendBeacon` survives the page being
 * unloaded, which a plain fetch does not.
 */
export function track(
  name: EventName,
  props?: Record<string, unknown>,
  route?: string,
): void {
  try {
    const body = JSON.stringify({
      name,
      props,
      route: route ?? window.location.pathname,
      deviceId: getDeviceId(),
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Deliberately silent.
  }
}
