import Link from 'next/link';
import { EmptyState } from '@/components/ui/EmptyState';
import { Node } from '@/components/ui/Node';
import { ProblemTable } from '@/components/problem/ProblemTable';
import { getProblemSet, getProblems, getTopics } from '@/content/registry';
import { Page } from '@/components/ui/Page';

/**
 * The Problems surface (B15).
 *
 * Sets are listed in curriculum order, every one of them enterable. Nothing
 * here reads progress — a set cannot be locked because there is no state to
 * lock it against (§6.6).
 */
export const metadata = {
  title: 'Practice problems — GetCracked',
  description: 'Interview-style practice problems, grouped by topic. Sign up free to track your progress.',
};

export default function ProblemsPage() {
  const topics = getTopics();
  const all = getProblems();

  return (
    <Page width="catalog">
      {/* Same masthead as every other surface — a page that looks like a
          different product is a page a learner has to re-learn. */}
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Problems</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          {all.length} problems across {topics.length} topics, easiest first. Every set
          is open — if you already know a topic, start there.
        </p>
      </header>

      {topics.length === 0 ? (
        <EmptyState title="No problems yet">The catalog is still being written.</EmptyState>
      ) : (
        <>
          {/*
            Topic sets first, because the catalogue is small enough that
            "which topic" is the real question. The full table below answers
            the other one — "find me something at this difficulty".
          */}
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">By topic</h2>
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {topics.map((topic) => {
                const set = getProblemSet(topic);
                return (
                  <li key={topic}>
                    <Link
                      href={`/problems/${topic}`}
                      className="node-surface node-interactive flex h-full flex-col gap-1 bg-accent-strong px-4 py-3 text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                    >
                      <span className="text-sm font-bold capitalize">
                        {topic.replace(/-/g, ' ')}
                      </span>
                      <span className="text-xs opacity-80">
                        {set.length} {set.length === 1 ? 'problem' : 'problems'}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold">Every problem</h2>
            <ProblemTable problems={all} />
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
