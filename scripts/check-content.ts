import { RAW_PROBLEMS } from '../src/content/registry';
import { contentSchema, exerciseId, type Content } from '../src/content/schema';
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

async function checkBehaviour(content: Content) {
  if (content.tier !== 'problem') return; // Lessons/challenges land in T2.1/T2.2.

  const id = exerciseId(content);
  const reference = content.referenceSolution.javascript;
  const starter = content.starterCode.javascript;

  if (!reference) {
    fail(id, 'No JavaScript reference solution. Phase 1 content is JavaScript-only.');
    return;
  }
  if (!starter) {
    fail(id, 'No JavaScript starter code.');
    return;
  }

  const ref = await runTestSpec({
    spec: content.testSpec,
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
    spec: content.testSpec,
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

    await checkBehaviour(content);
  }

  if (problems.length > 0) {
    process.stderr.write(`\n✗ Content check failed (${problems.length} problem(s)):\n\n`);
    for (const p of problems) {
      process.stderr.write(`  ${p.file}\n    ${p.message}\n\n`);
    }
    process.exit(1);
  }

  process.stdout.write(`✓ Content check passed (${RAW_PROBLEMS.length} item(s))\n`);
  process.exit(0);
}

main().catch((e: unknown) => {
  process.stderr.write(`Content check crashed: ${String(e)}\n`);
  process.exit(1);
});
