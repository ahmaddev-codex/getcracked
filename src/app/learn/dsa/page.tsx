import { Roadmap } from '@/components/learn/Roadmap';
import { Markdown } from '@/components/Markdown';
import { getChallengesForTopic, getTrack, getProblemSet } from '@/content/registry';
import { Page } from '@/components/ui/Page';

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
    // The node's third tier (I4). Authored on the challenge rather than
    // inferred from the slug, so a build appears against a topic because it
    // genuinely applies it.
    challenges: getChallengesForTopic(lesson.slug),
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
    <Page width="canvas">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Learn DSA</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          The path runs top to bottom, and practice for each topic branches off it. Nothing is
          locked — the order is a suggestion, so start anywhere.
        </p>
      </header>

      <Roadmap topics={topics} />
    </Page>
  );
}
