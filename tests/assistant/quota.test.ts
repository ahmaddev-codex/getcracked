import { describe, it, expect } from 'vitest';
import { getRateLimitStatus, checkRateLimit, RATE_LIMIT_POLICIES } from '@/lib/rate-limit';

describe('Assistant Rate Limiting & Quota (L9)', () => {
  it('has strict 10 requests per 24 hour limit', () => {
    expect(RATE_LIMIT_POLICIES.assistant.limit).toBe(10);
    expect(RATE_LIMIT_POLICIES.assistant.window).toBe('24 h');
    expect(RATE_LIMIT_POLICIES.assistant.failOpen).toBe(false);
  });

  it('fails closed when redis is unavailable', async () => {
    // With dummy/unreachable redis, assistant rate limiting should fail closed (allowed: false)
    const status = await getRateLimitStatus('assistant', 'u:test_user_no_redis');
    expect(status.limit).toBe(10);
    // Because failOpen is false for assistant
    expect(status.allowed).toBe(false);
    expect(status.remaining).toBe(0);
  });

  it('checkRateLimit also fails closed for assistant when redis is down', async () => {
    const limit = await checkRateLimit('assistant', 'u:test_user_no_redis_check');
    expect(limit.allowed).toBe(false);
    expect(limit.remaining).toBe(0);
  });
});
