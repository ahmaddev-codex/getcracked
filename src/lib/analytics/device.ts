'use client';

/**
 * Rotating anonymous device identifier (PRD F6 tier two, A16).
 *
 * Random and client-generated — never derived from anything about the person,
 * and never a fingerprint. Rotation caps how much history one identifier can
 * accumulate: after the window it becomes a new visitor, which is the point.
 *
 * Stored in localStorage rather than a cookie so it is not transmitted on every
 * request; it is sent explicitly, only with events.
 */

const KEY = 'gc.device';
/** Long enough for a funnel to be meaningful, short enough not to be a profile. */
const ROTATE_AFTER_MS = 30 * 24 * 60 * 60 * 1000;

interface Stored {
  id: string;
  createdAt: number;
}

function fresh(): Stored {
  return { id: crypto.randomUUID(), createdAt: Date.now() };
}

/**
 * Returns the current device id, rotating or creating as needed.
 *
 * Returns null when storage is unavailable — private browsing, blocked site
 * data — rather than falling back to something more persistent. A visitor who
 * has made their browser refuse storage has expressed a preference.
 */
export function getDeviceId(): string | null {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: Stored | null = raw ? (JSON.parse(raw) as Stored) : null;

    if (parsed?.id && Date.now() - parsed.createdAt < ROTATE_AFTER_MS) {
      return parsed.id;
    }
    const next = fresh();
    localStorage.setItem(KEY, JSON.stringify(next));
    return next.id;
  } catch {
    return null;
  }
}
