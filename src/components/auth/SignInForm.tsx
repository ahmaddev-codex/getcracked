'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { SocialButtons } from '@/components/auth/SocialButtons';
import type { OAuthProviderId } from '@/lib/oauth';
import { signIn } from '@/lib/auth-client';

export function SignInForm({ providers }: { providers: ReadonlyArray<{ id: OAuthProviderId; label: string }> }) {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await signIn.email({
      email: String(data.get('email')),
      password: String(data.get('password')),
    });
    setBusy(false);
    if (res.error) setError(res.error.message ?? 'Could not sign you in.');
    else router.push(next);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm opacity-70">Pick up where you left off.</p>
      </div>

      <SocialButtons providers={providers} callbackURL={next} />

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="email" type="email" placeholder="Email" required autoComplete="email" className="node-surface bg-surface px-3 py-2 text-sm text-foreground" />
        <input name="password" type="password" placeholder="Password" required autoComplete="current-password" className="node-surface bg-surface px-3 py-2 text-sm text-foreground" />
        <Button type="submit" disabled={busy} className="w-full justify-center">
          {busy ? 'Signing in…' : 'Sign in'}
        </Button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <p className="text-sm">
        No account? <Link href="/sign-up" className="text-link underline">Create one</Link> — everything works signed out, too.
      </p>
    </main>
  );
}
