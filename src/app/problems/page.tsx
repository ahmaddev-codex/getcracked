import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Node } from '@/components/ui/Node';
import { getProblemSet, getTopics, getProblems } from '@/content/registry';
import { Page } from '@/components/ui/Page';

/**
 * The Problems surface (B15).
 *
 * Dedicated to exploring practice sets by topic, with the same UI layout
 * as the dashboard tracks. To browse and filter every problem in a table,
 * learners use the dashboard catalog.
 */
export const metadata = {
  title: 'Practice problems by topic — GetCracked',
  description: 'Interview-style practice problems, grouped by topic. Sign up free to track your progress.',
};

export default function ProblemsPage() {
  const topics = getTopics();
  const all = getProblems();

  return (
    <Page width="catalog">
      {/* Same masthead as every other surface */}
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Problems</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          {all.length} practice problems grouped across {topics.length} core topics.
          Select any topic to start solving, or visit the{' '}
          <Link href="/dashboard" className="text-link underline underline-offset-2">
            dashboard
          </Link>{' '}
          to filter the entire catalog.
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

          <Node tone="muted" className="p-4 text-sm text-foreground-muted">
            Looking for a specific problem or company tag? Use the{' '}
            <Link href="/dashboard" className="text-link underline underline-offset-2 font-medium">
              dashboard problem catalog
            </Link>{' '}
            to filter across all {all.length} problems by difficulty, company, and topic.
          </Node>
        </>
      )}
    </Page>
  );
}
