import { conceptCategorySchema, type Concept, type ConceptCategory } from './schema';
import { CONCEPT_CATEGORIES } from './system-design';

/** Parsed and ordered. Validation runs in the content gate too. */
let cache: readonly ConceptCategory[] | undefined;

/**
 * Categories that are a catalogue of *named patterns* rather than system design
 * vocabulary.
 *
 * The split is not cosmetic. System design vocabulary describes properties and
 * mechanisms — latency, quorum, sharding — and answers "how will this system
 * behave?". A pattern has a proper name and answers a different question:
 * "what is the known solution to this recurring problem?". Circuit Breaker and
 * Saga are things you *apply*; eventual consistency is something you *reason
 * about*. Learners meet them at different moments, so they get different maps.
 *
 * PRD I5 already anticipated three roadmaps — DSA, System Design, Design
 * Patterns — and this is the line between the last two.
 */
const PATTERN_CATEGORIES = new Set([
  'reliability',
  'cloud-design',
  'cloud-data',
  'cloud-messaging',
]);

/** The named-pattern catalogue. */
export function getPatternCategories(): readonly ConceptCategory[] {
  return getConceptCategories().filter((c) => PATTERN_CATEGORIES.has(c.slug));
}

/** System design vocabulary — everything that is not a named pattern. */
export function getSystemDesignCategories(): readonly ConceptCategory[] {
  return getConceptCategories().filter((c) => !PATTERN_CATEGORIES.has(c.slug));
}

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
