import { Suspense } from 'react';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { availableProviders } from '@/lib/oauth';

/** Server component for the same reason as sign-in — see that file. */
export default function SignUpPage() {
  const providers = availableProviders();

  return (
    <Suspense fallback={<main className="p-8 text-sm">Loading…</main>}>
      <SignUpForm providers={providers} />
    </Suspense>
  );
}
