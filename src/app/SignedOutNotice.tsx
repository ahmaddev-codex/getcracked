'use client';

import Link from 'next/link';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useSession } from '@/lib/auth-client';
import { track } from '@/lib/analytics/track';

const DISMISSED_KEY = 'gc.notice.dismissed';

/**
 * Reads the dismissal flag through `useSyncExternalStore` rather than an effect.
 *
 * localStorage is an external store, and treating it as one is what gives a
 * correct server snapshot (never dismissed, so the markup is stable) without
 * setting state during an effect and triggering a cascading render.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab dismissing it should hide it here too.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function getSnapshot(): boolean {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    // Storage refused (private mode, blocked site data): show the notice.
    return false;
  }
}

/** On the server nothing is dismissed, so the first paint always includes it. */
function getServerSnapshot(): boolean {
  return false;
}

/**
 * The disclosure surface for signed-out visitors (PRD A16).
 *
 * Does two jobs deliberately. It is the A15 migration prompt — "your progress
 * is on this device only" — and it is where an anonymous visitor is told their
 * activity is recorded at all (F6 tier two).
 *
 * Putting those together is the honest version: the learner is offered
 * something in return for the tracking, in the same sentence, rather than the
 * tracking being disclosed on a policy page nobody opens.
 *
 * Never blocks the page. Dismissal is remembered.
 */
export function SignedOutNotice() {
  const { data: session, isPending } = useSession();
  const dismissed = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const visible = !isPending && !session && !dismissed;

  useEffect(() => {
    if (visible) track('signed_out_notice_shown');
  }, [visible]);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(DISMISSED_KEY, '1');
    } catch {
      // Storage refused; the notice simply returns on the next visit.
    }
    listeners.forEach((l) => l());
    track('signed_out_notice_dismissed');
  }, []);

  if (!visible) return null;

  return (
    <aside
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-black/10 px-4 py-2 text-xs"
    >
      <span>
        You&apos;re browsing signed out — your progress is saved on this device only, and
        we record anonymous usage to see which lessons work.{' '}
        <Link href="/sign-up" className="underline">
          Sign in
        </Link>{' '}
        to keep your progress across devices.
      </span>
      <button onClick={dismiss} className="underline opacity-60">
        Dismiss
      </button>
    </aside>
  );
}
