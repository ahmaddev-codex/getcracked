'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/auth-client';

/**
 * The site header (K1).
 *
 * A dark bar spanning the full width, with the wordmark at the left, the
 * surfaces in the middle, and account actions at the right — the reference's
 * arrangement, because it is the part of the layout a returning learner
 * navigates by muscle memory.
 *
 * Dark against the light page ground on purpose: it is the one element that is
 * not a node, which is what lets the yellow-on-white node language own
 * everything below it without competing for attention.
 *
 * The auth actions are the only part that varies. Signed out shows the pair the
 * reference does — a quiet link plus one filled call to action — because a
 * learner can use the whole product signed out (§2.6) and the header should
 * invite an account rather than demand one.
 */

const LINKS = [
  { href: '/learn/dsa', label: 'Learn DSA' },
  { href: '/learn/system-design', label: 'System Design' },
  { href: '/problems', label: 'Problems' },
];

export function SiteHeader() {
  const pathname = usePathname();
  const { data: session, isPending } = useSession();

  return (
    <header className="bg-header text-header-foreground">
      <nav
        aria-label="Main"
        className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6"
      >
        <Link
          href="/"
          className="flex items-center gap-2 rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
        >
          {/* The mark carries the node treatment, so the identity is the same
              shape language as everything the product draws. */}
          <span
            aria-hidden
            className="grid h-7 w-7 place-items-center rounded-node border-2 border-accent-strong bg-accent-strong text-sm font-bold text-accent-foreground"
          >
            G
          </span>
          <span className="text-base font-semibold tracking-tight">GetCracked</span>
        </Link>

        <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
          {LINKS.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`text-base transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong ${
                    active ? 'font-semibold text-accent-strong' : ''
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="ml-auto flex items-center gap-3">
          {/* Nothing is rendered until the session is known: flashing "Sign in"
              at someone who is signed in reads as having been logged out. */}
          {isPending ? null : session ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
              >
                Dashboard
              </Link>
              <Link
                href="/account"
                className="text-sm hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
              >
                Account
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="text-sm hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-node border-2 border-accent-strong bg-accent-strong px-3 py-1 text-sm font-semibold text-accent-foreground node-interactive focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
