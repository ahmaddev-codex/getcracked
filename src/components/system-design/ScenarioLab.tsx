'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { Scorecard } from './Scorecard';
import { LabTimer } from './LabTimer';
import { ConceptLinks } from './ConceptLinks';
import { track } from '@/lib/analytics/track';
import { correctOptions, estimateAccepted, gradeStep, scoreLab } from '@/lib/system-design/rubric';
import type { LabAnswer, LabAnswers } from '@/lib/system-design/rubric';
import { LAB_DIMENSION_LABELS, type LabStep, type ScenarioLab as Lab } from '@/content/schema';

/**
 * A guided System Design scenario (C2).
 *
 * **One step at a time, and every option explained once you commit.** The same
 * rule the decision trees follow: after answering, the reasoning for every
 * option is shown, not just the one that was picked. A lab that explains only
 * your own answer teaches you to recognise a right answer, and the question that
 * actually decides an interview is "why not the other one?".
 *
 * **Answers are held here and nowhere else.** A lab is something you do
 * repeatedly rather than complete once, so there is no server progress row and
 * no `tier` for it — a scorecard is a reading of one attempt, and storing it
 * would invite treating it as a grade. That is also why "Run it again" throws
 * the whole thing away rather than letting you patch one answer.
 */
export function ScenarioLab({ lab }: { lab: Lab }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<LabAnswers>({});
  /** Ticked but not yet committed, for the step on screen. */
  const [draft, setDraft] = useState<number[]>([]);
  const [estimateDraft, setEstimateDraft] = useState('');
  const [done, setDone] = useState(false);
  /** Epoch ms when the clock started, or null for an untimed run (C7). */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const step = lab.steps[index];
  const committed = answers[step?.slug ?? ''];
  const score = useMemo(() => scoreLab(lab, answers), [lab, answers]);

  const reset = useCallback(() => {
    setAnswers({});
    setDraft([]);
    setEstimateDraft('');
    setIndex(0);
    setDone(false);
    setStartedAt(null);
    setElapsed(0);
  }, []);

  const commit = useCallback(() => {
    if (!step) return;
    const answer: LabAnswer =
      step.kind === 'estimate'
        ? { kind: 'estimate', value: Number(estimateDraft) }
        : { kind: 'select', chosen: draft };

    setAnswers((prev) => ({ ...prev, [step.slug]: answer }));
    track('lab_step_answered', { labSlug: lab.slug, step: step.slug });
  }, [step, draft, estimateDraft, lab.slug]);

  const advance = useCallback(() => {
    setDraft([]);
    setEstimateDraft('');
    if (index < lab.steps.length - 1) {
      setIndex(index + 1);
      return;
    }
    setDone(true);
    track('lab_completed', { labSlug: lab.slug });
  }, [index, lab.steps.length, lab.slug]);

  if (done) {
    return (
      <Scorecard
        score={score}
        takeaway={lab.takeaway}
        onRetry={reset}
        timing={startedAt === null ? null : { elapsed, budgetMinutes: lab.timeBudgetMinutes }}
      />
    );
  }

  if (!step) return null;

  const result = committed ? gradeStep(step, committed) : null;
  const canCommit =
    step.kind === 'estimate' ? estimateDraft.trim() !== '' : draft.length > 0;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">
          Step {index + 1} of {lab.steps.length}
        </h2>
        <span className="flex items-center gap-3">
          <span className="text-xs text-foreground-muted">
            {LAB_DIMENSION_LABELS[step.dimension]}
          </span>
          {/*
            Offered on the first step only. Starting a clock halfway through
            would measure a fraction of the work and report it as the whole
            thing.
          */}
          {startedAt === null && index === 0 && Object.keys(answers).length === 0 ? (
            <button
              type="button"
              onClick={() => setStartedAt(Date.now())}
              className="node-surface node-pressable bg-surface px-2 py-1 text-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              Time me · {lab.timeBudgetMinutes} min
            </button>
          ) : (
            <LabTimer
              budgetMinutes={lab.timeBudgetMinutes}
              startedAt={startedAt}
              onElapsed={setElapsed}
            />
          )}
        </span>
      </div>

      {/* A bar rather than "3/6": the number is already above it, and the bar is
          the part readable without reading. */}
      <div
        aria-hidden
        className="flex gap-1"
      >
        {lab.steps.map((s, i) => (
          <span
            key={s.slug}
            className={`h-1.5 flex-1 rounded-node ${
              i < index ? 'bg-accent-strong' : i === index ? 'bg-accent' : 'bg-surface-muted'
            }`}
          />
        ))}
      </div>

      <Node tone="surface" className="flex flex-col gap-3 p-4">
        <p className="font-semibold">{step.prompt}</p>
        {step.detail && (
          <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground-muted">
            {step.detail.split('\n\n').map((p, i) => (
              <p key={i}>{p.replace(/\n/g, ' ')}</p>
            ))}
          </div>
        )}
      </Node>

      {step.kind === 'estimate' ? (
        <EstimateStep
          step={step}
          value={estimateDraft}
          onChange={setEstimateDraft}
          answered={Boolean(committed)}
          correct={result?.met ?? false}
        />
      ) : (
        <SelectStep
          step={step}
          draft={draft}
          onToggle={(i) =>
            setDraft((prev) =>
              step.multiple
                ? prev.includes(i)
                  ? prev.filter((x) => x !== i)
                  : [...prev, i]
                : [i],
            )
          }
          answered={Boolean(committed)}
        />
      )}

      {result && step.concepts.length > 0 && <ConceptLinks slugs={step.concepts} />}

      {result && (
        <Node tone={result.met ? 'strong' : 'muted'} className="p-3 text-sm">
          {result.met
            ? 'That is the answer to defend.'
            : step.kind === 'estimate'
              ? 'Not within range — the working is above.'
              : verdict(result.missed.length, result.overreached.length)}
        </Node>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {!committed ? (
          <Button onClick={commit} disabled={!canCommit}>
            {step.kind === 'estimate' ? 'Check my estimate' : 'Commit to this'}
          </Button>
        ) : (
          <Button onClick={advance}>
            {index < lab.steps.length - 1 ? 'Next step' : 'See the review'}
          </Button>
        )}
        {!committed && (
          <span className="text-xs text-foreground-muted">
            {step.kind === 'estimate'
              ? 'Roughly right is the target — you are marked within a factor of three.'
              : step.multiple
                ? 'Pick everything that belongs. Over-picking counts against you.'
                : 'One answer.'}
          </span>
        )}
      </div>
    </section>
  );
}

/** Names the mistake, because leaving out and dragging in are different errors. */
function verdict(missed: number, overreached: number): string {
  if (missed > 0 && overreached > 0) {
    return `Missed ${missed} that belong, and included ${overreached} that do not.`;
  }
  if (missed > 0) return `Missed ${missed} that belong.`;
  return `Included ${overreached} that do not belong — thoroughness is not the same as judgement.`;
}

function SelectStep({
  step,
  draft,
  onToggle,
  answered,
}: {
  step: Extract<LabStep, { kind: 'select' }>;
  draft: number[];
  onToggle: (index: number) => void;
  answered: boolean;
}) {
  const correct = new Set(correctOptions(step));

  return (
    <ul className="flex flex-col gap-2">
      {step.options.map((option, i) => {
        const picked = draft.includes(i);
        const belongs = correct.has(i);

        return (
          <li key={option.label}>
            <button
              type="button"
              disabled={answered}
              onClick={() => onToggle(i)}
              aria-pressed={picked}
              className={`node-surface flex w-full items-start gap-3 p-3 text-left disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
                answered
                  ? belongs
                    ? 'bg-success-soft'
                    : picked
                      ? 'bg-danger-soft'
                      : 'bg-surface-muted'
                  : picked
                    ? 'bg-accent-strong text-accent-foreground'
                    : 'bg-surface'
              }`}
            >
              <span aria-hidden className="mt-0.5 shrink-0">
                {answered ? (
                  belongs ? (
                    <Check size={16} strokeWidth={3} className="text-success" />
                  ) : picked ? (
                    <X size={16} strokeWidth={3} className="text-danger" />
                  ) : (
                    <span className="block size-4" />
                  )
                ) : (
                  <span
                    className={`block size-4 rounded-node border-2 border-current ${
                      picked ? 'bg-accent-foreground' : ''
                    }`}
                  />
                )}
              </span>

              <span className="flex flex-col gap-1">
                <span className="text-sm font-medium">{option.label}</span>
                {/*
                  Every option's reasoning, not just the chosen one — the rule
                  the decision trees follow, for the same reason.
                */}
                {answered && (
                  <span className="text-xs leading-relaxed text-foreground-muted">
                    {option.reason}
                  </span>
                )}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function EstimateStep({
  step,
  value,
  onChange,
  answered,
  correct,
}: {
  step: Extract<LabStep, { kind: 'estimate' }>;
  value: string;
  onChange: (next: string) => void;
  answered: boolean;
  correct: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="flex flex-wrap items-center gap-2 text-sm">
        <input
          type="number"
          inputMode="decimal"
          value={value}
          disabled={answered}
          onChange={(e) => onChange(e.target.value)}
          className="node-surface w-40 bg-surface px-3 py-1.5 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          aria-label={`Your estimate, in ${step.unit}`}
        />
        <span className="text-foreground-muted">{step.unit}</span>
      </label>

      {answered && (
        <Node tone={correct ? 'strong' : 'surface'} className="flex flex-col gap-2 p-3">
          <p className="text-xs font-semibold">
            {/*
              The accepted band is stated rather than implied. "Wrong" without a
              range leaves a learner unable to tell whether they were close.
            */}
            Accepted between {round(step.answer / step.tolerance)} and{' '}
            {round(step.answer * step.tolerance)} {step.unit}
            {!estimateAccepted(Number(value), step.answer, step.tolerance) &&
              ` — you said ${value}`}
          </p>
          {step.working.split('\n\n').map((p, i) => (
            <p key={i} className="text-sm leading-relaxed">
              {p.replace(/\n/g, ' ')}
            </p>
          ))}
        </Node>
      )}
    </div>
  );
}

/** Two significant figures: the band is approximate, so printing 12.866667 lies. */
function round(n: number): string {
  return Number(n.toPrecision(2)).toLocaleString();
}
