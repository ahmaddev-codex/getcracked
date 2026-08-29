import { RAW_LESSONS, RAW_PROBLEMS } from '../src/content/registry';
import { contentSchema, exerciseId, type RunnableExercise } from '../src/content/schema';
import { runTestSpec } from '../src/content/test-runner';

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
  const reference = exercise.referenceSolution.javascript;
  const starter = exercise.starterCode.javascript;

  if (!reference) {
    fail(id, 'No JavaScript reference solution. Phase 1 content is JavaScript-only.');
    return;
  }
  if (!starter) {
    fail(id, 'No JavaScript starter code.');
    return;
  }

  const ref = await runTestSpec({
    spec: exercise.testSpec,
    source: reference,
    language: 'javascript',
  });
  if (!ref.passed) {
    const failed = ref.cases.filter((c) => !c.passed);
    fail(
      id,
      `Reference solution fails its own spec (${failed.length}/${ref.cases.length} cases). ` +
        `First failure — ${failed[0]?.name}: expected ${JSON.stringify(failed[0]?.expected)}, ` +
        `got ${JSON.stringify(failed[0]?.actual)}${failed[0]?.error ? ` (${failed[0].error})` : ''}`,
    );
  }

  const stub = await runTestSpec({
    spec: exercise.testSpec,
    source: starter,
    language: 'javascript',
  });
  if (stub.passed) {
    fail(
      id,
      'Starter code passes the spec — the exercise tests nothing. Add a case the ' +
        'stub cannot satisfy.',
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

    // Guided exercises earn the same verification a problem does (B11, AD-7).
    for (const exercise of lesson.exercises) {
      await checkExercise(exerciseId(lesson, exercise.slug), exercise);
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
