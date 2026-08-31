import { describe, expect, it } from 'vitest';
import { resolveBaseUrl } from '@/lib/auth';

/**
 * Where a deployment thinks it lives (A2).
 *
 * This is the variable that produced a 500 on `/api/auth/sign-in/social` in
 * production with nothing to suggest why. `baseURL` fell back to
 * `http://localhost:3000` unconditionally, so a deployment missing
 * `BETTER_AUTH_URL` did not fail — it built OAuth callback URLs pointing at the
 * developer's laptop and returned a server error when the provider handshake
 * could not complete.
 *
 * `BETTER_AUTH_SECRET` has always refused to guess in production. These pin the
 * same discipline here, because a wrong base URL is the worse failure of the
 * two: a missing secret stops a deploy, a wrong origin ships and breaks sign-in
 * for everyone who tries it.
 */

const env = (over: Record<string, string | undefined> = {}) =>
  ({ NODE_ENV: 'production', ...over }) as NodeJS.ProcessEnv;

describe('an explicit setting wins', () => {
  it('uses BETTER_AUTH_URL when set', () => {
    expect(resolveBaseUrl(env({ BETTER_AUTH_URL: 'https://example.com' }))).toBe(
      'https://example.com',
    );
  });

  it('prefers it over anything Vercel provides', () => {
    // Vercel's values are per-deploy; the provider's registered redirect URI is
    // not. An explicit setting is the only one guaranteed to match.
    expect(
      resolveBaseUrl(
        env({
          BETTER_AUTH_URL: 'https://example.com',
          VERCEL_URL: 'preview-xyz.vercel.app',
          VERCEL_PROJECT_PRODUCTION_URL: 'prod.vercel.app',
        }),
      ),
    ).toBe('https://example.com');
  });
});

describe('falling back on Vercel', () => {
  it('uses the stable production domain before the per-deploy one', () => {
    expect(
      resolveBaseUrl(
        env({ VERCEL_URL: 'preview-xyz.vercel.app', VERCEL_PROJECT_PRODUCTION_URL: 'prod.vercel.app' }),
      ),
    ).toBe('https://prod.vercel.app');
  });

  it('falls back to this deployment’s own origin', () => {
    expect(resolveBaseUrl(env({ VERCEL_URL: 'preview-xyz.vercel.app' }))).toBe(
      'https://preview-xyz.vercel.app',
    );
  });

  it('never yields localhost in production', () => {
    // The whole bug in one assertion.
    for (const e of [
      env({ VERCEL_URL: 'x.vercel.app' }),
      env({ VERCEL_PROJECT_PRODUCTION_URL: 'y.vercel.app' }),
    ]) {
      expect(resolveBaseUrl(e)).not.toContain('localhost');
    }
  });
});

describe('with nothing to go on', () => {
  it('refuses to guess in production', () => {
    expect(() => resolveBaseUrl(env())).toThrow(/BETTER_AUTH_URL must be set/);
  });

  it('names the consequence, not just the variable', () => {
    // A deploy log saying "BETTER_AUTH_URL is required" sends someone to set it
    // to anything. Saying what breaks sends them to set it correctly, and to
    // register the callback URL that has to match it.
    expect(() => resolveBaseUrl(env())).toThrow(/callback/i);
  });

  it('still uses localhost outside production', () => {
    // `pnpm dev` must keep working with no configuration at all.
    expect(resolveBaseUrl({ NODE_ENV: 'development' } as NodeJS.ProcessEnv)).toBe(
      'http://localhost:3000',
    );
  });
});
