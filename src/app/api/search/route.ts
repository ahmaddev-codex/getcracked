import { NextResponse } from 'next/server';
import { buildSearchIndex } from '@/lib/search';

/**
 * The search index, as a static asset (I6).
 *
 * **Public, and listed as such in lib/access.ts.** APIs default to denied
 * because that is where user data lives; this returns nothing but the catalogue,
 * which is public content (§2.6, AD-5). Adding it to the public list with a
 * reason is more honest than putting it on a non-`/api` path to route around the
 * check.
 *
 * **Prerendered, not computed per request.** `force-static` builds it once at
 * build time, so it costs nothing to serve and cannot drift from the content it
 * was derived from — the content only changes on a deploy (AD-1).
 *
 * **Fetched on first use rather than bundled.** The alternative is importing the
 * registry into the search component, which would put every lesson, problem and
 * challenge into the browser bundle of every page to answer a question about
 * their titles.
 */
export const dynamic = 'force-static';

export function GET() {
  return NextResponse.json(
    { entries: buildSearchIndex() },
    {
      headers: {
        // Immutable for a day: the index changes only on a deploy, and a stale
        // one degrades to "a new lesson is not findable yet", never to a wrong
        // answer.
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    },
  );
}
