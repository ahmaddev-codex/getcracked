'use client';

import Link from 'next/link';
import Image from 'next/image';

import { AccountSlot } from '@/components/auth/AccountMenu';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { SiteNav } from '@/components/nav/SiteNav';
import { HeaderThemeToggle } from '@/components/theme/HeaderThemeToggle';

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
          <Image
            src="/getcracked_logo_light.svg"
            alt="GetCracked"
            width={104}
            height={32}
            className="h-6 w-auto sm:h-7"
            priority
          />
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
        <div className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4 sm:ml-0">
          <SearchTrigger />
          <HeaderThemeToggle />
          <AccountSlot />
        </div>
      </nav>
    </header>
  );
}
