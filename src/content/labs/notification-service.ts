import type { ScenarioLabInput } from '../schema';

/**
 * Scenario lab for a high-volume multi-channel notification service.
 * Covers message queues, idempotency, rate limiting, and vendor fallback.
 */
export const notificationServiceLab: ScenarioLabInput = {
  slug: 'notification-service',
  title: 'Design a Global Notification Service',
  summary: 'Delivering millions of push notifications, SMS, and emails reliably with idempotency, priority queues, and third-party provider failover.',
  difficulty: 'medium',
  topics: ['message-queues', 'idempotency', 'scaling'],
  timeBudgetMinutes: 30,

  brief: `> "Design a distributed notification system capable of sending 100 million notifications daily across iOS/Android push, SMS, and email, ensuring guaranteed delivery for critical transactional alerts without overloading downstream vendors."

Notifications span critical two-factor authentication codes (which must arrive within 5 seconds) to bulk promotional marketing campaigns (which can take hours).

A production design must address disparate latency SLAs, third-party vendor rate limits, message deduplication, and user opt-out preferences.`,

  steps: [
    {
      slug: 'requirements',
      kind: 'select',
      dimension: 'requirements',
      multiple: true,
      prompt: 'Which architectural and business requirements must the notification system satisfy?',
      options: [
        {
          label: 'Guaranteed at-least-once delivery with end-to-end deduplication (idempotency)',
          correct: true,
          reason:
            'Network retries and message queue replays must never cause a user to receive multiple SMS charges or duplicate transactional receipts.',
        },
        {
          label: 'Separation of transactional alerts (high priority) from marketing blasts (low priority)',
          correct: true,
          reason:
            'A massive marketing campaign must never starve 2FA verification codes or security password reset emails waiting in the same queue.',
        },
        {
          label: 'Third-party vendor rate limiting and automatic failover (e.g. Twilio to MessageBird)',
          correct: true,
          reason:
            'External communication APIs enforce hard rate limits and experience regional outages. The system must buffer and fail over dynamically.',
        },
        {
          label: 'Low latency for critical alerts (< 5 seconds delivery for OTP / 2FA)',
          correct: true,
          reason:
            'Authentication flows depend on real-time delivery; users will abandon login if a one-time code takes more than a few seconds.',
        },
        {
          label: 'Storing all historical message payload contents permanently in Redis memory',
          reason:
            'In-memory storage for millions of daily rich email bodies would be prohibitively expensive. Blob storage or cold DBs are used for delivery logs.',
        },
        {
          label: 'Client-driven direct push without server-side queue buffering or retry mechanisms',
          reason:
            'Direct peer-to-peer delivery without server queues is vulnerable to mobile device disconnection and cannot guarantee delivery or compliance.',
        },
      ],
    },

    {
      slug: 'throughput-estimation',
      kind: 'estimate',
      dimension: 'estimation',
      concepts: ['latency-vs-throughput'],
      prompt: 'If the system sends 100 million notifications per day with peak traffic at 3x average, what is the peak QPS?',
      unit: 'notifications per second',
      answer: 3500,
      tolerance: 500,
      working:
        '100,000,000 notifications / 86,400 seconds = ~1,160 notifications/sec average. A 3x peak multiplier gives ~3,480 (round to ~3,500) QPS at peak.',
    },

    {
      slug: 'decoupling-strategy',
      kind: 'select',
      dimension: 'scaling',
      concepts: ['message-queue'],
      prompt: 'How should ingestion APIs decouple client requests from downstream vendor dispatching?',
      options: [
        {
          label: 'Publish events to partitioned message queues categorized by channel and priority',
          correct: true,
          reason:
            'Partitioned queues (e.g., Kafka or RabbitMQ) isolate high-priority OTPs from bulk emails, absorb traffic spikes asynchronously, and allow independent worker autoscaling.',
        },
        {
          label: 'Make direct synchronous HTTP calls to Twilio and SendGrid from the API gateway',
          reason:
            'Synchronous calls block API threads, bubble vendor latencies up to client apps, and cause cascade failures when external providers experience degradation.',
        },
        {
          label: 'Poll a centralized SQL database table using scheduled cron workers every minute',
          reason:
            'Polling SQL tables creates massive write/read lock contention at 3,500 QPS and introduces high latency unsuited for real-time authentication codes.',
        },
      ],
    },

    {
      slug: 'idempotency-mechanism',
      kind: 'select',
      dimension: 'data-model',
      concepts: ['idempotency'],
      prompt: 'How should workers ensure duplicate notifications are not sent when tasks are retried after network timeouts?',
      options: [
        {
          label: 'Check and set an idempotency key with TTL in a fast distributed cache before calling vendors',
          correct: true,
          reason:
            'An idempotency key (e.g. hash of userId + eventType + deduplicationWindow) stored in Redis with atomic SETNX guarantees only one vendor dispatch occurs.',
        },
        {
          label: 'Rely solely on the client app to never trigger the notification endpoint twice',
          reason:
            'Clients retry on network drops, and message brokers provide at-least-once delivery; client promises cannot prevent infrastructure-level duplicates.',
        },
        {
          label: 'Send the notification and then log the recipient email in an append-only file',
          reason:
            'Logging after dispatching fails to prevent the duplicate transmission if the worker crashed or retried during execution.',
        },
      ],
    },

    {
      slug: 'vendor-outage-resilience',
      kind: 'select',
      dimension: 'bottleneck',
      concepts: ['circuit-breaker-pattern', 'graceful-degradation'],
      prompt: 'How should the notification service respond if the primary SMS vendor starts timing out or throwing 5xx errors?',
      options: [
        {
          label: 'Trip a circuit breaker and automatically reroute failed SMS tasks to a secondary fallback provider',
          correct: true,
          reason:
            'Circuit breakers detect vendor failure rates, open immediately to avoid waiting for timeouts, and switch to secondary providers (e.g. AWS SNS to Twilio).',
        },
        {
          label: 'Continuously retry the failed requests against the same vendor with 0 delay',
          reason:
            'Aggressive retries against an overloaded vendor exacerbate downstream outages and queue build-ups.',
        },
        {
          label: 'Silently drop all affected SMS notifications and return success to the sender',
          reason:
            'Silent drops result in lost 2FA codes and account lockouts without notifying callers or attempting recovery.',
        },
      ],
    },
  ],

  takeaway: `Designing a scalable notification system requires decoupling ingestion from delivery via partitioned message queues.
By categorizing queues by priority (transactional vs promotional), critical 2FA alerts never get trapped behind bulk newsletters.
Idempotency keys prevent duplicate dispatches during worker retries, while circuit breakers and provider fallbacks ensure 99.99% deliverability even during third-party telecom outages.`,
};
