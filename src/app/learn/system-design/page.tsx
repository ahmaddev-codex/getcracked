import Link from 'next/link';
import { ConceptMap } from '@/components/learn/ConceptMap';
import { Markdown } from '@/components/Markdown';
import { Roadmap } from '@/components/learn/Roadmap';
import { conceptCount, getConceptCategories } from '@/content/concepts';
import { getTrack } from '@/content/registry';

/**
 * The System Design track (I5), structured exactly like the DSA one: a path of
 * lessons with the concept reference beneath it.
 *
 * The concept map stays on this URL rather than moving to its own. Its entries
 * are deep-linkable by anchor (A14) and are one of the platform's strongest
 * organic acquisition surfaces — relocating them would break every one of those
 * links to gain nothing.
 *
 * These lessons carry no walkthrough and no guided exercises, because there is
 * no code to run. `deriveLessonState` already reports a lesson with no exercises
 * as `not_started` rather than silently counting it complete (B12), so the
 * absence is handled honestly rather than inflating the roadmap.
 */
export const metadata = {
  title: 'System Design — GetCracked',
  description:
    'A path through system design: scaling, caching, databases, consistency, queues and more — plus a reference map of every concept. Free, no account needed.',
};

export default function SystemDesignPage() {
  const categories = getConceptCategories();
  const lessons = getTrack('system-design');

  const topics = lessons.map((lesson) => ({
    lesson,
    // System Design has no runnable problem sets yet, so nothing branches off
    // the spine. The renderer draws a bare path, which is the honest picture.
    problems: [],
    cues:
      lesson.patternCues.length > 0 ? (
        <ul className="flex list-disc flex-col gap-1 pl-4 text-sm text-foreground-muted">
          {lesson.patternCues.slice(0, 4).map((cue) => (
            <li key={cue}>
              <Markdown>{cue}</Markdown>
            </li>
          ))}
        </ul>
      ) : null,
  }));

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <p className="text-xs text-foreground-muted">
          <Link href="/learn" className="text-link underline underline-offset-2">
            ← Learn
          </Link>
        </p>
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">
          System Design
        </h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          {lessons.length} topics, ordered from the decisions every system makes to the ones
          only large ones do. Nothing is locked — the order is a suggestion, so start anywhere.
        </p>
      </header>

      <Roadmap topics={topics} />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-2xl font-bold tracking-tight">Concept reference</h2>
          <p className="text-sm text-foreground-muted">
            {conceptCount()} concepts across {categories.length} areas. Definitions, not essays
            — each one links to itself, so you can send someone straight to a term.
          </p>
        </div>
        <ConceptMap categories={categories} />
      </section>
    </main>
  );
}
