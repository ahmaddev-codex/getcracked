import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { getLessons } from '@/content/registry';
import { conceptCount } from '@/content/concepts';

/**
 * The Learn hub (§2.1a).
 *
 * `/learn` used to be the System Design concept map alone. It now covers both
 * tracks, with the map at `/learn/system-design`.
 */
export const metadata = {
  title: 'Learn — GetCracked',
  description: 'Animated DSA lessons and a System Design concept map. Free, no account needed.',
};

export default function LearnHubPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Learn</h1>
        <p className="text-sm text-foreground-muted">
          Two tracks. Read either in any order — nothing here is locked.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/learn/dsa">
          <Card title="DSA">
            <p className="text-foreground-muted">
              {getLessons().length} lessons, each with guided exercises and practice problems.
            </p>
          </Card>
        </Link>
        <Link href="/learn/system-design">
          <Card title="System Design">
            <p className="text-foreground-muted">
              {conceptCount()} concepts — what each term means and why it matters.
            </p>
          </Card>
        </Link>
      </div>
    </main>
  );
}
