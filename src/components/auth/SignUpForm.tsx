'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { safeNext } from '@/lib/auth-redirect';
import { Button } from '@/components/ui/Button';
import { SocialButtons } from '@/components/auth/SocialButtons';
import type { OAuthProviderId } from '@/lib/oauth';
import { signUp } from '@/lib/auth-client';

export function SignUpForm({ providers }: { providers: ReadonlyArray<{ id: OAuthProviderId; label: string }> }) {
  const router = useRouter();
  // Validated, not just defaulted — `next` reaches router.push() and the OAuth
  // provider's callbackURL, so an unchecked value is an open redirect.
  const next = safeNext(useSearchParams().get('next'));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const data = new FormData(e.currentTarget);
    const res = await signUp.email({
      name: String(data.get('name')),
      email: String(data.get('email')),
      password: String(data.get('password')),
    });
    setBusy(false);
    if (res.error) setError(res.error.message ?? 'Could not create your account.');
    else router.push(next);
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8 text-center">
      <div className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm opacity-70">
          Free to use right now. An account keeps your progress, streaks and activity —
          without one they live in this browser and go when it does.
        </p>
      </div>

      <SocialButtons providers={providers} callbackURL={next} />

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="name" placeholder="Name" required className="node-surface bg-surface px-3 py-2 text-left text-sm text-foreground" />
        <input name="email" type="email" placeholder="Email" required autoComplete="email" className="node-surface bg-surface px-3 py-2 text-left text-sm text-foreground" />
        <input name="password" type="password" placeholder="Password" required minLength={8} autoComplete="new-password" className="node-surface bg-surface px-3 py-2 text-left text-sm text-foreground" />
        <Button type="submit" disabled={busy} className="w-full justify-center">
          {busy ? 'Creating…' : 'Create account'}
        </Button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      <p className="text-sm">
        Already have one? <Link href="/sign-in" className="text-link underline">Sign in</Link>
      </p>
    </main>
  );
}
