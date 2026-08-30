import { describe, expect, it } from 'vitest';
import { availableProviders, configuredProviders, socialProviderConfig } from '@/lib/oauth';

/**
 * Social sign-in configuration (A2).
 *
 * The property under test is that a provider is offered only when it can
 * actually work. A button configured with an empty client id is worse than a
 * missing one: it fails after the learner has committed to a redirect, which
 * reads as the product being broken rather than a deployment being incomplete.
 */

const FULL = {
  GOOGLE_CLIENT_ID: 'google-id',
  GOOGLE_CLIENT_SECRET: 'google-secret',
  GITHUB_CLIENT_ID: 'github-id',
  GITHUB_CLIENT_SECRET: 'github-secret',
};

describe('oauth providers', () => {
  it('offers nothing when nothing is configured', () => {
    // The default for local development and CI, where the suite runs with no
    // secrets at all. Email and password must keep working.
    expect(configuredProviders({})).toEqual([]);
    expect(socialProviderConfig({})).toEqual({});
    expect(availableProviders({})).toEqual([]);
  });

  it('offers both when both are configured', () => {
    expect(availableProviders(FULL).map((p) => p.id)).toEqual(['google', 'github']);
  });

  it('offers only the provider that is complete', () => {
    const env = {
      GOOGLE_CLIENT_ID: 'google-id',
      GOOGLE_CLIENT_SECRET: 'google-secret',
    };
    expect(availableProviders(env).map((p) => p.id)).toEqual(['google']);
  });

  it('refuses a half-configured provider rather than offering a broken button', () => {
    // The case this exists for: an id set, a secret forgotten. Offering it
    // produces an OAuth error page the learner cannot act on.
    for (const env of [
      { GOOGLE_CLIENT_ID: 'id' },
      { GOOGLE_CLIENT_SECRET: 'secret' },
      { GITHUB_CLIENT_ID: 'id' },
    ]) {
      expect(availableProviders(env)).toEqual([]);
    }
  });

  it('treats whitespace as absent', () => {
    // A quoted empty value in a .env file is the usual way this happens.
    const env = {
      GOOGLE_CLIENT_ID: '  ',
      GOOGLE_CLIENT_SECRET: 'secret',
    };
    expect(availableProviders(env)).toEqual([]);
  });

  it('never leaks a secret to what the page renders', () => {
    // availableProviders feeds a client component. A client secret reaching the
    // browser is the single worst outcome available in this file.
    const serialised = JSON.stringify(availableProviders(FULL));
    expect(serialised).not.toContain('google-secret');
    expect(serialised).not.toContain('github-secret');
    expect(serialised).not.toContain('google-id');
  });

  it('shapes the config the way Better Auth expects', () => {
    expect(socialProviderConfig(FULL)).toEqual({
      google: { clientId: 'google-id', clientSecret: 'google-secret' },
      github: { clientId: 'github-id', clientSecret: 'github-secret' },
    });
  });

  it('omits an absent provider rather than passing empty strings', () => {
    // Better Auth accepts an empty credential and fails later, at redirect
    // time, where the error is much harder to trace back to a missing variable.
    const config = socialProviderConfig({
      GITHUB_CLIENT_ID: 'id',
      GITHUB_CLIENT_SECRET: 'secret',
    });
    expect(Object.keys(config)).toEqual(['github']);
    expect('google' in config).toBe(false);
  });
});
