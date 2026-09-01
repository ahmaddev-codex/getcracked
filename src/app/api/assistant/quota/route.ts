import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getRateLimitStatus, rateLimitKey } from '@/lib/rate-limit';
import { assistantConfigured } from '@/lib/assistant/model';

/**
 * Returns the learner's remaining assistant queries without consuming a token.
 */
export async function GET() {
  const session = await getSession();
  const configured = assistantConfigured();

  if (!session?.user?.id) {
    return NextResponse.json({
      signedIn: false,
      configured,
      limit: 10,
      remaining: 0,
      reset: Date.now(),
    });
  }

  const status = await getRateLimitStatus(
    'assistant',
    rateLimitKey({ userId: session.user.id }),
  );

  return NextResponse.json({
    signedIn: true,
    configured,
    limit: status.limit,
    remaining: status.remaining,
    reset: status.reset,
  });
}
