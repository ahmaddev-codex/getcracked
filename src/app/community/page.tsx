'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Code2,
  MessageSquare,
  ArrowRight,
  ThumbsUp,
} from 'lucide-react';
import { Page } from '@/components/ui/Page';
import { Leaderboard } from '@/components/community/Leaderboard';
import { getAllCommunitySolutions, type CommunitySolution } from '@/lib/community/solutions';
import { getAllDiscussionComments, type DiscussionComment } from '@/lib/community/discussions';

type CommunityTab = 'leaderboard' | 'solutions' | 'discussions';

export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<CommunityTab>('leaderboard');
  const solutions: CommunitySolution[] = getAllCommunitySolutions();
  const discussions: DiscussionComment[] = getAllDiscussionComments();

  return (
    <Page width="catalog">
      <div className="flex flex-col gap-8 py-6">
        {/* Page Header */}
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded bg-link/10 px-2 py-0.5 font-mono text-3xs font-bold uppercase tracking-wider text-link">
              <UsersIcon />
              Community Hub
            </span>
            <span className="text-3xs font-mono text-foreground-muted">
              Live Learner Submissions &amp; Ranks
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            GetCracked Learner Community
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-foreground-muted">
            Share battle-tested solutions, dissect algorithmic edge cases, and climb the global leaderboard as you solve real coding problems and build systems.
          </p>
        </header>

        {/* Community Navigation Tabs */}
        <nav aria-label="Community navigation" className="flex items-center gap-2 border-b border-border-strong pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-accent-strong text-accent-foreground font-bold shadow-xs'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-muted/50'
            }`}
          >
            <Trophy size={14} />
            <span>Leaderboard &amp; Streaks</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('solutions')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'solutions'
                ? 'bg-accent-strong text-accent-foreground font-bold shadow-xs'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-muted/50'
            }`}
          >
            <Code2 size={14} />
            <span>Learner Solutions</span>
            {solutions.length > 0 && (
              <span className="rounded-full bg-link/20 px-1.5 py-0.2 font-mono text-3xs text-link font-bold">
                {solutions.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('discussions')}
            className={`flex items-center gap-2 rounded-md px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'discussions'
                ? 'bg-accent-strong text-accent-foreground font-bold shadow-xs'
                : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface-muted/50'
            }`}
          >
            <MessageSquare size={14} />
            <span>Algorithmic Discussions</span>
            {discussions.length > 0 && (
              <span className="rounded-full bg-link/20 px-1.5 py-0.2 font-mono text-3xs text-link font-bold">
                {discussions.length}
              </span>
            )}
          </button>
        </nav>

        {/* Tab 1: Leaderboard */}
        {activeTab === 'leaderboard' && (
          <section aria-label="Leaderboard" className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Top Crackers</h2>
                <p className="text-xs text-foreground-muted">
                  Ranked by verified passing test cases, consistent daily streaks, and complex build challenges.
                </p>
              </div>
            </div>
            <Leaderboard />
          </section>
        )}

        {/* Tab 2: Learner Solutions */}
        {activeTab === 'solutions' && (
          <section aria-label="Learner Solutions" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Community Solutions</h2>
                <p className="text-xs text-foreground-muted">
                  Approaches written and published by learners who passed all test suites.
                </p>
              </div>
              <Link
                href="/problems"
                className="flex items-center gap-1.5 rounded-md bg-accent-strong px-3 py-1.5 text-xs font-bold text-accent-foreground hover:opacity-90"
              >
                <span>Solve &amp; Publish</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {solutions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface p-12 text-center">
                <Code2 size={40} className="text-foreground-muted/40 mb-3" />
                <h3 className="text-sm font-bold text-foreground">No community solutions published yet</h3>
                <p className="mt-1 max-w-sm text-xs text-foreground-muted">
                  Pass all test cases in any algorithm problem or challenge, then click &ldquo;Share with Community&rdquo; to showcase your approach!
                </p>
                <Link
                  href="/problems"
                  className="mt-4 flex items-center gap-1.5 rounded-md bg-accent-strong px-4 py-2 text-xs font-bold text-accent-foreground"
                >
                  <span>Explore Problems</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {solutions.map((sol) => (
                  <article
                    key={sol.id}
                    className="flex flex-col justify-between rounded-lg border border-border-strong bg-surface p-4 transition-all hover:border-link"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-3xs uppercase tracking-wider text-link font-bold">
                          {sol.language}
                        </span>
                        <span className="flex items-center gap-1 text-3xs text-foreground-muted font-mono">
                          <ThumbsUp size={10} />
                          {sol.upvotes}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-foreground">{sol.title}</h3>
                      <p className="text-xs text-foreground-muted line-clamp-2 leading-relaxed">
                        {sol.explanation}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-3xs font-mono">
                        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-foreground-muted">
                          Time: {sol.timeComplexity}
                        </span>
                        <span className="rounded bg-surface-muted px-1.5 py-0.5 text-foreground-muted">
                          Space: {sol.spaceComplexity}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3 text-3xs text-foreground-muted">
                      <span>By {sol.author}</span>
                      <Link
                        href={`/problems`}
                        className="font-semibold text-link hover:underline"
                      >
                        Try Problem &rarr;
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Tab 3: Discussions */}
        {activeTab === 'discussions' && (
          <section aria-label="Discussions" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-foreground">Interview Edge Cases &amp; Trade-Offs</h2>
                <p className="text-xs text-foreground-muted">
                  Technical discourse on concurrency, memory bounds, and interview variations.
                </p>
              </div>
              <Link
                href="/problems"
                className="flex items-center gap-1.5 rounded-md bg-accent-strong px-3 py-1.5 text-xs font-bold text-accent-foreground hover:opacity-90"
              >
                <span>Ask on Problem</span>
                <ArrowRight size={12} />
              </Link>
            </div>

            {discussions.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface p-12 text-center">
                <MessageSquare size={40} className="text-foreground-muted/40 mb-3" />
                <h3 className="text-sm font-bold text-foreground">No discussion threads started yet</h3>
                <p className="mt-1 max-w-sm text-xs text-foreground-muted">
                  Have a question about Big-O complexity or edge cases? Open any problem and ask in the discussion tab!
                </p>
                <Link
                  href="/problems"
                  className="mt-4 flex items-center gap-1.5 rounded-md bg-accent-strong px-4 py-2 text-xs font-bold text-accent-foreground"
                >
                  <span>Browse Problems</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {discussions.map((disc) => (
                  <article
                    key={disc.id}
                    className="flex flex-col gap-2 rounded-lg border border-border-strong bg-surface p-4 transition-all hover:border-link"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{disc.author}</span>
                        {disc.authorBadge && (
                          <span className="rounded bg-link/15 px-1 py-0.5 text-3xs font-semibold text-link">
                            {disc.authorBadge}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1 text-3xs text-foreground-muted font-mono">
                        <ThumbsUp size={10} />
                        {disc.upvotes}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed text-foreground-muted">
                      {disc.content}
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Platform Practice Hub Footer Banner */}
        <aside aria-label="Practice suites" className="mt-4 rounded-xl border-2 border-border-strong bg-surface-muted/30 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-3xs font-bold uppercase tracking-wider text-link">
                Hands-On Practice
              </span>
              <h2 className="text-base font-bold text-foreground">
                Ready to crack your upcoming technical interview loop?
              </h2>
              <p className="text-xs text-foreground-muted">
                Run live code against unit tests, build real distributed systems, and practice mock rounds with an AI interviewer.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/problems"
                className="flex items-center gap-1.5 rounded-md bg-accent-strong px-4 py-2 text-xs font-bold text-accent-foreground shadow-xs hover:opacity-90"
              >
                <span>Algorithm Practice</span>
                <ArrowRight size={12} />
              </Link>
              <Link
                href="/interviews"
                className="flex items-center gap-1.5 rounded-md border border-border-strong bg-surface px-4 py-2 text-xs font-bold text-foreground hover:bg-surface-muted"
              >
                <span>Mock Rounds</span>
              </Link>
            </div>
          </div>
        </aside>
      </div>
    </Page>
  );
}

function UsersIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
