'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AccountSlot } from '@/components/auth/AccountMenu';
import { SearchTrigger } from '@/components/search/SearchTrigger';

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
 * The auth actions are the only part that varies, and they live in
 * `AccountSlot` — signed out it shows the pair the reference does, a quiet link
 * plus one filled call to action, because a learner can use the whole product
 * signed out (§2.6) and the header should invite an account rather than demand
 * one. Signed in it becomes the account menu, which is where sign-out lives.
 */

const LINKS = [
  { href: '/learn/dsa', label: 'Learn DSA' },
  { href: '/learn/system-design', label: 'System Design' },
  { href: '/learn/design-patterns', label: 'Patterns' },
  { href: '/problems', label: 'Problems' },
  { href: '/challenges', label: 'Build' },
  { href: '/sandbox', label: 'Sandbox' },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-header text-header-foreground">
      <nav
        aria-label="Main"
        /*
          The same rail a `canvas` page uses, and the same horizontal padding, so
          the wordmark lines up with the content of every page wide enough to
          reach it.
        */
        className="mx-auto flex w-full max-w-canvas flex-wrap items-center gap-x-6 gap-y-2 px-4 py-2.5 sm:px-6"
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

        {/*
          One row that scrolls on a phone, rather than three rows that wrap.

          Six destinations do not fit 375px at a readable size, and wrapping
          them pushed the header to roughly a third of the viewport before any
          content appeared. Scrolling keeps it to two rows — wordmark and
          account, then the links — and `order` puts the links on their own row
          below the breakpoint so the account actions stay reachable at the top
          right where they are on desktop.
        */}
        <ul className="order-last flex w-full min-w-0 flex-nowrap items-center gap-x-5 overflow-x-auto whitespace-nowrap sm:order-none sm:mx-auto sm:w-auto sm:flex-wrap sm:overflow-x-visible">
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

        {/*
          `ml-auto` only below the breakpoint, where it pushes the account
          actions to the right of the wordmark on their shared row. Above it the
          links carry `mx-auto`, and auto margins share free space between
          *every* auto in the line — so leaving this one on would give the row
          three claims on the space and the links would sit a third of the way
          across rather than centred.
        */}
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:ml-0">
          <SearchTrigger />
          <AccountSlot />
        </div>
      </nav>
    </header>
  );
}
