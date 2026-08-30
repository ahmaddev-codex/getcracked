import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Node } from '@/components/ui/Node';
import { ProblemTable } from '@/components/problem/ProblemTable';
import { RecommendationBanner } from '@/components/problem/RecommendationBanner';
import { findLesson, getProblemSet, getTopics } from '@/content/registry';
import { exerciseId } from '@/content/schema';

/**
 * One problem set (B15, B17).
 *
 * Ordered easy → medium → hard, so the problem straight after a lesson is
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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/* The same masthead every other surface uses — this was the last page
          still wearing the pre-design-system heading. */}
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <p className="text-xs text-foreground-muted">
          <Link href="/problems" className="text-link underline underline-offset-2">
            ← Problems
          </Link>
        </p>
        <h1 className="font-sans text-4xl font-bold capitalize tracking-tight sm:text-5xl">
          {topic.replace(/-/g, ' ')}
        </h1>
        <p className="text-sm text-foreground-muted">
          {set.length} {set.length === 1 ? 'problem' : 'problems'}, easiest first. Every one is
          open — nothing here is locked behind the others.
        </p>
      </header>

      {recommendedAfter.length > 0 && (
        <RecommendationBanner
          recommendedAfter={recommendedAfter}
          lessonExerciseIds={lessonExerciseIds}
        />
      )}

      <ProblemTable problems={set} />

      <Node tone="muted" className="p-4 text-sm text-foreground-muted">
        Stuck on the pattern rather than the problem? The{' '}
        <Link
          href={`/learn/dsa/${topic}`}
          className="text-link underline underline-offset-2"
        >
          {topic.replace(/-/g, ' ')} lesson
        </Link>{' '}
        walks through it with an animation you can step through.
      </Node>
    </main>
  );
}
