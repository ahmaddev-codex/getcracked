import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { getProblemSet, getTopics } from '@/content/registry';

/**
 * The Problems surface (B15).
 *
 * Sets are listed in curriculum order, every one of them enterable. Nothing
 * here reads progress — a set cannot be locked because there is no state to
 * lock it against (§6.6).
 */
export const metadata = {
  title: 'Practice problems — GetCracked',
  description: 'Interview-style practice problems, grouped by topic. Free, no account needed.',
};

export default function ProblemsPage() {
  const topics = getTopics();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="font-sans text-2xl font-semibold tracking-tight">Problems</h1>
        <p className="text-sm text-foreground-muted">
          One set per topic, ordered warm-up first. Every set is open — if you already
          know a topic, start there.
        </p>
      </header>

      {topics.length === 0 ? (
        <EmptyState title="No problems yet">The catalog is still being written.</EmptyState>
      ) : (
        <ul className="flex flex-col gap-3">
          {topics.map((topic) => {
            const set = getProblemSet(topic);
            return (
              <li key={topic}>
                <Link href={`/problems/${topic}`} className="block">
                  <Card title={topic}>
                    <p className="text-foreground-muted">
                      {set.length} {set.length === 1 ? 'problem' : 'problems'}
                    </p>
                  </Card>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
