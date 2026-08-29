import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * Rate limiting (R-17, ADR 0001 §6).
 *
 * Upstash in production; locally the same client talks to the
 * serverless-redis-http proxy in docker-compose, so this code path is exercised
 * in development rather than first in production.
 *
 * **Failure policy differs by endpoint, deliberately.** The right behaviour when
 * Redis is unreachable depends on what the limit protects:
 *
 * - Analytics (`events`) fails **open**. Losing a limiter should not break a
 *   learner's page, and the worst case is inflated counts in a table nobody
 *   bills us for.
 * - Anything that spends money or mutates user data fails **closed**. There,
 *   an unavailable limiter is a reason to refuse, not to wave through.
 *
 * A single global policy would get one of those two wrong.
 */

export type LimitPolicy = 'events' | 'auth' | 'mutation' | 'assistant';

interface PolicyConfig {
  /** Requests allowed per window. */
  limit: number;
  window: `${number} s` | `${number} m` | `${number} h`;
  /** Whether an unavailable limiter allows the request through. */
  failOpen: boolean;
}

const POLICIES: Record<LimitPolicy, PolicyConfig> = {
  // Generous: a single page view can legitimately emit several events.
  events: { limit: 120, window: '1 m', failOpen: true },
  // Tight: this is the credential-stuffing surface.
  auth: { limit: 10, window: '1 m', failOpen: false },
  mutation: { limit: 60, window: '1 m', failOpen: false },
  // Real money per call (L9). Lowest ceiling, and never fails open.
  assistant: { limit: 20, window: '1 h', failOpen: false },
};

let redis: Redis | null | undefined;

/** `undefined` = not yet resolved, `null` = deliberately unconfigured. */
function getRedis(): Redis | null {
  if (redis !== undefined) return redis;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

const limiters = new Map<LimitPolicy, Ratelimit>();

function getLimiter(policy: LimitPolicy): Ratelimit | null {
  const client = getRedis();
  if (!client) return null;

  let limiter = limiters.get(policy);
  if (!limiter) {
    const { limit, window } = POLICIES[policy];
    limiter = new Ratelimit({
      redis: client,
      // Sliding window rather than fixed: a fixed window lets a client send
      // 2x the limit across a boundary, which is exactly what a burst does.
      limiter: Ratelimit.slidingWindow(limit, window),
      prefix: `gc:rl:${policy}`,
      analytics: false,
    });
    limiters.set(policy, limiter);
  }
  return limiter;
}

export interface LimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  /** Unix ms when the window resets; useful for a Retry-After header. */
  reset: number;
}

/**
 * Checks one identifier against a policy.
 *
 * `identifier` should be the most specific stable thing available — a user id
 * where there is a session, otherwise a device id, falling back to IP. IP alone
 * is a poor key (shared NATs, corporate proxies), so it is the last resort
 * rather than the default.
 */
export async function checkRateLimit(
  policy: LimitPolicy,
  identifier: string,
): Promise<LimitResult> {
  const { limit, failOpen } = POLICIES[policy];
  const limiter = getLimiter(policy);

  if (!limiter) {
    return { allowed: failOpen, limit, remaining: failOpen ? limit : 0, reset: Date.now() };
  }

  try {
    const r = await limiter.limit(identifier);
    return { allowed: r.success, limit: r.limit, remaining: r.remaining, reset: r.reset };
  } catch {
    // Redis unreachable. The policy decides, not the error.
    return { allowed: failOpen, limit, remaining: 0, reset: Date.now() };
  }
}

/**
 * Builds the rate-limit key for a request.
 *
 * Exported so the choice of key is testable and reviewable rather than being
 * inlined in each handler and quietly diverging.
 */
export function rateLimitKey(opts: {
  userId?: string | null;
  deviceId?: string | null;
  ip?: string | null;
}): string {
  if (opts.userId) return `u:${opts.userId}`;
  if (opts.deviceId) return `d:${opts.deviceId}`;
  return `ip:${opts.ip ?? 'unknown'}`;
}

/** Best-effort client IP from the proxy headers Vercel sets. */
export function clientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip');
}

export const RATE_LIMIT_POLICIES = POLICIES;
