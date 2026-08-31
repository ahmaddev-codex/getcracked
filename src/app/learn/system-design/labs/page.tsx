import Link from 'next/link';
import { Page } from '@/components/ui/Page';
import { ArrowRight } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { EmptyState } from '@/components/ui/EmptyState';
import { getLabs } from '@/content/registry';
import { LAB_DIMENSION_LABELS, LAB_DIMENSIONS } from '@/content/schema';

/**
 * The scenario labs index (C2).
 *
 * **Public** (§2.6): a lab is content, it runs entirely in the browser, and
 * nothing about it is account-scoped.
 */
export const metadata = {
  title: 'System Design labs — GetCracked',
  description:
    'Guided design scenarios scored against the six things an interview actually assesses. Free, no account needed.',
};

const DIFFICULTY_TONE: Record<string, string> = {
  easy: 'bg-success-soft text-success',
  medium: 'bg-warning-soft text-warning',
  hard: 'bg-danger-soft text-danger',
};

export default function LabsPage() {
  const labs = getLabs();

  return (
    <Page width="canvas">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <p className="text-xs text-foreground-muted">
          <Link
            href="/learn/system-design"
            className="text-link underline underline-offset-2"
          >
            ← System Design
          </Link>
        </p>
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Design labs</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          A scenario, worked the way an interview goes: agree the requirements, size it,
          design the interface, choose where the data lives, decide how it scales, and say
          what breaks first. You get a scorecard naming which of those went worst.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">What you are scored on</h2>
        {/*
          Stated up front rather than revealed at the end. The rubric is the
          thing being taught — a learner who knows an interview weighs these six
          has already got most of the value, whatever they score.
        */}
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {LAB_DIMENSIONS.map((dimension) => (
            <li key={dimension}>
              <Node tone="muted" className="px-3 py-2 text-sm">
                {LAB_DIMENSION_LABELS[dimension]}
              </Node>
            </li>
          ))}
        </ul>
        <p className="text-xs text-foreground-muted">
          Not one of them is “can you draw a diagram”. A neat architecture diagram with no
          reasoning behind it fails an interview; a scrappy one with sharp reasoning passes.
        </p>
      </section>

      {labs.length === 0 ? (
        <EmptyState title="No labs yet">The catalog is still being written.</EmptyState>
      ) : (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Scenarios</h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {labs.map((lab) => (
              <li key={lab.slug}>
                <Link
                  href={`/learn/system-design/labs/${lab.slug}`}
                  className="node-surface node-interactive flex h-full flex-col gap-2 bg-surface p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  <span className="flex items-start justify-between gap-3">
                    <span className="text-sm font-bold">{lab.title}</span>
                    <ArrowRight size={15} aria-hidden className="mt-0.5 shrink-0" />
                  </span>
                  <span className="text-xs text-foreground-muted">{lab.summary}</span>
                  <span className="mt-auto flex flex-wrap items-center gap-2 pt-1 text-xs">
                    <span
                      className={`px-2 py-0.5 font-medium ${DIFFICULTY_TONE[lab.difficulty]}`}
                    >
                      {lab.difficulty}
                    </span>
                    <span className="text-foreground-muted">{lab.steps.length} questions</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Node tone="muted" className="p-4 text-sm text-foreground-muted">
        Sizing something of your own? The{' '}
        <Link
          href="/learn/system-design/capacity"
          className="text-link underline underline-offset-2"
        >
          capacity calculator
        </Link>{' '}
        does the same arithmetic with your numbers, and shows its working.
      </Node>
    </Page>
  );
}
