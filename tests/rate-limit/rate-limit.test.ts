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

/**
 * The assistant's daily quota (L9).
 *
 * Ten requests per learner per day. The distinction that matters is the
 * *window*: an hourly cap of 20 bounds a burst but permits 480 a day, and the
 * thing being controlled here is a monthly bill, not a spike.
 */
describe('assistant quota', () => {
  /** Windows are strings; compare the duration they mean, not the spelling. */
  const hours = (window: string): number => {
    const [n, unit] = window.split(' ');
    const factor = { s: 1 / 3600, m: 1 / 60, h: 1 }[unit] ?? 0;
    return Number(n) * factor;
  };

  it('is ten per day', () => {
    expect(RATE_LIMIT_POLICIES.assistant.limit).toBe(10);
    // Spelled `24 h` because Upstash's Duration type stops at hours.
    expect(hours(RATE_LIMIT_POLICIES.assistant.window)).toBe(24);
  });

  it('spans a full day, because the cost being bounded is monthly', () => {
    // An hourly ceiling caps a burst and not a bill — 20/hour is 480/day.
    expect(hours(RATE_LIMIT_POLICIES.assistant.window)).toBeGreaterThanOrEqual(24);
  });

  it('fails closed, unlike analytics', () => {
    // An unavailable limiter here means unmetered spend against a third-party
    // API. Analytics failing open loses a data point; this would lose money.
    expect(RATE_LIMIT_POLICIES.assistant.failOpen).toBe(false);
    expect(RATE_LIMIT_POLICIES.events.failOpen).toBe(true);
  });

  it('is the tightest daily allowance of any policy', () => {
    // Every other policy is per-minute, so comparing raw limits is meaningless;
    // what matters is that nothing else is this restrictive per day.
    const perDay = (p: { limit: number; window: string }) => {
      const [n, unit] = p.window.split(' ');
      const perWindow = Number(n);
      const windows = { s: 86_400, m: 1440, h: 24 }[unit] ?? 1;
      return (p.limit / perWindow) * windows;
    };

    const assistant = perDay(RATE_LIMIT_POLICIES.assistant);
    for (const [name, policy] of Object.entries(RATE_LIMIT_POLICIES)) {
      if (name === 'assistant') continue;
      expect(perDay(policy), `${name} is tighter than the assistant`).toBeGreaterThan(assistant);
    }
  });
});
