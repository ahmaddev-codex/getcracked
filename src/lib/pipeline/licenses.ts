/**
 * Licence classification (J3) — the gate every source passes before ingest.
 *
 * ## Why this is a hard gate rather than a warning
 *
 * The platform reproduces text. Reproducing text you do not have the right to
 * reproduce is not a quality problem that can be fixed later — it is a takedown,
 * and it invalidates everything derived from that artifact. So classification
 * happens *before* a fetch, and an unrecognised licence is `restricted`, which
 * permits substance only and never the source's words (J5).
 *
 * **There is deliberately no override.** A per-source "trust me" flag is exactly
 * the mechanism by which unlicensed content reaches production: it is set once
 * under deadline and never revisited. Adding a source means adding a licence the
 * classifier recognises, which is a code change with a diff someone reviews.
 *
 * ## What the buckets permit
 *
 * | bucket | reproduce text | obligations |
 * |---|---|---|
 * | `public-domain` | yes | none |
 * | `permissive` | yes | attribute |
 * | `share-alike` | yes | attribute, and the derived work carries the same licence |
 * | `noncommercial` | yes | attribute, and the work may not be used commercially |
 * | `restricted` | **no** | substance only, canonicalised in our own words (J5) |
 *
 * `noncommercial` is kept separate from `permissive` rather than folded into it,
 * because the platform is free today and a licence is forever. Merging them
 * would silently make a future paid tier an infringement.
 */

export type LicenseBucket =
  | 'public-domain'
  | 'permissive'
  | 'share-alike'
  | 'noncommercial'
  | 'restricted';

export interface LicenseClassification {
  bucket: LicenseBucket;
  /** The canonical identifier we matched, for the ledger. */
  spdx: string;
  /** May the source's own wording be stored and shown? */
  mayReproduceText: boolean;
  /** Must every artifact credit the source? */
  requiresAttribution: boolean;
  /** Must derived work carry the same licence? */
  requiresShareAlike: boolean;
  /** Is commercial use forbidden? */
  noncommercialOnly: boolean;
  /** Why the classifier decided this — recorded so a review can check it. */
  reason: string;
}

/**
 * Recognised licences, keyed by SPDX identifier.
 *
 * Only what has been deliberately reviewed appears here. Anything absent is
 * restricted, which is the safe direction to be wrong in.
 */
const KNOWN: Record<string, LicenseBucket> = {
  'CC0-1.0': 'public-domain',
  'CC-PDDC': 'public-domain',
  'CC-BY-4.0': 'permissive',
  'CC-BY-3.0': 'permissive',
  MIT: 'permissive',
  'Apache-2.0': 'permissive',
  'BSD-3-Clause': 'permissive',
  'CC-BY-SA-4.0': 'share-alike',
  'CC-BY-SA-3.0': 'share-alike',
  'GFDL-1.3': 'share-alike',
  'CC-BY-NC-4.0': 'noncommercial',
  'CC-BY-NC-SA-4.0': 'noncommercial',
};

const BUCKET_RULES: Record<
  LicenseBucket,
  Omit<LicenseClassification, 'spdx' | 'reason' | 'bucket'>
> = {
  'public-domain': {
    mayReproduceText: true,
    requiresAttribution: false,
    requiresShareAlike: false,
    noncommercialOnly: false,
  },
  permissive: {
    mayReproduceText: true,
    requiresAttribution: true,
    requiresShareAlike: false,
    noncommercialOnly: false,
  },
  'share-alike': {
    mayReproduceText: true,
    requiresAttribution: true,
    requiresShareAlike: true,
    noncommercialOnly: false,
  },
  noncommercial: {
    mayReproduceText: true,
    requiresAttribution: true,
    requiresShareAlike: false,
    noncommercialOnly: true,
  },
  restricted: {
    mayReproduceText: false,
    requiresAttribution: true,
    requiresShareAlike: false,
    noncommercialOnly: false,
  },
};

/** Normalises the spellings licences actually appear in. */
function normalise(raw: string): string {
  const trimmed = raw.trim();

  // A licence URL is the commonest form in the wild, and the path carries the
  // identifier: creativecommons.org/licenses/by-sa/4.0/
  const url = /creativecommons\.org\/(?:licenses|publicdomain)\/([a-z-]+)\/([\d.]+)?/i.exec(
    trimmed,
  );
  if (url) {
    const code = url[1].toLowerCase();
    const version = url[2] ?? '4.0';
    if (code === 'zero') return 'CC0-1.0';
    if (code === 'mark') return 'CC-PDDC';
    return `CC-${code.toUpperCase()}-${version}`;
  }

  return trimmed
    .toUpperCase()
    .replace(/\s+/g, '-')
    .replace(/^CC-BY/, 'CC-BY')
    .replace(/-LICENSE$/, '');
}

/**
 * Classifies a licence string.
 *
 * Never throws and never returns undefined: an unclassifiable input is
 * `restricted`, so a caller that forgets to check still fails safe.
 */
export function classifyLicense(raw: string | null | undefined): LicenseClassification {
  if (!raw || raw.trim() === '') {
    return {
      bucket: 'restricted',
      spdx: 'UNKNOWN',
      ...BUCKET_RULES.restricted,
      reason: 'No licence declared. Absence is not permission.',
    };
  }

  const spdx = normalise(raw);
  const bucket = KNOWN[spdx];

  if (!bucket) {
    return {
      bucket: 'restricted',
      spdx,
      ...BUCKET_RULES.restricted,
      reason: `"${spdx}" is not a reviewed licence. Add it to the registry deliberately, or treat the source as restricted.`,
    };
  }

  return {
    bucket,
    spdx,
    ...BUCKET_RULES[bucket],
    reason: `Recognised as ${spdx}.`,
  };
}

/**
 * Whether an artifact may carry the source's own words.
 *
 * The single question the extraction step asks. Kept as its own function so the
 * decision has one call site rather than being re-derived from the bucket at
 * each use, which is how such rules drift apart.
 */
export function mayReproduce(license: string | null | undefined): boolean {
  return classifyLicense(license).mayReproduceText;
}
