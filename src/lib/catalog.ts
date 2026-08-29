import { getLessons, getProblems } from '@/content/registry';
import type { Problem } from '@/content/schema';

/**
 * Catalog queries for the dashboard (A3, A4).
 *
 * Pure functions over content, taking the filter as an argument. Nothing here
 * reads progress or a session, so the catalog renders identically for a
 * signed-out visitor — which is what lets it be statically prerendered and
 * indexed.
 */

export interface CatalogFilter {
  difficulty?: string;
  topic?: string;
}

export const DIFFICULTIES = ['warm-up', 'core', 'stretch'] as const;

export function filterProblems(filter: CatalogFilter): readonly Problem[] {
  return getProblems().filter((p) => {
    if (filter.difficulty && p.difficulty !== filter.difficulty) return false;
    if (filter.topic && p.topic !== filter.topic) return false;
    return true;
  });
}

/** Counts for the three tiers, so the dashboard never hardcodes a number. */
export function catalogCounts() {
  return {
    lessons: getLessons().length,
    problems: getProblems().length,
    // Tier 3 lands in a later phase; reported as 0 rather than omitted so the
    // dashboard shows the shape of the product honestly.
    challenges: 0,
  };
}
