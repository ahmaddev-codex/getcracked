import type { ScenarioLabInput } from '../schema';

/**
 * Scenario lab for a distributed rate limiter at scale (500k QPS).
 * Bridges to the `token-bucket` build challenge (C6).
 */
export const rateLimiterLab: ScenarioLabInput = {
  slug: 'rate-limiter',
  title: 'Design a Distributed Rate Limiter',
  summary: 'Protecting downstream microservices against traffic spikes and DoS with token buckets and Redis clusters.',
  difficulty: 'medium',
  topics: ['rate-limiting', 'caching', 'consistent-hashing'],
  timeBudgetMinutes: 30,

  brief: `> "Design a distributed rate-limiting service that protects our public API gateway from abuse,
> handling up to 500,000 requests per second with sub-2ms latency overhead."

Rate limiting is the first line of defense in distributed infrastructure. A flawed design either adds
crippling latency to every user request or allows coordinated traffic spikes to take down primary databases.

Work through the core architectural trade-offs: algorithm selection, centralized vs local storage,
race conditions under concurrent requests, and fail-open vs fail-closed policies.`,

  steps: [
    {
      slug: 'requirements',
      kind: 'select',
      dimension: 'requirements',
      multiple: true,
      prompt: 'Which requirements and operational constraints define the rate limiter design?',
      options: [
        {
          label: 'Sub-millisecond latency overhead on the request path',
          correct: true,
          reason:
            'The rate limiter sits on the critical path of every incoming HTTP request. Adding even 10ms of overhead degrades end-to-end user latency unacceptably.',
        },
        {
          label: 'Support for multiple rate-limiting rules (per IP, per user token, per endpoint)',
          correct: true,
          reason:
            'Real-world gateways enforce layered tiers: an unauthenticated IP gets 60 req/min, while a paid API key gets 10,000 req/min on specific write routes.',
        },
        {
          label: 'Configurable fail-open vs fail-closed policy during infrastructure outages',
          correct: true,
          reason:
            'When the rate limiter cache cluster goes down, the business must decide whether to let traffic pass (fail-open) or block all requests (fail-closed).',
        },
        {
          label: 'Informative 429 response headers (X-RateLimit-Remaining, Retry-After)',
          correct: true,
          reason:
            'Standard HTTP 429 semantics allow legitimate client SDKs to perform polite exponential backoff rather than retrying in an aggressive spin loop.',
        },
        {
          label: 'Guaranteed strict zero-tolerance precision with zero dropped requests across global data centers',
          reason:
            'Over-constraining rate limiters to 100% mathematical precision across multi-region data centers requires cross-region consensus, creating immense latency penalties.',
        },
        {
          label: 'Storing all historical request logs permanently in an ACID relational database',
          reason:
            'Rate limiting is about instantaneous sliding windows or token refills, not historical audit analytics. Persisting every hit to SQL would overwhelm disk I/O.',
        },
      ],
    },

    {
      slug: 'qps-estimation',
      kind: 'estimate',
      dimension: 'estimation',
      concepts: ['latency-vs-throughput'],
      prompt: 'If the gateway handles 500k QPS and each check takes 1 Redis operation, how many Redis master nodes (assuming 50k QPS per core) are needed at peak?',
      unit: 'Redis master nodes',
      answer: 10,
      tolerance: 3,
      working:
        '500,000 peak requests per second ÷ 50,000 operations per Redis core = 10 dedicated Redis master shards. Adding a 2x replica per master yields a 20-30 node cluster.',
    },

    {
      slug: 'algorithm-selection',
      kind: 'select',
      dimension: 'scaling',
      concepts: ['rate-limiting'],
      prompt: 'Which rate-limiting algorithm best balances burst tolerance with minimal memory footprint?',
      options: [
        {
          label: 'Token Bucket algorithm (storing token count + last refill timestamp)',
          correct: true,
          reason:
            'Token bucket uses minimal memory (only 2 numbers per key: count and timestamp) and handles legitimate traffic bursts gracefully while bounding long-term average rate.',
        },
        {
          label: 'Sliding Window Log (storing timestamp of every individual request in a sorted set)',
          reason:
            'Sliding window log is memory-intensive (storing 8 bytes per request). For 500k QPS with 1-minute windows, memory consumption explodes to tens of gigabytes.',
        },
        {
          label: 'Fixed Window Counter (incrementing an integer counter reset on the clock boundary)',
          reason:
            'Fixed window suffers from boundary burst attacks: a client can send 2x the allowed limit by bursting right before and right after the window reset boundary.',
        },
      ],
    },

    {
      slug: 'concurrency-control',
      kind: 'select',
      dimension: 'data-model',
      concepts: ['distributed-locking', 'cache-aside'],
      prompt: 'How should the rate limiter prevent race conditions when concurrent requests for the same user arrive simultaneously?',
      options: [
        {
          label: 'Execute token decrement and timestamp update inside an atomic Redis Lua script',
          correct: true,
          reason:
            'Redis executes Lua scripts atomically in a single thread. This prevents race conditions (read-modify-write) in a single round-trip without distributed lock overhead.',
        },
        {
          label: 'Acquire a distributed lock (Redlock) across the cluster before checking every request',
          reason:
            'Distributed locking introduces multiple network round-trips and contention, turning a 1ms limiter check into a 25ms bottleneck that halves gateway throughput.',
        },
        {
          label: 'Use standard Redis GET followed by separate SET from application server memory',
          reason:
            'Non-atomic GET then SET creates classic race conditions where two simultaneous requests both read the remaining balance and overspend the quota.',
        },
      ],
    },

    {
      slug: 'failure-mitigation',
      kind: 'select',
      dimension: 'bottleneck',
      concepts: ['circuit-breaker-pattern', 'graceful-degradation'],
      prompt: 'What architectural defense ensures API availability if the centralized Redis cluster suffers a catastrophic outage?',
      options: [
        {
          label: 'Circuit breaker with fallback to local in-memory token buckets and fail-open mode',
          correct: true,
          reason:
            'A circuit breaker trips on Redis timeouts and falls back to coarse local memory limits, failing open so critical business transactions continue uninterrupted.',
        },
        {
          label: 'Queue incoming HTTP requests in a persistent message broker until Redis restarts',
          reason:
            'Queuing synchronous HTTP client requests blocks connection pools and causes client timeouts, multiplying the outage across all upstream clients.',
        },
        {
          label: 'Fail-closed immediately, returning 500 Internal Server Error for all customer traffic',
          reason:
            'Failing closed converts a rate limiter infrastructure hiccup into a 100% outage for the entire company.',
        },
      ],
    },
  ],

  takeaway: `The core insight of rate limiting is atomic in-memory state with graceful degradation.
Token bucket stored in Redis provides O(1) time and space complexity per client key.
Using atomic Lua scripts avoids distributed lock overhead, while local in-memory circuit breakers
ensure an infrastructure hiccup never takes down core customer APIs.`,
};
