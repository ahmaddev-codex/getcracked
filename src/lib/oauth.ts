/**
 * Social sign-in providers (A2).
 *
 * ## Why these are conditional rather than always declared
 *
 * A provider configured with an empty client id is worse than an absent one: it
 * renders a button that takes a learner to an OAuth error page, which reads as
 * the product being broken rather than a deployment being incomplete. So a
 * provider is enabled only when both halves of its credential are present, and
 * the sign-in page renders exactly the buttons that can actually work.
 *
 * That also keeps `pnpm dev` and CI working with no secrets at all — email and
 * password remain, which is what the tests exercise.
 *
 * ## Sign-in is still not required to use the product
 *
 * Adding providers lowers the cost of having an account; it does not make one
 * necessary. Every learning surface renders signed out (§2.6, AD-5), and these
 * exist so progress can follow someone across devices without inventing another
 * password.
 */

export type OAuthProviderId = 'google' | 'github';

/**
 * Just enough of the environment to read a credential from.
 *
 * Deliberately not `NodeJS.ProcessEnv`: Next augments that per project once it
 * generates its types, so a plain object literal in a test stops satisfying it
 * — and the only thing this file needs is a string map.
 */
export type EnvLike = Record<string, string | undefined>;

export interface OAuthProvider {
  id: OAuthProviderId;
  label: string;
  clientId: string;
  clientSecret: string;
}

const DEFINITIONS: ReadonlyArray<{
  id: OAuthProviderId;
  label: string;
  idVar: string;
  secretVar: string;
}> = [
  {
    id: 'google',
    label: 'Google',
    idVar: 'GOOGLE_CLIENT_ID',
    secretVar: 'GOOGLE_CLIENT_SECRET',
  },
  {
    id: 'github',
    label: 'GitHub',
    idVar: 'GITHUB_CLIENT_ID',
    secretVar: 'GITHUB_CLIENT_SECRET',
  },
];

/**
 * Providers with both halves of a credential present.
 *
 * Read at call time rather than at module load, so a test can set the
 * environment and see the effect without re-importing the module.
 */
export function configuredProviders(env: EnvLike = process.env): OAuthProvider[] {
  return DEFINITIONS.flatMap((definition) => {
    const clientId = env[definition.idVar]?.trim();
    const clientSecret = env[definition.secretVar]?.trim();
    if (!clientId || !clientSecret) return [];
    return [{ id: definition.id, label: definition.label, clientId, clientSecret }];
  });
}

/**
 * The shape Better Auth expects: `{ google: { clientId, clientSecret } }`.
 *
 * Absent providers are omitted entirely rather than passed as empty strings,
 * which Better Auth would accept and then fail on at redirect time.
 */
export function socialProviderConfig(
  env: EnvLike = process.env,
): Partial<Record<OAuthProviderId, { clientId: string; clientSecret: string }>> {
  return Object.fromEntries(
    configuredProviders(env).map((p) => [
      p.id,
      { clientId: p.clientId, clientSecret: p.clientSecret },
    ]),
  );
}

/** What the sign-in page needs: enough to render a button, and no secrets. */
export function availableProviders(
  env: EnvLike = process.env,
): Array<{ id: OAuthProviderId; label: string }> {
  return configuredProviders(env).map(({ id, label }) => ({ id, label }));
}
