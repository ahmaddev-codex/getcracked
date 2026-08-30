import {
  RAW_CHALLENGES,
  RAW_LABS,
  RAW_LESSONS,
  RAW_PROBLEMS,
} from '../src/content/registry';
import {
  contentSchema,
  exerciseId,
  LANGUAGES,
  type Challenge,
  type DecisionQuestion,
  type DecisionTree,
  type Language,
  type RunnableExercise,
  scenarioLabSchema,
  type ScenarioLab,
} from '../src/content/schema';
import {
  challengeLanguages,
  entryFileFor,
  fileEditable,
  focusFileFor,
  referenceProgram,
  resolveStepFiles,
  starterProgram,
} from '../src/content/challenge';
import { runTestSpec } from '../src/content/test-runner';
import { walkthroughSpec } from '../src/content/walkthrough';
import { findConcept } from '../src/content/concepts';

/**
 * Content validation gate (ADR 0001 §8, AD-3).
 *
 * Runs in `prebuild`, so invalid content fails the build rather than failing a
 * learner mid-attempt. Two distinct checks, and the second is the one that
 * matters:
 *
 *  1. **Shape** — Zod. Catches a missing hint, a malformed slug, an empty spec.
 *  2. **Behaviour** — every reference solution is executed against its own test
 *     spec, and every starter stub is executed too. The reference must pass and
 *     the starter must fail.
 *
 * That second check is what makes the spec trustworthy. A spec whose own
 * reference solution fails is wrong, and a spec the *starter* passes tests
 * nothing — a learner would "solve" it without writing anything. Both are easy
 * mistakes to make by hand and, at Module J's volume, easy to generate.
 */

interface Problem {
  file: string;
  message: string;
}

const problems: Problem[] = [];

function fail(file: string, message: string) {
  problems.push({ file, message });
}

/** Raw content may be malformed, so describe it defensively. */
function describe(content: unknown): string {
  const c = content as { tier?: string; slug?: string };
  return `${c.tier ?? 'content'} "${c.slug ?? '(no slug)'}"`;
}

/**
 * Runs one exercise's reference and starter against its own spec.
 *
 * Shared by problems and lesson exercises: both are the same runnable unit
 * (AD-7), so both earn the same check. A lesson exercise nobody verified is a
 * comprehension check that might teach the wrong thing.
 */
async function checkExercise(id: string, exercise: RunnableExercise) {
  // Every language the exercise declares is verified, not just the first.
  // A Python reference nobody ran is a solution that may not solve it.
  const languages = LANGUAGES.filter((l) => exercise.referenceSolution[l]);

  if (!languages.includes('javascript')) {
    fail(id, 'No JavaScript reference solution. JavaScript is the baseline language.');
    return;
  }

  for (const language of languages) {
    const reference = exercise.referenceSolution[language];
    const starter = exercise.starterCode[language];

    if (!starter) {
      fail(id, `[${language}] has a reference solution but no starter code.`);
      continue;
    }

    const ref = await runTestSpec({ spec: exercise.testSpec, source: reference!, language });
    if (!ref.passed) {
      const failed = ref.cases.filter((c) => !c.passed);
      fail(
        id,
        `[${language}] reference fails its own spec (${failed.length}/${ref.cases.length} cases). ` +
          `First failure — ${failed[0]?.name}: expected ${JSON.stringify(failed[0]?.expected)}, ` +
          `got ${JSON.stringify(failed[0]?.actual)}${failed[0]?.error ? ` (${failed[0].error})` : ''}`,
      );
    }

    const stub = await runTestSpec({ spec: exercise.testSpec, source: starter, language });
    if (stub.passed) {
      fail(
        id,
        `[${language}] starter code passes the spec — the exercise tests nothing. ` +
          'Add a case the stub cannot satisfy.',
      );
    }
  }
}

/**
 * A build challenge, step by step (tier 3).
 *
 * The same two questions a problem is asked — does the author's own solution
 * pass, and does the starting point fail — but asked of a *resolved workspace*
 * rather than one string. That is what makes carry-forward safe to rely on: a
 * step whose starter is the previous step's build is verified to fail this
 * step's spec, which is the machine-checkable statement of "this step adds
 * something".
 *
 * It also verifies each step is solvable **on its own**. A learner who opens
 * step 3 first is handed the author's build of steps 1 and 2, and running the
 * reference from that exact starting point is what proves that works.
 */
async function checkChallenge(id: string, challenge: Challenge) {
  const languages = challengeLanguages(challenge);

  if (!languages.includes('javascript')) {
    // Report why, not just that: a missing language here is almost always one
    // unresolvable file, and naming it saves reading four steps.
    let detail = '';
    for (const [i] of challenge.steps.entries()) {
      try {
        resolveStepFiles(challenge, i, 'javascript');
      } catch (e) {
        detail = ` (${e instanceof Error ? e.message : String(e)})`;
        break;
      }
    }
    fail(id, `No JavaScript build. JavaScript is the baseline language.${detail}`);
    return;
  }

  const stepSlugs = new Set<string>();
  for (const step of challenge.steps) {
    if (stepSlugs.has(step.slug)) {
      fail(id, `Duplicate step slug "${step.slug}" — step ids would collide in progress.`);
    }
    stepSlugs.add(step.slug);
  }

  for (const [index, step] of challenge.steps.entries()) {
    const where = `${id}/${step.slug}`;
    const names = new Set(step.files.map((f) => f.name));

    // A step naming a file it does not list produces an empty editor or a
    // "cannot find module" that reads as the learner's mistake.
    if (!names.has(entryFileFor(step))) {
      fail(where, `entryFile "${entryFileFor(step)}" is not among this step's files.`);
      continue;
    }
    if (step.focus && !names.has(step.focus)) {
      fail(where, `focus "${step.focus}" is not among this step's files.`);
      continue;
    }
    if (!step.files.some((f) => fileEditable(challenge, index, f.name))) {
      fail(where, 'Every file is read-only, so there is nothing for the learner to write.');
      continue;
    }
    const focus = focusFileFor(challenge, index);
    if (!fileEditable(challenge, index, focus)) {
      fail(where, `focus "${focus}" is read-only — the editor would open on a file nobody can change.`);
    }

    for (const language of languages) {
      const label = `${where} [${language}]`;

      let reference, starter;
      try {
        reference = referenceProgram(challenge, index, language);
        starter = starterProgram(challenge, index, language);
      } catch (e) {
        fail(label, e instanceof Error ? e.message : String(e));
        continue;
      }

      const ref = await runTestSpec({
        spec: step.testSpec,
        source: reference.source,
        modules: reference.modules,
        entryModule: reference.entryModule,
        language,
      });

      if (!ref.passed) {
        const failed = ref.cases.filter((c) => !c.passed);
        fail(
          label,
          `reference build fails its own spec (${failed.length}/${ref.cases.length} cases). ` +
            `First failure — ${failed[0]?.name}: expected ${JSON.stringify(failed[0]?.expected)}, ` +
            `got ${JSON.stringify(failed[0]?.actual)}${failed[0]?.error ? ` (${failed[0].error})` : ''}`,
        );
      }

      const stub = await runTestSpec({
        spec: step.testSpec,
        source: starter.source,
        modules: starter.modules,
        entryModule: starter.entryModule,
        language,
      });

      if (stub.passed) {
        fail(
          label,
          'the starting workspace already passes this step — the step asks for nothing. ' +
            (index === 0
              ? 'Add a case the stub cannot satisfy.'
              : `Its starter is the build carried from "${challenge.steps[index - 1].slug}", so this step's spec must test something that step did not.`),
        );
      }
    }
  }
}

/**
 * A trade-off decision tree (C4).
 *
 * Nesting already makes cycles and orphans impossible, so what is left are the
 * failures that render fine and teach nothing: a branch that stops at a question
 * with no answers behind it, an option nobody could tell apart from its
 * neighbour, or a tree so shallow it is a sentence with a button on it.
 *
 * None of these throw. All of them waste a learner's time, which is why they are
 * a build failure rather than a review note.
 */
function checkDecisionTree(id: string, tree: DecisionTree) {
  const MAX_DEPTH = 6;
  let outcomes = 0;
  let deepest = 0;

  const walk = (node: DecisionQuestion, depth: number, trail: string[]) => {
    deepest = Math.max(deepest, depth);
    const where = `${id} · ${trail.join(' → ') || 'root'}`;

    if (depth > MAX_DEPTH) {
      fail(where, `Decision tree is deeper than ${MAX_DEPTH} questions — nobody finishes it.`);
      return;
    }

    // Two options reading the same is a coin flip wearing a question. It is the
    // easiest mistake to make while authoring and invisible once rendered.
    const labels = node.options.map((o) => o.label.trim().toLowerCase());
    if (new Set(labels).size !== labels.length) {
      fail(where, `Two options share a label: ${labels.join(' / ')}`);
    }

    for (const option of node.options) {
      if (option.next.kind === 'outcome') {
        outcomes++;
        // The recommendation without the reasoning is a flowchart, and the
        // schema's `min(1)` would accept a single character.
        if (option.next.because.length < 40) {
          fail(
            `${where} → ${option.label}`,
            'Outcome reasoning is too short to be an argument. Say why, not just what.',
          );
        }
      } else {
        walk(option.next, depth + 1, [...trail, option.label]);
      }
    }
  };

  walk(tree.root, 1, []);

  if (outcomes < 3) {
    fail(id, `Decision tree has ${outcomes} outcome(s) — that is a sentence, not a decision.`);
  }
  if (deepest < 2) {
    fail(id, 'Decision tree is one question deep. A single question is a radio button.');
  }
}

/**
 * A guided scenario lab (C2) and the rubric it is scored against (C5).
 *
 * Everything here is a failure that renders perfectly and teaches nothing,
 * which is the only kind worth a gate. A step is *content*, so nothing executes
 * — what is checkable is whether the question is answerable and whether the
 * reasoning is actually reasoning.
 */
function checkLab(id: string, lab: ScenarioLab) {
  const slugs = new Set<string>();

  for (const step of lab.steps) {
    const where = `${id}/${step.slug}`;

    if (slugs.has(step.slug)) {
      fail(id, `Duplicate step slug "${step.slug}" — answers are keyed by it, so two steps would share one.`);
    }
    slugs.add(step.slug);

    if (step.kind === 'estimate') {
      // A tolerance of 1 is an exact-match check, which fails the skill the
      // step is testing: estimating out loud is meant to be roughly right.
      if (step.tolerance <= 1) {
        fail(where, 'tolerance must be greater than 1, or the estimate is an exact-match quiz.');
      }
      continue;
    }

    const correct = step.options.filter((o) => o.correct).length;

    if (correct === 0) {
      fail(where, 'No option is marked correct — the step is unanswerable.');
    }
    if (!step.multiple && correct > 1) {
      fail(
        where,
        `Single-answer step has ${correct} correct options. Set multiple: true, or mark one.`,
      );
    }
    if (step.multiple && correct === step.options.length) {
      // "Everything is correct" is the exact failure a requirements step exists
      // to catch, so a step that rewards ticking everything teaches the mistake.
      fail(where, 'Every option is correct, so ticking everything scores full marks.');
    }
    if (correct === step.options.length - 1) {
      fail(
        where,
        'Only one option is wrong, so the step is answerable by elimination without reading.',
      );
    }

    const labels = step.options.map((o) => o.label.trim().toLowerCase());
    if (new Set(labels).size !== labels.length) {
      fail(where, 'Two options read the same, so one of them cannot be argued against.');
    }
  }

  /**
   * A lab must exercise more than one dimension.
   *
   * Six questions on scaling is a quiz about scaling; the rubric's whole claim
   * is that an interview weighs six different things, and a scorecard with one
   * row does not make that point.
   */
  const dimensions = new Set(lab.steps.map((s) => s.dimension));
  if (dimensions.size < 3) {
    fail(
      id,
      `Covers only ${dimensions.size} rubric dimension(s). A scorecard needs at least three to say anything about where a learner is weak.`,
    );
  }
}

async function main() {
  const seen = new Set<string>();

  for (const raw of RAW_PROBLEMS) {
    const parsed = contentSchema.safeParse(raw);
    if (!parsed.success) {
      // Report every issue in the file, not just the first — one run of the
      // gate should tell an author everything they need to fix.
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.') || '(root)';
        fail(describe(raw), `${path}: ${issue.message}`);
      }
      continue;
    }

    const content = parsed.data;
    const id = exerciseId(content);
    if (seen.has(id)) fail(id, 'Duplicate content id — two entries share a tier and slug.');
    seen.add(id);

    // Narrowed above: only problems carry a runnable unit at the top level.
    if (content.tier === 'problem') await checkExercise(id, content);
  }

  for (const raw of RAW_LESSONS) {
    const parsed = contentSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        fail(describe(raw), `${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
      continue;
    }

    const lesson = parsed.data;
    if (lesson.tier !== 'lesson') continue;

    const id = exerciseId(lesson);
    if (seen.has(id)) fail(id, 'Duplicate content id — two entries share a tier and slug.');
    seen.add(id);

    // A recommendation pointing at nothing renders a dead link.
    const slugs = new Set(RAW_LESSONS.map((l) => l.slug));
    for (const prereq of lesson.recommendedAfter) {
      if (!slugs.has(prereq)) {
        fail(id, `recommendedAfter names "${prereq}", which is not an authored lesson.`);
      }
    }

    // A lesson claiming a concept that does not exist renders a term with no
    // definition behind it — a dead end in the one surface whose whole job is
    // answering "what does this word mean?".
    for (const slug of lesson.concepts) {
      if (!findConcept(slug)) {
        fail(id, `declares concept "${slug}", which is not in the concept reference.`);
      }
    }

    if (lesson.decisionTree) checkDecisionTree(id, lesson.decisionTree);

    // Guided exercises earn the same verification a problem does (B11, AD-7).
    for (const exercise of lesson.exercises) {
      await checkExercise(exerciseId(lesson, exercise.slug), exercise);
    }

    // A walkthrough that produces no visual is a broken lesson, and nothing
    // else would catch it — the page renders, just empty.
    //
    // Every declared language is executed, not just JavaScript. The walkthrough
    // now offers a language switcher, so a Python source that throws is a broken
    // control on a shipped page rather than an unused field.
    if (lesson.walkthrough) {
      const walkthrough = lesson.walkthrough;
      const declared = (Object.keys(walkthrough.source) as Language[]).filter(
        (l) => walkthrough.source[l],
      );

      if (declared.length === 0) {
        fail(id, 'walkthrough declares no source in any language.');
      }

      for (const language of declared) {
        const source = walkthrough.source[language]!;
        const entry = walkthrough.entryByLanguage?.[language] ?? walkthrough.entry;
        const where = `walkthrough (${language})`;

        // The entry has to exist in the source, or the failure surfaces as an
        // unhelpful runtime error rather than a naming mistake.
        if (!source.includes(entry)) {
          fail(id, `${where} never defines its entry \`${entry}\`.`);
          continue;
        }

        const run = await runTestSpec({
          // The same construction the lesson page uses, so this gate cannot
          // pass a spec the page would never build.
          spec: walkthroughSpec(walkthrough),
          source,
          language,
          trace: true,
        });

        if (run.timedOut) {
          fail(id, `${where} timed out — it must terminate to be animated.`);
        } else if (run.cases[0]?.error) {
          fail(id, `${where} threw: ${run.cases[0].error}`);
        } else if (!run.trace || run.trace.events.length === 0) {
          fail(id, `${where} produced no trace events — nothing to animate.`);
        } else if (
          // Any collection a renderer can draw. Checking only for `array` was
          // right when that was the only kind; a grid or a map is just as
          // drawable, and rejecting one would block the very lessons those
          // renderers exist for.
          !run.trace.collections.some((c) => ['array', 'grid', 'map'].includes(c.kind))
        ) {
          fail(
            id,
            `${where} traced no drawable collection, so the renderer has nothing to show. ` +
              'Pass an array or build a table or map the code actually touches.',
          );
        } else {
          // A handful of steps is not a walkthrough. This is a floor, not a
          // guarantee: the BFS whose start cell was a wall still produced 20
          // events while doing nothing, and no automatic check caught it —
          // someone had to watch the animation. Treat a passing gate as "not
          // obviously empty", not as "this teaches something".
          const MIN_STEPS = 8;
          if (run.trace.events.length < MIN_STEPS) {
            fail(
              id,
              `${where} produced only ${run.trace.events.length} steps, which is ` +
                'too short to show the pattern. Check the arguments actually ' +
                'exercise the algorithm.',
            );
          }
        }
      }

      // Both languages should compute the same thing. Divergence means the
      // switcher shows two different algorithms wearing one caption.
      if (declared.length > 1) {
        const results = new Map<Language, string>();
        for (const language of declared) {
          const run = await runTestSpec({
            spec: walkthroughSpec(walkthrough),
            source: walkthrough.source[language]!,
            language,
          });
          results.set(language, JSON.stringify(run.cases[0]?.actual ?? null));
        }
        const distinct = new Set(results.values());
        if (distinct.size > 1) {
          fail(
            id,
            'walkthrough languages disagree: ' +
              [...results].map(([l, v]) => `${l} returned ${v}`).join(', ') +
              '. They must implement the same algorithm.',
          );
        }
      }
    }
  }

  for (const raw of RAW_CHALLENGES) {
    const parsed = contentSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        fail(describe(raw), `${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
      continue;
    }

    const challenge = parsed.data;
    if (challenge.tier !== 'challenge') continue;

    const id = exerciseId(challenge);
    if (seen.has(id)) fail(id, 'Duplicate content id — two entries share a tier and slug.');
    seen.add(id);

    // Both relations render links. A slug naming nothing is a dead end on the
    // roadmap node that counts it and on the problem set that offers it (B20).
    const lessonSlugs = new Set(RAW_LESSONS.map((l) => l.slug));
    for (const topic of challenge.topics) {
      if (!lessonSlugs.has(topic)) {
        fail(id, `topics names "${topic}", which is not an authored lesson.`);
      }
    }
    for (const prereq of challenge.recommendedAfter) {
      if (!lessonSlugs.has(prereq)) {
        fail(id, `recommendedAfter names "${prereq}", which is not an authored lesson.`);
      }
    }

    await checkChallenge(id, challenge);
  }

  for (const raw of RAW_LABS) {
    const parsed = scenarioLabSchema.safeParse(raw);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        fail(`lab "${raw.slug}"`, `${issue.path.join('.') || '(root)'}: ${issue.message}`);
      }
      continue;
    }

    const lab = parsed.data;
    const id = `labs/${lab.slug}`;
    if (seen.has(id)) fail(id, 'Duplicate lab slug.');
    seen.add(id);

    const lessonSlugs = new Set(RAW_LESSONS.map((l) => l.slug));
    for (const topic of lab.topics) {
      if (!lessonSlugs.has(topic)) {
        fail(id, `topics names "${topic}", which is not an authored lesson.`);
      }
    }

    checkLab(id, lab);
  }

  if (problems.length > 0) {
    process.stderr.write(`\n✗ Content check failed (${problems.length} problem(s)):\n\n`);
    for (const p of problems) {
      process.stderr.write(`  ${p.file}\n    ${p.message}\n\n`);
    }
    process.exit(1);
  }

  process.stdout.write(
    `✓ Content check passed (${RAW_PROBLEMS.length} problem(s), ${RAW_LESSONS.length} lesson(s), ` +
      `${RAW_CHALLENGES.length} challenge(s) / ${RAW_CHALLENGES.reduce((n, c) => n + c.steps.length, 0)} steps, ` +
      `${RAW_LABS.length} lab(s))\n`,
  );
  process.exit(0);
}

main().catch((e: unknown) => {
  process.stderr.write(`Content check crashed: ${String(e)}\n`);
  process.exit(1);
});
