import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';

/**
 * The first account-scoped page — exists to prove the guard end to end.
 *
 * Middleware has already rejected requests with no cookie; this is the
 * authoritative check that the session record is real (AD-5).
 */
export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in?next=/account');

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Your account</h1>
      <p className="text-sm text-foreground-muted">Signed in as {session.user.email}</p>
    </main>
  );
}
