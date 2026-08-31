import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LANDING, safeNext } from '@/lib/auth-redirect';

/**
 * Where authentication sends you (A2).
 *
 * Two separate concerns on one value. The **default** is a product decision:
 * someone who just made an account has already been sold, so landing them on the
 * marketing page makes them navigate to the thing they came for. The
 * **validation** is a security one: `next` arrives from the query string and is
 * handed both to `router.push()` and to the OAuth provider as `callbackURL`, so
 * unchecked it is an open redirect — and one on a sign-in page is a credible
 * phishing link, because the domain in the address bar is genuinely ours right
 * up until it is not.
 */

describe('the default landing', () => {
  it('is the curriculum, not the marketing page', () => {
    expect(DEFAULT_LANDING).toBe('/learn/dsa');
    expect(safeNext(null)).toBe(DEFAULT_LANDING);
    expect(safeNext(undefined)).toBe(DEFAULT_LANDING);
    expect(safeNext('')).toBe(DEFAULT_LANDING);
  });
});

describe('a legitimate next survives', () => {
  it.each([
    '/account',
    '/problems/hashing/two-sum',
    '/challenges/lru-cache/evict-the-oldest',
    '/learn/system-design#quorum',
    '/problems?difficulty=easy',
  ])('keeps %s', (path) => {
    // The guard sets these. A signed-out visitor bounced from /account has to
    // end up back at /account, or the redirect was pointless.
    expect(safeNext(path)).toBe(path);
  });
});

describe('an off-site next does not', () => {
  it.each([
    ['an absolute URL', 'https://example.com'],
    ['a bare host', 'example.com'],
    // Looks like a path and is not: a browser reads the leading `//` as
    // protocol-relative and goes off-origin.
    ['protocol-relative', '//example.com'],
    ['protocol-relative with a path', '//example.com/pretend'],
    // Browsers normalise the backslash to a slash, so this escapes the same way
    // — and it is the form a check for `//` alone misses.
    ['a backslash escape', '/\\example.com'],
    ['a javascript URL', 'javascript:alert(1)'],
    ['a data URL', 'data:text/html,<script>alert(1)</script>'],
  ])('refuses %s', (_name, hostile) => {
    expect(safeNext(hostile)).toBe(DEFAULT_LANDING);
  });

  it('falls back rather than throwing', () => {
    // A bad `next` is not the learner's problem to solve, and refusing to sign
    // them in over it would be a worse outcome than ignoring it.
    expect(() => safeNext('https://example.com')).not.toThrow();
  });
});

describe('an auth page as next', () => {
  it.each(['/sign-in', '/sign-up', '/sign-in?next=/account'])(
    'does not send you back to %s',
    (path) => {
      // Landing on the sign-in page having just signed in is a dead end that
      // reads as a failure.
      expect(safeNext(path)).toBe(DEFAULT_LANDING);
    },
  );

  it('does not over-match a path that merely starts the same way', () => {
    expect(safeNext('/sign-in-help')).toBe('/sign-in-help');
  });
});

describe('both forms route through it', () => {
  // The validator is worth nothing if one of the two forms reads the parameter
  // directly, and that is an easy thing to reintroduce by copying the other
  // one's older shape.
  it.each(['SignInForm', 'SignUpForm'])('%s validates rather than defaulting', (form) => {
    const source = readFileSync(`src/components/auth/${form}.tsx`, 'utf8');
    expect(source).toContain('safeNext(useSearchParams().get(');
    expect(source).not.toMatch(/useSearchParams\(\)\.get\('next'\)\s*\?\?/);
  });
});
