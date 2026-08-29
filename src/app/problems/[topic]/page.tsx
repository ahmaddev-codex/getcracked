import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { RecommendationBanner } from '@/components/problem/RecommendationBanner';
import { findLesson, getProblemSet, getTopics } from '@/content/registry';
import { exerciseId } from '@/content/schema';

/**
 * One problem set (B15, B17).
 *
 * Ordered warm-up → core → stretch, so the problem straight after a lesson is
 * deliberately gentle. Fully enterable regardless of what has been read; the
 * only thing prerequisites produce is the banner (B16).
 */

interface TopicRouteProps {
  params: Promise<{ topic: string }>;
}

export function generateStaticParams() {
  return getTopics().map((topic) => ({ topic }));
}

export async function generateMetadata(props: TopicRouteProps) {
  const { topic } = await props.params;
  return { title: `${topic} problems — GetCracked` };
}

export default async function ProblemSetPage(props: TopicRouteProps) {
  const { topic } = await props.params;
  const set = getProblemSet(topic);
  if (set.length === 0) notFound();

  // Prerequisites are the union across the set, so the banner reflects the
  // topic rather than whichever problem happens to be first.
  const recommendedAfter = [...new Set(set.flatMap((p) => p.recommendedAfter))];
  const lessonExerciseIds = Object.fromEntries(
    recommendedAfter.map((slug) => {
      const lesson = findLesson(slug);
      return [slug, lesson ? lesson.exercises.map((e) => exerciseId(lesson, e.slug)) : []];
    }),
  );

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs text-foreground-muted">
          <Link href="/problems" className="text-link underline underline-offset-2">
            Problems
          </Link>
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{topic}</h1>
        <p className="text-sm text-foreground-muted">
          {set.length} {set.length === 1 ? 'problem' : 'problems'}, warm-up first.
        </p>
      </header>

      {recommendedAfter.length > 0 && (
        <RecommendationBanner
          recommendedAfter={recommendedAfter}
          lessonExerciseIds={lessonExerciseIds}
        />
      )}

      <ul className="flex flex-col gap-3">
        {set.map((problem) => (
          <li key={problem.slug}>
            <Link href={`/problems/${problem.topic}/${problem.slug}`} className="block">
              <Card title={problem.title}>
                <p className="text-foreground-muted">{problem.difficulty}</p>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
