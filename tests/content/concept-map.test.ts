import { describe, expect, it } from 'vitest';
import { matchesQuery } from '@/components/learn/ConceptMindMap';
import {
  findConcept,
  getAllConcepts,
  getConceptCategories,
  getPatternCategories,
  getSystemDesignCategories,
} from '@/content/concepts';
import { getLessons } from '@/content/registry';

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

/**
 * The join between the path and the vocabulary.
 *
 * System Design lessons and the concept reference were two diagrams of the same
 * material, so a learner reading about caching had to scroll to a separate map
 * to find out what a cache stampede is. Lessons now declare the terms they
 * cover — and a declaration that points at nothing is a dead end in the one
 * surface whose job is answering "what does this word mean?".
 */
describe('lesson to concept links', () => {
  const lessons = getLessons().filter((l) => l.concepts.length > 0);

  it('is actually used, not just available', () => {
    expect(lessons.length).toBeGreaterThan(0);
  });

  it.each(lessons.map((l) => [l.slug, l] as const))(
    '%s only claims concepts that exist',
    (_slug, lesson) => {
      for (const slug of lesson.concepts) {
        expect(findConcept(slug), `${lesson.slug} claims missing concept "${slug}"`).toBeTruthy();
      }
    },
  );

  it('never claims the same concept from two lessons', () => {
    // A term belongs to the lesson that teaches it. Two claims mean a learner
    // meets the same definition twice and neither lesson owns it.
    const seen = new Map<string, string>();
    for (const lesson of lessons) {
      for (const slug of lesson.concepts) {
        const owner = seen.get(slug);
        expect(owner, `"${slug}" claimed by both ${owner} and ${lesson.slug}`).toBeUndefined();
        seen.set(slug, lesson.slug);
      }
    }
  });

  it('keeps named patterns out of the system design reference', () => {
    // The split: a pattern has a proper name and answers "what is the known
    // solution?"; system design vocabulary describes how a system behaves.
    const design = getSystemDesignCategories().map((c) => c.slug);
    const patterns = getPatternCategories().map((c) => c.slug);

    expect(patterns.length).toBeGreaterThan(0);
    expect(design.length).toBeGreaterThan(0);
    for (const slug of patterns) expect(design).not.toContain(slug);
    // Together they must still account for every category — a term that fell
    // into neither would be unreachable from any page.
    expect(design.length + patterns.length).toBe(getConceptCategories().length);
  });
});
