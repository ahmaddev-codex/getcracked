'use client';

import { useCallback, useMemo, useState } from 'react';
import { Check, Flame, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { Scorecard } from './Scorecard';
import { LabTimer } from './LabTimer';
import { ConceptLinks } from './ConceptLinks';
import { ArchitectureCanvas } from './ArchitectureCanvas';
import { ARCHITECTURE_PRESETS } from '@/lib/system-design/canvas-presets';
import { track } from '@/lib/analytics/track';
import { correctOptions, gradeStep, scoreLab } from '@/lib/system-design/rubric';
import type { LabAnswer, LabAnswers } from '@/lib/system-design/rubric';
import type { SimulationConfig } from '@/lib/system-design/simulation';
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
  const [showCanvas, setShowCanvas] = useState(false);
  const [remediationConfig, setRemediationConfig] = useState<SimulationConfig | null>(null);
  const [showRemediationCanvas, setShowRemediationCanvas] = useState(false);
  /** Epoch ms when the clock started, or null for an untimed run (C7). */
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);

  const step = lab.steps[index];
  const committed = answers[step?.slug ?? ''];
  const score = useMemo(() => scoreLab(lab, answers), [lab, answers]);
  const initialArch = ARCHITECTURE_PRESETS[lab.slug] ?? ARCHITECTURE_PRESETS['url-shortener'];

  const reset = useCallback(() => {
    setAnswers({});
    setDraft([]);
    setEstimateDraft('');
    setIndex(0);
    setDone(false);
    setStartedAt(null);
    setElapsed(0);
    setRemediationConfig(null);
    setShowRemediationCanvas(false);
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
      <div className="flex flex-col gap-6">
        <Scorecard
          lab={lab}
          score={score}
          takeaway={lab.takeaway}
          onRetry={reset}
          timing={startedAt === null ? null : { elapsed, budgetMinutes: lab.timeBudgetMinutes }}
          onLaunchRemediation={(cfg) => {
            setRemediationConfig(cfg);
            setShowRemediationCanvas(true);
          }}
        />

        {showRemediationCanvas && (
          <section className="flex flex-col gap-3 p-4 rounded-node border-2 border-accent/40 bg-surface shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-xs bg-accent/20 text-accent">
                  <Flame size={15} />
                </span>
                <h3 className="text-sm font-bold text-foreground">
                  Interactive Remediation Whiteboard ({lab.title})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRemediationCanvas(false)}
                className="text-xs text-foreground-muted hover:text-foreground cursor-pointer px-2 py-1 rounded-xs bg-surface-muted"
              >
                Hide Whiteboard
              </button>
            </div>
            <ArchitectureCanvas
              key={`remediation-${lab.slug}-${remediationConfig?.globalQps ?? 0}`}
              initialArchitecture={initialArch}
              initialMode="simulate"
              initialSimConfig={remediationConfig ?? undefined}
              compact
            />
          </section>
        )}
      </div>
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
          <button
            type="button"
            onClick={() => setShowCanvas((v) => !v)}
            className={`node-surface node-pressable px-2 py-1 text-xs transition-colors flex items-center gap-1 ${
              showCanvas
                ? 'bg-accent font-semibold text-accent-foreground'
                : 'bg-surface text-foreground'
            }`}
          >
            <span>{showCanvas ? 'Hide Whiteboard' : 'Whiteboard Diagram (C1)'}</span>
          </button>

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

      {showCanvas && (
        <div className="w-full my-2">
          <ArchitectureCanvas initialArchitecture={initialArch} compact />
        </div>
      )}

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
          result={result}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <ConceptLinks slugs={committed ? step.concepts : []} />
        <div className="flex gap-2">
          {!committed ? (
            <Button
              onClick={commit}
              disabled={!canCommit}
              tone="strong"
            >
              Commit answer
            </Button>
          ) : (
            <Button onClick={advance} tone="strong">
              {index < lab.steps.length - 1 ? 'Next question →' : 'See scorecard →'}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function SelectStep({
  step,
  draft,
  onToggle,
  answered,
  result,
}: {
  step: Extract<LabStep, { kind: 'select' }>;
  draft: number[];
  onToggle: (index: number) => void;
  answered: boolean;
  result: ReturnType<typeof gradeStep> | null;
}) {
  const correctSet = useMemo(() => new Set(correctOptions(step)), [step]);

  return (
    <div className="flex flex-col gap-2">
      {step.options.map((opt, i) => {
        const picked = draft.includes(i);
        const isCorrect = correctSet.has(i);

        let highlight = '';
        if (answered) {
          if (isCorrect) {
            highlight = 'border-l-4 border-l-success';
          } else if (picked) {
            highlight = 'border-l-4 border-l-danger';
          }
        }

        return (
          <button
            key={i}
            type="button"
            disabled={answered}
            onClick={() => onToggle(i)}
            className={`node-surface text-left transition-all ${
              !answered ? 'node-pressable' : ''
            } ${picked && !answered ? 'ring-2 ring-accent' : ''} ${highlight} p-3`}
          >
            <div className="flex items-start gap-3">
              <span
                aria-hidden
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-node border border-border-strong text-2xs ${
                  picked ? 'bg-accent text-accent-foreground' : 'bg-surface'
                }`}
              >
                {picked && <Check size={12} strokeWidth={3} />}
              </span>
              <div className="flex flex-col gap-1">
                <p className="text-sm font-medium">{opt.label}</p>
                {answered && (
                  <p className="text-xs leading-relaxed text-foreground-muted">
                    {opt.reason}
                  </p>
                )}
              </div>
            </div>
          </button>
        );
      })}

      {answered && result && (
        <div
          role="status"
          aria-live="polite"
          className="mt-2 flex items-center gap-2 text-xs text-foreground-muted"
        >
          {result.met ? (
            <span className="flex items-center gap-1 font-semibold text-success">
              <Check size={14} /> Solid answer
            </span>
          ) : (
            <span className="flex items-center gap-1 font-semibold text-danger">
              <X size={14} />
              {result.missed.length > 0 && result.overreached.length > 0
                ? 'Missed some essentials and brought in non-requirements'
                : result.missed.length > 0
                  ? 'Left out an essential requirement'
                  : 'Included things that are not requirements'}
            </span>
          )}
        </div>
      )}
    </div>
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
  onChange: (val: string) => void;
  answered: boolean;
  correct: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor="estimate-input" className="sr-only">
          Your estimate in {step.unit}
        </label>
        <input
          id="estimate-input"
          type="number"
          step="any"
          disabled={answered}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="e.g. 1000"
          className="node-surface bg-surface px-3 py-2 text-sm font-mono focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:opacity-75"
        />
        <span className="text-sm text-foreground-muted">{step.unit}</span>
      </div>

      {answered && (
        <Node tone="surface" className="flex flex-col gap-2 p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            {correct ? (
              <span className="flex items-center gap-1 text-success">
                <Check size={14} /> Right order of magnitude
              </span>
            ) : (
              <span className="flex items-center gap-1 text-danger">
                <X size={14} /> Off the mark
              </span>
            )}
            <span className="text-foreground-muted">
              (Reference: ~{step.answer.toLocaleString()} {step.unit})
            </span>
          </div>
          <p className="leading-relaxed text-foreground-muted">{step.working}</p>
        </Node>
      )}
    </div>
  );
}
