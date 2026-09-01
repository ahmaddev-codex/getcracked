import { z } from 'zod';

/**
 * System Design concept map (A14).
 *
 * Reference material rather than a runnable unit, so it sits outside the
 * three-tier content union: nothing here is attempted, graded, or progressed
 * through. It is the System Design track's tier-1 equivalent of a DSA lesson,
 * and the vocabulary the labs (Module C) and roadmaps (Module I) link into.
 */

export const tenDimensionsSchema = z.object({
  /** 01 — Problem: What problem exists? */
  problem: z.string().min(15),
  /** 02 — Why it happens: What causes it? */
  whyItHappens: z.string().min(15),
  /** 03 — Primitive solution: What's the simplest naive solution? */
  primitiveSolution: z.string().min(15),
  /** 04 — Scale limit: When does that naive solution break down? */
  scaleLimit: z.string().min(15),
  /** 05 — Component: What architectural component solves it? */
  component: z.string().min(15),
  /** 06 — Trade-offs: What do we gain and what do we sacrifice? */
  tradeOffs: z.object({
    gains: z.array(z.string().min(5)).min(1),
    sacrifices: z.array(z.string().min(5)).min(1),
  }),
  /** 07 — Failure: What happens when this component fails in production? */
  failureModes: z.string().min(15),
  /** 08 — Alternatives: What else could we use and when? */
  alternatives: z.array(z.string().min(5)).min(1),
  /** 09 — Interview signal: When should you bring this up in an interview? */
  interviewSignal: z.string().min(15),
  /** 10 — Real system: Where would this appear in a real-world architecture? */
  realSystem: z.string().min(15),
});
export type TenDimensions = z.infer<typeof tenDimensionsSchema>;

export const conceptSchema = z.object({
  /** Stable anchor. Deep links depend on it, so renaming one breaks bookmarks. */
  slug: z.string().regex(/^[a-z0-9-]+$/),
  term: z.string().min(1),
  /** One or two sentences. Definitions, not essays. */
  definition: z.string().min(20),
  /** Why an interviewer or a system actually cares. */
  matters: z.string().min(20),
  /** Standardized 10-dimension architectural reference (Track 4). */
  dimensions: tenDimensionsSchema.optional(),
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
