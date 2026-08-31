import { describe, expect, it } from 'vitest';
import { decide } from '../../scripts/deploy-migrate';

/**
 * When a deployment migrates (and, mostly, when it must not).
 *
 * The failure this whole step exists for was a database that never had its
 * migrations applied, so the app deployed green and 500'd on the first write.
 * The failure the *fix* could introduce is worse: Vercel environment variables
 * are commonly set for every environment at once, so a build that migrates
 * whenever a `DATABASE_URL` is present turns any pull-request branch into a
 * schema change on production.
 *
 * So the decision is a table rather than a truthiness check, and it is pinned
 * here — importing the module must not migrate anything, which is itself one of
 * the cases below.
 */

const env = (over: Record<string, string | undefined>) => over as NodeJS.ProcessEnv;

describe('a preview deployment', () => {
  it('does not migrate by default', () => {
    // The dangerous case: a branch build reaching the production database.
    const d = decide(env({ DATABASE_URL: 'postgres://x', VERCEL_ENV: 'preview' }));
    expect(d.run).toBe(false);
    expect(d.because).toMatch(/production is using/);
  });

  it('says how to opt in, for a preview with its own database', () => {
    expect(
      decide(env({ DATABASE_URL: 'postgres://x', VERCEL_ENV: 'preview' })).because,
    ).toMatch(/MIGRATE_PREVIEW=1/);
  });

  it('migrates when explicitly opted in', () => {
    expect(
      decide(env({ DATABASE_URL: 'postgres://x', VERCEL_ENV: 'preview', MIGRATE_PREVIEW: '1' }))
        .run,
    ).toBe(true);
  });

  it('needs the exact opt-in, not any truthy value', () => {
    // "false" and "0" are both truthy strings. A loose check here would migrate
    // production because someone typed the word they meant to disable it with.
    for (const value of ['0', 'false', 'no', '']) {
      expect(
        decide(env({ DATABASE_URL: 'postgres://x', VERCEL_ENV: 'preview', MIGRATE_PREVIEW: value }))
          .run,
        value,
      ).toBe(false);
    }
  });
});

describe('a production deployment', () => {
  it('migrates', () => {
    const d = decide(env({ DATABASE_URL: 'postgres://x', VERCEL_ENV: 'production' }));
    expect(d.run).toBe(true);
  });
});

describe('outside Vercel', () => {
  it('migrates, because the database is disposable', () => {
    // Local and CI both land here, and CI applying them every run is a free
    // check that the migrations still apply cleanly.
    expect(decide(env({ DATABASE_URL: 'postgres://x' })).run).toBe(true);
  });
});

describe('with no database configured', () => {
  it('skips rather than failing the build', () => {
    // `pnpm build` with no database is a normal thing to do, and a build should
    // not require one to produce static output.
    const d = decide(env({}));
    expect(d.run).toBe(false);
    expect(d.because).toMatch(/not set/);
  });

  it('skips even on a production deployment', () => {
    // Deliberate: failing here would be a confusing place to discover it, and
    // `db:verify` names the problem properly.
    expect(decide(env({ VERCEL_ENV: 'production' })).run).toBe(false);
  });
});
