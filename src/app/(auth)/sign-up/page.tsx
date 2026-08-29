'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUp } from '@/lib/auth-client';
import { PrivacyNotice } from '../PrivacyNotice';

function SignUpForm() {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm opacity-70">
          Everything is free. An account just keeps your progress.
        </p>
      </div>

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input name="name" placeholder="Name" required className="rounded border border-black/20 px-3 py-2 text-sm" />
        <input name="email" type="email" placeholder="Email" required autoComplete="email" className="rounded border border-black/20 px-3 py-2 text-sm" />
        <input name="password" type="password" placeholder="Password" required minLength={8} autoComplete="new-password" className="rounded border border-black/20 px-3 py-2 text-sm" />
        <button disabled={busy} className="rounded border border-black bg-black px-3 py-2 text-sm text-white disabled:opacity-40">
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <PrivacyNotice />

      <p className="text-sm">
        Already have one? <Link href="/sign-in" className="underline">Sign in</Link>
      </p>
    </main>
  );
}

/**
 * `useSearchParams` opts a component into client-side rendering, which fails
 * prerendering without a boundary. The wrapper keeps the route statically
 * renderable and the form streams in.
 */
export default function SignUpPage() {
  return (
    <Suspense fallback={<main className="p-8 text-sm">Loading…</main>}>
      <SignUpForm />
    </Suspense>
  );
}
