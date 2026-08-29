import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Markdown } from '@/components/Markdown';
import { LessonSection } from '@/components/learn/LessonSection';
import { Node } from '@/components/ui/Node';
import { findLesson, getLessons, getLessonPosition, getProblemSet } from '@/content/registry';
import { exerciseId } from '@/content/schema';
import { GuidedExercises } from '@/components/learn/GuidedExercises';
import { Walkthrough } from '@/components/learn/Walkthrough';

/**
 * One lesson (B10), rendering the five sections in a fixed order so a learner
 * who has read one knows where to look in the next.
 *
 * Public and statically prerendered. Nothing here consults progress: a lesson is
 * readable in any order, having completed nothing (B14).
 */

interface LessonRouteProps {
  params: Promise<{ topic: string }>;
}

export function generateStaticParams() {
  return getLessons().map((l) => ({ topic: l.slug }));
}

export async function generateMetadata(props: LessonRouteProps) {
  const { topic } = await props.params;
  const lesson = findLesson(topic);
  if (!lesson) return { title: 'Lesson not found' };
  return { title: `${lesson.title} — GetCracked`, description: lesson.summary };
}

export default async function LessonPage(props: LessonRouteProps) {
  const { topic } = await props.params;
  const lesson = findLesson(topic);
  if (!lesson) notFound();

  const { index, total, previous, next } = getLessonPosition(lesson);
  const problems = getProblemSet(lesson.slug);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs text-foreground-muted">
          <Link href="/learn/dsa" className="text-link underline underline-offset-2">
            Learn DSA
          </Link>
          {` · Lesson ${index + 1} of ${total}`}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{lesson.title}</h1>
        <p className="text-sm text-foreground-muted">{lesson.summary}</p>
      </header>

      {/* (a) */}
      <LessonSection title="The idea">
        <Markdown>{lesson.explainer}</Markdown>
      </LessonSection>

      {/* (b) The trace-driven walkthrough (B10b), filled by T2.8. */}
      <LessonSection title="Walkthrough">
        {lesson.walkthrough ? (
          <Walkthrough
            entry={lesson.walkthrough.entry}
            entryByLanguage={lesson.walkthrough.entryByLanguage}
            sourceByLanguage={lesson.walkthrough.source}
            args={lesson.walkthrough.args}
            caption={lesson.walkthrough.caption}
            visual={lesson.walkthrough.visual}
            title={lesson.title}
          />
        ) : (
          <Node tone="muted" className="p-4 text-sm text-foreground-muted">
            No walkthrough for this topic yet — the guided exercises below run the same way.
          </Node>
        )}
      </LessonSection>

      {/* (c) */}
      {lesson.complexity && (
        <LessonSection title="What it costs">
          <Node tone="strong" className="p-3">
            <dl className="flex flex-wrap gap-x-8 gap-y-2">
              <div className="flex flex-col">
                <dt className="text-xs">time</dt>
                <dd className="font-mono text-sm">{lesson.complexity.time}</dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-xs">space</dt>
                <dd className="font-mono text-sm">{lesson.complexity.space}</dd>
              </div>
            </dl>
            {lesson.complexity.note && (
              <p className="mt-2 text-xs">{lesson.complexity.note}</p>
            )}
          </Node>
        </LessonSection>
      )}

      {/* (d) */}
      {lesson.patternCues.length > 0 && (
        <LessonSection title="How to spot it">
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {lesson.patternCues.map((cue, i) => (
              <li key={i}>{cue}</li>
            ))}
          </ul>
        </LessonSection>
      )}

      {/* (e) */}
      {lesson.pitfalls.length > 0 && (
        <LessonSection title="Where it goes wrong">
          <div className="flex flex-col gap-2">
            {lesson.pitfalls.map((pitfall, i) => (
              <Node key={i} tone="muted" className="p-3">
                <p className="text-sm font-semibold">{pitfall.title}</p>
                <p className="mt-1 text-sm">{pitfall.body}</p>
              </Node>
            ))}
          </div>
        </LessonSection>
      )}

      {/* (B11) Guided checks, using the same runner a problem does. */}
      <GuidedExercises
        lessonSlug={lesson.slug}
        exercises={lesson.exercises}
        exerciseIds={lesson.exercises.map((e) => exerciseId(lesson, e.slug))}
      />

      {/* B13: the handoff into practice. Open regardless of progress. */}
      {problems.length > 0 && (
        <LessonSection title="Practise it">
          <ul className="flex flex-col gap-2">
            {problems.map((problem) => (
              <li key={problem.slug}>
                <Link
                  href={`/problems/${problem.topic}/${problem.slug}`}
                  className="text-link underline underline-offset-2"
                >
                  {problem.title}
                </Link>
                <span className="ml-2 text-xs text-foreground-muted">{problem.difficulty}</span>
              </li>
            ))}
          </ul>
        </LessonSection>
      )}

      <nav className="flex justify-between gap-3 border-t border-border-subtle pt-4 text-sm">
        {previous ? (
          <Link href={`/learn/dsa/${previous.slug}`} className="text-link underline underline-offset-2">
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`/learn/dsa/${next.slug}`} className="text-link underline underline-offset-2">
            {next.title} →
          </Link>
        )}
      </nav>
    </main>
  );
}
