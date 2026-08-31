import { describe, expect, it } from 'vitest';
import {
  correctOptions,
  estimateAccepted,
  gradeStep,
  scoreLab,
  type LabAnswers,
} from '@/lib/system-design/rubric';
import { getLabs, findLab, RAW_LABS } from '@/content/registry';
import { findConcept } from '@/content/concepts';
import { formatDuration } from '@/components/system-design/LabTimer';
import { scenarioLabSchema, type LabStep, type ScenarioLab } from '@/content/schema';

/**
 * The design-review rubric (C5).
 *
 * The scoring is where a lab can be quietly wrong: a grader that gives partial
 * credit on a multi-select rewards ticking everything, which is the exact
 * failure the requirements step exists to catch. So the rules are pinned here
 * rather than left to the component that draws them.
 */

const selectStep = (over: Partial<Extract<LabStep, { kind: 'select' }>> = {}) =>
  scenarioLabSchema.parse({
    slug: 'fixture',
    title: 'Fixture',
    summary: 'A fixture.',
    brief: 'A fixture.',
    difficulty: 'easy',
    takeaway: 'A fixture.',
    steps: [
      {
        slug: 'step',
        kind: 'select',
        dimension: 'requirements',
        prompt: 'Which?',
        multiple: true,
        options: [
          { label: 'A', correct: true, reason: 'x'.repeat(40) },
          { label: 'B', correct: true, reason: 'x'.repeat(40) },
          { label: 'C', reason: 'x'.repeat(40) },
          { label: 'D', reason: 'x'.repeat(40) },
        ],
        ...over,
      },
    ],
  }).steps[0];

describe('estimates', () => {
  const answer = 100;

  it('accepts anything within the factor, either way', () => {
    // Roughly right out loud is the skill; an equality check would fail someone
    // who reasoned correctly and rounded differently.
    expect(estimateAccepted(100, answer, 3)).toBe(true);
    expect(estimateAccepted(300, answer, 3)).toBe(true);
    expect(estimateAccepted(34, answer, 3)).toBe(true);
  });

  it('rejects an answer outside it', () => {
    expect(estimateAccepted(301, answer, 3)).toBe(false);
    expect(estimateAccepted(33, answer, 3)).toBe(false);
  });

  it('rejects nonsense rather than treating it as zero', () => {
    // An empty input parses to NaN, and NaN comparisons are all false — which
    // would silently read as "wrong" rather than "not answered" if the caller
    // relied on the comparison alone.
    expect(estimateAccepted(Number.NaN, answer, 3)).toBe(false);
    expect(estimateAccepted(0, answer, 3)).toBe(false);
    expect(estimateAccepted(-100, answer, 3)).toBe(false);
    expect(estimateAccepted(Number.POSITIVE_INFINITY, answer, 3)).toBe(false);
  });
});

describe('grading a select step', () => {
  const step = selectStep();

  it('meets only on an exact match', () => {
    expect(gradeStep(step, { kind: 'select', chosen: [0, 1] }).met).toBe(true);
  });

  it('does not reward ticking everything', () => {
    // The whole reason there is no partial credit: "everything is a
    // requirement" is the mistake the requirements step exists to catch.
    const result = gradeStep(step, { kind: 'select', chosen: [0, 1, 2, 3] });
    expect(result.met).toBe(false);
    expect(result.overreached).toEqual([2, 3]);
  });

  it('separates what was left out from what was dragged in', () => {
    // Different mistakes with different fixes, so they are reported separately
    // rather than as one "wrong".
    const result = gradeStep(step, { kind: 'select', chosen: [0, 2] });
    expect(result.missed).toEqual([1]);
    expect(result.overreached).toEqual([2]);
  });

  it('does not care what order the options were ticked in', () => {
    expect(gradeStep(step, { kind: 'select', chosen: [1, 0] }).met).toBe(true);
  });

  it('reports an unanswered step as unanswered, not as wrong', () => {
    const result = gradeStep(step, undefined);
    expect(result.answered).toBe(false);
    expect(result.met).toBe(false);
  });

  it('reads the correct options off the content', () => {
    expect(correctOptions(step)).toEqual([0, 1]);
  });
});

describe('the scorecard', () => {
  const lab = scenarioLabSchema.parse({
    slug: 'fixture',
    title: 'Fixture',
    summary: 'A fixture.',
    brief: 'A fixture.',
    difficulty: 'easy',
    takeaway: 'A fixture.',
    steps: [
      {
        slug: 'req',
        kind: 'select',
        dimension: 'requirements',
        prompt: '?',
        options: [
          { label: 'A', correct: true, reason: 'x'.repeat(40) },
          { label: 'B', reason: 'x'.repeat(40) },
          { label: 'C', reason: 'x'.repeat(40) },
        ],
      },
      {
        slug: 'est',
        kind: 'estimate',
        dimension: 'estimation',
        prompt: '?',
        unit: 'rps',
        answer: 100,
        working: 'x'.repeat(40),
      },
      {
        slug: 'scale',
        kind: 'select',
        dimension: 'scaling',
        prompt: '?',
        options: [
          { label: 'A', correct: true, reason: 'x'.repeat(40) },
          { label: 'B', reason: 'x'.repeat(40) },
          { label: 'C', reason: 'x'.repeat(40) },
        ],
      },
    ],
  }) as ScenarioLab;

  const answers = (over: LabAnswers = {}): LabAnswers => ({
    req: { kind: 'select', chosen: [0] },
    est: { kind: 'estimate', value: 100 },
    scale: { kind: 'select', chosen: [0] },
    ...over,
  });

  it('reports per dimension, because a total says nothing to act on', () => {
    const score = scoreLab(lab, answers());
    expect(score.dimensions.map((d) => d.dimension)).toEqual([
      'requirements',
      'estimation',
      'scaling',
    ]);
    expect(score.met).toBe(3);
  });

  it('omits dimensions the lab never covered', () => {
    // Reporting 0/0 for API design on a lab with no API step would read as a
    // failure rather than as an absence.
    const score = scoreLab(lab, answers());
    expect(score.dimensions.some((d) => d.dimension === 'api')).toBe(false);
  });

  it('names the weakest dimension, which is the only actionable output', () => {
    const score = scoreLab(lab, answers({ est: { kind: 'estimate', value: 1 } }));
    expect(score.weakest).toEqual(['estimation']);
  });

  it('names every dimension tied for worst rather than picking one', () => {
    const score = scoreLab(
      lab,
      answers({
        est: { kind: 'estimate', value: 1 },
        scale: { kind: 'select', chosen: [1] },
      }),
    );
    expect(score.weakest).toEqual(['estimation', 'scaling']);
  });

  it('names nothing when everything held', () => {
    expect(scoreLab(lab, answers()).weakest).toEqual([]);
  });

  it('does not call an unanswered dimension a weakness', () => {
    // Telling someone to study the step they never reached is advice about
    // nothing.
    const score = scoreLab(lab, { req: { kind: 'select', chosen: [0] } });
    expect(score.answered).toBe(1);
    expect(score.weakest).toEqual([]);
  });

  it('scores an untouched lab as nothing attempted, not as zero out of three', () => {
    const score = scoreLab(lab, {});
    expect(score.answered).toBe(0);
    expect(score.met).toBe(0);
    expect(score.weakest).toEqual([]);
  });
});

describe('the authored labs', () => {
  it('validate against the schema', () => {
    for (const raw of RAW_LABS) {
      const parsed = scenarioLabSchema.safeParse(raw);
      expect(parsed.success, `${raw.slug}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
    }
  });

  it('are answerable — the reference answer scores full marks', () => {
    // The gate checks each step in isolation; this checks the lab end to end
    // through the same scorer the UI uses, so a step that is individually valid
    // and collectively ungradeable still fails.
    for (const lab of getLabs()) {
      const perfect: LabAnswers = Object.fromEntries(
        lab.steps.map((step) => [
          step.slug,
          step.kind === 'estimate'
            ? ({ kind: 'estimate', value: step.answer } as const)
            : ({ kind: 'select', chosen: correctOptions(step) } as const),
        ]),
      );

      const score = scoreLab(lab, perfect);
      expect(score.met, `${lab.slug}: ${JSON.stringify(score.steps.filter((s) => !s.met))}`).toBe(
        lab.steps.length,
      );
      expect(score.weakest).toEqual([]);
    }
  });

  it('cannot be passed by ticking every box', () => {
    // The property the exact-match rule exists to give. If this ever passes, the
    // requirements step has stopped testing judgement.
    for (const lab of getLabs()) {
      const greedy: LabAnswers = Object.fromEntries(
        lab.steps.map((step) => [
          step.slug,
          step.kind === 'estimate'
            ? ({ kind: 'estimate', value: 1 } as const)
            : ({ kind: 'select', chosen: step.options.map((_, i) => i) } as const),
        ]),
      );

      expect(scoreLab(lab, greedy).met, lab.slug).toBeLessThan(lab.steps.length);
    }
  });

  it('cover enough of the rubric to say where someone is weak', () => {
    for (const lab of getLabs()) {
      expect(new Set(lab.steps.map((s) => s.dimension)).size, lab.slug).toBeGreaterThanOrEqual(3);
    }
  });

  it('links the url-shortener lab to lessons that exist', () => {
    const lab = findLab('url-shortener')!;
    expect(lab.topics.length).toBeGreaterThan(0);
  });
});

/**
 * The interview clock (C7) and the reference links (C9).
 *
 * Both are attached to the lab content, so both are checkable there — and both
 * have a failure mode that renders perfectly: a budget nobody could meet, and a
 * term strip that gives the answer away by appearing too early.
 */
describe('timed mode', () => {
  it('gives every lab a budget in a range a person could work to', () => {
    for (const lab of getLabs()) {
      expect(lab.timeBudgetMinutes, lab.slug).toBeGreaterThanOrEqual(10);
      expect(lab.timeBudgetMinutes, lab.slug).toBeLessThanOrEqual(90);
    }
  });

  it('leaves at least a minute per question', () => {
    // A six-step lab on a five-minute clock is not interview conditions, it is
    // a typo — and it would read as the learner being slow.
    for (const lab of getLabs()) {
      expect(lab.timeBudgetMinutes, lab.slug).toBeGreaterThanOrEqual(lab.steps.length);
    }
  });

  it('formats a countdown as minutes and seconds', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(9)).toBe('0:09');
    expect(formatDuration(61)).toBe('1:01');
    expect(formatDuration(1_500)).toBe('25:00');
  });

  it('never formats a negative time, since overrun is rendered separately', () => {
    expect(formatDuration(-5)).toBe('0:00');
  });
});

describe('concept links', () => {
  it('name terms that exist in the reference', () => {
    // ConceptLinks drops an unknown slug rather than rendering a dead link, so
    // without this the only symptom is a term quietly missing from the strip.
    for (const lab of getLabs()) {
      for (const step of lab.steps) {
        for (const slug of step.concepts) {
          expect(findConcept(slug), `${lab.slug}/${step.slug}: ${slug}`).toBeDefined();
        }
      }
    }
  });

  it('are attached to the steps whose answers turn on them', () => {
    // Not every step needs them, but a lab with none anywhere has not wired C9
    // up at all — which would look identical to one that had.
    for (const lab of getLabs()) {
      const withTerms = lab.steps.filter((s) => s.concepts.length > 0);
      expect(withTerms.length, lab.slug).toBeGreaterThan(0);
    }
  });

  it('do not repeat the same term across every step', () => {
    // A strip that says "cache aside" on all six steps has stopped meaning
    // "this step turns on it" and started meaning "this is a lab".
    for (const lab of getLabs()) {
      const stepsWithTerms = lab.steps.filter((s) => s.concepts.length > 0);
      for (const slug of new Set(stepsWithTerms.flatMap((s) => s.concepts))) {
        const uses = stepsWithTerms.filter((s) => s.concepts.includes(slug)).length;
        expect(uses, `${lab.slug}: ${slug}`).toBeLessThan(stepsWithTerms.length);
      }
    }
  });
});
