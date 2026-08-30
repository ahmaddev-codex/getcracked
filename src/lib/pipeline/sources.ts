import { classifyLicense, type LicenseClassification } from './licenses';

/**
 * The source registry (J1).
 *
 * ## Why this list is short, and deliberately so
 *
 * The pipeline's original justification was catalog volume, and the obvious
 * sources for that — the large interview-practice sites — are the ones we
 * cannot use. Their terms forbid scraping, so J3 classifies them `restricted`,
 * and J5 then reduces us to "substance only, never their text". That is
 * authoring with extra steps plus legal exposure, which is a worse trade than
 * authoring directly.
 *
 * So the registry holds only sources whose licence *already* permits reuse with
 * attribution. Every entry here can be reproduced; nothing here needs a
 * judgement call at ingest time. That turns H7 from a legal review into a
 * one-line policy: **we ingest CC-licensed and public-domain sources,
 * attribution is mandatory, and no ToS-restricted site is crawled.**
 *
 * Adding a source is a code change, reviewed like any other. There is no runtime
 * path that introduces one.
 */

export interface Source {
  id: string;
  name: string;
  homepage: string;
  /** Declared licence, verbatim as the source states it. */
  license: string;
  /** Where the licence claim was read, so a reviewer can re-check it. */
  licenseEvidence: string;
  /** What we expect to take from it. */
  covers: string;
  /**
   * Seconds between requests. Politeness is a property of the source, not a
   * global constant: a volunteer-run wiki and a university CDN tolerate very
   * different rates.
   */
  crawlDelaySeconds: number;
}

export const SOURCES: readonly Source[] = [
  {
    id: 'wikipedia',
    name: 'Wikipedia',
    homepage: 'https://en.wikipedia.org/',
    license: 'CC-BY-SA-4.0',
    licenseEvidence: 'https://en.wikipedia.org/wiki/Wikipedia:Copyrights',
    covers: 'Definitions, complexity tables, and variant taxonomies for data structures and algorithms.',
    crawlDelaySeconds: 1,
  },
  {
    id: 'cp-algorithms',
    name: 'CP-Algorithms',
    homepage: 'https://cp-algorithms.com/',
    license: 'CC-BY-SA-4.0',
    licenseEvidence: 'https://github.com/cp-algorithms/cp-algorithms/blob/main/LICENSE',
    covers: 'Algorithm explanations and reference implementations, especially advanced topics.',
    crawlDelaySeconds: 2,
  },
  {
    id: 'competitive-programmers-handbook',
    name: "Competitive Programmer's Handbook",
    homepage: 'https://cses.fi/book/index.php',
    license: 'CC-BY-4.0',
    licenseEvidence: 'Stated on the title page of the PDF.',
    covers: 'Worked techniques and problem framings across the algorithms track.',
    crawlDelaySeconds: 2,
  },
  {
    id: 'mit-ocw',
    name: 'MIT OpenCourseWare',
    homepage: 'https://ocw.mit.edu/',
    license: 'CC-BY-NC-SA-4.0',
    licenseEvidence: 'https://ocw.mit.edu/terms/',
    covers: 'Lecture framing and problem sets for algorithms and system design.',
    crawlDelaySeconds: 3,
  },
];

export interface RegisteredSource extends Source {
  classification: LicenseClassification;
}

/**
 * The registry with every licence already classified.
 *
 * Classification happens here rather than at fetch time, so a source that would
 * be restricted is visible at review, in a diff, rather than at 3am in a job log.
 */
export function registry(): RegisteredSource[] {
  return SOURCES.map((source) => ({
    ...source,
    classification: classifyLicense(source.license),
  }));
}

export function findSource(id: string): RegisteredSource | undefined {
  return registry().find((s) => s.id === id);
}

/**
 * Sources that may not be crawled at all.
 *
 * Empty by construction today, and checked rather than assumed: a restricted
 * source reaching the registry is a mistake worth failing loudly on, not a state
 * to handle gracefully.
 */
export function restrictedSources(): RegisteredSource[] {
  return registry().filter((s) => s.classification.bucket === 'restricted');
}
