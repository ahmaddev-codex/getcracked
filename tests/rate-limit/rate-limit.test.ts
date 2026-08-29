import { describe, expect, it } from 'vitest';
import { rateLimitKey, RATE_LIMIT_POLICIES } from '@/lib/rate-limit';

describe('rate limit keys', () => {
  it('prefers the user id, the most specific stable identifier', () => {
    expect(rateLimitKey({ userId: 'u1', deviceId: 'd1', ip: '1.2.3.4' })).toBe('u:u1');
  });

  it('falls back to the device id for a signed-out learner', () => {
    expect(rateLimitKey({ deviceId: 'd1', ip: '1.2.3.4' })).toBe('d:d1');
  });

  it('uses IP only as a last resort', () => {
    // Shared NATs and corporate proxies make IP a poor key — many unrelated
    // learners behind one address would throttle each other.
    expect(rateLimitKey({ ip: '1.2.3.4' })).toBe('ip:1.2.3.4');
    expect(rateLimitKey({})).toBe('ip:unknown');
  });

  it('namespaces keys so a user and a device can never collide', () => {
    expect(rateLimitKey({ userId: 'x' })).not.toBe(rateLimitKey({ deviceId: 'x' }));
  });
});

describe('failure policy', () => {
  it('fails open only for analytics', () => {
    expect(RATE_LIMIT_POLICIES.events.failOpen).toBe(true);
  });

  it('fails closed wherever money or user data is at stake', () => {
    // An unavailable limiter is a reason to refuse these, not to wave through.
    expect(RATE_LIMIT_POLICIES.auth.failOpen).toBe(false);
    expect(RATE_LIMIT_POLICIES.mutation.failOpen).toBe(false);
    expect(RATE_LIMIT_POLICIES.assistant.failOpen).toBe(false);
  });

  it('gives the assistant the tightest ceiling, since it costs real money', () => {
    expect(RATE_LIMIT_POLICIES.assistant.limit).toBeLessThan(
      RATE_LIMIT_POLICIES.events.limit,
    );
  });
});
