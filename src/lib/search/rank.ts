import type { SearchEntry, SearchKind } from './index';

/**
 * Ranking search results (I6).
 *
 * **Substring matching, deliberately not fuzzy.** Fuzzy matching is what most
 * command palettes do, and at this catalogue's size it would be a downgrade: it
 * needs a library, it is slower, and — the real objection — it is confidently
 * wrong in a way substring matching never is. A learner who types `heap` and is
 * shown "Hash Map" because the letters appear in order has been told something
 * false about the catalogue. Nothing here matches what was not typed.
 *
 * **Every term must match.** Multi-word queries are an AND, because that is what
 * narrowing means: "graph hard" should be the hard graph problems, not
 * everything about graphs plus everything hard.
 */

/**
 * How well one entry matches, lower being better. `null` means it does not.
 *
 * The tiers are ordered by how much the match tells you it was meant: an exact
 * title is unambiguous, a title prefix is what someone typing halfway expects,
 * and a body hit is a guess that happened to pay off.
 */
function score(entry: SearchEntry, terms: string[]): number | null {
  const title = entry.title.toLowerCase();
  let total = 0;

  for (const term of terms) {
    if (!entry.haystack.includes(term)) return null;

    if (title === term) total += 0;
    else if (title.startsWith(term)) total += 1;
    // A word inside the title: "cache" should rank "LRU Cache" above a lesson
    // that merely mentions caching in its summary.
    else if (new RegExp(`\\b${escapeRegExp(term)}`).test(title)) total += 2;
    else if (title.includes(term)) total += 3;
    else total += 4;
  }

  return total;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Order between kinds, used only to break a tie.
 *
 * Lessons first because a learner who has not narrowed further is usually
 * looking for the explanation; the reference terms last because they are the
 * shortest and most numerous, so they would otherwise crowd out everything else
 * on a broad query.
 */
const KIND_ORDER: Record<SearchKind, number> = {
  lesson: 0,
  problem: 1,
  challenge: 2,
  lab: 3,
  company: 4,
  pattern: 5,
  concept: 6,
};

export interface SearchHit {
  entry: SearchEntry;
  score: number;
}

export interface SearchOptions {
  /** Restrict to one kind. Undefined searches everything. */
  kind?: SearchKind;
  limit?: number;
}

export function searchEntries(
  entries: readonly SearchEntry[],
  query: string,
  { kind, limit = 20 }: SearchOptions = {},
): SearchHit[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const hits: SearchHit[] = [];
  for (const entry of entries) {
    if (kind && entry.kind !== kind) continue;
    const value = score(entry, terms);
    if (value !== null) hits.push({ entry, score: value });
  }

  return hits
    .sort(
      (a, b) =>
        a.score - b.score ||
        KIND_ORDER[a.entry.kind] - KIND_ORDER[b.entry.kind] ||
        // Shorter titles last-resort first: an exact-length match is more
        // likely to be the thing itself than something that contains it.
        a.entry.title.length - b.entry.title.length ||
        a.entry.title.localeCompare(b.entry.title),
    )
    .slice(0, limit);
}

/** How many results each kind would return, for the filter chips. */
export function countByKind(
  entries: readonly SearchEntry[],
  query: string,
): Record<SearchKind, number> {
  const counts: Record<SearchKind, number> = {
    lesson: 0,
    problem: 0,
    challenge: 0,
    lab: 0,
    company: 0,
    pattern: 0,
    concept: 0,
  };
  // No limit: a chip saying "problems" has to report how many there are, not
  // how many fitted on the screen.
  for (const hit of searchEntries(entries, query, { limit: Number.MAX_SAFE_INTEGER })) {
    counts[hit.entry.kind]++;
  }
  return counts;
}
