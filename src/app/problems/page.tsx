import Link from 'next/link';
import { Suspense } from 'react';
import { ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Node } from '@/components/ui/Node';
import { ProblemTable } from '@/components/problem/ProblemTable';
import { Filters } from '@/components/dashboard/Filters';
import { LoadingBar } from '@/components/ui/LoadingBar';
import { getProblemSet, getTopics } from '@/content/registry';
import { DIFFICULTIES, companyTags, filterProblems } from '@/lib/catalog';
import { Page } from '@/components/ui/Page';

/**
 * The Problems surface (B15).
 *
 * Sets are listed in curriculum order, every one of them enterable.
 * Matches the dashboard UI with topic cards and full filter controls.
 */
export const metadata = {
  title: 'Practice problems — GetCracked',
  description: 'Interview-style practice problems, grouped by topic. Sign up free to track your progress.',
};

export default async function ProblemsPage(props: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : undefined;
  const topics = getTopics();
  const problems = filterProblems(searchParams ?? {});
  const totalCount = filterProblems({}).length;

  return (
    <Page width="catalog">
      {/* Same masthead as every other surface */}
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Problems</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          {totalCount} problems across {topics.length} topics, easiest first. Every set
          is open — if you already know a topic, start there.
        </p>
      </header>

      {topics.length === 0 ? (
        <EmptyState title="No problems yet">The catalog is still being written.</EmptyState>
      ) : (
        <>
          {/*
            Topic sets matching the dashboard "Where to go" UI
          */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">By topic</h2>
            <ul className="grid gap-3 sm:grid-cols-2">
              {topics.map((topic) => {
                const set = getProblemSet(topic);
                return (
                  <li key={topic}>
                    <Link
                      href={`/problems/${topic}`}
                      className="node-surface node-interactive flex h-full items-center justify-between gap-3 bg-accent-strong px-4 py-3 text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                    >
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-bold capitalize">
                          {topic.replace(/-/g, ' ')}
                        </span>
                        <span className="text-xs opacity-80">
                          {set.length} {set.length === 1 ? 'problem' : 'problems'}
                        </span>
                      </span>
                      <ArrowRight size={16} aria-hidden className="shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

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
              <ProblemTable problems={problems} />
            )}
          </section>

          <Node tone="muted" className="p-4 text-sm text-foreground-muted">
            Each problem set has a lesson behind it. If one is unfamiliar, the{' '}
            <Link href="/learn/dsa" className="text-link underline underline-offset-2">
              DSA path
            </Link>{' '}
            covers it first — a recommendation, never a lock.
          </Node>
        </>
      )}
    </Page>
  );
}
