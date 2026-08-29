import { describe, expect, it } from 'vitest';
import {
  CONCEPT_CATEGORIES,
  conceptCount,
  findConcept,
  getAllConcepts,
  getConceptCategories,
} from '@/content/concepts';
import { conceptCategorySchema } from '@/content/concepts/schema';
import { isPublicPath } from '@/lib/access';

describe('concept map content (A14)', () => {
  it('validates against the schema', () => {
    for (const category of CONCEPT_CATEGORIES) {
      const parsed = conceptCategorySchema.safeParse(category);
      expect(parsed.success, `${category.slug}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
    }
  });

  it('has globally unique concept slugs, since they are anchors', () => {
    // A duplicate slug means one deep link silently lands on the wrong term.
    const slugs = getAllConcepts().map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('has unique category slugs', () => {
    const slugs = getConceptCategories().map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('returns categories in declared order', () => {
    const orders = getConceptCategories().map((c) => c.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('gives every concept both a definition and a reason it matters', () => {
    // A definition without the "why" is a glossary; the "why" is the teaching.
    for (const concept of getAllConcepts()) {
      expect(concept.definition.length, concept.slug).toBeGreaterThan(20);
      expect(concept.matters.length, concept.slug).toBeGreaterThan(20);
    }
  });

  it('has no empty category', () => {
    for (const category of getConceptCategories()) {
      expect(category.concepts.length, category.slug).toBeGreaterThan(0);
    }
  });

  it('reports a real count rather than a target', () => {
    expect(conceptCount()).toBe(getAllConcepts().length);
  });
});

describe('deep linking', () => {
  it('finds a concept by its anchor slug', () => {
    expect(findConcept('cap-theorem')?.term).toBe('CAP theorem');
  });

  it('reports which category a concept belongs to, so the panel can open', () => {
    expect(findConcept('quorum')?.category).toBe('consistency-availability');
  });

  it('returns undefined for an unknown anchor rather than throwing', () => {
    expect(findConcept('not-a-concept')).toBeUndefined();
  });
});

describe('access', () => {
  it('is public — it is an acquisition surface, not account data', () => {
    expect(isPublicPath('/learn')).toBe(true);
    expect(isPublicPath('/learn/system-design')).toBe(true);
  });
});
