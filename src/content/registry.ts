import { twoSum } from './problems/hashing/two-sum';
import { problemSchema, type Content, type Problem, type ProblemInput } from './schema';

/**
 * The content index (ADR 0001 §8).
 *
 * Hand-maintained while the catalog is small. Once Module J is producing
 * problems at volume this becomes a build-time generated index, with individual
 * exercises `import()`ed by slug so the whole catalog never lands in a client
 * bundle.
 */

/**
 * Authored content, exactly as written and deliberately unvalidated.
 *
 * The check script reads this rather than the parsed export, so it can report
 * *every* problem across *every* file. Validating here instead would throw on
 * the first bad entry and hide the rest — turning one run of the gate into one
 * fix at a time.
 */
export const RAW_PROBLEMS: readonly ProblemInput[] = [twoSum];

function parseProblem(input: ProblemInput): Problem {
  const parsed = problemSchema.safeParse(input);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('; ');
    // Reached only if something bypassed the prebuild gate.
    throw new Error(`Invalid problem "${input.slug}" — ${detail}. Run \`pnpm content:check\`.`);
  }
  return parsed.data;
}

let cache: readonly Problem[] | undefined;

/** Parsed content for runtime use — defaults applied, shape guaranteed. */
export function getProblems(): readonly Problem[] {
  cache ??= RAW_PROBLEMS.map(parseProblem);
  return cache;
}

export function getAllContent(): readonly Content[] {
  return [...getProblems()];
}

export function findProblem(topic: string, slug: string): Problem | undefined {
  return getProblems().find((p) => p.topic === topic && p.slug === slug);
}
