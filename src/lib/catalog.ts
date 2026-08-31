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
  /**
   * Company name, matched case-insensitively against a problem's tags (D1).
   *
   * Matched on the name rather than a slug because that is what the content
   * carries — a problem lists "Amazon", not "amazon" — and normalising at the
   * comparison keeps the tags readable in the files where they are authored.
   */
  company?: string;
}

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

export function filterProblems(filter: CatalogFilter): readonly Problem[] {
  return getProblems().filter((p) => {
    if (filter.difficulty && p.difficulty !== filter.difficulty) return false;
    if (filter.topic && p.topic !== filter.topic) return false;
    if (
      filter.company &&
      !p.companies.some((c) => c.toLowerCase() === filter.company!.toLowerCase())
    ) {
      return false;
    }
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

/**
 * Every company any problem is tagged with, with how many carry it (D1).
 *
 * Derived from the tags rather than from the authored guides, because the two
 * are different sets on purpose: a tag can exist without a guide (most do), and
 * the filter should offer everything that would actually return something.
 */
export function companyTags(): Array<{ name: string; count: number }> {
  const counts = new Map<string, number>();
  for (const problem of getProblems()) {
    for (const company of problem.companies) {
      counts.set(company, (counts.get(company) ?? 0) + 1);
    }
  }

  return [...counts]
    .map(([name, count]) => ({ name, count }))
    // Most-tagged first: the long tail of single-mention companies is not what
    // anyone is scanning for.
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}
