import { twoSum } from './problems/hashing/two-sum';
import { validAnagram } from './problems/hashing/valid-anagram';
import { firstUniqueChar } from './problems/hashing/first-unique-char';
import { groupAnagrams } from './problems/hashing/group-anagrams';
import { longestConsecutiveSequence } from './problems/hashing/longest-consecutive-sequence';
import { maxSubarray } from './problems/arrays/max-subarray';
import { runningSum } from './problems/arrays/running-sum';
import { binarySearch } from './problems/binary-search/binary-search';
import { searchInsert } from './problems/binary-search/search-insert';
import { searchRotatedSortedArray } from './problems/binary-search/search-rotated-sorted-array';
import { climbStairs } from './problems/dynamic-programming/climb-stairs';
import { coinChange } from './problems/dynamic-programming/coin-change';
import { houseRobber } from './problems/dynamic-programming/house-robber';
import { longestPalindromicSubstring } from './problems/dynamic-programming/longest-palindromic-substring';
import { countComponents } from './problems/graphs/count-components';
import { numberOfIslands } from './problems/graphs/number-of-islands';
import { kthLargest } from './problems/heaps/kth-largest';
import { topKFrequent } from './problems/heaps/top-k-frequent';
import { fibMemo } from './problems/recursion/fib-memo';
import { longestUniqueSubstring } from './problems/sliding-window/longest-unique-substring';
import { maxSumSubarrayK } from './problems/sliding-window/max-sum-subarray-k';
import { dailyTemperatures } from './problems/stacks-queues/daily-temperatures';
import { validParentheses } from './problems/stacks-queues/valid-parentheses';
import { maxDepth } from './problems/trees/max-depth';
import { isValidBst } from './problems/trees/is-valid-bst';
import { containerWater } from './problems/two-pointers/container-water';
import { removeDuplicates } from './problems/two-pointers/remove-duplicates';
import { trapRainWater } from './problems/two-pointers/trap-rain-water';
import { singleNumber } from './problems/bit-manipulation/single-number';
import { jumpGame } from './problems/greedy/jump-game';
import { bestTimeToBuyAndSellStock } from './problems/greedy/best-time-to-buy-and-sell-stock';
import { mergeIntervals } from './problems/intervals/merge-intervals';
import { insertInterval } from './problems/intervals/insert-interval';
import { subarraySumK } from './problems/prefix-sums/subarray-sum-k';
import { sortColors } from './problems/sorting/sort-colors';
import { subsets } from './problems/backtracking/subsets';
import { wordSearch } from './problems/backtracking/word-search';
import { reverseLinkedList } from './problems/linked-lists/reverse-linked-list';
import { threeSum } from './problems/two-pointers/three-sum';
import { productExceptSelf } from './problems/arrays/product-except-self';
import { levelOrder } from './problems/trees/level-order';
import { longestCommonSubsequence } from './problems/dynamic-programming/longest-common-subsequence';
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
import { urlShortenerLab } from './labs/url-shortener';
import { rateLimiterLab } from './labs/rate-limiter';
import { distributedCacheLab } from './labs/distributed-cache';
import { videoStreamingLab } from './labs/video-streaming';
import { realTimeChatLab } from './labs/real-time-chat';
import { notificationServiceLab } from './labs/notification-service';
import { lruCacheChallenge } from './challenges/dsa/lru-cache';
import { hashMapChallenge } from './challenges/dsa/hash-map';
import { minHeapChallenge } from './challenges/dsa/min-heap';
import { trieChallenge } from './challenges/dsa/trie';
import { linkedListChallenge } from './challenges/dsa/linked-list';
import { binarySearchTreeChallenge } from './challenges/dsa/binary-search-tree';
import { tokenBucketChallenge } from './challenges/real-world/token-bucket';
import { undoRedoChallenge } from './challenges/design-patterns/undo-redo';
import {
  challengeSchema,
  scenarioLabSchema,
  lessonSchema,
  problemSchema,
  type Challenge,
  type ChallengeInput,
  type ScenarioLab,
  type ScenarioLabInput,
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
  validAnagram,
  firstUniqueChar,
  groupAnagrams,
  longestConsecutiveSequence,
  maxSubarray,
  runningSum,
  binarySearch,
  searchInsert,
  searchRotatedSortedArray,
  climbStairs,
  coinChange,
  houseRobber,
  longestPalindromicSubstring,
  countComponents,
  numberOfIslands,
  kthLargest,
  topKFrequent,
  fibMemo,
  longestUniqueSubstring,
  maxSumSubarrayK,
  dailyTemperatures,
  validParentheses,
  maxDepth,
  isValidBst,
  containerWater,
  removeDuplicates,
  trapRainWater,
  singleNumber,
  jumpGame,
  bestTimeToBuyAndSellStock,
  mergeIntervals,
  insertInterval,
  subarraySumK,
  sortColors,
  subsets,
  wordSearch,
  reverseLinkedList,
  threeSum,
  productExceptSelf,
  levelOrder,
  longestCommonSubsequence,
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
  return [...getProblems(), ...getLessons(), ...getChallenges()];
}

export function findProblem(topic: string, slug: string): Problem | undefined {
  return getProblems().find((p) => p.topic === topic && p.slug === slug);
}

const DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const;

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
  arraysLesson,
  slidingWindowLesson,
  stacksQueuesLesson,
  binarySearchLesson,
  recursionLesson,
  treesLesson,
  graphsLesson,
  heapsLesson,
  dynamicProgrammingLesson,
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

/** Authored build challenges, unvalidated — the check script reports on these. */
export const RAW_CHALLENGES: readonly ChallengeInput[] = [
  linkedListChallenge,
  lruCacheChallenge,
  hashMapChallenge,
  minHeapChallenge,
  binarySearchTreeChallenge,
  trieChallenge,
  tokenBucketChallenge,
  undoRedoChallenge,
];

let challengeCache: readonly Challenge[] | undefined;

/**
 * Build challenges in catalog order (tier 3).
 *
 * Ordered by category and then by difficulty, so the DSA builds — the ones a
 * learner arrives at from a lesson — lead, and the gentlest of each category
 * comes first. Order is presentation only; nothing here reads progress and
 * nothing is locked (§6.6).
 */
const CATEGORY_ORDER: ReadonlyArray<Challenge['category']> = [
  'dsa',
  'real-world',
  'design-patterns',
];

const CHALLENGE_DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const;

export function getChallenges(): readonly Challenge[] {
  challengeCache ??= RAW_CHALLENGES.map((c) => {
    const parsed = challengeSchema.safeParse(c);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      throw new Error(`Invalid challenge "${c.slug}" — ${detail}. Run \`pnpm content:check\`.`);
    }
    return parsed.data;
  }).sort(
    (a, b) =>
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category) ||
      CHALLENGE_DIFFICULTY_ORDER.indexOf(a.difficulty) -
        CHALLENGE_DIFFICULTY_ORDER.indexOf(b.difficulty) ||
      a.slug.localeCompare(b.slug),
  );
  return challengeCache;
}

export function findChallenge(slug: string): Challenge | undefined {
  return getChallenges().find((c) => c.slug === slug);
}

export function getChallengeCategories(): ReadonlyArray<Challenge['category']> {
  return CATEGORY_ORDER.filter((category) =>
    getChallenges().some((c) => c.category === category),
  );
}

export function getChallengesInCategory(
  category: Challenge['category'],
): readonly Challenge[] {
  return getChallenges().filter((c) => c.category === category);
}

/**
 * Challenges that apply a given lesson topic (B20).
 *
 * The join a roadmap node counts its third tier with, and the one a problem set
 * offers the deeper build from. Read off the challenge's authored `topics`
 * rather than matched on the title, because the relationship is genuinely not
 * in the words: `token-bucket` applies hashing and queues and says so neither
 * time.
 */
export function getChallengesForTopic(topic: string): readonly Challenge[] {
  return getChallenges().filter((c) => c.topics.includes(topic));
}

/** Authored System Design labs, unvalidated — the check script reports on these. */
export const RAW_LABS: readonly ScenarioLabInput[] = [
  urlShortenerLab,
  rateLimiterLab,
  distributedCacheLab,
  videoStreamingLab,
  realTimeChatLab,
  notificationServiceLab,
];

let labCache: readonly ScenarioLab[] | undefined;

/**
 * Guided scenario labs (C2), in catalog order.
 *
 * Easiest first, because a lab is the one surface here where starting on the
 * wrong one is genuinely discouraging: a learner who opens a hard scenario cold
 * scores badly on six dimensions at once and learns only that they are bad at
 * this. Order is presentation; nothing is locked (§6.6).
 */
const LAB_DIFFICULTY_ORDER = ['easy', 'medium', 'hard'] as const;

export function getLabs(): readonly ScenarioLab[] {
  labCache ??= RAW_LABS.map((l) => {
    const parsed = scenarioLabSchema.safeParse(l);
    if (!parsed.success) {
      const detail = parsed.error.issues
        .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
        .join('; ');
      throw new Error(`Invalid lab "${l.slug}" — ${detail}. Run \`pnpm content:check\`.`);
    }
    return parsed.data;
  }).sort(
    (a, b) =>
      LAB_DIFFICULTY_ORDER.indexOf(a.difficulty) - LAB_DIFFICULTY_ORDER.indexOf(b.difficulty) ||
      a.slug.localeCompare(b.slug),
  );
  return labCache;
}

export function findLab(slug: string): ScenarioLab | undefined {
  return getLabs().find((l) => l.slug === slug);
}

/** Labs that exercise a given lesson, for the roadmap join and the lesson page. */
export function getLabsForTopic(topic: string): readonly ScenarioLab[] {
  return getLabs().filter((l) => l.topics.includes(topic));
}
