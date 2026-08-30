import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ChallengeProgress } from './StepList';
import { challengeLanguages, stepIds } from '@/content/challenge';
import type { Challenge } from '@/content/schema';

/**
 * One build, as a card.
 *
 * Extracted because three surfaces had grown their own: the catalog, the
 * problem set's "then build one" (B20), and now the lesson bridge (C6). They
 * had already drifted — two different fills, two different metadata lines, and
 * only one of them showing progress — which is exactly how a learner ends up
 * unsure whether two things are the same thing.
 *
 * `tone` is the one real difference and it is a genuine one. A catalog shows
 * many of these at once and they should sit quietly; a bridge shows one, as the
 * suggested next step, and it should read as a call to action. Same component,
 * the same two tones the rest of the design system uses.
 */
export function ChallengeCard({
  challenge,
  tone = 'surface',
}: {
  challenge: Challenge;
  /** `strong` for a single highlighted next step; `surface` for a listing. */
  tone?: 'surface' | 'strong';
}) {
  const emphasised = tone === 'strong';

  return (
    <Link
      href={`/challenges/${challenge.slug}`}
      className={`node-surface node-interactive flex h-full flex-col gap-2 p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
        emphasised ? 'bg-accent-strong text-accent-foreground' : 'bg-surface'
      }`}
    >
      <span className="flex items-start justify-between gap-3">
        <span className="text-sm font-bold">{challenge.title}</span>
        <ArrowRight size={15} aria-hidden className="mt-0.5 shrink-0" />
      </span>

      <span className={`text-xs ${emphasised ? 'opacity-80' : 'text-foreground-muted'}`}>
        {challenge.summary}
      </span>

      {/* `mt-auto` so the metadata sits on the baseline of a grid of cards
          whatever length the summaries are. */}
      <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-1 text-xs">
        <span className={emphasised ? 'opacity-80' : 'text-foreground-muted'}>
          {challenge.steps.length} steps
        </span>
        <span className={emphasised ? 'opacity-80' : 'text-foreground-muted'}>
          {challengeLanguages(challenge).join(' · ')}
        </span>
        <span className={emphasised ? 'opacity-80' : 'text-foreground-muted'}>
          {challenge.difficulty}
        </span>
        {/* Client component: reports nothing until something is done, so an
            untouched catalog does not read as a list of failures. */}
        <ChallengeProgress stepIds={stepIds(challenge)} />
      </span>
    </Link>
  );
}
