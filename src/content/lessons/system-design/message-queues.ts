import type { LessonInput } from '../../schema';

export const messageQueuesLesson: LessonInput = {
  tier: 'lesson',
  slug: 'message-queues',
  title: 'Message Queues',
  summary: 'Stop doing work in the request, and let the slow part fail without the user seeing it.',
  order: 7,
  track: 'system-design',
  difficulty: 'core',

  operations: [
    { name: 'enqueue', time: '1-5 ms', note: 'What the user waits for instead of the actual work.' },
    { name: 'end-to-end processing', time: 'ms to hours', note: 'Decoupled from the request, which is the entire point.' },
    { name: 'throughput (Kafka)', time: 'millions/s', note: 'Partitioned log. Order guaranteed within a partition only.' },
    { name: 'throughput (SQS, RabbitMQ)', time: 'thousands/s', note: 'Per queue. Richer routing and per-message semantics.' },
  ],

  variants: [
    { name: 'Work queue', what: 'One consumer per message. Jobs: resize this image, send this email.' },
    { name: 'Publish/subscribe', what: 'Every subscriber sees every message. Events: an order was placed.' },
    { name: 'Log (Kafka)', what: 'An ordered, replayable, retained sequence. Consumers track their own position.' },
    { name: 'Dead-letter queue', what: 'Where messages go after repeated failure, so one poison message cannot block the rest.' },
    { name: 'Delay / scheduled queue', what: 'Deliver later. Retries with backoff, reminders, timeouts.' },
  ],

  furtherReading: [
    { label: 'Message queue', url: 'https://en.wikipedia.org/wiki/Message_queue', source: 'Wikipedia' },
    { label: 'Publish–subscribe pattern', url: 'https://en.wikipedia.org/wiki/Publish%E2%80%93subscribe_pattern', source: 'Wikipedia' },
  ],

  explainer: `A queue lets a request hand off work and return immediately. The user waits for
an enqueue — a few milliseconds — rather than for a video to transcode.

That buys three things, and it is worth naming them separately because they are
different arguments:

**Latency.** The response no longer contains the slow part.

**Decoupling.** The producer does not need the consumer to be alive. If the email
service is down, orders still complete and the emails go out when it returns.
Without a queue, one dependency's outage becomes yours.

**Load smoothing.** A spike becomes a backlog rather than a failure. Ten thousand
requests in a second are drained at whatever rate consumers can manage, instead
of overwhelming a downstream service.

The costs are real and worth stating in an interview:

**Delivery semantics.** "Exactly once" is largely a marketing term for
distributed systems. What you actually get is *at least once* — meaning
duplicates happen, and consumers must be idempotent — or *at most once*, meaning
messages can be lost. Choosing at-least-once plus idempotent consumers is the
standard answer and the correct one.

**Ordering.** Global ordering is expensive and usually not offered. Kafka orders
within a partition; if you need per-user ordering, partition by user id. If you
need global ordering, you probably need to re-examine the requirement.

**Operational surface.** A queue is another system to run, monitor, and page on.
Its most important metric is not throughput but **consumer lag**: how far behind
the consumers are. That is what tells you a backlog is growing before users do.`,

  whenToUse: {
    reachFor: [
      'Work that does not need to finish before the response — email, transcoding, indexing, reports.',
      'Traffic spikes that would otherwise overwhelm a downstream service.',
      'Decoupling services so one being down does not take the others with it.',
      'Fan-out: one event that several independent consumers each need to react to.',
    ],
    insteadOf: [
      { alternative: 'Doing the work in the request', why: 'Simpler and correct when the work is fast and the caller genuinely needs the result. A queue adds a system, a failure mode and eventual consistency — do not add it for a 20 ms operation.' },
      { alternative: 'A cron job over a database table', why: 'Often enough, and a great deal less machinery: a status column and a periodic sweep gets you retries and durability using the database you already run. It scales worse and is much easier to operate.' },
      { alternative: 'Direct synchronous calls between services', why: 'Necessary when the caller needs an answer. Queues are for when it does not — asking for one back turns a queue into a slow RPC.' },
    ],
  },

  patternCues: [
    'The design contains work the user should not wait for.',
    'One event needs to trigger several unrelated things.',
    'Traffic is spiky and a downstream service has a fixed rate limit.',
    'The interviewer asks how the system behaves when a dependency is down.',
  ],

  pitfalls: [
    { title: 'Assuming exactly-once delivery', body: 'Design for at-least-once and make consumers idempotent. Every real queue will redeliver at some point, and a consumer that charges a card twice is the outcome.' },
    { title: 'No dead-letter queue', body: 'One message that always fails is retried forever and blocks everything behind it. Cap the retries and move it aside.' },
    { title: 'Not monitoring consumer lag', body: 'Throughput looks healthy while the backlog grows for hours. Lag is the metric that tells you first.' },
    { title: 'Expecting global ordering', body: 'Most queues order within a partition or not at all. If order matters, say what it is keyed on.' },
  ],

  recommendedAfter: ['scaling'],
};
