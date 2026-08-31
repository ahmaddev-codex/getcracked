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

const MARKS: Record<OAuthProviderId, React.ReactNode> = {
  // Inline rather than from an icon set: these are brand marks, and a generic
  // icon renders a shape that is recognisably not the provider's.
  google: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.4 14.3a7.1 7.1 0 0 1 0-4.6v-3.1h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.5-3.5A12 12 0 0 0 1.4 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z"
      />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M12 .5a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2c-3.3.7-4-1.6-4-1.6-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7 0-.7 0-.7 1.2.1 1.9 1.3 1.9 1.3 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-5.9 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.6-2.8 5.6-5.5 5.9.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .5Z"
      />
    </svg>
  ),
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
            className="node-surface node-interactive flex w-full items-center justify-center gap-2 bg-surface px-3 py-2 text-sm font-medium text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link disabled:cursor-not-allowed disabled:opacity-60"
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
