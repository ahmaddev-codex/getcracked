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
 * Where a path through a trade-off ends.
 *
 * `because` is required and `recommend` is deliberately short: an answer with
 * no reasoning is a flowchart, and a learner who can only produce the answer
 * has learned the one thing an interview does not ask for.
 */
export const decisionOutcomeSchema = z.object({
  kind: z.literal('outcome'),
  recommend: z.string().min(1),
  because: z.string().min(1),
  /** What still bites after choosing correctly. */
  caveat: z.string().optional(),
});
export type DecisionOutcome = z.infer<typeof decisionOutcomeSchema>;

export interface DecisionQuestion {
  kind: 'question';
  ask: string;
  /** Why this question is the one worth asking at this point. */
  why?: string;
  options: Array<{
    label: string;
    /**
     * What choosing this tells you, shown *without* choosing it.
     *
     * The reason this is not a quiz: an interview asks "why not the other
     * one?", so a tree that hides the branches you did not take teaches
     * recitation. Every option's note is readable before and after answering.
     */
    note?: string;
    next: DecisionQuestion | DecisionOutcome;
  }>;
}

export const decisionQuestionSchema: z.ZodType<DecisionQuestion> = z.lazy(() =>
  z.object({
    kind: z.literal('question'),
    ask: z.string().min(1),
    why: z.string().optional(),
    options: z
      .array(
        z.object({
          label: z.string().min(1),
          note: z.string().optional(),
          next: z.union([decisionQuestionSchema, decisionOutcomeSchema]),
        }),
      )
      // One option is not a decision, and more than four is a menu nobody
      // reads — at that point the question is really several questions.
      .min(2, 'A decision needs at least two options')
      .max(4, 'More than four options is a menu, not a decision'),
  }),
);

export const decisionTreeSchema = z.object({
  title: z.string().min(1),
  /** The question the whole tree answers, in the words a learner would use. */
  prompt: z.string().min(1),
  root: decisionQuestionSchema,
});
export type DecisionTree = z.infer<typeof decisionTreeSchema>;

/**
 * The six things a System Design interview is actually assessing (C5).
 *
 * Taken from the PRD's rubric rather than invented, and worth stating plainly:
 * **not one of them is "can you draw a diagram"**. A neat architecture diagram
 * with no reasoning behind it fails an interview; a scrappy one with sharp
 * reasoning passes. So a lab is scored on judgement, and judgement is what its
 * steps ask for.
 */
export const labDimensionSchema = z.enum([
  'requirements',
  'estimation',
  'api',
  'data-model',
  'scaling',
  'bottleneck',
]);
export type LabDimension = z.infer<typeof labDimensionSchema>;

/** Reading order, and the order an interview asks them in. */
export const LAB_DIMENSIONS = labDimensionSchema.options;

export const LAB_DIMENSION_LABELS: Record<LabDimension, string> = {
  requirements: 'Requirements gathering',
  estimation: 'Capacity estimation',
  api: 'API design',
  'data-model': 'Data model',
  scaling: 'Scaling strategy',
  bottleneck: 'Bottleneck identification',
};

export const labOptionSchema = z.object({
  label: z.string().min(1),
  /** True when a good answer includes this. */
  correct: z.boolean().default(false),
  /**
   * Why it belongs, or why it does not.
   *
   * Required on *every* option, including the wrong ones, and shown for all of
   * them once answered — the same rule the decision trees follow. A lab that
   * only explains the option you picked teaches you to recognise one answer;
   * the interview question that decides the outcome is "why not the other one?".
   */
  reason: z.string().min(40, 'An option that cannot be argued for or against teaches nothing'),
});
export type LabOption = z.infer<typeof labOptionSchema>;

const labStepBase = {
  slug: z.string().regex(/^[a-z0-9-]+$/),
  dimension: labDimensionSchema,
  /** The question, in the words an interviewer would use. */
  prompt: z.string().min(1),
  /** Markdown context — the brief so far, the figures you were given. */
  detail: z.string().optional(),
};

export const labStepSchema = z.discriminatedUnion('kind', [
  z.object({
    ...labStepBase,
    kind: z.literal('select'),
    /**
     * Whether more than one option belongs.
     *
     * Derived from the content would be neater, but stating it is what lets the
     * gate catch the mismatch: a single-answer step with two correct options is
     * unanswerable, and it renders perfectly.
     */
    multiple: z.boolean().default(false),
    options: z.array(labOptionSchema).min(3, 'Fewer than three options is a coin toss'),
  }),
  z.object({
    ...labStepBase,
    kind: z.literal('estimate'),
    /** What is being counted — "requests per second", "GB per year". */
    unit: z.string().min(1),
    answer: z.number().positive(),
    /**
     * Accepted spread, as a factor either way.
     *
     * An interview asks you to be *roughly* right out loud, so an exact-match
     * check would fail the skill it is testing. Three is the default because it
     * is what "right order of magnitude" means in practice: 100M when the answer
     * is 200M is a good estimate, 5M is not.
     */
    tolerance: z.number().min(1).default(3),
    /** The arithmetic, shown once answered. Never just the number. */
    working: z.string().min(40),
  }),
]);
export type LabStep = z.infer<typeof labStepSchema>;

/**
 * A guided System Design scenario (C2), scored against the rubric (C5).
 *
 * **Why this is not a whiteboard.** C1 specifies a free-form diagramming canvas,
 * and it is deliberately not what a lab is built on. A diagram can only be
 * auto-graded on its topology — "is there a cache between the app and the
 * database?" — which is a shallow proxy for the six things above, and the one
 * dimension it touches at all is scaling. Grading structured judgement grades
 * the thing the rubric actually names. A canvas can still arrive later as a
 * place to sketch *alongside* a lab; it should not be the surface the score
 * comes from.
 */
export const scenarioLabSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  /** Markdown. The scenario as an interviewer would open it. */
  brief: z.string().min(1),
  difficulty: difficultySchema,
  /** Lessons this exercises, for the roadmap join and the "read this first" nudge. */
  topics: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
  steps: z.array(labStepSchema).min(1),
  /**
   * What a strong answer sounds like, read after the scorecard.
   *
   * Prose rather than a checklist on purpose: the steps already checked the
   * parts, and what a learner cannot get from a list of parts is how they join
   * into something you could say out loud for five minutes.
   */
  takeaway: z.string().min(1),
});
export type ScenarioLab = z.infer<typeof scenarioLabSchema>;
export type ScenarioLabInput = z.input<typeof scenarioLabSchema>;

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
        .enum([
          'array',
          'stack',
          'queue',
          'linked-list',
          'tree',
          'heap',
          'graph',
          'map',
          'grid',
        ])
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

  /**
   * A walkable trade-off (C4).
   *
   * The lesson already states its trade-offs as prose — `whenToUse.reachFor`
   * and `insteadOf`. This is the same material as a decision you make rather
   * than a list you read, which is the form an interview actually asks for:
   * nobody is asked to recite when to use a relational database, they are asked
   * which one they would choose here and why.
   *
   * **Nested rather than a node graph with ids.** A tree with `next: nodeId`
   * needs the content gate to prove there are no cycles and no orphans; nesting
   * makes both structurally impossible, which is a better guarantee than a
   * check.
   */
  decisionTree: z.lazy(() => decisionTreeSchema).optional(),

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

/**
 * One file in a build challenge's workspace.
 *
 * Named without an extension, because the same module is `store.js` in
 * JavaScript and `store.py` in Python and the challenge is authored once for
 * both (AD-3). The extension is applied at render time — see
 * `fileNameFor` in content/challenge.ts.
 *
 * Content is resolved *across* steps rather than restated on each one: a step
 * that lists a file without giving it new code inherits the previous step's
 * work. That is what makes tier 3 a single build rather than four unrelated
 * exercises sharing a title.
 */
export const challengeFileSchema = z.object({
  /** Module identifier, valid as an import name in every launch language. */
  name: z.string().regex(/^[a-z][a-z0-9_]*$/, 'File name must be a lowercase identifier'),
  /** Tab label. Defaults to the filename. */
  label: z.string().min(1).optional(),
  /**
   * What the learner is handed at this step.
   *
   * Omitted means "carry forward" — the learner's own work from an earlier
   * step, falling back to the author's build of it. See resolveStepFiles.
   */
  starterCode: z.partialRecord(languageSchema, z.string().min(1)).optional(),
  /**
   * The author's implementation of this file *as of this step*.
   *
   * Per step rather than per file, because a build challenge revisits the same
   * file: `lru_cache` after step 2 evicts, and after step 3 it also reorders on
   * read. One solution per file could only ever describe the finished article,
   * which would make every intermediate step unverifiable.
   */
  solution: z.partialRecord(languageSchema, z.string().min(1)).optional(),
  /**
   * False for scaffolding the learner reads but does not write.
   *
   * Load-bearing rather than cosmetic: a test spec calls one function with JSON
   * arguments, and what a build challenge produces is usually a *class*. A
   * read-only harness module that constructs the learner's class and replays a
   * command sequence is what bridges the two — and it must not be editable, or
   * the spec could be satisfied by rewriting the harness.
   *
   * Optional rather than defaulted, because it **carries forward** like the
   * file's content does: editability is a property of the file across the whole
   * build, not of one step's mention of it. Defaulting it to `true` per step
   * would mean an author who wrote `{ name: 'harness' }` on step 2 silently made
   * the harness writable — and a learner could then pass by editing the tests'
   * own scaffolding. Absent everywhere means editable.
   */
  editable: z.boolean().optional(),
});
export type ChallengeFile = z.infer<typeof challengeFileSchema>;

/**
 * One step of a build challenge.
 *
 * Deliberately the runnable unit with its source fields swapped out (AD-7): a
 * step has a brief, hints, a test spec and a complexity target exactly as a
 * problem does, and differs only in that its source is a *set* of files rather
 * than one string. `stepAsExercise` in content/challenge.ts projects it back to
 * a plain `RunnableExercise` for a given language, so the content gate, the
 * editor and the runner all keep treating it as one unit.
 */
export const challengeStepSchema = runnableExerciseSchema
  .omit({ starterCode: true, referenceSolution: true })
  .extend({
    files: z.array(challengeFileSchema).min(1),
    /**
     * The file holding `testSpec.entry`. Defaults to the first file listed.
     *
     * Explicit because the entry is usually the read-only harness, not the file
     * the learner is editing — guessing would pick the wrong one exactly when
     * the challenge is most interesting.
     */
    entryFile: z.string().optional(),
    /** The file the editor opens on. Defaults to the first editable file. */
    focus: z.string().optional(),
  });
export type ChallengeStep = z.infer<typeof challengeStepSchema>;

/** Tier-3 build-it challenge: an ordered sequence of steps over a shared workspace. */
export const challengeSchema = z.object({
  tier: z.literal('challenge'),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  category: z.enum(['dsa', 'real-world', 'design-patterns']),
  /** One line for the catalog. */
  summary: z.string().min(1),
  /** Markdown. What the finished thing is, and why it is worth building. */
  brief: z.string().min(1),
  /**
   * Practice difficulty, on the same scale a problem uses.
   *
   * A build is longer than a problem but not automatically harder, and ranking
   * every challenge `hard` by virtue of its tier would tell a learner nothing.
   */
  difficulty: difficultySchema,
  /**
   * Lesson slugs this build applies.
   *
   * The join that makes B20 possible in both directions: a topic's roadmap node
   * can count its challenges, and a problem set can offer the deeper build.
   * Authored, never inferred from the title — `rate-limiter` applies queues and
   * hashing, and no string match would find that.
   */
  topics: z.array(z.string().regex(/^[a-z0-9-]+$/)).default([]),
  steps: z.array(challengeStepSchema).min(1),
  /** Guidance only, exactly as elsewhere: nothing is locked (§6.6, B16). */
  recommendedAfter: z.array(z.string()).default([]),
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
