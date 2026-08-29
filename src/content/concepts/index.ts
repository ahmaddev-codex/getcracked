import { conceptCategorySchema, type Concept, type ConceptCategory } from './schema';
import { CONCEPT_CATEGORIES } from './system-design';

/** Parsed and ordered. Validation runs in the content gate too. */
let cache: readonly ConceptCategory[] | undefined;

export function getConceptCategories(): readonly ConceptCategory[] {
  cache ??= CONCEPT_CATEGORIES.map((c) => conceptCategorySchema.parse(c)).sort(
    (a, b) => a.order - b.order,
  );
  return cache;
}

export function conceptCount(): number {
  return getConceptCategories().reduce((n, c) => n + c.concepts.length, 0);
}

/** Every concept flattened, for search and for the roadmap's deep links. */
export function getAllConcepts(): Array<Concept & { category: string }> {
  return getConceptCategories().flatMap((cat) =>
    cat.concepts.map((c) => ({ ...c, category: cat.slug })),
  );
}

export function findConcept(slug: string): (Concept & { category: string }) | undefined {
  return getAllConcepts().find((c) => c.slug === slug);
}

export { CONCEPT_CATEGORIES };
export type { Concept, ConceptCategory };
