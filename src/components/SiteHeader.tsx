'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Sparkles, Trophy } from 'lucide-react';
import { AccountSlot } from '@/components/auth/AccountMenu';
import { SearchTrigger } from '@/components/search/SearchTrigger';
import { SiteNav } from '@/components/nav/SiteNav';
import { useAssistant } from '@/components/assistant';

function AssistantHeaderButton() {
  const { openAssistant } = useAssistant();
  return (
    <button
      type="button"
      onClick={() => openAssistant()}
      aria-label="Open AI Assistant"
      className="flex items-center gap-1.5 rounded-xs text-header-foreground/80 transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      title="Open AI Assistant"
    >
      <Sparkles size={16} aria-hidden />
      <span className="hidden sm:inline text-xs font-medium">AI</span>
    </button>
  );
}

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
          <Image src="/getcracked_logo_light.svg" alt="GetCracked" width={96} height={96} />
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
        <div className="ml-auto flex shrink-0 items-center gap-4 sm:ml-0">
          <Link
            href="/leaderboard"
            title="Leaderboard"
            aria-label="Leaderboard"
            className="flex items-center gap-1.5 rounded-xs text-header-foreground/80 transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
          >
            <Trophy size={16} aria-hidden />
            <span className="hidden sm:inline text-xs font-medium">Leaderboard</span>
          </Link>
          <AssistantHeaderButton />
          <SearchTrigger />
          <AccountSlot />
        </div>
      </nav>
    </header>
  );
}
