'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { SignInToTrack } from '@/components/account/SignInToTrack';
import { useSolved } from '@/lib/use-solved';

/**
 * A build's steps, with what has been finished (per-step progress, I4's third
 * state).
 *
 * Every step is a link. Nothing here consults whether the previous one is done
 * — steps are independently solvable by construction, since an unfinished step
 * hands over the author's build of everything before it (see
 * content/challenge.ts), and locking step 3 behind step 2 would contradict
 * §6.6 for no gain.
 *
 * A tick means the step was *submitted passing*, which is a claim about work
 * done. It is deliberately not "you have read this".
 */
export interface StepSummary {
  slug: string;
  title: string;
  /** `challenges/{slug}/{step}` — how progress addresses it. */
  id: string;
}

export function StepList({
  challengeSlug,
  steps,
  currentSlug,
  compact = false,
}: {
  challengeSlug: string;
  steps: readonly StepSummary[];
  /** The step being worked on, so the sidebar marks where the learner is. */
  currentSlug?: string;
  /** Sidebar rendering: tighter, no heading, no sign-in nudge. */
  compact?: boolean;
}) {
  const solved = useSolved();
  const done = steps.filter((s) => solved.has(s.id)).length;

  return (
    <div className="flex flex-col gap-2">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-sm font-semibold">
            Steps{' '}
            <span className="font-normal text-foreground-muted" aria-live="polite">
              · {done} of {steps.length} done
            </span>
          </h2>
          <SignInToTrack what="step progress" />
        </div>
      )}

      <ol className="flex flex-col gap-2">
        {steps.map((step, i) => {
          const isDone = solved.has(step.id);
          const isCurrent = step.slug === currentSlug;

          return (
            <li key={step.slug}>
              <Link
                href={`/challenges/${challengeSlug}/${step.slug}`}
                aria-current={isCurrent ? 'step' : undefined}
                className={`node-surface node-interactive flex items-center gap-3 px-3 py-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
                  isCurrent ? 'bg-accent-strong text-accent-foreground' : 'bg-surface'
                }`}
              >
                <span
                  aria-hidden
                  className="grid h-5 w-5 shrink-0 place-items-center rounded-node border-2 border-current text-xs font-bold"
                >
                  {isDone ? <Check size={11} strokeWidth={3} /> : i + 1}
                </span>
                <span className={`text-sm ${isCurrent ? 'font-semibold' : ''}`}>
                  {step.title}
                </span>
                {isDone && (
                  <span className="sr-only">Done</span>
                )}
              </Link>
            </li>
          );
        })}
      </ol>

      {!compact && done === steps.length && steps.length > 0 && (
        <Node tone="strong" className="p-3 text-sm">
          Every step passes. You built the whole thing.
        </Node>
      )}
    </div>
  );
}

/**
 * How far through a build a learner is, for a catalog card.
 *
 * Reports nothing until something is done. A row of `0/4` on every card is
 * noise, and it makes a catalogue of untouched builds read as a list of
 * failures — the same call the roadmap nodes make about their counts.
 */
export function ChallengeProgress({ stepIds }: { stepIds: readonly string[] }) {
  const solved = useSolved();
  const done = stepIds.filter((id) => solved.has(id)).length;

  if (done === 0) return null;

  return (
    <span className="text-xs font-semibold" aria-live="polite">
      {done === stepIds.length ? 'Built ✓' : `${done}/${stepIds.length} steps`}
    </span>
  );
}
