'use client';

import Link from 'next/link';
import { AccountSlot } from '@/components/auth/AccountMenu';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { SiteNav } from '@/components/nav/SiteNav';

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
 * The destinations are grouped rather than listed — see `SiteNav` for why. The
 * auth actions are the only part that varies, and they live in
 * `AccountSlot` — signed out it shows the pair the reference does, a quiet link
 * plus one filled call to action, because a learner can use the whole product
 * signed out (§2.6) and the header should invite an account rather than demand
 * one. Signed in it becomes the account menu, which is where sign-out lives.
 */

export function SiteHeader() {
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

        <SiteNav />

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
