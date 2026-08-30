import { getChallenges, getLabs, getLessons, getProblems } from '@/content/registry';
import { getConceptCategories } from '@/content/concepts';
import { lessonBase } from '@/components/learn/difficulty';
import { stepIds } from '@/content/challenge';

/**
 * One search index over everything (I6).
 *
 * **Why this rather than a search box per roadmap.** The task as written was
 * "search across the DSA roadmap", which would have made a third per-page
 * filter — the concept map has one, the pattern map has one — each with its own
 * matcher, each able to see only its own island. That is the wrong shape for the
 * question people actually arrive with. Nobody searching "quorum" or "LRU" or
 * "memoization" knows in advance whether the answer is a lesson, a reference
 * term, a practice problem or a build; asking them to guess the right page
 * before they can search is asking them to answer the question themselves.
 *
 * So there is one index over all five content types and one way in, from any
 * page. The concept map keeps its inline filter, because that one is doing a
 * different job — narrowing a graph you are looking at is a view operation, not
 * navigation, and the results stay in place on the map.
 *
 * **Built from content, server-side.** The catalogue is repo-authored (AD-1), so
 * the index is derived rather than maintained, and it is derived where the
 * content already lives. Importing the registry into a client component would
 * put every lesson, problem and challenge into the browser bundle to answer a
 * question about their titles.
 */

export type SearchKind = 'lesson' | 'concept' | 'pattern' | 'problem' | 'challenge' | 'lab';

export interface SearchEntry {
  /** Stable across builds, so a result can be keyed and measured. */
  id: string;
  kind: SearchKind;
  title: string;
  href: string;
  /** One line under the title — what this is and where it sits. */
  detail: string;
  /**
   * Everything matchable, lowercased and joined.
   *
   * Precomputed rather than assembled per keystroke: the whole index is scanned
   * on every character, and lowercasing 100+ entries' worth of prose each time
   * is work that never changes between keystrokes.
   */
  haystack: string;
}

/**
 * The categories that make up the pattern map.
 *
 * Mirrors the split in content/concepts — a pattern is something you *apply*,
 * vocabulary is something you *reason about* — because the two live on
 * different pages and a result has to link to the right one.
 */
const PATTERN_CATEGORIES = new Set([
  'reliability',
  'cloud-design',
  'cloud-data',
  'cloud-messaging',
]);

/**
 * Caps on how much prose each entry contributes.
 *
 * The index is fetched over the network, so its size is a real cost. A brief's
 * first paragraph is where the distinguishing words are; the rest is worked
 * examples and code, which match everything and therefore nothing.
 */
const BRIEF_CHARS = 240;

function normalise(...parts: Array<string | undefined | null>): string {
  return parts
    .filter((p): p is string => Boolean(p))
    .join(' ')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/** Markdown stripped to words, so `**LRU**` matches a search for `lru`. */
function plain(markdown: string, limit = BRIEF_CHARS): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[`*_>#\[\]()]/g, ' ')
    .slice(0, limit);
}

export function buildSearchIndex(): SearchEntry[] {
  const entries: SearchEntry[] = [];

  for (const lesson of getLessons()) {
    entries.push({
      id: `lesson:${lesson.slug}`,
      kind: 'lesson',
      title: lesson.title,
      href: `${lessonBase(lesson.track)}/${lesson.slug}`,
      detail: lesson.summary,
      /**
       * Summary, cues and variants — not the explainer.
       *
       * The explainer is the bulk of a lesson and would dominate the index for
       * a poor return: it is long-form prose, so it contains most common words
       * and matches nearly every query. The cues are the opposite — they are
       * written as "how do I recognise this?", which is close to how someone
       * searches when they cannot name the thing.
       */
      haystack: normalise(
        lesson.title,
        lesson.summary,
        lesson.track,
        lesson.difficulty,
        ...lesson.patternCues,
        ...lesson.variants.map((v) => `${v.name} ${v.what}`),
        ...lesson.operations.map((o) => o.name),
        ...(lesson.whenToUse?.reachFor ?? []),
      ),
    });
  }

  for (const category of getConceptCategories()) {
    const isPattern = PATTERN_CATEGORIES.has(category.slug);
    for (const concept of category.concepts) {
      entries.push({
        id: `concept:${concept.slug}`,
        kind: isPattern ? 'pattern' : 'concept',
        title: concept.term,
        // The maps deep-link by anchor (A14), and those links are load-bearing
        // for search traffic — so a result lands on the term, not the page top.
        href: `${isPattern ? '/learn/design-patterns' : '/learn/system-design'}#${concept.slug}`,
        detail: concept.definition,
        /**
         * Definition and "why it matters", exactly as the map's own filter does.
         *
         * The reference is most useful when you *cannot* name the thing — "the
         * one where reads plus writes exceed replicas" should find Quorum — and
         * that only works if the body is searched, not just the term.
         */
        haystack: normalise(concept.term, concept.definition, concept.matters, category.title),
      });
    }
  }

  for (const problem of getProblems()) {
    entries.push({
      id: `problem:${problem.topic}/${problem.slug}`,
      kind: 'problem',
      title: problem.title,
      href: `/problems/${problem.topic}/${problem.slug}`,
      detail: `${problem.difficulty} · ${problem.topic.replace(/-/g, ' ')}`,
      haystack: normalise(
        problem.title,
        problem.topic,
        problem.difficulty,
        ...problem.companies,
        plain(problem.brief),
      ),
    });
  }

  for (const challenge of getChallenges()) {
    entries.push({
      id: `challenge:${challenge.slug}`,
      kind: 'challenge',
      title: challenge.title,
      href: `/challenges/${challenge.slug}`,
      detail: challenge.summary,
      haystack: normalise(
        challenge.title,
        challenge.summary,
        challenge.category,
        challenge.difficulty,
        ...challenge.topics,
        plain(challenge.brief),
        // Step titles, because they are where the specifics are: someone
        // searching "evict" wants the eviction step, and the build's own title
        // says only "LRU Cache".
        ...challenge.steps.map((s) => s.title),
      ),
    });

    /**
     * Steps are their own results.
     *
     * A build is four or five sittings and its steps are named for the ideas
     * they add. Collapsing them into the parent would mean a search for "token
     * bucket refill" landing on an overview page and leaving the learner to
     * find the step themselves — which is the work search exists to remove.
     */
    const ids = stepIds(challenge);
    challenge.steps.forEach((step, i) => {
      entries.push({
        id: ids[i],
        kind: 'challenge',
        title: step.title,
        href: `/challenges/${challenge.slug}/${step.slug}`,
        detail: `Step ${i + 1} of ${challenge.steps.length} · ${challenge.title}`,
        haystack: normalise(step.title, challenge.title, plain(step.brief)),
      });
    });
  }

  for (const lab of getLabs()) {
    entries.push({
      id: `lab:${lab.slug}`,
      kind: 'lab',
      title: lab.title,
      href: `/learn/system-design/labs/${lab.slug}`,
      detail: lab.summary,
      haystack: normalise(
        lab.title,
        lab.summary,
        lab.difficulty,
        ...lab.topics,
        plain(lab.brief),
        // The prompts, because they are the questions someone would search
        // with: "how many writes per second" is a real query and appears
        // nowhere in the title.
        ...lab.steps.map((s) => s.prompt),
      ),
    });
  }

  return entries;
}
