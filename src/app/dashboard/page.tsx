import Link from 'next/link';
import { Suspense } from 'react';
import { Card } from '@/components/ui/Card';
import { Node } from '@/components/ui/Node';
import { EmptyState } from '@/components/ui/EmptyState';
import { Filters } from '@/components/dashboard/Filters';
import { DIFFICULTIES, catalogCounts, filterProblems } from '@/lib/catalog';
import { getTopics } from '@/content/registry';

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

interface DashboardProps {
  searchParams: Promise<{ difficulty?: string; topic?: string }>;
}

export default async function DashboardPage({ searchParams }: DashboardProps) {
  const filter = await searchParams;
  const problems = filterProblems(filter);
  const counts = catalogCounts();
  const topics = getTopics();

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-foreground-muted">
          Three tiers: read a topic, practise it, then build the thing itself.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/learn/dsa">
          <Card title="Learn">
            <p className="text-foreground-muted">
              {counts.lessons} {counts.lessons === 1 ? 'lesson' : 'lessons'}
            </p>
          </Card>
        </Link>
        <Link href="/problems">
          <Card title="Practise">
            <p className="text-foreground-muted">
              {counts.problems} {counts.problems === 1 ? 'problem' : 'problems'}
            </p>
          </Card>
        </Link>
        <Node tone="muted" className="p-4">
          <h3 className="mb-1 text-sm font-semibold">Build</h3>
          <p className="text-sm text-foreground-muted">Multi-step challenges, coming later.</p>
        </Node>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold">All problems</h2>

        <Suspense fallback={<p className="text-sm text-foreground-muted">Loading filters…</p>}>
          <Filters difficulties={DIFFICULTIES} topics={topics} />
        </Suspense>

        {problems.length === 0 ? (
          <EmptyState title="No problems match those filters">
            Try widening the difficulty range, or clearing the topic filter.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {problems.map((problem) => (
              <li key={`${problem.topic}/${problem.slug}`}>
                <Link href={`/problems/${problem.topic}/${problem.slug}`} className="block">
                  <Card title={problem.title}>
                    <p className="text-foreground-muted">
                      {problem.topic} · {problem.difficulty}
                    </p>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
