import { describe, expect, it } from 'vitest';
import { buildSearchIndex, type SearchEntry } from '@/lib/search';
import { countByKind, searchEntries } from '@/lib/search/rank';
import { getChallenges, getLessons, getProblems } from '@/content/registry';
import { conceptCount } from '@/content/concepts';

/**
 * Platform-wide search (I6).
 *
 * Two things are being protected. The **index** has to cover every content type,
 * because the whole argument for one search instead of a filter per roadmap is
 * that a learner should not have to know which surface a thing lives on before
 * they can look for it. And the **ranking** has to be predictable, because
 * search that returns plausible-looking wrong answers is worse than no search.
 */

const index = buildSearchIndex();

describe('coverage', () => {
  it('indexes every lesson, problem, challenge and reference term', () => {
    const counts = index.reduce<Record<string, number>>((acc, e) => {
      acc[e.kind] = (acc[e.kind] ?? 0) + 1;
      return acc;
    }, {});

    expect(counts.lesson).toBe(getLessons().length);
    expect(counts.problem).toBe(getProblems().length);
    // Concepts and patterns are one corpus split across two maps.
    expect((counts.concept ?? 0) + (counts.pattern ?? 0)).toBe(conceptCount());
  });

  it('indexes a build and each of its steps separately', () => {
    // A build is four or five sittings named for the ideas they add. Collapsing
    // the steps would land "evict" on an overview page and leave the learner to
    // find the step themselves — which is the work search exists to remove.
    const challenges = getChallenges();
    const expected = challenges.length + challenges.reduce((n, c) => n + c.steps.length, 0);
    expect(index.filter((e) => e.kind === 'challenge')).toHaveLength(expected);
  });

  it('gives every entry a unique id and a real destination', () => {
    const ids = index.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entry of index) {
      expect(entry.href, entry.id).toMatch(/^\/[a-z]/);
      expect(entry.title.length, entry.id).toBeGreaterThan(0);
      expect(entry.detail.length, entry.id).toBeGreaterThan(0);
    }
  });

  it('sends reference terms to the map that actually shows them', () => {
    // The two maps are separate pages, so a term linked to the wrong one lands
    // on a page where its anchor does not exist.
    for (const entry of index) {
      if (entry.kind === 'concept') expect(entry.href.startsWith('/learn/system-design#')).toBe(true);
      if (entry.kind === 'pattern') {
        expect(entry.href.startsWith('/learn/design-patterns#')).toBe(true);
      }
    }
  });

  it('lowercases the haystack once, at build time', () => {
    // The whole index is scanned per keystroke; lowercasing it each time would
    // be work that never changes between them.
    for (const entry of index) {
      expect(entry.haystack, entry.id).toBe(entry.haystack.toLowerCase());
    }
  });
});

describe('finding real things', () => {
  const first = (query: string) => searchEntries(index, query)[0]?.entry;

  it.each([
    ['two sum', 'Two Sum'],
    ['lru', 'LRU Cache'],
    ['sliding window', 'Sliding Window'],
  ])('puts the obvious answer to %o first', (query, title) => {
    expect(first(query)?.title).toBe(title);
  });

  it('finds a build step by the idea it adds, not by its parent’s name', () => {
    const hit = searchEntries(index, 'evict').find((h) => h.entry.href.includes('/challenges/'));
    expect(hit?.entry.href).toMatch(/^\/challenges\/lru-cache\//);
  });

  it('finds a reference term through its definition', () => {
    // The reference is most useful when you cannot name the thing, which only
    // works because the body is searched and not just the term.
    const hits = searchEntries(index, 'replicas');
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => h.entry.kind === 'concept' || h.entry.kind === 'pattern')).toBe(true);
  });

  it('reaches every content type from some query', () => {
    // A kind nobody can reach is a kind that is not really indexed.
    for (const [query, kind] of [
      ['hashing', 'lesson'],
      ['two sum', 'problem'],
      ['cache', 'challenge'],
    ] as const) {
      expect(searchEntries(index, query).some((h) => h.entry.kind === kind), query).toBe(true);
    }
  });
});

describe('ranking', () => {
  const entries: SearchEntry[] = [
    { id: 'a', kind: 'lesson', title: 'Heaps', href: '/a', detail: '', haystack: 'heaps priority queue' },
    { id: 'b', kind: 'lesson', title: 'Hash Maps', href: '/b', detail: '', haystack: 'hash maps heaps mentioned' },
    { id: 'c', kind: 'problem', title: 'Kth Largest', href: '/c', detail: '', haystack: 'kth largest heap' },
  ];

  it('ranks an exact title above a title that merely contains the word', () => {
    expect(searchEntries(entries, 'heaps')[0].entry.id).toBe('a');
  });

  it('ranks a title match above a body match', () => {
    const order = searchEntries(entries, 'heap').map((h) => h.entry.id);
    expect(order.indexOf('a')).toBeLessThan(order.indexOf('c'));
  });

  it('requires every term of a multi-word query to match', () => {
    // Narrowing has to narrow: "graph hard" is the hard graph problems, not
    // everything about graphs plus everything hard.
    expect(searchEntries(entries, 'hash maps')).toHaveLength(1);
    expect(searchEntries(entries, 'hash nonsense')).toHaveLength(0);
  });

  it('never matches letters it was not given in order', () => {
    // The case against fuzzy matching: `hep` must not find "Heaps". A learner
    // shown a result they did not ask for has been told something false about
    // the catalogue.
    expect(searchEntries(entries, 'hep')).toHaveLength(0);
  });

  it('returns nothing for an empty query rather than everything', () => {
    expect(searchEntries(entries, '')).toHaveLength(0);
    expect(searchEntries(entries, '   ')).toHaveLength(0);
  });

  it('respects a kind filter', () => {
    expect(searchEntries(entries, 'heap', { kind: 'problem' }).map((h) => h.entry.id)).toEqual([
      'c',
    ]);
  });

  it('honours the limit', () => {
    expect(searchEntries(entries, 'heap', { limit: 1 })).toHaveLength(1);
  });
});

describe('kind counts', () => {
  it('count what exists, not what fitted on screen', () => {
    // A chip saying "Problems 14" must mean fourteen, even though the list
    // shows twenty results in total.
    const counts = countByKind(index, 'a');
    const unlimited = searchEntries(index, 'a', { limit: Number.MAX_SAFE_INTEGER });
    expect(Object.values(counts).reduce((x, y) => x + y, 0)).toBe(unlimited.length);
    expect(unlimited.length).toBeGreaterThan(20);
  });
});
