import type { LessonInput } from '../../schema';

export const scalingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'scaling',
  title: 'Scaling Basics',
  summary: 'Buy a bigger machine, or buy more of them — and what each one costs you.',
  order: 1,
  track: 'system-design',
  difficulty: 'foundational',

  operations: [
    { name: 'vertical scaling limit', time: 'one machine', note: 'Bounded by the largest instance you can rent. Real, and further away than people think.' },
    { name: 'horizontal scaling limit', time: 'effectively none', note: 'Bounded instead by whatever you failed to make stateless.' },
    { name: 'adding a replica', time: 'minutes', note: 'If the app is stateless. Days, if it is not.' },
    { name: 'cost curve', time: 'superlinear vertically, linear horizontally', note: 'The biggest instance costs far more than twice the one below it.' },
  ],

  variants: [
    { name: 'Vertical (scale up)', what: 'A bigger machine. No code changes, no distributed systems problems, a hard ceiling.' },
    { name: 'Horizontal (scale out)', what: 'More machines. No ceiling, but every piece of local state becomes a problem.' },
    { name: 'Read replicas', what: 'Scale reads by copying. Cheap and effective when reads dominate, which they usually do.' },
    { name: 'Functional decomposition', what: 'Split by responsibility rather than by load — services, not just instances.' },
  ],

  furtherReading: [
    { label: 'Scalability', url: 'https://en.wikipedia.org/wiki/Scalability', source: 'Wikipedia' },
    { label: 'Latency numbers every programmer should know', url: 'https://static.googleusercontent.com/media/sre.google/en//static/pdf/rule-of-thumb-latency-numbers-letter.pdf', source: 'Google SRE' },
  ],

  explainer: `There are exactly two ways to handle more load: make the machine bigger, or use
more machines. Everything else is a detail of one of those.

**Vertical scaling** is buying a bigger box. It requires no code changes, no
distributed systems, and no new failure modes — which makes it dramatically
underrated. A single modern server handles far more than most engineers assume,
and "just make it bigger" is often the correct answer for years. Its limits are a
hard ceiling on the largest instance available, a cost curve that rises much
faster than the capacity, and a single machine that can still fail.

**Horizontal scaling** is adding more boxes. It has no ceiling and gives you
redundancy for free. The price is that every distributed systems problem now
applies to you: state has to live somewhere shared, requests have to be routed,
failures become partial rather than total, and the things that used to be a
function call become network calls that can time out.

The pivot between them is **statelessness**. A stateless server can be cloned
without thought; a server holding session data, in-memory caches, or uploaded
files cannot. That is why "push state to the edges" is the first move of almost
every scaling story — it is what makes the second machine possible at all.

The order that usually works: measure first, then optimise what you have, then
scale vertically, then cache, then scale horizontally. Each step is cheaper and
less risky than the one after it, and skipping ahead is how teams end up
operating a distributed system to serve traffic one machine could have handled.`,

  whenToUse: {
    reachFor: [
      'Scale vertically first when the app is not yet the bottleneck and downtime for a resize is acceptable.',
      'Scale horizontally when you need redundancy as much as capacity — one machine is a single point of failure regardless of size.',
      'Add read replicas when reads dominate writes, which is the common case.',
      'Decompose functionally when different parts of the system have genuinely different load profiles.',
    ],
    insteadOf: [
      { alternative: 'Rewriting for performance', why: 'Often the cheapest option of all — an index, a query fix, or an N+1 removed can beat a year of infrastructure work. Profile before you provision.' },
      { alternative: 'Microservices', why: 'A deployment and organisational strategy, not a scaling one. A single service scaled horizontally handles enormous load; splitting it adds network calls and failure modes that scaling alone would not have.' },
    ],
  },

  patternCues: [
    'The interviewer states a request rate or user count — that is an invitation to size the system.',
    'Traffic is spiky, which favours horizontal elasticity over a permanently large machine.',
    'The service holds session state, which is the thing blocking a second instance.',
    'Reads vastly outnumber writes, which points at replicas and caching before anything else.',
  ],

  pitfalls: [
    { title: 'Scaling before measuring', body: 'Adding capacity to a system bottlenecked on one slow query buys nothing and costs money. Find the bottleneck first; it is usually not where the discussion assumes.' },
    { title: 'Sticky sessions as a substitute for stateless design', body: 'Pinning a user to one server makes horizontal scaling look like it works until that server dies, at which point the user loses everything.' },
    { title: 'Forgetting the database is also a machine', body: 'Ten application servers pointed at one database have moved the bottleneck, not removed it.' },
    { title: 'Treating horizontal scaling as free', body: 'It brings partial failure, network partitions, and cache coherence. Those costs are paid in engineering time forever, not once.' },
  ],
};
