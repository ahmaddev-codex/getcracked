import { classifyLicense, type LicenseBucket } from './licenses';
import { findSource } from './sources';

/**
 * The attribution ledger (J4).
 *
 * Every ingested artifact carries where it came from, under what licence, and
 * when it was retrieved. That record is what makes a takedown (J6) a single
 * operation — delete by source id — instead of an archaeology exercise across a
 * catalog nobody can prove the provenance of.
 *
 * It is also the thing that makes a share-alike obligation survivable. CC BY-SA
 * requires the derived work to carry the same licence; that is only possible if
 * you can still tell, months later, which artifacts descended from a share-alike
 * source. Provenance recorded at ingest is the only moment that information
 * exists for free.
 */

export interface Provenance {
  /** Registry id. Deleting every artifact with this id is the takedown. */
  sourceId: string;
  /** Exact page the artifact came from, not just the site. */
  sourceUrl: string;
  /** ISO date the fetch happened, so a licence change can be dated against it. */
  retrievedAt: string;
  /** Licence as classified at ingest, kept even if the source later changes it. */
  license: string;
  bucket: LicenseBucket;
  /** Whether this artifact contains the source's own wording. */
  reproducesText: boolean;
  /** Named author or attribution line, where the source gives one. */
  author?: string;
}

export class ProvenanceError extends Error {}

/**
 * Builds a provenance record, refusing anything it cannot vouch for.
 *
 * Throws rather than returning a partial record. An artifact whose origin cannot
 * be stated is precisely the artifact that must not enter the catalog, and a
 * caller that ignores a returned null would let it in.
 */
export function recordProvenance(input: {
  sourceId: string;
  sourceUrl: string;
  retrievedAt: Date;
  /** Whether the extraction kept the source's wording. */
  reproducesText: boolean;
  author?: string;
}): Provenance {
  const source = findSource(input.sourceId);
  if (!source) {
    throw new ProvenanceError(
      `Unknown source "${input.sourceId}". Add it to the registry before ingesting from it.`,
    );
  }

  const classification = classifyLicense(source.license);

  if (input.reproducesText && !classification.mayReproduceText) {
    throw new ProvenanceError(
      `${source.name} is ${classification.bucket}; its text may not be reproduced. ` +
        'Canonicalise the substance in our own words instead (J5).',
    );
  }

  let url: URL;
  try {
    url = new URL(input.sourceUrl);
  } catch {
    throw new ProvenanceError(`"${input.sourceUrl}" is not a URL, so it cannot be cited.`);
  }

  // A citation pointing at the wrong site is worse than none: it credits someone
  // who did not write it, and hides who did.
  if (!url.hostname.endsWith(new URL(source.homepage).hostname)) {
    throw new ProvenanceError(
      `${input.sourceUrl} is not on ${source.name}'s domain. Register it as its own source.`,
    );
  }

  return {
    sourceId: source.id,
    sourceUrl: input.sourceUrl,
    retrievedAt: input.retrievedAt.toISOString(),
    license: classification.spdx,
    bucket: classification.bucket,
    reproducesText: input.reproducesText,
    author: input.author,
  };
}

/**
 * The credit line shown to a learner.
 *
 * Attribution is a licence obligation, so it is generated from the record rather
 * than authored per artifact — a hand-written credit is one someone can forget.
 */
export function attributionLine(provenance: Provenance): string {
  const source = findSource(provenance.sourceId);
  const name = source?.name ?? provenance.sourceId;
  const who = provenance.author ? `${provenance.author}, ${name}` : name;
  const shareAlike = classifyLicense(provenance.license).requiresShareAlike
    ? ', shared under the same licence'
    : '';
  return `Adapted from ${who} (${provenance.license})${shareAlike}.`;
}
