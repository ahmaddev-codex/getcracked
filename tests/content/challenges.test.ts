import { describe, expect, it } from 'vitest';
import {
  getChallenges,
  getChallengesForTopic,
  findChallenge,
  RAW_CHALLENGES,
  RAW_LESSONS,
} from '@/content/registry';
import { challengeSchema, exerciseId } from '@/content/schema';
import {
  challengeLanguages,
  entryFileFor,
  fileEditable,
  focusFileFor,
  referenceProgram,
  starterProgram,
  stepIds,
} from '@/content/challenge';
import { runTestSpec } from '@/content/test-runner';

/**
 * The authored build catalog, as tests rather than only as a build script.
 *
 * `pnpm content:check` fails the build; these fail the suite. Both matter — a
 * contributor running `pnpm test` should learn their build is broken without
 * waiting for a build.
 */

describe('authored challenges', () => {
  it('validate against the schema', () => {
    for (const raw of RAW_CHALLENGES) {
      const parsed = challengeSchema.safeParse(raw);
      expect(parsed.success, `${raw.slug}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
    }
  });

  it('have unique ids, and unique step ids within each build', () => {
    const slugs = getChallenges().map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    for (const challenge of getChallenges()) {
      const ids = stepIds(challenge);
      expect(new Set(ids).size, challenge.slug).toBe(ids.length);
    }
  });

  it('name only lessons that exist, in both relations', () => {
    // Both render links. A slug naming nothing is a dead end on the roadmap node
    // that counts it and on the problem set that offers it (B20).
    const lessons = new Set(RAW_LESSONS.map((l) => l.slug));
    for (const challenge of getChallenges()) {
      for (const topic of challenge.topics) expect(lessons, challenge.slug).toContain(topic);
      for (const after of challenge.recommendedAfter) {
        expect(lessons, challenge.slug).toContain(after);
      }
    }
  });

  it('are reachable from the topics they claim', () => {
    for (const challenge of getChallenges()) {
      for (const topic of challenge.topics) {
        expect(getChallengesForTopic(topic).map((c) => c.slug)).toContain(challenge.slug);
      }
    }
  });

  it('build in JavaScript at minimum — the baseline language', () => {
    for (const challenge of getChallenges()) {
      expect(challengeLanguages(challenge), challenge.slug).toContain('javascript');
    }
  });

  it('address steps the way progress addresses them', () => {
    const challenge = getChallenges()[0];
    expect(stepIds(challenge)[0]).toBe(exerciseId(challenge, challenge.steps[0].slug));
  });
});

describe.each(getChallenges().map((c) => [c.slug, c] as const))(
  'challenge: %s',
  (_slug, challenge) => {
    it('opens the editor on a file the learner may actually write', () => {
      for (const [index, step] of challenge.steps.entries()) {
        const names = step.files.map((f) => f.name);
        expect(names, step.slug).toContain(entryFileFor(step));
        const focus = focusFileFor(challenge, index);
        expect(names, step.slug).toContain(focus);
        expect(fileEditable(challenge, index, focus), `${step.slug}/${focus}`).toBe(true);
      }
    });

    it('keeps the scaffolding read-only at every step', () => {
      // A learner who can rewrite the harness can satisfy the spec without
      // building anything, so this is a correctness property rather than a
      // presentation one.
      for (const [index, step] of challenge.steps.entries()) {
        for (const file of step.files) {
          if (file.name !== 'harness') continue;
          expect(fileEditable(challenge, index, 'harness'), `${step.slug}`).toBe(false);
        }
      }
    });

    describe.each(challengeLanguages(challenge))('%s', (language) => {
      it.each(challenge.steps.map((s, i) => [s.slug, i] as const))(
        'step %s: the reference build passes, the starting workspace does not',
        async (_stepSlug, index) => {
          const step = challenge.steps[index];

          const reference = referenceProgram(challenge, index, language);
          const ref = await runTestSpec({
            spec: step.testSpec,
            source: reference.source,
            modules: reference.modules,
            entryModule: reference.entryModule,
            language,
          });
          const failed = ref.cases.filter((c) => !c.passed);
          expect(
            ref.passed,
            failed.length
              ? `${failed[0].name}: expected ${JSON.stringify(failed[0].expected)}, got ${JSON.stringify(failed[0].actual)}${failed[0].error ? ` (${failed[0].error})` : ''}`
              : '',
          ).toBe(true);

          // The starter for a later step is the *previous* step's build, so
          // this failing is the machine-checkable statement that the step adds
          // something. It is also what proves a learner can open step 3 first
          // and still have work to do.
          const starter = starterProgram(challenge, index, language);
          const stub = await runTestSpec({
            spec: step.testSpec,
            source: starter.source,
            modules: starter.modules,
            entryModule: starter.entryModule,
            language,
          });
          expect(stub.passed, 'the starting workspace already passes this step').toBe(false);
        },
      );
    });
  },
);

describe('lru-cache, specifically', () => {
  const challenge = findChallenge('lru-cache')!;

  it('is a real multi-file build, not one file wearing a tab bar', () => {
    // The whole reason tier 3 needed a runner change. If this ever collapses to
    // one file the multi-file path stops being exercised by real content.
    for (const step of challenge.steps) {
      expect(step.files.length).toBeGreaterThan(1);
    }
  });

  it('drives the learner‘s class through the harness rather than calling it directly', () => {
    for (const step of challenge.steps) {
      expect(entryFileFor(step)).toBe('harness');
    }
  });
});
