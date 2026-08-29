import { NextResponse } from 'next/server';
import { getDb } from '@/db/client';
import { requireSession } from '@/lib/session';
import { getLatestSubmission, getProgress, recordAttempt } from '@/lib/progress';
import { checkRateLimit, clientIp, rateLimitKey } from '@/lib/rate-limit';
import { LANGUAGES, tierSchema, type Language } from '@/content/schema';

/**
 * Progress for the signed-in learner (A10).
 *
 * Account-scoped, so `lib/access.ts` denies it without a session at the edge and
 * `requireSession` proves the session record is real here — the two AD-5 layers.
 *
 * The user id comes from the session and is never read from the request, so a
 * client cannot write progress as somebody else.
 */

function parseLanguage(value: string | null): Language | null {
  return LANGUAGES.includes(value as Language) ? (value as Language) : null;
}

async function session() {
  try {
    return await requireSession();
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  const url = new URL(request.url);
  const exerciseId = url.searchParams.get('exerciseId');
  const language = parseLanguage(url.searchParams.get('language'));
  if (!exerciseId || !language) {
    return NextResponse.json({ error: 'exerciseId and language are required' }, { status: 400 });
  }

  const db = getDb();
  const [progress, submission] = await Promise.all([
    getProgress(db, auth.user.id, exerciseId, language),
    getLatestSubmission(db, auth.user.id, exerciseId, language),
  ]);

  return NextResponse.json({ progress, submission });
}

export async function POST(request: Request) {
  const auth = await session();
  if (!auth) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

  // Fails closed: an unavailable limiter refuses a write rather than waving it
  // through (see the policy table in lib/rate-limit.ts).
  const limit = await checkRateLimit(
    'mutation',
    rateLimitKey({ userId: auth.user.id, ip: clientIp(request) }),
  );
  if (!limit.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { exerciseId, tier, language, code, passed } = (payload ?? {}) as Record<string, unknown>;
  const parsedTier = tierSchema.safeParse(tier);
  const parsedLanguage = parseLanguage(typeof language === 'string' ? language : null);

  if (
    typeof exerciseId !== 'string' ||
    !parsedTier.success ||
    !parsedLanguage ||
    typeof code !== 'string' ||
    typeof passed !== 'boolean'
  ) {
    return NextResponse.json({ error: 'Malformed attempt' }, { status: 400 });
  }

  await recordAttempt(getDb(), {
    userId: auth.user.id,
    exerciseId,
    tier: parsedTier.data,
    language: parsedLanguage,
    code,
    passed,
  });

  return NextResponse.json({ ok: true });
}
