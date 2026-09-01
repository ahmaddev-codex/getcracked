import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { EmptyState } from '@/components/ui/EmptyState';
import { Filters } from '@/components/dashboard/Filters';
import { ProblemTable } from '@/components/problem/ProblemTable';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { DIFFICULTIES, catalogCounts, companyTags, filterProblems } from '@/lib/catalog';
import { getTopics } from '@/content/registry';
import { conceptCount } from '@/content/concepts';
import { Page } from '@/components/ui/Page';
import { PersonalizedDashboard } from '@/components/dashboard/PersonalizedDashboard';

/**
 * The dashboard (A3, A4) — navigation across the three tiers (§2.1a).
 *
 * Public: it is a catalog, not account data. Progress belongs to the account
 * and is rendered by client components that can read it, so this page stays
 * statically prerenderable and indexable.
 */
export const metadata = {
  title: 'Dashboard — GetCracked',
  description: 'Learn, practise, and build. Free and open, no account needed.',
};

export default async function DashboardPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const counts = catalogCounts();
  const searchParams = await props.searchParams;
  const problems = filterProblems(searchParams);
  const topics = getTopics();

  const tracks = [
    {
      href: '/learn',
      title: 'Foundations',
      detail: `${counts.lessons} lessons across ${getTopics().length} topics`,
    },
    {
      href: '/concepts',
      title: `Reference (${conceptCount()})`,
      detail: 'Named solutions to problems that keep recurring',
    },
    {
      href: '/problems',
      title: 'Practice',
      detail: `${counts.problems} problems, grouped by topic`,
    },
    {
      href: '/challenges',
      title: 'Build it',
      detail: `${counts.challenges} multi-step builds, ${counts.challengeSteps} steps in all`,
    },
    {
      href: '/interviews',
      title: 'Mock Interviews',
      detail: 'Timed DSA & System Design rounds with Socratic AI interviewer',
    },
    {
      href: '/sandbox',
      title: 'Sandbox',
      detail: 'Your own code, your own input, animated — nothing graded',
    },
  ];

  return (
    <Page width="catalog">
      {/* The same masthead every other surface uses. This page previously had
          its own smaller heading and card grid, which made the one page a
          signed-in learner lands on the one that looked least like the
          product. */}
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Dashboard</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          Everything in one place. Read a topic, practise it, then build the thing itself —
          in any order, having completed nothing.
        </p>
      </header>

      {/* Personalized Retention & Mock Hub (Module F) */}
      <PersonalizedDashboard />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Where to go</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {tracks.map((track) => (
            <li key={track.href}>
              <Link
                href={track.href}
                className="node-surface node-interactive flex h-full items-center justify-between gap-3 bg-accent-strong px-4 py-3 text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                <span className="flex flex-col gap-0.5">
                  <span className="text-sm font-bold">{track.title}</span>
                  <span className="text-xs opacity-80">{track.detail}</span>
                </span>
                <ArrowRight size={16} aria-hidden className="shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Node tone="muted" className="p-4 text-sm text-foreground-muted">
        Three tiers, one direction: read a topic, practise it on single functions, then
        build the thing itself across several files. In any order — nothing is locked
        behind anything.
      </Node>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold">All problems</h2>

        <Suspense fallback={<LoadingBar />}>
          <Filters difficulties={DIFFICULTIES} topics={topics} companies={companyTags()} />
        </Suspense>

        {problems.length === 0 ? (
          <EmptyState title="No problems match those filters">
            Try widening the difficulty range, or clearing the topic filter.
          </EmptyState>
        ) : (
          // The same table the Problems surface uses, so a filtered view and the
          // full catalogue do not read as two different features.
          <ProblemTable problems={problems} />
        )}
      </section>
    </Page>
  );
}
