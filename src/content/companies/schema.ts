import { z } from 'zod';

/**
 * Company interview-loop guides (D7).
 *
 * **Sourced per claim, not per guide.** A page confirming "there are four
 * stages" does not license writing that "the Bar Raiser evaluates X" — those are
 * different assertions and need different evidence. Attaching one list of links
 * to a whole guide lets an unsourced sentence sit next to a sourced one looking
 * identical, which is exactly how the first attempt at this went wrong: three
 * guides were drafted and *then* their sources checked, and one citation turned
 * out to be a 404.
 *
 * So the order is inverted and the schema enforces it. A claim is either
 * `confirmed` — and then it must carry a source that a reader can actually open
 * — or `commonly-reported`, which is a real and separate category for things
 * everyone knows and no company has ever written down. What the schema makes
 * impossible is the third thing: an unsourced claim presented as fact.
 */

/**
 * A source, with the two properties that decide whether it counts.
 *
 * `openable` is not decoration. Google's careers pages describe the process and
 * are useless as sources, because they render nothing without JavaScript — you
 * can link them but you cannot quote them, and a link nobody can read is a
 * placeholder wearing a citation's clothes. The re:Work guides that used to
 * cover this now 404 outright.
 */
export const sourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url(),
  /**
   * Renders without JavaScript or a login, so the claim can be checked.
   *
   * Recorded rather than assumed because it is checkable — see
   * `scripts/check-company-sources.ts`, which re-fetches every URL.
   */
  openable: z.literal(true, {
    message: 'A source that cannot be opened is not a source. Find one that renders.',
  }),
  /**
   * Published by the company itself, or by someone speaking for it.
   *
   * A community write-up describing what a company "actually does" is not
   * evidence about that company, however widely believed. Those belong in
   * `commonly-reported`, which says so.
   */
  firstParty: z.literal(true, {
    message: 'Only first-party sources confirm a claim. Use commonly-reported instead.',
  }),
  /**
   * When the source itself was published, separate from our review date.
   *
   * Null is allowed and is not the same as absent: plenty of career pages carry
   * no date at all, and recording that honestly is better than inventing one.
   * It is rendered, because a 2022 post about a 2026 process is a staleness risk
   * even when everything else about it is right.
   */
  published: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
});
export type Source = z.infer<typeof sourceSchema>;

/**
 * One assertion, and what backs it.
 *
 * The discriminant is the point. `confirmed` cannot parse without a source;
 * `commonly-reported` cannot carry one, because if a first-party source existed
 * the claim would not be in that category.
 */
export const claimSchema = z.discriminatedUnion('status', [
  z.object({
    status: z.literal('confirmed'),
    text: z.string().min(1),
    sources: z.array(sourceSchema).min(1),
  }),
  z.object({
    status: z.literal('commonly-reported'),
    text: z.string().min(1),
    /**
     * Why it is not confirmed, shown to the reader.
     *
     * "Widely reported and the company has never published it" is a useful
     * thing to know, and burying it would turn an honest caveat into a hedge.
     */
    caveat: z.string().min(1),
  }),
]);
export type Claim = z.infer<typeof claimSchema>;

export const interviewRoundSchema = z.object({
  name: z.string().min(1),
  assesses: claimSchema,
  /** Where to prepare for it here. */
  practice: z
    .object({ label: z.string().min(1), href: z.string().startsWith('/') })
    .optional(),
});
export type InterviewRound = z.infer<typeof interviewRoundSchema>;

export const companySchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  /** Exactly as it appears in a problem's `companies` list — the D1 join key. */
  name: z.string().min(1),
  summary: z.string().min(1),
  rounds: z.array(interviewRoundSchema).min(1),
  /** Anything else worth knowing, each sourced or flagged the same way. */
  notes: z.array(claimSchema).default([]),
  /**
   * When a human last read every source and confirmed it still says this.
   *
   * Distinct from each source's own `published` date, and both are rendered. On
   * a cadence, or on any reported mismatch, this is what gets re-checked: if a
   * URL now 404s, redirects elsewhere, or no longer supports the claim, the
   * guide is pulled back to needing re-verification rather than sitting live.
   */
  reviewed: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'reviewed must be an ISO date'),
});
export type Company = z.infer<typeof companySchema>;
export type CompanyInput = z.input<typeof companySchema>;

/** Every source a guide cites, for the liveness re-check. */
export function sourcesOf(company: Company): Source[] {
  const claims: Claim[] = [...company.rounds.map((r) => r.assesses), ...company.notes];
  return claims.flatMap((c) => (c.status === 'confirmed' ? c.sources : []));
}
