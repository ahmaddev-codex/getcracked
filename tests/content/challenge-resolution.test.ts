import { describe, expect, it } from 'vitest';
import {
  ChallengeResolutionError,
  challengeLanguages,
  composeProgram,
  entryFileFor,
  fileEditable,
  fileNameFor,
  focusFileFor,
  referenceProgram,
  resolveStepFiles,
  starterProgram,
  stepIds,
} from '@/content/challenge';
import { challengeSchema, type Challenge, type ChallengeInput } from '@/content/schema';

/**
 * Workspace resolution — the whole of the tier-3 content model.
 *
 * Tested against a purpose-built fixture rather than the real catalog, because
 * these are assertions about the *rules* (what carries forward, what a starter
 * offsets from) and a fixture can state each rule in three lines. The real
 * catalog is exercised separately, end to end, in challenges.test.ts.
 */

function parse(input: ChallengeInput): Challenge {
  const result = challengeSchema.safeParse(input);
  if (!result.success) throw new Error(JSON.stringify(result.error.issues));
  return result.data;
}

const base = {
  tier: 'challenge',
  slug: 'fixture',
  title: 'Fixture',
  category: 'dsa',
  difficulty: 'easy',
  summary: 'A fixture.',
  brief: 'A fixture.',
} as const;

const step = (over: Partial<ChallengeInput['steps'][number]>) => ({
  slug: 'a',
  title: 'A',
  brief: 'Do a thing.',
  hints: ['one', 'two'],
  files: [{ name: 'main' }],
  testSpec: { entry: 'go', cases: [{ args: [], expected: 1 }] },
  ...over,
});

describe('file naming', () => {
  it('gives one module name the right extension per language', () => {
    expect(fileNameFor('lru_cache', 'javascript')).toBe('lru_cache.js');
    expect(fileNameFor('lru_cache', 'python')).toBe('lru_cache.py');
  });
});

describe('carry-forward resolution', () => {
  const challenge = parse({
    ...base,
    steps: [
      step({
        slug: 'one',
        files: [
          {
            name: 'main',
            starterCode: { javascript: 'STARTER_1' },
            solution: { javascript: 'SOLUTION_1' },
          },
          { name: 'harness', editable: false, starterCode: { javascript: 'HARNESS' } },
        ],
      }),
      step({
        slug: 'two',
        files: [{ name: 'main', solution: { javascript: 'SOLUTION_2' } }, { name: 'harness' }],
      }),
      step({
        slug: 'three',
        files: [{ name: 'main' }, { name: 'harness' }],
      }),
    ],
  });

  it('hands step 1 its own declared starter', () => {
    const [main] = resolveStepFiles(challenge, 0, 'javascript');
    expect(main.starter).toBe('STARTER_1');
    expect(main.reference).toBe('SOLUTION_1');
  });

  it('starts a later step from the previous step‘s build, not its own answer', () => {
    // The offset is the model: what you are handed is the build up to here,
    // what the author would write is the build including here.
    const [main] = resolveStepFiles(challenge, 1, 'javascript');
    expect(main.starter).toBe('SOLUTION_1');
    expect(main.reference).toBe('SOLUTION_2');
  });

  it('carries the newest build forward through a step that declares nothing', () => {
    const [main] = resolveStepFiles(challenge, 2, 'javascript');
    expect(main.starter).toBe('SOLUTION_2');
    // Nothing new was authored, so the reference is what came before.
    expect(main.reference).toBe('SOLUTION_2');
  });

  it('carries read-only scaffolding — and its editability — through every step', () => {
    // `editable: false` is declared once, on step 1. Requiring it on every step
    // would work until the step that forgot, and that is the step where a
    // learner could edit the harness the tests run them through.
    for (const index of [0, 1, 2]) {
      const harness = resolveStepFiles(challenge, index, 'javascript')[1];
      expect(harness.editable).toBe(false);
      // No solution exists because there is nothing to solve; the starter is
      // both what the learner sees and what the author would run.
      expect(harness.starter).toBe('HARNESS');
      expect(harness.reference).toBe('HARNESS');
    }
  });

  it('lets a read-only file be replaced later without touching learner work', () => {
    // The token-bucket build does exactly this: the harness drives a bucket for
    // three steps and a limiter at the fourth.
    const replaced = parse({
      ...base,
      steps: [
        step({
          slug: 'one',
          files: [
            { name: 'main', starterCode: { javascript: 'S1' }, solution: { javascript: 'R1' } },
            { name: 'harness', editable: false, starterCode: { javascript: 'H1' } },
          ],
        }),
        step({
          slug: 'two',
          files: [
            { name: 'main' },
            { name: 'harness', editable: false, starterCode: { javascript: 'H2' } },
          ],
        }),
      ],
    });

    expect(resolveStepFiles(replaced, 0, 'javascript')[1].starter).toBe('H1');
    expect(resolveStepFiles(replaced, 1, 'javascript')[1].starter).toBe('H2');
    // The learner's own file is untouched by the swap.
    expect(resolveStepFiles(replaced, 1, 'javascript')[0].starter).toBe('R1');
  });
});

describe('unresolvable content', () => {
  it('names the file and language rather than rendering an empty editor', () => {
    const broken = parse({
      ...base,
      steps: [step({ files: [{ name: 'main', starterCode: { javascript: 'S' } }] })],
    });

    expect(() => resolveStepFiles(broken, 0, 'python')).toThrow(ChallengeResolutionError);
    expect(() => resolveStepFiles(broken, 0, 'python')).toThrow(/"main"/);
    expect(() => resolveStepFiles(broken, 0, 'python')).toThrow(/python/);
  });

  it('reports a half-translated build as one language, not two', () => {
    const jsOnly = parse({
      ...base,
      steps: [
        step({
          slug: 'one',
          files: [
            {
              name: 'main',
              starterCode: { javascript: 'S', python: 'S' },
              solution: { javascript: 'R', python: 'R' },
            },
          ],
        }),
        // Step 2 was written in JavaScript only. Resolution alone would still
        // succeed for Python — carry-forward hands back step 1's code — and a
        // learner would get a Python switcher into a step that asks nothing.
        step({
          slug: 'two',
          files: [{ name: 'main', solution: { javascript: 'R2' } }],
        }),
      ],
    });

    expect(resolveStepFiles(jsOnly, 1, 'python')[0].starter).toBe('R');
    expect(challengeLanguages(jsOnly)).toEqual(['javascript']);
  });
});

describe('entry and focus', () => {
  const challenge = parse({
    ...base,
    steps: [
      step({
        files: [
          { name: 'harness', editable: false, starterCode: { javascript: 'H' } },
          { name: 'main', starterCode: { javascript: 'S' }, solution: { javascript: 'R' } },
        ],
        entryFile: 'harness',
      }),
    ],
  });

  it('defaults the entry to the first file listed', () => {
    const noEntry = parse({ ...base, steps: [step({ files: [{ name: 'main', starterCode: { javascript: 'S' } }] })] });
    expect(entryFileFor(noEntry.steps[0])).toBe('main');
  });

  it('defaults the focus to the first editable file, never the scaffolding', () => {
    // The entry is usually the read-only harness, so opening the editor on the
    // entry would put a learner in a file they cannot change.
    expect(entryFileFor(challenge.steps[0])).toBe('harness');
    expect(focusFileFor(challenge, 0)).toBe('main');
  });

  it('does not treat a bare later mention of scaffolding as editable', () => {
    const carried = parse({
      ...base,
      steps: [
        step({
          slug: 'one',
          entryFile: 'harness',
          files: [
            { name: 'harness', editable: false, starterCode: { javascript: 'H' } },
            { name: 'main', starterCode: { javascript: 'S' }, solution: { javascript: 'R' } },
          ],
        }),
        // Deliberately bare, and deliberately listed first: a step-local read of
        // `editable` would pick the harness as the focus here.
        step({ slug: 'two', entryFile: 'harness', files: [{ name: 'harness' }, { name: 'main' }] }),
      ],
    });

    expect(fileEditable(carried, 1, 'harness')).toBe(false);
    expect(focusFileFor(carried, 1)).toBe('main');
  });
});

describe('program composition', () => {
  const challenge = parse({
    ...base,
    steps: [
      step({
        entryFile: 'harness',
        files: [
          { name: 'harness', editable: false, starterCode: { javascript: 'H' } },
          { name: 'main', starterCode: { javascript: 'S' }, solution: { javascript: 'R' } },
        ],
      }),
    ],
  });

  it('splits the entry module from its siblings', () => {
    const program = referenceProgram(challenge, 0, 'javascript');
    expect(program.entryModule).toBe('harness');
    expect(program.source).toBe('H');
    expect(program.modules).toEqual([{ name: 'main', source: 'R' }]);
  });

  it('composes the starting workspace from starters', () => {
    expect(starterProgram(challenge, 0, 'javascript').modules).toEqual([
      { name: 'main', source: 'S' },
    ]);
  });

  it('refuses an entry that is not part of the workspace', () => {
    expect(() => composeProgram([{ name: 'a' }], 'b', { a: '' })).toThrow(
      ChallengeResolutionError,
    );
  });
});

describe('addressing', () => {
  const challenge = parse({
    ...base,
    steps: [
      step({ slug: 'one', files: [{ name: 'main', starterCode: { javascript: 'S' }, solution: { javascript: 'R' } }] }),
      step({ slug: 'two', files: [{ name: 'main' }] }),
    ],
  });

  it('addresses a step the way a lesson exercise is addressed', () => {
    expect(stepIds(challenge)).toEqual(['challenges/fixture/one', 'challenges/fixture/two']);
  });

});
