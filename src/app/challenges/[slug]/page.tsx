import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Node } from '@/components/ui/Node';
import { Markdown } from '@/components/Markdown';
import { StepList } from '@/components/challenge/StepList';
import { findChallenge, findLesson, getChallenges, getProblemSet } from '@/content/registry';
import {
  challengeLanguages,
  fileNameFor,
  resolveStepFiles,
  stepId,
} from '@/content/challenge';
import { Page } from '@/components/ui/Page';

/**
 * A build challenge's overview.
 *
 * A page rather than a redirect to step 1. A learner deciding whether to spend
 * an hour on this wants to know what they will have at the end, what files they
 * will be writing, and what it assumes — and none of that fits in a step brief
 * without burying the step.
 *
 * **Public** (§2.6). Progress is rendered by a client component.
 */

export function generateStaticParams() {
  return getChallenges().map((c) => ({ slug: c.slug }));
}

interface ChallengeRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: ChallengeRouteProps) {
  const { slug } = await props.params;
  const challenge = findChallenge(slug);
  if (!challenge) return { title: 'Challenge not found' };

  return {
    title: `${challenge.title} — GetCracked`,
    description: `${challenge.summary} A ${challenge.steps.length}-step build in Python and JavaScript.`,
  };
}

export default async function ChallengePage(props: ChallengeRouteProps) {
  const { slug } = await props.params;
  const challenge = findChallenge(slug);
  if (!challenge) notFound();

  const languages = challengeLanguages(challenge);
  const primary = languages[0] ?? 'javascript';

  // The files as they stand at the last step — the finished workspace, which is
  // what "what will I be writing" actually means.
  const finalFiles = resolveStepFiles(challenge, challenge.steps.length - 1, primary);

  const steps = challenge.steps.map((step) => ({
    slug: step.slug,
    title: step.title,
    id: stepId(challenge, step),
  }));

  const lessons = challenge.topics
    .map((topic) => findLesson(topic))
    .filter((l) => l !== undefined);

  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-3 bg-surface p-6">
        <p className="text-xs text-foreground-muted">
          <Link href="/challenges" className="text-link underline underline-offset-2">
            Build challenges
          </Link>
          {' · '}
          {challenge.steps.length} steps · {languages.join(' · ')}
        </p>

        <h1 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">
          {challenge.title}
        </h1>
        <p className="max-w-2xl text-sm text-foreground-muted">{challenge.summary}</p>
      </header>

      <Markdown>{challenge.brief}</Markdown>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">The workspace</h2>
        <p className="text-sm text-foreground-muted">
          These files carry across every step. What you write in one step is what you
          start the next with.
        </p>
        <ul className="flex flex-wrap gap-2">
          {finalFiles.map((file) => (
            <li key={file.name}>
              <Node
                tone={file.editable ? 'surface' : 'muted'}
                className="px-3 py-1.5 font-mono text-xs"
              >
                {fileNameFor(file.name, primary)}
                {!file.editable && (
                  <span className="ml-1.5 font-sans text-foreground-muted">read-only</span>
                )}
              </Node>
            </li>
          ))}
        </ul>
      </section>

      <StepList challengeSlug={challenge.slug} steps={steps} />

      <Node tone="muted" className="flex flex-col gap-2 p-4 text-sm text-foreground-muted">
        <p>
          <strong className="font-semibold text-foreground">Start anywhere.</strong> Open
          step 3 first and you are handed the reference build of steps 1 and 2, so every
          step stands on its own. Nothing here is locked behind anything else.
        </p>
        {lessons.length > 0 && (
          <p>
            This build applies{' '}
            {lessons.map((lesson, i) => (
              <span key={lesson.slug}>
                {i > 0 && (i === lessons.length - 1 ? ' and ' : ', ')}
                <Link
                  href={
                    lesson.track === 'system-design'
                      ? `/learn/system-design/${lesson.slug}`
                      : `/learn/dsa/${lesson.slug}`
                  }
                  className="text-link underline underline-offset-2"
                >
                  {lesson.title}
                </Link>
              </span>
            ))}
            . Read the lesson first if it is unfamiliar — a recommendation, not a
            prerequisite.
          </p>
        )}
      </Node>

      {/* The other direction of B20: from the build back to the shorter practice
          that drills the same pattern. */}
      {challenge.topics.some((topic) => getProblemSet(topic).length > 0) && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Shorter practice on the same ideas</h2>
          <ul className="flex flex-wrap gap-2">
            {challenge.topics
              .filter((topic) => getProblemSet(topic).length > 0)
              .map((topic) => (
                <li key={topic}>
                  <Link
                    href={`/problems/${topic}`}
                    className="node-surface node-interactive block bg-surface px-3 py-1.5 text-xs capitalize focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                  >
                    {topic.replace(/-/g, ' ')} · {getProblemSet(topic).length} problems
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}

      <nav className="border-t border-border-subtle pt-4">
        <Link
          href={`/challenges/${challenge.slug}/${challenge.steps[0].slug}`}
          className="node-surface node-interactive node-pressable inline-block bg-accent-strong px-4 py-2 text-sm font-bold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          Start with step 1 →
        </Link>
        <p className="mt-2 text-xs text-foreground-muted">
          Each step is recorded on its own, so an evening that gets you through two of
          them counts as two.
        </p>
      </nav>
    </Page>
  );
}
