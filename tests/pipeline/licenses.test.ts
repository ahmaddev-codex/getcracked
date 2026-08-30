import { describe, expect, it } from 'vitest';
import { classifyLicense, mayReproduce } from '@/lib/pipeline/licenses';
import { registry, restrictedSources, SOURCES } from '@/lib/pipeline/sources';

/**
 * The licence gate (J3).
 *
 * These tests are the policy. Reproducing text without the right to do so is not
 * a defect that can be fixed after the fact — it is a takedown that invalidates
 * everything derived from the artifact — so the interesting cases here are all
 * about failing safe.
 */
describe('licence classification', () => {
  it.each([
    ['CC0-1.0', 'public-domain'],
    ['CC-BY-4.0', 'permissive'],
    ['MIT', 'permissive'],
    ['CC-BY-SA-4.0', 'share-alike'],
    ['CC-BY-NC-SA-4.0', 'noncommercial'],
  ])('classifies %s as %s', (license, bucket) => {
    expect(classifyLicense(license).bucket).toBe(bucket);
  });

  it('reads a licence URL, which is how sources usually state it', () => {
    expect(
      classifyLicense('https://creativecommons.org/licenses/by-sa/4.0/').bucket,
    ).toBe('share-alike');
    expect(classifyLicense('http://creativecommons.org/publicdomain/zero/1.0/').bucket).toBe(
      'public-domain',
    );
  });

  it('treats an absent licence as restricted', () => {
    // Absence is not permission. This is the single most important case here.
    for (const value of [null, undefined, '', '   ']) {
      const result = classifyLicense(value);
      expect(result.bucket).toBe('restricted');
      expect(result.mayReproduceText).toBe(false);
    }
  });

  it('treats an unrecognised licence as restricted rather than guessing', () => {
    const result = classifyLicense('Some-Company-EULA-2.0');
    expect(result.bucket).toBe('restricted');
    expect(result.mayReproduceText).toBe(false);
    expect(result.reason).toMatch(/not a reviewed licence/i);
  });

  it('never permits reproducing restricted text', () => {
    expect(mayReproduce('All rights reserved')).toBe(false);
    expect(mayReproduce(undefined)).toBe(false);
  });

  it('keeps noncommercial separate from permissive', () => {
    // The platform is free today and a licence is forever. Folding these
    // together would make a future paid tier an infringement, silently.
    const nc = classifyLicense('CC-BY-NC-4.0');
    expect(nc.noncommercialOnly).toBe(true);
    expect(classifyLicense('CC-BY-4.0').noncommercialOnly).toBe(false);
  });

  it('carries the share-alike obligation forward', () => {
    expect(classifyLicense('CC-BY-SA-4.0').requiresShareAlike).toBe(true);
    expect(classifyLicense('MIT').requiresShareAlike).toBe(false);
  });

  it('requires attribution even for restricted sources', () => {
    // We cannot use their words, but if we use their substance we still say so.
    expect(classifyLicense('unknown').requiresAttribution).toBe(true);
  });
});

describe('source registry (J1)', () => {
  it('registers no source we are not allowed to reproduce', () => {
    // The whole point of the descoped pipeline: every source in the registry is
    // already reusable, so no ingest-time judgement call is ever needed.
    expect(restrictedSources()).toEqual([]);
  });

  it('gives every source a licence, evidence, and a crawl delay', () => {
    for (const source of SOURCES) {
      expect(source.license, `${source.id} has no licence`).toBeTruthy();
      expect(source.licenseEvidence, `${source.id} cites no evidence`).toBeTruthy();
      expect(source.crawlDelaySeconds, `${source.id} has no delay`).toBeGreaterThan(0);
    }
  });

  it('classifies every source at registry build, not at fetch', () => {
    for (const source of registry()) {
      expect(source.classification.spdx).not.toBe('UNKNOWN');
      expect(source.classification.mayReproduceText).toBe(true);
    }
  });

  it('uses unique ids, since a takedown deletes by id', () => {
    const ids = SOURCES.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
