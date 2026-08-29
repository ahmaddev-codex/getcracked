import { z } from 'zod';

/**
 * System Design concept map (A14).
 *
 * Reference material rather than a runnable unit, so it sits outside the
 * three-tier content union: nothing here is attempted, graded, or progressed
 * through. It is the System Design track's tier-1 equivalent of a DSA lesson,
 * and the vocabulary the labs (Module C) and roadmaps (Module I) link into.
 */

export const conceptSchema = z.object({
  /** Stable anchor. Deep links depend on it, so renaming one breaks bookmarks. */
  slug: z.string().regex(/^[a-z0-9-]+$/),
  term: z.string().min(1),
  /** One or two sentences. Definitions, not essays. */
  definition: z.string().min(20),
  /** Why an interviewer or a system actually cares. */
  matters: z.string().min(20),
});
export type Concept = z.infer<typeof conceptSchema>;

export const conceptCategorySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  order: z.number().int().nonnegative(),
  concepts: z.array(conceptSchema).min(1),
});
export type ConceptCategory = z.infer<typeof conceptCategorySchema>;
