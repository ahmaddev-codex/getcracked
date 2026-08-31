import { Suspense } from 'react';
import { SignInForm } from '@/components/auth/SignInForm';
import { availableProviders } from '@/lib/oauth';
import { LoadingBar } from '@/components/ui/LoadingBar';

/**
 * A server component, so it can read which OAuth providers this deployment
 * actually has credentials for. The form itself is a client component.
 *
 * `useSearchParams` inside the form opts it into client-side rendering, which
 * fails prerendering without a boundary — hence the Suspense wrapper, which
 * keeps the route statically renderable while the form streams in.
 */
export default function SignInPage() {
  const providers = availableProviders();

  return (
    <Suspense fallback={<LoadingBar />}>
      <SignInForm providers={providers} />
    </Suspense>
  );
}
