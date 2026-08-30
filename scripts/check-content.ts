import { RAW_LESSONS, RAW_PROBLEMS } from '../src/content/registry';
import {
  contentSchema,
  exerciseId,
  LANGUAGES,
  type Language,
  type RunnableExercise,
} from '../src/content/schema';
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

  if (problems.length > 0) {
    process.stderr.write(`\n✗ Content check failed (${problems.length} problem(s)):\n\n`);
    for (const p of problems) {
      process.stderr.write(`  ${p.file}\n    ${p.message}\n\n`);
    }
    process.exit(1);
  }

  process.stdout.write(
    `✓ Content check passed (${RAW_PROBLEMS.length} problem(s), ${RAW_LESSONS.length} lesson(s))\n`,
  );
  process.exit(0);
}

main().catch((e: unknown) => {
  process.stderr.write(`Content check crashed: ${String(e)}\n`);
  process.exit(1);
});
