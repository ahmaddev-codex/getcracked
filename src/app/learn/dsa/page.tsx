import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { getLessons } from '@/content/registry';

/**
 * The DSA Learn surface (B9).
 *
 * Lists lessons in curriculum order. Order is a recommendation, not a gate —
 * every lesson links straight through regardless of what came before (B14).
 */
export const metadata = {
  title: 'Learn DSA — GetCracked',
  description:
    'Animated, structured lessons on data structures and algorithms. Free, no account needed.',
};

export default function LearnDsaPage() {
  const lessons = getLessons();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">Learn DSA</h1>
        <p className="text-sm text-foreground-muted">
          Topics in the order they build on each other. You can read any of them in any
          order — the sequence is a suggestion, not a gate.
        </p>
      </header>

      <ol className="flex flex-col gap-3">
        {lessons.map((lesson, i) => (
          <li key={lesson.slug}>
            <Link
              href={`/learn/dsa/${lesson.slug}`}
              className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              <Card title={`${i + 1}. ${lesson.title}`}>
                <p className="text-foreground-muted">{lesson.summary}</p>
                {lesson.recommendedAfter.length > 0 && (
                  <p className="mt-2 text-xs text-foreground-muted">
                    Reads best after {lesson.recommendedAfter.join(', ')}
                  </p>
                )}
              </Card>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
