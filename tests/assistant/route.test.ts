import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/assistant/route';
import { GET as getQuota } from '@/app/api/assistant/quota/route';
import * as sessionModule from '@/lib/session';
import * as rateLimitModule from '@/lib/rate-limit';

vi.mock('@/lib/session');
vi.mock('@/lib/rate-limit');
vi.mock('@/lib/assistant/model', () => ({
  assistantConfigured: vi.fn().mockReturnValue(true),
  ASSISTANT_MODEL: 'openai/gpt-oss-120b',
  ASSISTANT_MODEL_FAST: 'openai/gpt-oss-20b',
}));
vi.mock('@/lib/assistant/client', () => ({
  streamAssistantResponse: vi.fn().mockResolvedValue(
    new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('Mock assistant response'));
        controller.close();
      },
    }),
  ),
}));

describe('Assistant API Route (POST /api/assistant)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.GROQ_API_KEY = 'gsk_test_key_for_tests';
  });

  it('rejects unauthenticated requests with 401', async () => {
    vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null);

    const req = new Request('http://localhost:3000/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Help me' }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('Authentication required');
  });

  it('rejects with 429 when daily rate limit is exceeded', async () => {
    vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
      user: { id: 'u_123', email: 'test@example.com', name: 'Test' },
      session: { id: 's_123', userId: 'u_123', expiresAt: new Date() },
    } as unknown as Awaited<ReturnType<typeof sessionModule.getSession>>);

    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValue({
      allowed: false,
      limit: 10,
      remaining: 0,
      reset: Date.now() + 3600000,
    });

    const req = new Request('http://localhost:3000/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: 'Give me a hint' }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(429);
    const body = (await res.json()) as { error: string };
    expect(body.error).toContain('Daily assistant limit reached');
  });

  it('rejects invalid JSON or schema with 400', async () => {
    vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
      user: { id: 'u_123', email: 'test@example.com', name: 'Test' },
      session: { id: 's_123', userId: 'u_123', expiresAt: new Date() },
    } as unknown as Awaited<ReturnType<typeof sessionModule.getSession>>);

    const req = new Request('http://localhost:3000/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [], // empty messages array fails validation
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns stream when valid and allowed', async () => {
    vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
      user: { id: 'u_123', email: 'test@example.com', name: 'Test' },
      session: { id: 's_123', userId: 'u_123', expiresAt: new Date() },
    } as unknown as Awaited<ReturnType<typeof sessionModule.getSession>>);

    vi.spyOn(rateLimitModule, 'checkRateLimit').mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 9,
      reset: Date.now() + 86400000,
    });

    const req = new Request('http://localhost:3000/api/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: 'socratic',
        messages: [{ role: 'user', content: 'How do I start Two Sum?' }],
      }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/plain');
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('9');
  });
});

describe('Assistant Quota Endpoint (GET /api/assistant/quota)', () => {
  it('returns signedIn: false when not authenticated', async () => {
    vi.spyOn(sessionModule, 'getSession').mockResolvedValue(null);

    const res = await getQuota();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { signedIn: boolean; limit: number; remaining: number };
    expect(body.signedIn).toBe(false);
    expect(body.limit).toBe(10);
    expect(body.remaining).toBe(0);
  });

  it('returns remaining quota when authenticated', async () => {
    vi.spyOn(sessionModule, 'getSession').mockResolvedValue({
      user: { id: 'u_123', email: 'test@example.com', name: 'Test' },
      session: { id: 's_123', userId: 'u_123', expiresAt: new Date() },
    } as unknown as Awaited<ReturnType<typeof sessionModule.getSession>>);

    vi.spyOn(rateLimitModule, 'getRateLimitStatus').mockResolvedValue({
      allowed: true,
      limit: 10,
      remaining: 7,
      reset: Date.now() + 50000,
    });

    const res = await getQuota();
    expect(res.status).toBe(200);
    const body = (await res.json()) as { signedIn: boolean; limit: number; remaining: number };
    expect(body.signedIn).toBe(true);
    expect(body.limit).toBe(10);
    expect(body.remaining).toBe(7);
  });
});
