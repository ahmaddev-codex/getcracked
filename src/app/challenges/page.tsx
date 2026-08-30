import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { EmptyState } from '@/components/ui/EmptyState';
import { ChallengeProgress } from '@/components/challenge/StepList';
import {
  getChallengeCategories,
  getChallenges,
  getChallengesInCategory,
} from '@/content/registry';
import { challengeLanguages, stepIds } from '@/content/challenge';
import type { Challenge } from '@/content/schema';
import { Page } from '@/components/ui/Page';

/**
 * The Challenges surface — tier 3 (PRD §2.3, §7.2.1).
 *
 * **Public.** Content is not gated (§2.6): a signed-out learner browses, opens,
 * and solves every step of every build without an account. Progress is the only
 * thing an account adds, and the components that read it are client components
 * so this page stays statically prerendered and indexable.
 *
 * Deliberately not the problems table. A build is not something you pick off a
 * list by difficulty and finish in ten minutes — the question here is "what do I
 * want to have built", so each one gets a card with room to say what it is.
 */
export const metadata = {
  title: 'Build challenges — GetCracked',
  description:
    'Multi-step builds: an LRU cache, a rate limiter, undo and redo. Write the files, run the tests. Free, no account needed.',
};

const CATEGORY_LABEL: Record<Challenge['category'], string> = {
  dsa: 'Data structures & algorithms',
  'real-world': 'Real-world systems',
  'design-patterns': 'Design patterns',
};

const CATEGORY_BLURB: Record<Challenge['category'], string> = {
  dsa: 'The structures themselves, built from nothing rather than imported.',
  'real-world': 'The pieces of infrastructure you have used without opening.',
  'design-patterns': 'Named solutions, built small enough to see the shape.',
};

const DIFFICULTY_TONE: Record<string, string> = {
  easy: 'bg-success-soft text-success',
  medium: 'bg-warning-soft text-warning',
  hard: 'bg-danger-soft text-danger',
};

export default function ChallengesPage() {
  const all = getChallenges();
  const categories = getChallengeCategories();
  const steps = all.reduce((n, c) => n + c.steps.length, 0);

  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Build it</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          {all.length} builds, {steps} steps. Each one is a real thing assembled across
          several files, one rule at a time — not a function with a hole in it. Every step
          runs against tests in your browser.
        </p>
      </header>

      {all.length === 0 ? (
        <EmptyState title="No builds yet">The catalog is still being written.</EmptyState>
      ) : (
        categories.map((category) => (
          <section key={category} className="flex flex-col gap-3">
            <div className="flex flex-col gap-0.5">
              <h2 className="text-sm font-semibold">{CATEGORY_LABEL[category]}</h2>
              <p className="text-xs text-foreground-muted">{CATEGORY_BLURB[category]}</p>
            </div>

            <ul className="grid gap-3 sm:grid-cols-2">
              {getChallengesInCategory(category).map((challenge) => (
                <li key={challenge.slug}>
                  <Link
                    href={`/challenges/${challenge.slug}`}
                    className="node-surface node-interactive flex h-full flex-col gap-2 bg-surface p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-sm font-bold">{challenge.title}</span>
                      <ArrowRight size={15} aria-hidden className="mt-0.5 shrink-0" />
                    </span>

                    <span className="text-xs text-foreground-muted">{challenge.summary}</span>

                    <span className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span
                        className={`px-2 py-0.5 font-medium ${DIFFICULTY_TONE[challenge.difficulty]}`}
                      >
                        {challenge.difficulty}
                      </span>
                      <span className="text-foreground-muted">
                        {challenge.steps.length} steps
                      </span>
                      <span className="text-foreground-muted">
                        {challengeLanguages(challenge).join(' · ')}
                      </span>
                      <ChallengeProgress stepIds={stepIds(challenge)} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}

      <Node tone="muted" className="p-4 text-sm text-foreground-muted">
        Builds assume the pattern rather than teach it. If one is unfamiliar, the{' '}
        <Link href="/learn/dsa" className="text-link underline underline-offset-2">
          DSA path
        </Link>{' '}
        and the{' '}
        <Link href="/problems" className="text-link underline underline-offset-2">
          problem sets
        </Link>{' '}
        cover the same ground first — a recommendation, never a lock. Nothing here is
        closed to anyone.
      </Node>
    </Page>
  );
}
