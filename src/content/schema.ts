import { z } from 'zod';

/**
 * Content model (AD-1, AD-7, ADR 0001 §8).
 *
 * Content lives in the repo as typed modules, never in the database. Validation
 * is a Zod schema checked in CI, so an invalid exercise fails the build rather
 * than failing a learner mid-attempt.
 *
 * The same schemas are Module J's output contract (J8): pipeline-generated
 * content and hand-authored content pass through one gate, so the pipeline
 * cannot publish something an author could not have written.
 */

export const LANGUAGES = ['javascript', 'python'] as const;
export type Language = (typeof LANGUAGES)[number];

/** PRD H1: Java is suspended, not cancelled. Adding it back is one entry here. */
export const languageSchema = z.enum(LANGUAGES);

export const tierSchema = z.enum(['lesson', 'problem', 'challenge']);
export type Tier = z.infer<typeof tierSchema>;

export const difficultySchema = z.enum(['warm-up', 'core', 'stretch']);

/**
 * One test case: arguments in, expected value out.
 *
 * Deliberately data, not code. A case written as an assertion in JavaScript
 * would have to be rewritten for every other language; as data it is
 * interpreted by whichever runtime adapter runs it (AD-3), so one spec covers
 * every language and cannot drift between them.
 */
export const testCaseSchema = z.object({
  name: z.string().min(1).optional(),
  args: z.array(z.unknown()),
  expected: z.unknown(),
  /** Hidden cases still run but are not shown before a learner passes. */
  hidden: z.boolean().default(false),
});
export type TestCase = z.infer<typeof testCaseSchema>;

export const testSpecSchema = z.object({
  /** Function the learner must implement. */
  entry: z.string().min(1),
  cases: z.array(testCaseSchema).min(1, 'A test spec needs at least one case'),
});
export type TestSpec = z.infer<typeof testSpecSchema>;

/**
 * The single runnable unit underlying all three tiers (AD-7).
 *
 * A lesson's guided exercise, a practice problem, and one step of a build-it
 * challenge are the same thing packaged differently. Defining it once is what
 * stops each tier growing its own divergent copy of starter code, hints, and
 * test shape.
 */
export const runnableExerciseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase kebab-case'),
  title: z.string().min(1),
  /** Markdown. What the learner is asked to do. */
  brief: z.string().min(1),
  /** Revealed one at a time (A8), so order is meaningful. */
  hints: z.array(z.string().min(1)).min(2, 'Every exercise needs at least 2 hints'),
  /** Per language, so a learner can switch without losing the scaffold (A6). */
  starterCode: z.partialRecord(languageSchema, z.string().min(1)),
  /** Per language. Used to validate the spec itself — see checkExercise. */
  referenceSolution: z.partialRecord(languageSchema, z.string().min(1)),
  testSpec: testSpecSchema,
});
export type RunnableExercise = z.infer<typeof runnableExerciseSchema>;

/** Tier-2 practice problem (B15). */
export const problemSchema = runnableExerciseSchema.extend({
  tier: z.literal('problem'),
  topic: z.string().regex(/^[a-z0-9-]+$/),
  difficulty: difficultySchema,
  /** Companies known to have asked a variant (B19). */
  companies: z.array(z.string()).default([]),
});
export type Problem = z.infer<typeof problemSchema>;

/**
 * What an author writes, as opposed to what the parser returns.
 *
 * Fields with defaults are required in the parsed output but optional in the
 * source, so content modules are typed against the input. Typing them against
 * the output would force every author to restate every default.
 */
export type ProblemInput = z.input<typeof problemSchema>;

/** Tier-1 lesson (B9, B10). Its guided exercises are the same runnable unit. */
export const lessonSchema = z.object({
  tier: z.literal('lesson'),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  /** Markdown body — the explainer, pitfalls, and pattern cues (B10). */
  body: z.string().min(1),
  exercises: z.array(runnableExerciseSchema).default([]),
  /**
   * Recommended prerequisites — guidance only. Nothing is locked (PRD §6.6,
   * B16): these drive ordering and nudges, never access.
   */
  recommendedAfter: z.array(z.string()).default([]),
});
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonInput = z.input<typeof lessonSchema>;

/** Tier-3 build-it challenge: an ordered sequence of the same runnable unit. */
export const challengeSchema = z.object({
  tier: z.literal('challenge'),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  category: z.enum(['dsa', 'real-world', 'design-patterns']),
  steps: z.array(runnableExerciseSchema).min(1),
});
export type Challenge = z.infer<typeof challengeSchema>;
export type ChallengeInput = z.input<typeof challengeSchema>;

export const contentSchema = z.discriminatedUnion('tier', [
  problemSchema,
  lessonSchema,
  challengeSchema,
]);
export type Content = z.infer<typeof contentSchema>;

/** Stable identifier used by progress rows and analytics. Never a database id. */
export function exerciseId(content: { tier: Tier; slug: string }, step?: string): string {
  const base = `${content.tier}s/${content.slug}`;
  return step ? `${base}/${step}` : base;
}
