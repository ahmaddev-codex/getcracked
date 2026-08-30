import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { getDb } from '@/db/client';
import { getAuth } from '@/lib/auth';
import { getAllProgress } from '@/lib/progress';

/**
 * Every exercise this learner has completed, in one call.
 *
 * The per-exercise endpoint answers "how am I doing on *this* one", which is
 * the wrong shape for a listing: marking twenty rows would be twenty requests.
 * This returns only the ids, not the submissions — a catalogue page needs to
 * know *whether*, never *what*, and sending stored code to render a tick would
 * be a needless widening of what leaves the database.
 *
 * Signed out returns an empty set rather than a 401. There is nothing to
 * authorise: the listing renders for everyone (§2.6), and a signed-out learner's
 * progress lives in their browser, which the client merges in.
 */
export async function GET() {
  const session = await getAuth().api.getSession({ headers: await headers() });
  if (!session) return NextResponse.json({ solved: [] });

  const progress = await getAllProgress(getDb(), session.user.id);

  return NextResponse.json(
    {
      solved: [...new Set(progress.filter((p) => p.state === 'complete').map((p) => p.exerciseId))],
    },
    // Private: this is per-account. A shared cache here would serve one
    // learner's ticks to the next visitor.
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
