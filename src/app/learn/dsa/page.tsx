import { Roadmap } from '@/components/learn/Roadmap';
import { Markdown } from '@/components/Markdown';
import { getTrack, getProblemSet } from '@/content/registry';

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
  // The DSA surface is the two code tracks. System Design is its own roadmap at
  // /learn/system-design — one page holding all three would be a scroll rather
  // than a path.
  const lessons = [...getTrack('data-structures'), ...getTrack('algorithms')];

  const topics = lessons.map((lesson) => ({
    lesson,
    problems: getProblemSet(lesson.slug),
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
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Learn DSA</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          The path runs top to bottom, and practice for each topic branches off it. Nothing is
          locked — the order is a suggestion, so start anywhere.
        </p>
      </header>

      <Roadmap topics={topics} />
    </main>
  );
}
