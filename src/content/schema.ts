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

/**
 * Practice difficulty, in the words the rest of the industry uses.
 *
 * Deliberately *not* the same scale as a lesson's `difficulty`
 * (foundational · core · advanced). They measure different things: a lesson is
 * ranked by how much it assumes, a problem by how hard it is to solve. Sharing
 * a vocabulary would imply a mapping between them that does not exist — an
 * advanced topic can have an easy first problem.
 */
export const difficultySchema = z.enum(['easy', 'medium', 'hard']);
export type Difficulty = z.infer<typeof difficultySchema>;

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
  /**
   * Not listed in the UI, so a learner aims for a general solution.
   *
   * Hidden, not secret: tests run in the learner's browser (AD-2), so the whole
   * spec reaches the client either way.
   */
  hidden: z.boolean().default(false),
});
export type TestCase = z.infer<typeof testCaseSchema>;

export const testSpecSchema = z.object({
  /** Function the learner must implement. */
  entry: z.string().min(1),
  /**
   * Per-language overrides for the entry name.
   *
   * Idiomatic naming differs — `twoSum` in JavaScript is `two_sum` in Python —
   * and forcing one convention on every language would teach learners to write
   * code that looks wrong in the language they are writing it in.
   */
  entryByLanguage: z.partialRecord(languageSchema, z.string().min(1)).optional(),
  cases: z.array(testCaseSchema).min(1, 'A test spec needs at least one case'),
});
export type TestSpec = z.infer<typeof testSpecSchema>;

/** The function name to call for a given language. */
export function entryFor(spec: TestSpec, language: Language): string {
  return spec.entryByLanguage?.[language] ?? spec.entry;
}

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
  /**
   * The target asymptotic cost, stated by the author.
   *
   * Deliberately authored rather than inferred: Big-O is a claim about growth,
   * and no amount of running a function on one input can establish it. The
   * runtime measures what actually happened (lib/runtime/measure.ts); this is
   * what the learner is aiming for.
   */
  complexity: z
    .object({
      time: z.string().min(1),
      space: z.string().min(1),
      /** Why that bound holds — shown once a learner passes. */
      note: z.string().optional(),
    })
    .optional(),
});
export type RunnableExercise = z.infer<typeof runnableExerciseSchema>;

/** Tier-2 practice problem (B15). */
export const problemSchema = runnableExerciseSchema.extend({
  tier: z.literal('problem'),
  topic: z.string().regex(/^[a-z0-9-]+$/),
  difficulty: difficultySchema,
  /** Companies known to have asked a variant (B19). */
  companies: z.array(z.string()).default([]),
  /**
   * Lessons this problem reads best after (B16).
   *
   * Drives a suggestion and nothing else. There is no code path that turns this
   * into a lock — see lib/recommendations.ts.
   */
  recommendedAfter: z.array(z.string()).default([]),
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

/**
 * Tier-1 lesson (B9, B10).
 *
 * The five sections are separate fields rather than one markdown blob, because
 * B10 fixes their order and every lesson should teach in the same shape — a
 * learner who has read one knows where to find the pitfalls in the next. It also
 * lets the walkthrough be structured data the animator can execute (T2.8)
 * instead of prose it would have to parse.
 */
export const lessonSchema = z.object({
  tier: z.literal('lesson'),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  /** One line for the index. */
  summary: z.string().min(1),
  /** Curriculum position. Ordering only — it gates nothing (§6.6). */
  order: z.number().int().nonnegative(),

  /**
   * Which of the two tracks this lesson belongs to.
   *
   * The split is not cosmetic. A data structure is a thing you *hold* state in
   * and is chosen by its operation costs; an algorithm is a thing you *do* and
   * is chosen by the shape of the problem. Learners routinely conflate the two
   * — "should I use a heap or binary search?" is a question that only sounds
   * sensible until the tracks are separated — so the curriculum separates them
   * and each track answers its own selection question.
   */
  track: z.enum(['data-structures', 'algorithms', 'system-design']),

  /**
   * How hard the topic is, so a learner knows where to start.
   *
   * Ranking, never a gate (§6.6, B14): an advanced lesson is one click away from
   * anyone at any time. What this buys is an answer to "where do I begin?",
   * which curriculum order alone does not give — order says what follows what,
   * difficulty says what is safe to skip to.
   */
  difficulty: z.enum(['foundational', 'core', 'advanced']),

  /**
   * The asymptotic table: what each operation costs.
   *
   * Separate from `complexity`, which describes the *pattern* as a whole. This
   * is the per-operation breakdown a learner actually compares structures on —
   * "insert is O(1) but lookup is O(n)" is the sentence that decides between a
   * list and an array, and a single summary figure cannot express it.
   */
  operations: z
    .array(
      z.object({
        name: z.string().min(1),
        time: z.string().min(1),
        note: z.string().optional(),
      }),
    )
    .default([]),

  /**
   * Concept-reference terms this lesson covers.
   *
   * The join between the path and the vocabulary. System Design lessons and the
   * concept map were two separate diagrams describing the same material, which
   * made a learner check both; declaring the relationship lets the terms hang
   * off the lesson that teaches them, exactly as practice problems hang off a
   * DSA lesson.
   *
   * Authored deliberately rather than inferred from category names, because the
   * mapping is genuinely uneven — `networking` splits across load balancing and
   * CDNs, and some terms belong to no lesson at all. A forced mapping would
   * assert a relationship the curriculum does not have.
   */
  concepts: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),

  /** Named variants worth recognising by name. */
  variants: z
    .array(z.object({ name: z.string().min(1), what: z.string().min(1) }))
    .default([]),

  /**
   * Where to read more, off-platform.
   *
   * Linked rather than ingested: these are references, not content we host, so
   * they carry no licence question (contrast Module J, where the text itself is
   * reproduced). Each names its source so a learner can judge it before
   * clicking.
   */
  furtherReading: z
    .array(
      z.object({
        label: z.string().min(1),
        url: z.string().url(),
        source: z.string().min(1),
      }),
    )
    .default([]),

  /** (a) What the structure or pattern is. Markdown. */
  explainer: z.string().min(1),

  /**
   * (b) The animated walkthrough slot.
   *
   * Structured so T2.8 can run it through the same runtime the learner's own
   * code uses, rather than replaying a recording. Optional while the animator
   * is unbuilt; the page renders a placeholder in its absence.
   */
  walkthrough: z
    .object({
      entry: z.string().min(1),
      /**
       * Per-language entry name, for the same reason `testSpec` has one: the
       * walkthrough shows idiomatic code, and `runningSum` is `running_sum` in
       * Python.
       */
      entryByLanguage: z.partialRecord(languageSchema, z.string().min(1)).optional(),
      source: z.partialRecord(languageSchema, z.string().min(1)),
      /**
       * The shape the animation should draw.
       *
       * Cannot be inferred: a heap, a DP table and a queue are all arrays as far
       * as the trace is concerned. Defaults to `array`, which is always a
       * truthful picture even when a more specific one would teach more.
       */
      visual: z
        .enum(['array', 'stack', 'queue', 'linked-list', 'tree', 'heap', 'graph', 'map'])
        .default('array'),
      /** The call the animation steps through. */
      args: z.array(z.unknown()),
      caption: z.string().optional(),
    })
    .optional(),

  /** (c) What it costs, and why. */
  complexity: z
    .object({
      time: z.string().min(1),
      space: z.string().min(1),
      note: z.string().optional(),
    })
    .optional(),

  /** (d) How to recognise a problem this pattern solves. */
  patternCues: z.array(z.string().min(1)).default([]),

  /**
   * (f) Why this one, and not the obvious alternative.
   *
   * Beyond B10's five sections, because knowing how a heap works does not tell
   * you when to reach for one — and "when to reach for one" is the actual skill
   * an interview tests. `reachFor` is the positive case; `insteadOf` names the
   * thing a learner would otherwise have used and says what it costs, which is
   * the comparison that makes the choice stick.
   */
  whenToUse: z
    .object({
      reachFor: z.array(z.string().min(1)).min(1),
      insteadOf: z
        .array(
          z.object({
            alternative: z.string().min(1),
            why: z.string().min(1),
          }),
        )
        .default([]),
    })
    .optional(),

  /** (e) The mistakes this topic reliably produces. */
  pitfalls: z
    .array(z.object({ title: z.string().min(1), body: z.string().min(1) }))
    .default([]),

  /** Guided exercises — the same runnable unit as a problem (AD-7, B11). */
  exercises: z.array(runnableExerciseSchema).default([]),

  /**
   * Lessons usually read better after these, and problem sets use the same
   * relation to suggest an order. Guidance only: nothing is locked (§6.6, B16).
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

/**
 * Stable identifier used by progress rows and analytics. Never a database id.
 *
 * `step` addresses a unit nested inside its parent — a lesson's guided exercise,
 * or one step of a build-it challenge. Both are the same runnable unit (AD-7),
 * so both address the same way.
 */
export function exerciseId(content: { tier: Tier; slug: string }, step?: string): string {
  const base = `${content.tier}s/${content.slug}`;
  return step ? `${base}/${step}` : base;
}
