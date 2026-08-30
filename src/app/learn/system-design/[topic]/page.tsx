import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Markdown } from '@/components/Markdown';
import { LessonSection } from '@/components/learn/LessonSection';
import { Node } from '@/components/ui/Node';
import { findLesson, getLessons, getLessonPosition, getProblemSet } from '@/content/registry';
import { trackIndex } from '@/components/learn/difficulty';
import { findConcept } from '@/content/concepts';
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
  // System Design only, for the same reason the DSA route excludes it.
  return getLessons()
    .filter((l) => l.track === 'system-design')
    .map((l) => ({ topic: l.slug }));
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
  if (!lesson || !(lesson.track === 'system-design')) notFound();

  const { index, total, previous, next } = getLessonPosition(lesson);
  const problems = getProblemSet(lesson.slug);
  const lessonConcepts = lesson.concepts
    .map((slug) => findConcept(slug))
    .filter((c): c is NonNullable<typeof c> => Boolean(c));
  const trackLink = trackIndex(lesson.track);
  const base = trackLink.href;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8 sm:px-6">
      {/*
        The title sits in a card rather than floating on the page ground, which
        is what gives a lesson a masthead the eye can land on — the reference
        does the same, and the breadcrumb belongs inside it rather than above.
      */}
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <p className="text-xs text-foreground-muted">
          <Link href={base} className="text-link underline underline-offset-2">
            ← {trackLink.label}
          </Link>
          {` · Lesson ${index + 1} of ${total}`}
        </p>
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">{lesson.title}</h1>
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

      {/*
        (f) Why this one, and not the obvious alternative.

        Placed straight after the cost, because the cost is the argument: a heap
        is worth reaching for precisely when O(log n) insertion beats re-sorting,
        and the comparison lands hardest while those figures are still on screen.
      */}
      {lesson.whenToUse && (
        <LessonSection title="When to reach for it">
          <ul className="flex list-disc flex-col gap-1 pl-5 text-sm">
            {lesson.whenToUse.reachFor.map((reason, i) => (
              <li key={i}>{reason}</li>
            ))}
          </ul>

          {lesson.whenToUse.insteadOf.length > 0 && (
            <div className="mt-3 flex flex-col gap-2">
              <p className="text-xs font-semibold text-foreground-muted">
                Rather than the obvious alternative
              </p>
              {lesson.whenToUse.insteadOf.map((swap, i) => (
                <Node key={i} tone="muted" className="p-3 text-sm">
                  <p className="font-semibold">{swap.alternative}</p>
                  <p className="mt-0.5 text-foreground-muted">{swap.why}</p>
                </Node>
              ))}
            </div>
          )}
        </LessonSection>
      )}

      {/* Vocabulary this lesson covers, merged from the concept reference. */}
      {lessonConcepts.length > 0 && (
        <LessonSection title="Key terms">
          <dl className="flex flex-col gap-3 text-sm">
            {lessonConcepts.map((concept) => (
              <div key={concept.slug}>
                <dt className="font-semibold">
                  <Link
                    href={`/learn/system-design#${concept.slug}`}
                    className="text-link underline underline-offset-2"
                  >
                    {concept.term}
                  </Link>
                </dt>
                <dd className="text-foreground-muted">{concept.definition}</dd>
              </div>
            ))}
          </dl>
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
          <Link href={`${base}/${previous.slug}`} className="text-link underline underline-offset-2">
            ← {previous.title}
          </Link>
        ) : (
          <span />
        )}
        {next && (
          <Link href={`${base}/${next.slug}`} className="text-link underline underline-offset-2">
            {next.title} →
          </Link>
        )}
      </nav>
    </main>
  );
}
