import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';
import { streamAssistantResponse } from '@/lib/assistant/client';
import { assistantConfigured } from '@/lib/assistant/model';
import { getDb } from '@/db/client';
import { recordEvent } from '@/lib/analytics/record';

const AssistantRequestSchema = z.object({
  mode: z
    .enum(['socratic', 'explain_state', 'code_review', 'concept_qa', 'study_plan', 'general'])
    .default('socratic'),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant', 'system']),
        content: z.string().max(8000),
      }),
    )
    .min(1)
    .max(20),
  context: z
    .object({
      mode: z
        .enum(['socratic', 'explain_state', 'code_review', 'concept_qa', 'study_plan', 'general'])
        .default('socratic'),
      exercise: z
        .object({
          title: z.string().optional(),
          topic: z.string().optional(),
          slug: z.string().optional(),
          tier: z.enum(['lesson', 'problem', 'challenge']).optional(),
          brief: z.string().max(10000).optional(),
          language: z.string().optional(),
          code: z.string().max(20000).optional(),
          starterCode: z.string().max(20000).optional(),
          solved: z.boolean().optional(),
          hintsOpened: z.number().optional(),
          totalHints: z.number().optional(),
          testResults: z
            .object({
              passed: z.boolean(),
              totalCases: z.number(),
              passedCases: z.number(),
              failedCase: z
                .object({
                  args: z.array(z.unknown()).optional(),
                  expected: z.unknown().optional(),
                  actual: z.unknown().optional(),
                  error: z.string().optional(),
                })
                .optional(),
            })
            .optional(),
        })
        .optional(),
      traceStep: z
        .object({
          stepIndex: z.number().optional(),
          totalSteps: z.number().optional(),
          line: z.number().optional(),
          codeSnippet: z.string().optional(),
          changedVariables: z.record(z.string(), z.unknown()).optional(),
          description: z.string().optional(),
        })
        .optional(),
      concept: z
        .object({
          slug: z.string().optional(),
          name: z.string().optional(),
          category: z.string().optional(),
          definition: z.string().optional(),
        })
        .optional(),
      studyPlan: z
        .object({
          targetCompany: z.string().optional(),
          timelineWeeks: z.number().optional(),
          hoursPerWeek: z.number().optional(),
          currentLevel: z.string().optional(),
          focusTopics: z.array(z.string()).optional(),
        })
        .optional(),
    })
    .optional(),
  useFastModel: z.boolean().optional(),
});

/**
 * AI Assistant endpoint (Module L, PRD §2.6, L9).
 *
 * **Account-scoped and strictly rate limited.**
 * - Requires an authenticated session (HTTP 401).
 * - Capped at 10 requests per 24 hours per learner (HTTP 429 if exceeded).
 * - Fails closed if rate limiter / Redis is unreachable to avoid unmetered inference spend.
 */
export async function POST(request: Request) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Authentication required. Sign in to use the AI assistant.' },
      { status: 401 },
    );
  }

  if (!assistantConfigured()) {
    return NextResponse.json(
      { error: 'AI Assistant is currently unconfigured.' },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON request body' }, { status: 400 });
  }

  const parsed = AssistantRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid assistant request schema', details: parsed.error.issues },
      { status: 400 },
    );
  }

  const limit = await checkRateLimit(
    'assistant',
    rateLimitKey({ userId: session.user.id }),
  );

  if (!limit.allowed) {
    const retrySec = Math.max(1, Math.ceil((limit.reset - Date.now()) / 1000));
    return NextResponse.json(
      {
        error: 'Daily assistant limit reached (10 queries per 24 hours).',
        limit: limit.limit,
        remaining: 0,
        reset: limit.reset,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retrySec),
          'X-RateLimit-Limit': String(limit.limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(limit.reset),
        },
      },
    );
  }

  const { mode, messages, context, useFastModel } = parsed.data;

  try {
    const stream = await streamAssistantResponse({
      context: {
        mode: context?.mode ?? mode,
        exercise: context?.exercise,
        traceStep: context?.traceStep,
        concept: context?.concept,
        studyPlan: context?.studyPlan,
      },
      messages,
      useFastModel,
    });

    // Record analytics event in background (F6)
    try {
      void recordEvent(getDb(), {
        name: 'assistant_query',
        userId: session.user.id,
        props: {
          mode,
          topic: context?.exercise?.topic ?? null,
          slug: context?.exercise?.slug ?? null,
          tier: context?.exercise?.tier ?? null,
          remaining: limit.remaining,
        },
      }).catch(() => {});
    } catch {
      // Analytics error should not block assistant response
    }

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-RateLimit-Limit': String(limit.limit),
        'X-RateLimit-Remaining': String(limit.remaining),
        'X-RateLimit-Reset': String(limit.reset),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[assistant] stream error:', msg);

    if (msg.includes('GROQ_AUTH_FAILED')) {
      return NextResponse.json({ error: 'Inference authentication failed.' }, { status: 502 });
    }
    if (msg.includes('GROQ_UPSTREAM_RATE_LIMITED')) {
      return NextResponse.json({ error: 'Upstream provider rate limited. Please try again shortly.' }, { status: 429 });
    }

    return NextResponse.json(
      { error: 'Failed to generate assistant response.' },
      { status: 500 },
    );
  }
}
