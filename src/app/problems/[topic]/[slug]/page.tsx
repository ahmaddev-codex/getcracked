import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { Node } from '@/components/ui/Node';
import { Markdown } from '@/components/Markdown';
import { Hints } from '@/components/problem/Hints';
import { RecommendationBanner } from '@/components/problem/RecommendationBanner';
import { Workspace } from '@/components/problem/Workspace';
import { findLesson, findProblem, getProblems, getSetPosition } from '@/content/registry';
import { exerciseId } from '@/content/schema';

/**
 * A practice problem (B15).
 *
 * **Public.** Content is not gated (PRD §2.6) — a signed-out learner reads and,
 * from T1.3, solves this without an account.
 *
 * Read-only for now: the editor and test runner arrive in T1.3.
 */

export function generateStaticParams() {
  // Content is repo-authored (AD-1), so every problem is known at build time and
  // renders statically — which is also what makes the catalog indexable.
  return getProblems().map((p) => ({ topic: p.topic, slug: p.slug }));
}

/**
 * Params are typed explicitly rather than via `PageProps<'/route'>`.
 *
 * That helper resolves against a generated route union, so a brand-new route
 * fails to typecheck until the generator has seen it — a needless ordering
 * dependency for two strings.
 */
interface ProblemRouteProps {
  params: Promise<{ topic: string; slug: string }>;
}

export async function generateMetadata(props: ProblemRouteProps) {
  const { topic, slug } = await props.params;
  const problem = findProblem(topic, slug);
  if (!problem) return { title: 'Problem not found' };

  return {
    title: `${problem.title} — GetCracked`,
    description: `Practice ${problem.title}, a ${problem.difficulty} ${problem.topic} problem.`,
  };
}

export default async function ProblemPage(props: ProblemRouteProps) {
  const { topic, slug } = await props.params;
  const problem = findProblem(topic, slug);

  // An unknown slug is a missing page, not a crash.
  if (!problem) notFound();

  const { index, total, previous, next } = getSetPosition(problem);
  const id = exerciseId(problem);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-3">
        <p className="text-xs text-foreground-muted">
          <Link href={`/problems/${problem.topic}`} className="text-link underline underline-offset-2">
            {problem.topic}
          </Link>
          {' · '}
          Problem {index + 1} of {total}
        </p>

        <h1 className="font-sans text-2xl font-semibold tracking-tight">{problem.title}</h1>

        <div className="flex flex-wrap items-center gap-2">
          <Badge state="not-started">{problem.difficulty}</Badge>
          {problem.companies.map((company) => (
            <Node key={company} tone="surface" className="px-2 py-0.5 text-xs">
              {company}
            </Node>
          ))}
        </div>
      </header>

      {problem.recommendedAfter.length > 0 && (
        <RecommendationBanner
          recommendedAfter={problem.recommendedAfter}
          lessonExerciseIds={Object.fromEntries(
            problem.recommendedAfter.map((slug) => {
              const lesson = findLesson(slug);
              return [slug, lesson ? lesson.exercises.map((e) => exerciseId(lesson, e.slug)) : []];
            }),
          )}
        />
      )}

      <Markdown>{problem.brief}</Markdown>

      <Workspace
        exerciseId={id}
        language="javascript"
        starterCode={problem.starterCode.javascript ?? ''}
        starterByLanguage={problem.starterCode}
        spec={problem.testSpec}
        complexity={problem.complexity}
      />

      <Hints exerciseId={id} hints={problem.hints} />

      <nav className="flex justify-between gap-3 border-t border-border-subtle pt-4 text-sm">
        {previous ? (
          <Link
            href={`/problems/${previous.topic}/${previous.slug}`}
            className="text-link underline underline-offset-2"
          >
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link
            href={`/problems/${next.topic}/${next.slug}`}
            className="text-link underline underline-offset-2"
          >
            {next.title} →
          </Link>
        )}
      </nav>
    </main>
  );
}
