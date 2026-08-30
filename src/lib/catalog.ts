import { getChallenges, getLessons, getProblems } from '@/content/registry';
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

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export function filterProblems(filter: CatalogFilter): readonly Problem[] {
  return getProblems().filter((p) => {
    if (filter.difficulty && p.difficulty !== filter.difficulty) return false;
    if (filter.topic && p.topic !== filter.topic) return false;
    return true;
  });
}

/** Counts for the three tiers, so the dashboard never hardcodes a number. */
export function catalogCounts() {
  const challenges = getChallenges();
  return {
    lessons: getLessons().length,
    problems: getProblems().length,
    challenges: challenges.length,
    /**
     * Steps, not just builds.
     *
     * A challenge is the unit a learner picks; a step is the unit they finish
     * and the unit progress is recorded against. Reporting only the first would
     * make three challenges look like less work than twelve problems, which is
     * the opposite of true.
     */
    challengeSteps: challenges.reduce((n, c) => n + c.steps.length, 0),
  };
}
