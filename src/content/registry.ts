import { twoSum } from './problems/hashing/two-sum';
import { hashing } from './lessons/hashing';
import { twoPointers } from './lessons/two-pointers';
import {
  lessonSchema,
  problemSchema,
  type Content,
  type Lesson,
  type LessonInput,
  type Problem,
  type ProblemInput,
} from './schema';

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
  return [...getProblems(), ...getLessons()];
}

export function findProblem(topic: string, slug: string): Problem | undefined {
  return getProblems().find((p) => p.topic === topic && p.slug === slug);
}

const DIFFICULTY_ORDER = ['warm-up', 'core', 'stretch'] as const;

/**
 * A topic's problems in the order a learner should meet them (B17).
 *
 * Warm-up first so the problem straight after a lesson is deliberately gentle
 * and reinforces the pattern just taught.
 */
export function getProblemSet(topic: string): readonly Problem[] {
  return getProblems()
    .filter((p) => p.topic === topic)
    .sort(
      (a, b) =>
        DIFFICULTY_ORDER.indexOf(a.difficulty) - DIFFICULTY_ORDER.indexOf(b.difficulty) ||
        a.slug.localeCompare(b.slug),
    );
}

/** Where a problem sits in its set, plus its neighbours, for navigation. */
export function getSetPosition(problem: Problem) {
  const set = getProblemSet(problem.topic);
  const index = set.findIndex((p) => p.slug === problem.slug);
  return {
    index,
    total: set.length,
    previous: index > 0 ? set[index - 1] : undefined,
    next: index >= 0 && index < set.length - 1 ? set[index + 1] : undefined,
  };
}

/** Authored lessons, unvalidated — the check script reports on these. */
export const RAW_LESSONS: readonly LessonInput[] = [hashing, twoPointers];

let lessonCache: readonly Lesson[] | undefined;

/**
 * Lessons in curriculum order.
 *
 * Order is presentation only. Every lesson is readable at any time (B14) —
 * nothing here consults progress, which is what makes read-ahead structural
 * rather than a behaviour someone has to remember not to break.
 */
export function getLessons(): readonly Lesson[] {
  lessonCache ??= RAW_LESSONS.map((l) => {
    const parsed = lessonSchema.safeParse(l);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      throw new Error(`Invalid lesson "${l.slug}" — ${detail}. Run \`pnpm content:check\`.`);
    }
    return parsed.data;
  }).sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug));
  return lessonCache;
}

export function findLesson(slug: string): Lesson | undefined {
  return getLessons().find((l) => l.slug === slug);
}

/** Neighbours in curriculum order, for lesson-to-lesson navigation. */
export function getLessonPosition(lesson: Lesson) {
  const all = getLessons();
  const index = all.findIndex((l) => l.slug === lesson.slug);
  return {
    index,
    total: all.length,
    previous: index > 0 ? all[index - 1] : undefined,
    next: index >= 0 && index < all.length - 1 ? all[index + 1] : undefined,
  };
}

export function getTopics(): readonly string[] {
  return [...new Set(getProblems().map((p) => p.topic))].sort();
}
