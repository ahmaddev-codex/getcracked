import type { LessonInput } from '../../schema';

export const replicationShardingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'replication-sharding',
  title: 'Replication and Sharding',
  summary: 'Copy the data to survive failure and scale reads; split it to scale writes.',
  order: 5,
  track: 'system-design',
  difficulty: 'core',

  operations: [
    { name: 'replication lag', time: '1 ms - seconds', note: 'Usually milliseconds, and unbounded under load. Never assume zero.' },
    { name: 'failover to a replica', time: '10-60 s', note: 'Detection dominates. Automatic failover risks split brain.' },
    { name: 'query hitting one shard', time: 'as normal', note: 'The good case, and the reason the shard key matters.' },
    { name: 'query fanning out to all shards', time: 'slowest shard', note: 'A scatter-gather is as slow as its worst participant.' },
    { name: 'resharding', time: 'hours to days', note: 'The reason to think about the key up front.' },
  ],

  concepts: ['sharding', 'replication'],

  variants: [
    { name: 'Single-primary replication', what: 'One writer, many readers. Simple, and the default.' },
    { name: 'Multi-primary replication', what: 'Several writers. Removes the write bottleneck and introduces write conflicts.' },
    { name: 'Synchronous replication', what: 'A write is not acknowledged until a replica has it. No data loss, higher latency.' },
    { name: 'Asynchronous replication', what: 'Acknowledge first, replicate after. Fast, and loses recent writes if the primary dies.' },
    { name: 'Range sharding', what: 'Split by key range. Range queries stay cheap; sequential keys create a hot shard.' },
    { name: 'Hash sharding', what: 'Split by hash of the key. Even distribution; range queries become fan-outs.' },
  ],

  furtherReading: [
    { label: 'Replication (computing)', url: 'https://en.wikipedia.org/wiki/Replication_(computing)', source: 'Wikipedia' },
    { label: 'Shard (database architecture)', url: 'https://en.wikipedia.org/wiki/Shard_(database_architecture)', source: 'Wikipedia' },
  ],

  explainer: `These two get discussed together and solve different problems. Conflating them is
one of the clearer signals in a system design interview.

**Replication copies the same data to several machines.** It buys durability —
losing one machine does not lose the data — and it scales *reads*, because any
replica can serve them. It does not scale writes at all: with a single primary,
every write still goes through one machine.

The cost is **lag**. Asynchronous replication acknowledges the write before the
replica has it, which means a user can write and then immediately read a stale
value from a replica. This is not a rare edge case; it is the default behaviour,
and "read your own writes" is the pattern that exists to work around it.

**Sharding splits different data across machines.** Shard 1 holds users A–M,
shard 2 holds N–Z. This is what scales writes, because each shard has its own
primary. It is also where most of the difficulty lives.

The **shard key** decides everything. A good key spreads load evenly and keeps
most queries on one shard. A bad key produces a hot shard doing all the work
while the rest idle — sharding by timestamp is the classic example, because all
of today's writes land in one place. And a key chosen wrongly is extremely
expensive to change once there is data.

What sharding takes away is worth stating plainly: **joins across shards, and
transactions across shards.** Both become application problems. Queries that
cannot be answered from one shard become scatter-gathers, which are as slow as
the slowest shard and get slower as you add shards.

The order to reach for them: replicate first — it is simpler and solves
durability, which you need regardless. Shard only when a single primary genuinely
cannot absorb the write volume.`,

  whenToUse: {
    reachFor: [
      'Replicate for durability and failover — which is not optional for anything that matters.',
      'Replicate to scale reads, which is the cheapest large win available.',
      'Shard when one primary cannot absorb the write throughput, and not before.',
      'Shard when the dataset no longer fits on one machine, which is the other honest reason.',
    ],
    insteadOf: [
      { alternative: 'Caching', why: 'Cheaper and simpler for read load, with no durability benefit. Reach for a cache first; add replicas when you need fresh reads or failover as well.' },
      { alternative: 'Vertical scaling the primary', why: 'A bigger write machine defers sharding for a long time and costs a fraction of the complexity. Sharding is close to irreversible; resizing is an afternoon.' },
      { alternative: 'Functional partitioning', why: 'Splitting by table or service — orders here, analytics there — gets much of the benefit without a shard key. Try it before splitting a single table across machines.' },
    ],
  },

  patternCues: [
    'The write rate is stated as beyond what one machine handles.',
    'The dataset is described in terabytes.',
    'The question asks what happens when the database machine dies.',
    'A user complains they cannot see something they just posted — that is replication lag.',
  ],

  pitfalls: [
    { title: 'Assuming replicas are current', body: 'Reading your own write from a replica returns the old value. Route reads that must be fresh to the primary, or pin a user to the primary briefly after they write.' },
    { title: 'A shard key that creates a hot shard', body: 'Timestamps and auto-increment ids put every new write on one shard. Hash, or pick a key with natural spread.' },
    { title: 'Sharding too early', body: 'It is one of the hardest things to undo, and it makes every subsequent feature harder. Exhaust replicas, caching and a bigger primary first.' },
    { title: 'Forgetting cross-shard queries exist', body: 'Every query that does not include the shard key becomes a fan-out to all of them. Design the key around the queries, not around the data.' },
  ],

  recommendedAfter: ['databases'],
};
