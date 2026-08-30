'use client';

import { useState } from 'react';
import { Check, CornerDownRight, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { track } from '@/lib/analytics/track';
import type {
  DecisionOutcome,
  DecisionQuestion,
  DecisionTree as Tree,
} from '@/content/schema';

/**
 * A walkable trade-off (C4).
 *
 * The lesson states its trade-offs as prose above this. Here they are a decision
 * you make, which is the form an interview actually asks for: nobody is asked to
 * recite when to use a relational database, they are asked which one they would
 * choose here and why.
 *
 * **The branches you did not take stay visible, and that is the whole design.**
 * A tree that reveals only the path you walked is a flowchart with extra clicks,
 * and it teaches recitation — a learner ends up able to produce one answer and
 * unable to answer "why not the other one?", which is the follow-up that
 * actually decides an interview. So every option carries its consequence before
 * it is chosen, and the ones not taken remain legible afterwards.
 *
 * Nothing here is graded or recorded. There is no correct path: the tree
 * encodes which answer follows from which circumstances, not which circumstances
 * a learner should have.
 */
export function DecisionTree({ tree, lessonSlug }: { tree: Tree; lessonSlug: string }) {
  /**
   * The option index chosen at each depth.
   *
   * A list rather than a pointer to the current node, because going back has to
   * be possible without re-walking: truncating this array *is* stepping back,
   * and the path renders straight out of it.
   */
  const [path, setPath] = useState<number[]>([]);

  // Walk the answers to find where the learner is, and record the questions
  // passed through so the trail above can show them.
  const trail: Array<{ question: DecisionQuestion; chosen: number }> = [];
  let current: DecisionQuestion | null = tree.root;
  let outcome: DecisionOutcome | null = null;

  for (const choice of path) {
    if (!current) break;
    const option: DecisionQuestion['options'][number] | undefined = current.options[choice];
    if (!option) break;
    trail.push({ question: current, chosen: choice });

    if (option.next.kind === 'outcome') {
      outcome = option.next;
      current = null;
    } else {
      current = option.next;
    }
  }

  const choose = (index: number) => {
    setPath((previous) => [...previous, index]);
    track('decision_step', { lessonSlug });
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-foreground-muted">{tree.prompt}</p>

      {/* Where you have been, and what each answer committed you to. */}
      {trail.map((step, depth) => (
        <Node key={depth} tone="muted" className="flex flex-col gap-1 p-3">
          <p className="text-xs text-foreground-muted">{step.question.ask}</p>
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <CornerDownRight size={13} aria-hidden className="shrink-0 opacity-60" />
            {step.question.options[step.chosen].label}
          </p>
          {step.question.options[step.chosen].note && (
            <p className="text-xs text-foreground-muted">
              {step.question.options[step.chosen].note}
            </p>
          )}
          <button
            type="button"
            // Back to *this* question, not one step back: on a four-deep tree
            // the useful move is "what if I had answered the second one
            // differently", and clicking Back three times to reach it is
            // friction with no purpose.
            onClick={() => setPath((previous) => previous.slice(0, depth))}
            className="self-start text-xs text-link underline underline-offset-2"
          >
            Change this answer
          </button>
        </Node>
      ))}

      {current && (
        <Node tone="surface" className="flex flex-col gap-3 p-4">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold">{current.ask}</h3>
            {current.why && (
              <p className="text-xs text-foreground-muted">{current.why}</p>
            )}
          </div>

          <ul className="flex flex-col gap-2">
            {current.options.map((option, index) => (
              <li key={option.label}>
                <button
                  type="button"
                  onClick={() => choose(index)}
                  className="node-surface node-interactive flex w-full flex-col gap-0.5 bg-surface-muted px-3 py-2 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  <span className="text-sm font-medium">{option.label}</span>
                  {/*
                    Shown before choosing, not after. This is what stops the
                    component being a quiz — the consequences of every branch
                    are readable without walking them.
                  */}
                  {option.note && (
                    <span className="text-xs text-foreground-muted">{option.note}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </Node>
      )}

      {outcome && (
        <Node tone="strong" className="flex flex-col gap-2 p-4">
          <p className="flex items-center gap-1.5 text-xs font-semibold">
            <Check size={13} strokeWidth={3} aria-hidden />
            Where that leads
          </p>
          <p className="text-base font-bold">{outcome.recommend}</p>
          <p className="text-sm">{outcome.because}</p>
          {outcome.caveat && (
            <p className="text-sm opacity-80">
              <span className="font-semibold">Still true afterwards: </span>
              {outcome.caveat}
            </p>
          )}
        </Node>
      )}

      {path.length > 0 && (
        <div>
          <Button
            tone="surface"
            onClick={() => setPath([])}
            className="inline-flex items-center gap-1.5"
          >
            <RotateCcw size={13} aria-hidden />
            Start over
          </Button>
        </div>
      )}
    </div>
  );
}
