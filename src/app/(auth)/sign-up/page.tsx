import { Suspense } from 'react';
import { SignUpForm } from '@/components/auth/SignUpForm';
import { availableProviders } from '@/lib/oauth';
import { LoadingBar } from '@/components/ui/LoadingBar';

/** Server component for the same reason as sign-in — see that file. */
export default function SignUpPage() {
  const providers = availableProviders();

  return (
    <Suspense fallback={<LoadingBar />}>
      <SignUpForm providers={providers} />
    </Suspense>
  );
}
