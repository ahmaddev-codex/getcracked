'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Flame, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { LAB_DIMENSION_LABELS, type LabDimension, type ScenarioLab } from '@/content/schema';
import { formatDuration } from './LabTimer';
import type { Scorecard as ScorecardData } from '@/lib/system-design/rubric';
import { findConcept, type Concept } from '@/content/concepts';
import { ComponentReferenceModal } from './ComponentReferenceModal';
import { generateScorecardRemediations } from '@/lib/system-design/remediation';
import type { SimulationConfig } from '@/lib/system-design/simulation';

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
  lab,
  score,
  takeaway,
  onRetry,
  timing,
  onLaunchRemediation,
}: {
  lab?: ScenarioLab;
  score: ScorecardData;
  takeaway: string;
  onRetry: () => void;
  /** Null for an untimed run — most of them (C7). */
  timing: { elapsed: number; budgetMinutes: number } | null;
  onLaunchRemediation?: (simConfig: SimulationConfig) => void;
}) {
  const [activeModalConcept, setActiveModalConcept] = useState<Concept | null>(null);

  const remediations = useMemo(
    () => (lab ? generateScorecardRemediations(lab, score) : []),
    [lab, score],
  );
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Design review</h2>
        <span className="text-xs text-foreground-muted">
          {score.met} of {score.total} met
        </span>
      </div>

      {timing && <Timing {...timing} />}

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

      {remediations.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-xs bg-accent/20 text-accent">
              <Sparkles size={14} />
            </span>
            <h3 className="text-sm font-bold text-foreground">
              Targeted Remediation Plan (Track 5)
            </h3>
          </div>

          <div className="flex flex-col gap-3">
            {remediations.map((rem) => (
              <Node key={rem.id} tone="surface" className="flex flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider bg-accent/15 text-accent border border-accent/30">
                      {LAB_DIMENSION_LABELS[rem.dimension]}
                    </span>
                    <h4 className="text-sm font-semibold text-foreground">{rem.title}</h4>
                  </div>

                  {onLaunchRemediation && (
                    <button
                      type="button"
                      onClick={() => onLaunchRemediation(rem.suggestedSimConfig)}
                      className="px-3 py-1.5 bg-accent text-accent-foreground rounded-xs text-xs font-semibold hover:bg-accent-strong transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Flame size={13} />
                      <span>Simulate & Fix on Whiteboard</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xs bg-surface-muted/40 border border-border-subtle flex flex-col gap-1">
                    <span className="font-semibold text-rose-500 flex items-center gap-1">
                      <ShieldAlert size={12} />
                      Diagnostic
                    </span>
                    <p className="text-foreground-muted leading-relaxed">{rem.diagnostic}</p>
                  </div>

                  <div className="p-2.5 rounded-xs bg-surface-muted/40 border border-border-subtle flex flex-col gap-1">
                    <span className="font-semibold text-amber-500 flex items-center gap-1">
                      <ArrowRight size={12} />
                      Prescribed Architectural Fix
                    </span>
                    <p className="text-foreground-muted leading-relaxed">{rem.actionAdvice}</p>
                  </div>
                </div>

                {/* 10D Component Chips */}
                {rem.conceptSlugs.length > 0 && (
                  <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center gap-2">
                    <span className="text-2xs text-foreground-muted">Study 10D Component Spec:</span>
                    {rem.conceptSlugs.map((slug) => {
                      const concept = findConcept(slug);
                      if (!concept) return null;
                      return (
                        <button
                          key={slug}
                          type="button"
                          onClick={() => setActiveModalConcept(concept)}
                          className="px-2 py-1 rounded-xs text-xs font-semibold bg-surface border border-border-strong text-foreground hover:bg-accent/10 hover:border-accent/40 hover:text-accent transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Sparkles size={11} className="text-accent" />
                          <span>{concept.term}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </Node>
            ))}
          </div>
        </section>
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

      {activeModalConcept && (
        <ComponentReferenceModal
          concept={activeModalConcept}
          isOpen={Boolean(activeModalConcept)}
          onClose={() => setActiveModalConcept(null)}
        />
      )}
    </section>
  );
}

/**
 * What the clock is for (C7).
 *
 * Reported, never punished: going over does not change the score, because the
 * six dimensions measure judgement and taking longer is not worse judgement. It
 * is a separate fact about the same session, and stating it separately is what
 * keeps both honest.
 */
function Timing({ elapsed, budgetMinutes }: { elapsed: number; budgetMinutes: number }) {
  const budget = budgetMinutes * 60;
  const over = elapsed > budget;

  return (
    <Node tone={over ? 'surface' : 'muted'} className="p-3 text-sm">
      <span className="font-mono">{formatDuration(elapsed)}</span>{' '}
      {over ? (
        <>
          — over the {budgetMinutes} minute budget by{' '}
          <span className="font-mono">{formatDuration(elapsed - budget)}</span>. In a real
          round you would have been moved on, so it is worth knowing which step took the
          time.
        </>
      ) : (
        <>
          — inside the {budgetMinutes} minute budget, with{' '}
          <span className="font-mono">{formatDuration(budget - elapsed)}</span> to spare.
        </>
      )}
    </Node>
  );
}
