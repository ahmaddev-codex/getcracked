import type { LessonInput } from '../../schema';

export const rateLimitingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'rate-limiting',
  title: 'Rate Limiting',
  summary: 'Decide who gets turned away, before load decides it for you.',
  order: 8,
  track: 'system-design',
  difficulty: 'core',

  operations: [
    { name: 'in-memory check', time: '< 0.1 ms', note: 'Per instance only, so the real limit is the limit times the instance count.' },
    { name: 'Redis check', time: '0.5-2 ms', note: 'Shared across instances. The usual answer.' },
    { name: 'token bucket state', time: 'O(1) per key', note: 'Two numbers: tokens remaining, last refill.' },
    { name: 'sliding window log', time: 'O(requests in window)', note: 'Exact, and the memory grows with the rate.' },
  ],

  variants: [
    { name: 'Fixed window', what: 'N per calendar minute. Trivial, and allows 2N across a boundary.' },
    { name: 'Sliding window log', what: 'Timestamps of recent requests. Exact, and the most memory.' },
    { name: 'Sliding window counter', what: 'Weighted blend of the current and previous window. Nearly exact, cheap. The usual compromise.' },
    { name: 'Token bucket', what: 'Tokens refill at a steady rate; a request spends one. Allows bursts up to the bucket size.' },
    { name: 'Leaky bucket', what: 'Requests drain at a fixed rate. Smooths output completely, allows no burst.' },
  ],

  furtherReading: [
    { label: 'Rate limiting', url: 'https://en.wikipedia.org/wiki/Rate_limiting', source: 'Wikipedia' },
    { label: 'Token bucket', url: 'https://en.wikipedia.org/wiki/Token_bucket', source: 'Wikipedia' },
  ],

  explainer: `Rate limiting decides, deliberately, who gets turned away. Without it the
decision still gets made — by whichever resource exhausts first, and usually in
the worst possible way, with every user degraded rather than the abusive one
stopped.

The algorithms differ mainly in how they treat **bursts**:

**Fixed window** counts requests per calendar minute. It is the easiest to
implement and has a real flaw: a client can send the full allowance at 11:59:59
and again at 12:00:00, so the actual peak is double the limit.

**Sliding window log** keeps timestamps and is exactly correct, at the cost of
memory proportional to the request rate.

**Sliding window counter** blends the current and previous window by how far
through you are. It is very nearly exact and costs two numbers, which is why it
is the common production choice.

**Token bucket** refills tokens at a fixed rate up to a maximum. A request costs
a token. This *permits* bursts up to the bucket size, which is usually what you
want — a client that has been idle should be allowed to catch up.

**Leaky bucket** drains at a constant rate and permits no burst at all. Use it
when the thing you are protecting genuinely cannot absorb a spike.

Two design questions matter as much as the algorithm. **What is the key?** Per IP
punishes everyone behind a NAT; per API key is precise but requires
authentication; per user is right for logged-in traffic. Most real systems layer
several. And **where does the state live?** In-memory per instance is fast and
wrong — with ten instances the effective limit is ten times what you configured.
Shared state in Redis is the standard answer.

When you reject, say so properly: **429**, with \`Retry-After\`. A client that
knows when to come back stops hammering; one that gets a generic 500 retries
immediately and makes it worse.`,

  whenToUse: {
    reachFor: [
      'Any public API — the limit is what stops one client consuming the capacity of all of them.',
      'Protecting an expensive downstream: a payment provider, an LLM, an email service with its own quota.',
      'Login and password-reset endpoints, where the limit is a security control against brute force.',
      'Fair sharing between tenants, so one customer\'s batch job does not starve the rest.',
    ],
    insteadOf: [
      { alternative: 'Autoscaling', why: 'Adds capacity for legitimate load, and happily scales up to serve an attack at your expense. Use both: limits decide who deserves capacity, scaling provides it.' },
      { alternative: 'A queue', why: 'Delays work rather than rejecting it, which is right when the work must eventually happen. Rate limiting is for when the correct answer is "no".' },
      { alternative: 'A circuit breaker', why: 'Protects *you* from a failing dependency; rate limiting protects a dependency from you. They solve opposite directions of the same relationship.' },
    ],
  },

  patternCues: [
    'The system exposes a public API.',
    'A downstream dependency has its own quota or a per-second cost.',
    'The interviewer raises abuse, scraping, or credential stuffing.',
    'Multiple tenants share infrastructure and one could starve the others.',
  ],

  pitfalls: [
    { title: 'Per-instance counters', body: 'Ten instances each allowing 100 requests per minute is a limit of 1000, not 100. Share the state or divide the budget explicitly.' },
    { title: 'Limiting by IP alone', body: 'One corporate NAT is thousands of users on one address. Key by user or API key where you can, and treat IP as a coarse backstop.' },
    { title: 'Returning the wrong status', body: 'A 500 tells the client to retry immediately. A 429 with Retry-After tells it when to come back.' },
    { title: 'Rate limiting after the expensive work', body: 'The check has to happen before the database query it is meant to protect, or it protects nothing.' },
  ],

  recommendedAfter: ['load-balancing'],
};
