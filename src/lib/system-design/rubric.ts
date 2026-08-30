import {
  LAB_DIMENSIONS,
  type LabDimension,
  type LabStep,
  type ScenarioLab,
} from '@/content/schema';

/**
 * Scoring a design review (C5).
 *
 * **A scorecard, not a grade.** The number it produces is worth very little on
 * its own — six steps cannot rank anyone as a system designer, and pretending
 * otherwise would be the same mistake as printing "O(n²)" after running one
 * input. What it is for is naming the *dimension* a learner was weakest on and
 * pointing at the lesson that covers it, which is a thing six steps genuinely
 * can do.
 *
 * That is why the shape below is per-dimension rather than one total: "you
 * scored 4/6" tells nobody what to do next, and "your requirements gathering
 * was the weak one" tells them exactly.
 */

/** What a learner submitted for one step. */
export type LabAnswer =
  /** Indices of the options ticked, in any order. */
  | { kind: 'select'; chosen: number[] }
  | { kind: 'estimate'; value: number };

export type LabAnswers = Record<string, LabAnswer | undefined>;

export interface StepResult {
  slug: string;
  dimension: LabDimension;
  answered: boolean;
  met: boolean;
  /** Correct options the learner did not tick. */
  missed: number[];
  /** Options they ticked that do not belong. */
  overreached: number[];
}

export interface DimensionScore {
  dimension: LabDimension;
  met: number;
  total: number;
}

export interface Scorecard {
  steps: StepResult[];
  dimensions: DimensionScore[];
  met: number;
  total: number;
  answered: number;
  /**
   * The dimensions that went worst, for the "what to read next" line.
   *
   * Plural because ties are common on a six-step lab, and picking one
   * arbitrarily would tell a learner to go and study something they did no worse
   * at than three others.
   */
  weakest: LabDimension[];
}

/** Indices of the options that belong in a good answer. */
export function correctOptions(step: LabStep): number[] {
  if (step.kind !== 'select') return [];
  return step.options.flatMap((option, i) => (option.correct ? [i] : []));
}

/**
 * Whether an estimate is close enough.
 *
 * A factor either way, never an exact match: the skill being tested is reaching
 * the right order of magnitude out loud, and an equality check would fail
 * someone who did the reasoning correctly and rounded differently.
 */
export function estimateAccepted(value: number, answer: number, tolerance: number): boolean {
  if (!Number.isFinite(value) || value <= 0) return false;
  return value >= answer / tolerance && value <= answer * tolerance;
}

/**
 * Grades one step.
 *
 * **Exact match, and deliberately.** Partial credit on a multi-select would
 * reward ticking everything, and "everything is a requirement" is precisely the
 * failure the requirements step exists to catch. So a step is met only when the
 * answer contains every option that belongs and none that does not — and both
 * halves of the miss are reported, because leaving something out and dragging
 * something in are different mistakes with different fixes.
 */
export function gradeStep(step: LabStep, answer: LabAnswer | undefined): StepResult {
  const base = { slug: step.slug, dimension: step.dimension };

  if (!answer) {
    return { ...base, answered: false, met: false, missed: [], overreached: [] };
  }

  if (step.kind === 'estimate') {
    const met =
      answer.kind === 'estimate' &&
      estimateAccepted(answer.value, step.answer, step.tolerance);
    return { ...base, answered: true, met, missed: [], overreached: [] };
  }

  if (answer.kind !== 'select') {
    return { ...base, answered: true, met: false, missed: [], overreached: [] };
  }

  const chosen = new Set(answer.chosen);
  const correct = new Set(correctOptions(step));

  const missed = [...correct].filter((i) => !chosen.has(i));
  const overreached = [...chosen].filter((i) => !correct.has(i));

  return {
    ...base,
    answered: true,
    met: missed.length === 0 && overreached.length === 0,
    missed,
    overreached,
  };
}

export function scoreLab(lab: ScenarioLab, answers: LabAnswers): Scorecard {
  const steps = lab.steps.map((step) => gradeStep(step, answers[step.slug]));

  const dimensions: DimensionScore[] = LAB_DIMENSIONS.map((dimension) => ({
    dimension,
    met: steps.filter((s) => s.dimension === dimension && s.met).length,
    total: steps.filter((s) => s.dimension === dimension).length,
  }))
    // A lab need not cover all six; reporting 0/0 for the ones it skipped would
    // read as a failure rather than as an absence.
    .filter((d) => d.total > 0);

  const met = steps.filter((s) => s.met).length;

  /**
   * Only among what was actually attempted.
   *
   * A dimension left blank is not a weakness, it is an unanswered question, and
   * telling someone to go and study the step they never reached would be
   * advice about nothing.
   */
  const attempted = dimensions.filter((d) =>
    steps.some((s) => s.dimension === d.dimension && s.answered),
  );
  const worst = Math.min(...attempted.map((d) => d.met / d.total), Number.POSITIVE_INFINITY);

  return {
    steps,
    dimensions,
    met,
    total: steps.length,
    answered: steps.filter((s) => s.answered).length,
    weakest:
      attempted.length > 0 && worst < 1
        ? attempted.filter((d) => d.met / d.total === worst).map((d) => d.dimension)
        : [],
  };
}
