'use client';

import Link from 'next/link';
import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { useSession } from '@/lib/auth-client';
import { useHydrated } from '@/lib/use-hydrated';
import { track } from '@/lib/analytics/track';
import { LOCAL_PROGRESS_KEY, readLocalProgress } from '@/lib/progress-local';
import {
  DISCLOSURE_DISMISSED_KEY,
  PROMPT_SNOOZE_KEY,
  readNotice,
  serverNotice,
} from '@/lib/signed-out-prompt';

/**
 * Both snapshots return stable references — see the note in
 * `lib/signed-out-prompt.ts`. A fresh object per call re-renders forever.
 */
const getSnapshot = () =>
  readNotice(
    () => readLocalProgress().filter((e) => e.state === 'complete').length,
    LOCAL_PROGRESS_KEY,
  );

/**
 * Reads storage through `useSyncExternalStore` rather than an effect.
 *
 * localStorage is an external store, and treating it as one is what gives a
 * correct server snapshot (nothing dismissed, nothing solved, so the markup is
 * stable) without setting state during an effect and triggering a cascading
 * render.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // Another tab dismissing it, or solving something, should update this one.
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * The signed-out banner — disclosure first, then a prompt that is earned (A16,
 * A15).
 *
 * One slot, two messages, never both. Which one, and why the split exists at
 * all, is decided in `lib/signed-out-prompt.ts` — the short version is that the
 * two jobs have opposite timing requirements. Disclosure has to appear before
 * anything is recorded and may be dismissed forever; the sign-up prompt is worth
 * nothing until there is something to lose, and should be allowed back when the
 * stake has grown.
 *
 * The disclosure names the *rotation*, not just the recording, because that is
 * what makes anonymous measurement defensible — "we count you" and "we count you
 * against an id that forgets you every month" are different claims, and only the
 * second one is what the code does (analytics/device.ts).
 *
 * Never blocks the page.
 */
export function SignedOutNotice() {
  const { data: session, isPending } = useSession();
  const notice = useSyncExternalStore(subscribe, getSnapshot, serverNotice);
  const hydrated = useHydrated();

  /**
   * Held back until after hydration.
   *
   * Whether to show this depends on the session and on local storage, neither of
   * which the server can see. Rendering it on the first client pass produced a
   * hydration mismatch — the server had emitted nothing where the client wanted
   * a banner. Waiting one render costs a frame and removes the mismatch.
   */
  const visible = hydrated && !isPending && !session && notice.kind !== 'none';

  useEffect(() => {
    if (visible) track('signed_out_notice_shown', { kind: notice.kind });
  }, [visible, notice.kind]);

  const dismiss = useCallback(() => {
    try {
      /**
       * Always, whichever message was on screen.
       *
       * The prompt makes the disclosure's claim as well as its own, so
       * dismissing it has to settle both — otherwise "Dismiss" swaps the prompt
       * for the plain disclosure, and the banner is downgraded rather than
       * gone. One dismissal, one outcome.
       */
      localStorage.setItem(DISCLOSURE_DISMISSED_KEY, '1');

      if (notice.kind === 'keep-progress') {
        // Snoozed against the count, not the clock: it returns when it has
        // something new to say, and not otherwise.
        localStorage.setItem(PROMPT_SNOOZE_KEY, String(notice.solved));
      }
    } catch {
      // Storage refused; the notice simply returns on the next visit.
    }
    listeners.forEach((l) => l());
    track('signed_out_notice_dismissed', { kind: notice.kind });
  }, [notice.kind, notice.solved]);

  if (!visible) return null;

  return (
    <aside
      role="status"
      className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 bg-notice px-4 py-2 text-xs text-notice-foreground"
    >
      <span>
        {notice.kind === 'keep-progress' ? (
          <>
            {/*
              The number is the whole point. "Your progress is saved on this
              device only" is an abstraction someone can shrug at; "you have
              solved 7 problems and they are in this browser" is a thing they
              can picture losing.
            */}
            You&apos;ve solved {notice.solved}{' '}
            {notice.solved === 1 ? 'exercise' : 'exercises'} — all of it lives in this
            browser, and clearing your site data takes it with them.{' '}
            <Link href="/sign-up" className="underline underline-offset-2">
              Create a free account
            </Link>{' '}
            to keep your progress, streaks and activity across devices.
          </>
        ) : (
          <>
            You&apos;re browsing signed out — everything works, but your progress lives in
            this browser only. We count anonymous usage against a random id that resets
            monthly, to see which lessons work.{' '}
            <Link href="/sign-up" className="underline underline-offset-2">
              Sign in
            </Link>{' '}
            to keep your progress, streaks and activity across devices.
          </>
        )}
      </span>
      <button onClick={dismiss} className="underline underline-offset-2">
        Dismiss
      </button>
    </aside>
  );
}
