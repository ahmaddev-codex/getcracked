'use client';

import Link from 'next/link';
import { Node } from '@/components/ui/Node';
import { LAB_DIMENSION_LABELS, type LabDimension } from '@/content/schema';
import type { Scorecard as ScorecardData } from '@/lib/system-design/rubric';

/**
 * The design-review rubric (C5).
 *
 * **Per dimension, and only secondarily a total.** "You scored 4 of 6" tells a
 * learner nothing they can act on. "Your requirements gathering was the weak
 * one, here is the lesson" tells them exactly what to do next, and that is the
 * only claim six questions can honestly support.
 *
 * There is deliberately no pass mark and no grade letter. A six-step lab cannot
 * rank anyone as a system designer, and dressing it up as though it could would
 * be the same mistake as printing a complexity class after running one input.
 */

/** Which lesson covers each dimension, for the "read this" link. */
const DIMENSION_LESSON: Partial<Record<LabDimension, { slug: string; title: string }>> = {
  estimation: { slug: 'scaling', title: 'Scaling' },
  'data-model': { slug: 'databases', title: 'SQL and NoSQL' },
  scaling: { slug: 'caching', title: 'Caching' },
  bottleneck: { slug: 'scaling', title: 'Scaling' },
};

export function Scorecard({
  score,
  takeaway,
  onRetry,
}: {
  score: ScorecardData;
  takeaway: string;
  onRetry: () => void;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Design review</h2>
        <span className="text-xs text-foreground-muted">
          {score.met} of {score.total} met
        </span>
      </div>

      <Node tone="surface" className="flex flex-col divide-y divide-border-subtle p-0">
        {score.dimensions.map((d) => {
          const full = d.met === d.total;
          return (
            <div key={d.dimension} className="flex items-center gap-3 px-4 py-2.5">
              {/*
                A filled bar rather than a tick, because most dimensions have one
                step and a bare tick would make a six-row list of ticks and
                crosses read as a test result. The bar says "this much of it".
              */}
              <span
                aria-hidden
                className={`h-2 w-10 shrink-0 rounded-node border-2 border-border-strong ${
                  full ? 'bg-accent-strong' : d.met > 0 ? 'bg-accent' : 'bg-surface-muted'
                }`}
              />
              <span className="text-sm">{LAB_DIMENSION_LABELS[d.dimension]}</span>
              <span className="ml-auto shrink-0 text-xs text-foreground-muted">
                {d.met}/{d.total}
              </span>
            </div>
          );
        })}
      </Node>

      {score.weakest.length > 0 && (
        <Node tone="muted" className="flex flex-col gap-1.5 p-4 text-sm">
          <p className="font-semibold">
            Weakest {score.weakest.length === 1 ? 'dimension' : 'dimensions'}:{' '}
            {score.weakest.map((d) => LAB_DIMENSION_LABELS[d]).join(' and ')}
          </p>
          <p className="text-foreground-muted">
            That is the one to read up on before the next scenario — the others held.
            {score.weakest.some((d) => DIMENSION_LESSON[d]) && ' '}
            {score.weakest
              .map((d) => DIMENSION_LESSON[d])
              .filter((l) => l !== undefined)
              .map((lesson, i, all) => (
                <span key={lesson.slug}>
                  {i > 0 && (i === all.length - 1 ? ' and ' : ', ')}
                  <Link
                    href={`/learn/system-design/${lesson.slug}`}
                    className="text-link underline underline-offset-2"
                  >
                    {lesson.title}
                  </Link>
                </span>
              ))}
            {score.weakest.some((d) => DIMENSION_LESSON[d]) && ' covers it.'}
          </p>
        </Node>
      )}

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold">What a strong answer sounds like</h3>
        {/*
          Rendered as paragraphs rather than through the markdown component: this
          is a client component and the takeaway is plain prose, so shipping a
          markdown parser to the browser for it would be a bundle for nothing.
        */}
        {takeaway.split('\n\n').map((paragraph, i) => (
          <p key={i} className="text-sm leading-relaxed text-foreground-muted">
            {paragraph.replace(/\n/g, ' ')}
          </p>
        ))}
      </div>

      <div>
        <button
          type="button"
          onClick={onRetry}
          className="node-surface node-pressable bg-surface px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          Run it again
        </button>
        <p className="mt-1.5 text-xs text-foreground-muted">
          Worth doing: the second pass is where you find out whether you learned the
          reasoning or remembered the answers.
        </p>
      </div>
    </section>
  );
}
