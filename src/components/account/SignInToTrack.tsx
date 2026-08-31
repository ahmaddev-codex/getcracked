'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Save } from 'lucide-react';
import { useSession } from '@/lib/auth-client';

/**
 * A quiet prompt wherever progress is displayed.
 *
 * The top-of-page notice states the policy once and is dismissible; this states
 * the *consequence* at the moment it matters — beside a tick count that lives
 * only in this browser. Someone who dismissed the banner on their first visit
 * has no other way to learn that their record is device-local until they lose
 * it, which is the worst possible moment.
 *
 * Deliberately not a blocker and not a modal. Everything works signed out
 * (§2.6); the account only adds durability, so this reads as an offer rather
 * than a demand.
 *
 * **Where this belongs, and where it does not.** Beside a persistent *count* —
 * "13 / 20 solved", "2 of 4 done" — and nowhere else. The A16 banner already
 * makes the general statement on every page, so a second copy next to every
 * badge, card and catalogue is the same sentence four times over, which reads
 * as nagging and gets dismissed rather than read. Two placements: the problem
 * table and a build's step list.
 */
export function SignInToTrack({ what = 'progress' }: { what?: string }) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();

  // Nothing until the session is known, so a signed-in learner never sees a
  // flash of a prompt telling them to sign in.
  if (isPending || session) return null;

  return (
    <p className="flex flex-wrap items-center gap-1.5 text-xs text-foreground-muted">
      <Save size={13} aria-hidden className="shrink-0" />
      Your {what} is saved on this device only.{' '}
      <Link
        href={`/sign-in?next=${encodeURIComponent(pathname)}`}
        className="text-link underline underline-offset-2"
      >
        Sign in
      </Link>{' '}
      to keep it across devices.
    </p>
  );
}
