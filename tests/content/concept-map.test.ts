import { describe, expect, it } from 'vitest';
import { matchesQuery } from '@/components/learn/ConceptMindMap';
import { getAllConcepts, getConceptCategories } from '@/content/concepts';

/**
 * The concept reference (A14).
 *
 * It used to be an accordion of twelve collapsed categories, so finding a term
 * meant guessing which one held it. It is now a mind map with a search, and
 * these tests cover the two properties that makes findability depend on:
 * the search reaches definitions, and every slug is still a stable anchor.
 */
describe('concept search', () => {
  const concepts = getAllConcepts();

  it('matches on the term', () => {
    const quorum = concepts.find((c) => c.slug === 'quorum')!;
    expect(matchesQuery(quorum, 'quor')).toBe(true);
  });

  it('matches on the definition, for when you cannot name the thing', () => {
    // The reference is most useful when a learner half-remembers a concept.
    const quorum = concepts.find((c) => c.slug === 'quorum')!;
    expect(matchesQuery(quorum, 'majority of replicas')).toBe(true);
  });

  it('is case-insensitive and ignores surrounding space', () => {
    const quorum = concepts.find((c) => c.slug === 'quorum')!;
    expect(matchesQuery(quorum, '  QUORUM ')).toBe(true);
  });

  it('an empty query matches everything, so the map starts full', () => {
    for (const concept of concepts.slice(0, 5)) {
      expect(matchesQuery(concept, '')).toBe(true);
      expect(matchesQuery(concept, '   ')).toBe(true);
    }
  });

  it('does not match unrelated text', () => {
    const quorum = concepts.find((c) => c.slug === 'quorum')!;
    expect(matchesQuery(quorum, 'zzzznotathing')).toBe(false);
  });
});

describe('concept anchors', () => {
  it('every slug is unique, since deep links depend on it', () => {
    // Module C's labs (C9) and roadmap nodes (I3) link into individual terms.
    // A duplicate slug means one of those links lands on the wrong definition.
    const slugs = getAllConcepts().map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('no concept slug collides with a category slug', () => {
    // Both are rendered as element ids on the same page, so a collision makes
    // one of them unreachable by anchor.
    const categories = getConceptCategories().map((c) => c.slug);
    const concepts = getAllConcepts().map((c) => c.slug);
    for (const slug of concepts) {
      expect(categories, `${slug} collides with a category id`).not.toContain(slug);
    }
  });

  it('every category holds at least one concept', () => {
    for (const category of getConceptCategories()) {
      expect(category.concepts.length, `${category.slug} is empty`).toBeGreaterThan(0);
    }
  });
});
