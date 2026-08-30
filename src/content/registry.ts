import { twoSum } from './problems/hashing/two-sum';
import { maxSubarray } from './problems/arrays/max-subarray';
import { runningSum } from './problems/arrays/running-sum';
import { binarySearch } from './problems/binary-search/binary-search';
import { searchInsert } from './problems/binary-search/search-insert';
import { climbStairs } from './problems/dynamic-programming/climb-stairs';
import { coinChange } from './problems/dynamic-programming/coin-change';
import { houseRobber } from './problems/dynamic-programming/house-robber';
import { countComponents } from './problems/graphs/count-components';
import { firstUniqueChar } from './problems/hashing/first-unique-char';
import { groupAnagrams } from './problems/hashing/group-anagrams';
import { kthLargest } from './problems/heaps/kth-largest';
import { fibMemo } from './problems/recursion/fib-memo';
import { longestUniqueSubstring } from './problems/sliding-window/longest-unique-substring';
import { maxSumSubarrayK } from './problems/sliding-window/max-sum-subarray-k';
import { dailyTemperatures } from './problems/stacks-queues/daily-temperatures';
import { validParentheses } from './problems/stacks-queues/valid-parentheses';
import { maxDepth } from './problems/trees/max-depth';
import { containerWater } from './problems/two-pointers/container-water';
import { removeDuplicates } from './problems/two-pointers/remove-duplicates';
import { hashingLesson } from './lessons/hashing';
import { arraysLesson } from './lessons/arrays';
import { slidingWindowLesson } from './lessons/sliding-window';
import { stacksQueuesLesson } from './lessons/stacks-queues';
import { binarySearchLesson } from './lessons/binary-search';
import { recursionLesson } from './lessons/recursion';
import { treesLesson } from './lessons/trees';
import { graphsLesson } from './lessons/graphs';
import { heapsLesson } from './lessons/heaps';
import { dynamicProgrammingLesson } from './lessons/dynamic-programming';
import { twoPointersLesson } from './lessons/two-pointers';
import { linkedListsLesson } from './lessons/linked-lists';
import { triesLesson } from './lessons/tries';
import { unionFindLesson } from './lessons/union-find';
import { sortingLesson } from './lessons/sorting';
import { prefixSumsLesson } from './lessons/prefix-sums';
import { backtrackingLesson } from './lessons/backtracking';
import { greedyLesson } from './lessons/greedy';
import { intervalsLesson } from './lessons/intervals';
import { bitManipulationLesson } from './lessons/bit-manipulation';
import { scalingLesson } from './lessons/system-design/scaling';
import { loadBalancingLesson } from './lessons/system-design/load-balancing';
import { cachingLesson } from './lessons/system-design/caching';
import { databasesLesson } from './lessons/system-design/databases';
import { replicationShardingLesson } from './lessons/system-design/replication-sharding';
import { consistencyLesson } from './lessons/system-design/consistency';
import { messageQueuesLesson } from './lessons/system-design/message-queues';
import { rateLimitingLesson } from './lessons/system-design/rate-limiting';
import { cdnLesson } from './lessons/system-design/cdn';
import { consistentHashingLesson } from './lessons/system-design/consistent-hashing';
import { idempotencyLesson } from './lessons/system-design/idempotency';
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
export const RAW_PROBLEMS: readonly ProblemInput[] = [
  twoSum,
  maxSubarray, runningSum, binarySearch, searchInsert, climbStairs, coinChange, houseRobber, countComponents, firstUniqueChar, groupAnagrams, kthLargest, fibMemo, longestUniqueSubstring, maxSumSubarrayK, dailyTemperatures, validParentheses, maxDepth, containerWater, removeDuplicates,
];

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
export const RAW_LESSONS: readonly LessonInput[] = [
  hashingLesson,
  twoPointersLesson,
  linkedListsLesson,
  triesLesson,
  unionFindLesson,
  sortingLesson,
  prefixSumsLesson,
  backtrackingLesson,
  greedyLesson,
  intervalsLesson,
  bitManipulationLesson,
  scalingLesson,
  loadBalancingLesson,
  cachingLesson,
  databasesLesson,
  replicationShardingLesson,
  consistencyLesson,
  messageQueuesLesson,
  rateLimitingLesson,
  cdnLesson,
  consistentHashingLesson,
  idempotencyLesson,
  arraysLesson, slidingWindowLesson, stacksQueuesLesson, binarySearchLesson, recursionLesson, treesLesson, graphsLesson, heapsLesson, dynamicProgrammingLesson,
];

let lessonCache: readonly Lesson[] | undefined;

/**
 * Lessons in curriculum order.
 *
 * Order is presentation only. Every lesson is readable at any time (B14) —
 * nothing here consults progress, which is what makes read-ahead structural
 * rather than a behaviour someone has to remember not to break.
 */
/** You hold state in a structure before you do anything to it. */
const TRACK_ORDER: ReadonlyArray<Lesson['track']> = [
  'data-structures',
  'algorithms',
  'system-design',
];

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
  })
    // Data structures before algorithms, then by each track's own order. The
    // tracks are numbered independently so adding a structure does not
    // renumber every algorithm, and vice versa.
    .sort(
      (a, b) =>
        TRACK_ORDER.indexOf(a.track) - TRACK_ORDER.indexOf(b.track) ||
        a.order - b.order ||
        a.slug.localeCompare(b.slug),
    );
  return lessonCache;
}

/** Lessons in one track, in that track's order. */
export function getTrack(track: Lesson['track']): readonly Lesson[] {
  return getLessons().filter((l) => l.track === track);
}

export function findLesson(slug: string): Lesson | undefined {
  return getLessons().find((l) => l.slug === slug);
}

/**
 * Neighbours in curriculum order, within the lesson's own track.
 *
 * Scoped to the track because the tracks are separate paths presented on
 * separate pages: "Lesson 3 of 31" spanning all three would count topics a
 * learner on this page cannot see, and next/previous would walk them off the
 * end of the track into an unrelated one.
 */
export function getLessonPosition(lesson: Lesson) {
  const all = getTrack(lesson.track);
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
