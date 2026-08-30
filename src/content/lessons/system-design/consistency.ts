import type { LessonInput } from '../../schema';

export const consistencyLesson: LessonInput = {
  tier: 'lesson',
  slug: 'consistency',
  title: 'Consistency and CAP',
  summary: 'Partitions happen; the only real choice is what you give up when they do.',
  order: 6,
  track: 'system-design',
  difficulty: 'core',

  operations: [
    { name: 'strong consistency', time: 'cross-node round trip per write', note: 'Correct, and pays network latency on the write path.' },
    { name: 'eventual consistency', time: 'local acknowledge', note: 'Fast. Readers may see an old value for a window.' },
    { name: 'convergence window', time: 'ms to seconds', note: '"Eventually" is not a duration. Measure it; do not assume it.' },
    { name: 'quorum read/write', time: 'majority round trip', note: 'R + W > N gives strong consistency without a single primary.' },
  ],

  concepts: ['cap-theorem', 'eventual-consistency', 'strong-consistency', 'quorum'],

  variants: [
    { name: 'Strong consistency', what: 'Every read sees the latest write. What a single database gives you by default.' },
    { name: 'Eventual consistency', what: 'Replicas converge given time. The default in most distributed stores.' },
    { name: 'Read-your-writes', what: 'A user always sees their own changes, even if others do not yet. Usually the property actually wanted.' },
    { name: 'Monotonic reads', what: 'Time never appears to run backwards for one reader — no seeing a value, then an older one.' },
    { name: 'Causal consistency', what: 'Related events are seen in order. A reply never arrives before the message it answers.' },
  ],

  furtherReading: [
    { label: 'CAP theorem', url: 'https://en.wikipedia.org/wiki/CAP_theorem', source: 'Wikipedia' },
    { label: 'Eventual consistency', url: 'https://en.wikipedia.org/wiki/Eventual_consistency', source: 'Wikipedia' },
    { label: 'PACELC theorem', url: 'https://en.wikipedia.org/wiki/PACELC_theorem', source: 'Wikipedia' },
  ],

  explainer: `CAP is usually stated as "pick two of consistency, availability, partition
tolerance", and that framing is misleading enough to be worth correcting.

**Partition tolerance is not optional.** Networks fail. If you run on more than
one machine, you will have partitions, and a system that cannot tolerate them
simply breaks. So the real choice is between the other two, *during a partition*:

- **CP** — refuse to answer rather than risk a wrong answer. The minority side of
  the partition returns errors. Correct for money, inventory, and bookings.
- **AP** — answer from whichever side you can reach, accepting that the two sides
  may disagree until they reconcile. Correct for feeds, likes, and analytics.

**PACELC** completes the picture, and is the more useful framing in practice:
during a Partition, choose Availability or Consistency; **Else** — the 99.9% of
the time when there is no partition — choose Latency or Consistency. That second
half is where the everyday cost lives. Strong consistency across regions means
every write pays a cross-region round trip, partition or no partition.

The most useful move in an interview is to stop treating consistency as one
global setting. It is per-operation. The same system can require strong
consistency for "charge this card" and eventual consistency for "increment the
view counter", and saying so is a stronger answer than picking a side.

Finally, "eventual" is a promise with no deadline attached. It is worth asking
how long convergence actually takes, because for most systems the honest answer
is milliseconds — and a millisecond of staleness is acceptable in far more places
than the phrase suggests.`,

  whenToUse: {
    reachFor: [
      'Strong consistency for money, inventory, seat booking, and anything where a double-spend is unacceptable.',
      'Eventual consistency for counters, feeds, recommendations, and analytics.',
      'Read-your-writes wherever a user would otherwise think their action failed.',
      'Causal consistency for messaging and comment threads, where order carries meaning.',
    ],
    insteadOf: [
      { alternative: 'One consistency level for the whole system', why: 'The most common mistake. Consistency is chosen per operation; forcing the strongest level everywhere pays cross-region latency to protect a view counter.' },
      { alternative: 'Distributed transactions (two-phase commit)', why: 'They give strong consistency across services and hold locks across the network, which makes availability worse. A saga with compensating actions is usually the better trade.' },
    ],
  },

  patternCues: [
    'The interviewer asks what happens when the network splits.',
    'The domain involves money, inventory, or a limited resource.',
    'A user might see their own action fail to appear.',
    'The system spans regions, which makes the latency half of PACELC the real question.',
  ],

  pitfalls: [
    { title: 'Reciting "pick two"', body: 'Partition tolerance is not a choice for a distributed system. Framing it as CP-or-AP during a partition shows you understand what the theorem actually says.' },
    { title: 'Treating eventual consistency as a defect', body: 'It is the correct choice for most data. The question is whether the convergence window is acceptable for that specific operation.' },
    { title: 'Ignoring the "else" in PACELC', body: 'Most of a system\'s life has no partition. The latency cost of strong consistency is paid constantly; the partition benefit is claimed rarely.' },
    { title: 'Assuming a single database is immune', body: 'A primary with async replicas is already an eventually consistent system from the reader\'s point of view.' },
  ],

  recommendedAfter: ['replication-sharding'],
};
