import { describe, expect, it } from 'vitest';
import { isPublicPath, ACCOUNT_SCOPED_PAGE_PREFIXES } from '@/lib/access';

/**
 * The access model's defining property (PRD §2.6, AD-5): content is public,
 * user-owned data fails closed.
 *
 * The easy mistake is to gate everything by reflex, so the signed-out cases are
 * asserted as deliberately as the denied ones.
 */

describe('content is public', () => {
  it.each([
    '/',
    '/learn/dsa',
    '/learn/design-patterns',
    '/learn/dsa/hashing',
    '/learn/system-design',
    '/problems',
    '/problems/hashing',
    '/problems/hashing/two-sum',
    '/challenges/lru-cache/1',
    '/roadmaps',
    '/roadmaps/dsa',
    '/dashboard',
  ])('%s renders without a session', (path) => {
    expect(isPublicPath(path)).toBe(true);
  });

  it('treats an unknown content route as public rather than denied', () => {
    // Content is the default. A new lesson route must not 404-by-auth simply
    // because nobody remembered to allowlist it.
    expect(isPublicPath('/some/future/lesson/route')).toBe(true);
  });
});

describe('account-scoped pages require a session', () => {
  it.each(['/account', '/account/settings', '/admin', '/admin/review-queue'])(
    '%s is not public',
    (path) => {
      expect(isPublicPath(path)).toBe(false);
    },
  );

  it('protects every declared prefix and its children', () => {
    for (const prefix of ACCOUNT_SCOPED_PAGE_PREFIXES) {
      expect(isPublicPath(prefix)).toBe(false);
      expect(isPublicPath(`${prefix}/nested/deeper`)).toBe(false);
    }
  });
});

describe('API routes fail closed', () => {
  it.each([
    '/api/progress',
    '/api/progress/sync',
    '/api/submissions',
    '/api/assistant',
  ])('%s is not public', (path) => {
    expect(isPublicPath(path)).toBe(false);
  });

  it('denies an API route nobody has thought about yet', () => {
    // The point of the asymmetry: a new endpoint is refused by default rather
    // than exposed until someone remembers to list it.
    expect(isPublicPath('/api/billing/charge')).toBe(false);
    expect(isPublicPath('/api/some-future-endpoint')).toBe(false);
  });
});

describe('the analytics endpoint is deliberately public', () => {
  it('accepts writes without a session, because signed-out visitors are tracked', () => {
    // F6 tier two. The learner is told this is happening by the A16 notice
    // rather than by a policy page nobody opens. It defends itself with a
    // closed event allowlist and a payload cap instead of an auth check.
    expect(isPublicPath('/api/events')).toBe(true);
  });
});

describe('auth endpoints', () => {
  it('leaves Better Auth’s own routes reachable, or sign-in could never happen', () => {
    expect(isPublicPath('/api/auth/sign-in/email')).toBe(true);
    expect(isPublicPath('/api/auth/callback/github')).toBe(true);
  });

  it('does not let an auth-lookalike prefix bypass the guard', () => {
    // `/api/authorize-payment` starts with `/api/auth` as a raw string but is a
    // different route. Matching on prefix rather than path segment exposes it.
    expect(isPublicPath('/api/authorize-payment')).toBe(false);
  });
});
