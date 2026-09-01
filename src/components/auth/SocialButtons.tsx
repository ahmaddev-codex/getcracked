'use client';

import { useState } from 'react';
import { signIn } from '@/lib/auth-client';
import type { OAuthProviderId } from '@/lib/oauth';

/**
 * Social sign-in buttons (A2).
 *
 * Rendered only for providers the deployment has credentials for, decided on
 * the server — a button that cannot work is worse than a missing one, because
 * it fails only after the learner has committed to a redirect.
 *
 * `callbackURL` carries the page they came from, falling back to the front of
 * the curriculum. Sending everyone to one fixed page after an OAuth round trip
 * loses their place, and the reason to sign in here is usually that they were
 * already doing something.
 *
 * It is validated before it gets here (`lib/auth-redirect.ts`). This value
 * leaves our origin — it is handed to the provider — so an unchecked one is an
 * open redirect with an authentication step in front of it.
 */

import { CompanyLogo } from '@/components/company/CompanyLogo';

const MARKS: Record<OAuthProviderId, React.ReactNode> = {
  google: <CompanyLogo name="google.com" size={16} alt="Google" className="rounded-full" />,
  github: <CompanyLogo name="github.com" size={16} alt="GitHub" className="rounded-full" />,
};

export function SocialButtons({
  providers,
  callbackURL,
}: {
  providers: ReadonlyArray<{ id: OAuthProviderId; label: string }>;
  callbackURL: string;
}) {
  const [busy, setBusy] = useState<OAuthProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (providers.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <button
            key={provider.id}
            type="button"
            disabled={busy !== null}
            onClick={async () => {
              setBusy(provider.id);
              setError(null);
              const res = await signIn.social({ provider: provider.id, callbackURL });
              // A successful call redirects, so reaching here means it did not.
              // Without this the button would spin forever on a failure.
              if (res?.error) {
                setError(res.error.message ?? `Could not continue with ${provider.label}.`);
                setBusy(null);
              }
            }}
            className="node-surface cursor-pointer node-interactive flex w-full items-center justify-center gap-2 bg-surface px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-60"
          >
            {MARKS[provider.id]}
            {busy === provider.id ? 'Redirecting…' : `Continue with ${provider.label}`}
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border-subtle" />
        <span className="text-xs text-foreground-muted">or</span>
        <span className="h-px flex-1 bg-border-subtle" />
      </div>
    </div>
  );
}
