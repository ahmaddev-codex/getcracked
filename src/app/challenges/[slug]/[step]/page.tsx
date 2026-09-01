import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Markdown } from '@/components/Markdown';
import { Node } from '@/components/ui/Node';
import { Hints } from '@/components/problem/Hints';
import { ChallengeWorkspace } from '@/components/challenge/ChallengeWorkspace';
import { StepList } from '@/components/challenge/StepList';
import { findChallenge, getChallenges } from '@/content/registry';
import {
  challengeLanguages,
  entryFileFor,
  focusFileFor,
  resolveStepFiles,
  stepId,
  type ResolvedFile,
} from '@/content/challenge';
import { exerciseId, type Language } from '@/content/schema';
import { pageClasses } from '@/components/ui/Page';
import { EngineeringStackBreadcrumb } from '@/components/content/EngineeringStackBreadcrumb';

/**
 * One step of a build challenge (PRD §2.2, `/challenges/{slug}/{step}`).
 *
 * **Public.** Content is not gated (§2.6) — a signed-out learner writes and runs
 * every file here.
 *
 * The workspace is resolved on the server, once per language, and handed to the
 * client as plain data. Resolution walks the whole challenge backwards
 * (`resolveStepFiles`), so doing it here rather than in the browser keeps the
 * other steps' code out of the bundle and keeps one implementation of "what does
 * this step start from" — the same one the content gate verifies.
 */

export function generateStaticParams() {
  // Content is repo-authored (AD-1), so every step is known at build time and
  // renders statically — which is also what makes builds indexable.
  return getChallenges().flatMap((c) =>
    c.steps.map((s) => ({ slug: c.slug, step: s.slug })),
  );
}

interface StepRouteProps {
  params: Promise<{ slug: string; step: string }>;
}

export async function generateMetadata(props: StepRouteProps) {
  const { slug, step } = await props.params;
  const challenge = findChallenge(slug);
  const found = challenge?.steps.find((s) => s.slug === step);
  if (!challenge || !found) return { title: 'Step not found' };

  const index = challenge.steps.findIndex((s) => s.slug === step);
  return {
    title: `${found.title} — ${challenge.title} — GetCracked`,
    description: `Step ${index + 1} of ${challenge.steps.length} building ${challenge.title}.`,
  };
}

export default async function ChallengeStepPage(props: StepRouteProps) {
  const { slug, step: stepSlug } = await props.params;
  const challenge = findChallenge(slug);
  if (!challenge) notFound();

  const index = challenge.steps.findIndex((s) => s.slug === stepSlug);
  // An unknown step is a missing page, not a crash.
  if (index === -1) notFound();

  const step = challenge.steps[index];
  const languages = challengeLanguages(challenge);
  const id = stepId(challenge, step);

  const filesByLanguage: Partial<Record<Language, ResolvedFile[]>> = {};
  for (const language of languages) {
    filesByLanguage[language] = resolveStepFiles(challenge, index, language);
  }

  const steps = challenge.steps.map((s) => ({
    slug: s.slug,
    title: s.title,
    id: stepId(challenge, s),
  }));

  const previous = index > 0 ? challenge.steps[index - 1] : undefined;
  const next = index < challenge.steps.length - 1 ? challenge.steps[index + 1] : undefined;

  /*
   * Canvas, like the roadmaps — this is the other page type that holds a second
   * column. `pageClasses` rather than `<Page>` because the sidebar sits beside
   * the content rather than under it, which is a layout change *to* the rail
   * rather than an opt-out of it.
   */
  return (
    <main className={pageClasses('canvas', 'lg:flex-row')}>
      {/*
        A persistent step sidebar (PRD §2.2). On a build, "where am I and what is
        left" is a question a learner asks constantly, and answering it in the
        page body would mean scrolling past the editor to find out.
      */}
      <aside className="flex shrink-0 flex-col gap-3 lg:w-56">
        <Link
          href={`/challenges/${challenge.slug}`}
          className="text-xs text-link underline underline-offset-2"
        >
          ← {challenge.title}
        </Link>
        <StepList
          compact
          challengeSlug={challenge.slug}
          steps={steps}
          currentSlug={step.slug}
        />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-6">
        <EngineeringStackBreadcrumb tier="challenge" slug={challenge.slug} />

        <header className="flex flex-col gap-2">
          <p className="text-xs text-foreground-muted">
            Step {index + 1} of {challenge.steps.length}
          </p>
          <h1 className="font-sans text-2xl font-semibold tracking-tight">{step.title}</h1>
        </header>

        {index > 0 && (
          <Node tone="muted" className="p-3 text-xs text-foreground-muted">
            You start from the build so far — your own work where you have written it, the
            reference build where you have not. Either way this step stands on its own.
          </Node>
        )}

        <Markdown>{step.brief}</Markdown>

        <ChallengeWorkspace
          // Keyed by the step, so moving between steps is a remount rather than
          // a component reconciling a new workspace into the last step's state.
          key={id}
          challengeId={exerciseId(challenge)}
          stepId={id}
          stepIds={steps.map((s) => s.id)}
          challengeSlug={challenge.slug}
          filesByLanguage={filesByLanguage}
          initialLanguage={languages[0] ?? 'javascript'}
          entryFile={entryFileFor(step)}
          focusFile={focusFileFor(challenge, index)}
          spec={step.testSpec}
          complexity={step.complexity}
        />

        <Hints exerciseId={id} hints={step.hints} />

        <nav className="flex justify-between gap-3 border-t border-border-subtle pt-4 text-sm">
          {previous ? (
            <Link
              href={`/challenges/${challenge.slug}/${previous.slug}`}
              className="text-link underline underline-offset-2"
            >
              ← {previous.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              href={`/challenges/${challenge.slug}/${next.slug}`}
              className="text-link underline underline-offset-2"
            >
              {next.title} →
            </Link>
          ) : (
            <Link
              href={`/challenges/${challenge.slug}`}
              className="text-link underline underline-offset-2"
            >
              Back to the overview →
            </Link>
          )}
        </nav>
      </div>
    </main>
  );
}
