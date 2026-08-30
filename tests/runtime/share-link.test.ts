import { describe, expect, it } from 'vitest';
import { decodeRun, encodeRun, MAX_LINK_LENGTH, type SharedRun } from '@/lib/share-link';

/**
 * Shareable sandbox links (B6, the link half).
 *
 * Two properties matter and neither is obvious from the code. A link has to
 * round-trip exactly — a snippet that comes back with a character changed is
 * worse than one that fails to load. And a *malformed* link has to be refused
 * rather than half-accepted, because it is attacker-controlled input in the
 * ordinary sense: anyone can craft one, and the decoded language reaches the
 * runtime registry.
 */

const run: SharedRun = {
  language: 'javascript',
  entry: 'solve',
  source: 'function solve(nums) {\n  return nums.length;\n}',
  args: [[1, 2, 3]],
};

describe('round trip', () => {
  it('returns exactly what went in', () => {
    expect(decodeRun(encodeRun(run))).toEqual(run);
  });

  it('survives characters that break a naive base64', () => {
    // Non-ASCII in a comment or a string literal is entirely normal, and
    // `btoa` alone throws on it — the encoder goes through UTF-8 for this.
    const unicode: SharedRun = {
      ...run,
      source: '// naïve — 日本語 — ✅\nfunction solve() { return "café"; }',
      args: ['ünïcödé'],
    };
    expect(decodeRun(encodeRun(unicode))).toEqual(unicode);
  });

  it('produces a fragment that is URL-safe', () => {
    // `+`, `/` and `=` all mean something else in a URL, so plain base64 would
    // arrive mangled from anything that re-encodes it.
    const fragment = encodeRun({ ...run, source: 'a'.repeat(200) });
    expect(fragment.startsWith('#c=')).toBe(true);
    expect(fragment.slice(3)).toMatch(/^[A-Za-z0-9\-_]+$/);
  });

  it('preserves Python as readily as JavaScript', () => {
    const python: SharedRun = {
      language: 'python',
      entry: 'solve',
      source: 'def solve(nums):\n    return len(nums)\n',
      args: [[1, 2]],
    };
    expect(decodeRun(encodeRun(python))).toEqual(python);
  });
});

describe('a link that is not one', () => {
  it.each([
    ['no fragment at all', ''],
    ['a fragment with no payload', '#anchor'],
    ['a payload that is not base64', '#c=not base64!'],
    ['a payload that is not JSON', `#c=${btoa('nonsense').replace(/=+$/, '')}`],
  ])('opens normally for %s', (_case, fragment) => {
    // A mangled link is a normal thing to receive — it has been through a chat
    // client that decided the trailing bracket was punctuation.
    expect(decodeRun(fragment)).toBeNull();
  });

  it.each([
    ['an unknown language', { l: 'ruby', e: 'solve', s: 'x', a: [] }],
    ['no entry', { l: 'javascript', e: '', s: 'x', a: [] }],
    ['no source', { l: 'javascript', e: 'solve', s: '', a: [] }],
    ['args that are not a list', { l: 'javascript', e: 'solve', s: 'x', a: 5 }],
    ['nothing at all', {}],
  ])('refuses %s rather than accepting half of it', (_case, payload) => {
    // The decoded language reaches the runtime registry, so a field that is not
    // what it claims must not get that far.
    const fragment = `#c=${Buffer.from(JSON.stringify(payload))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')}`;

    expect(decodeRun(fragment)).toBeNull();
  });

  it('finds the payload when it is not the first parameter', () => {
    const encoded = encodeRun(run).slice(1);
    expect(decodeRun(`#theme=dark&${encoded}`)).toEqual(run);
  });
});

describe('length', () => {
  it('keeps an ordinary snippet well inside the limit', () => {
    // The whole reason the limit exists is that a truncated link produces a
    // broken sandbox rather than an error, so a typical share must not be near it.
    expect(encodeRun(run).length).toBeLessThan(MAX_LINK_LENGTH / 4);
  });

  it('grows predictably enough for the caller to check before copying', () => {
    const big = encodeRun({ ...run, source: 'x'.repeat(3000) });
    expect(big.length).toBeGreaterThan(MAX_LINK_LENGTH);
  });
});
