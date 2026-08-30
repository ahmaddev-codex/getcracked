import type { LessonInput } from '../../schema';

export const consistentHashingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'consistent-hashing',
  title: 'Consistent Hashing',
  summary: 'Add or remove a node and move 1/N of the keys, not all of them.',
  order: 10,
  track: 'system-design',
  difficulty: 'advanced',

  operations: [
    { name: 'lookup', time: 'O(log n)', note: 'Binary search around the ring over n virtual nodes.' },
    { name: 'keys moved when a node joins', time: '~1/N', note: 'Against ~all of them with modulo hashing. The entire point.' },
    { name: 'virtual nodes per physical node', time: '100-200', note: 'What makes the distribution even rather than lumpy.' },
    { name: 'memory', time: 'O(nodes x replicas)', note: 'Trivial — a sorted array of hashes.' },
  ],

  variants: [
    { name: 'Modulo hashing', what: 'hash(key) % N. Simple, and remaps nearly every key when N changes.' },
    { name: 'Ring with virtual nodes', what: 'Each physical node placed at many points. The standard form.' },
    { name: 'Rendezvous (highest random weight)', what: 'Pick the node maximising hash(key, node). Same property, simpler, no ring to maintain.' },
    { name: 'Jump consistent hash', what: 'No storage at all, but nodes can only be added or removed at the end.' },
  ],

  furtherReading: [
    { label: 'Consistent hashing', url: 'https://en.wikipedia.org/wiki/Consistent_hashing', source: 'Wikipedia' },
    { label: 'Rendezvous hashing', url: 'https://en.wikipedia.org/wiki/Rendezvous_hashing', source: 'Wikipedia' },
  ],

  explainer: `The obvious way to spread keys over N machines is \`hash(key) % N\`. It works
perfectly until N changes. Go from 4 machines to 5 and the modulus changes for
every key, so roughly **80% of the data is now on the wrong machine**. For a
cache that means a near-total miss storm; for a datastore it means moving almost
everything.

Consistent hashing fixes this by hashing keys and nodes into the same circular
space. A key belongs to the first node clockwise from it. Add a node and it takes
over only the arc between itself and its predecessor — about 1/N of the keys.
Everything else stays exactly where it was.

Two refinements make it usable in practice.

**Virtual nodes.** A handful of physical nodes placed randomly on a ring produce
badly uneven arcs, so one machine gets far more than its share. Placing each
physical node at 100–200 points averages the arcs out, and it also means a
departing node's load is spread across all the survivors rather than dumped
entirely on its clockwise neighbour.

**Replication.** Walk clockwise past the first node to the next R distinct
physical nodes, and you have R copies of each key with no extra machinery.

Worth knowing: **rendezvous hashing** achieves the same minimal-movement property
by scoring every node for a key and taking the highest. It needs no ring, no
virtual nodes, and no sorted structure — it is O(N) per lookup instead of
O(log N), which for realistic N is fine. If you can only remember one of these,
rendezvous is easier to implement correctly.`,

  whenToUse: {
    reachFor: [
      'A distributed cache where node changes must not invalidate everything — the original motivation.',
      'Sharded datastores that need to rebalance incrementally rather than all at once.',
      'Sticky routing where the same user or key should reach the same instance to keep a local cache warm.',
      'Any partitioning scheme where the node count changes during normal operation.',
    ],
    insteadOf: [
      { alternative: 'Modulo hashing', why: 'Correct and far simpler when the node count never changes. If your shard count is fixed at deploy time, this machinery buys nothing.' },
      { alternative: 'A lookup table of key ranges', why: 'Explicit, debuggable, and allows deliberate placement — which matters when nodes have different capacities. It needs a coordinator to maintain, which is the cost.' },
      { alternative: 'Rendezvous hashing', why: 'Same minimal-movement guarantee, no ring and no virtual nodes to tune. Prefer it unless the node count is large enough for O(N) lookup to matter.' },
    ],
  },

  patternCues: [
    'The design has a distributed cache or a sharded store that scales elastically.',
    'The interviewer asks what happens to the data when a node is added.',
    'You need the same key to reach the same node repeatedly.',
    'The words "rebalancing" or "resharding" come up.',
  ],

  pitfalls: [
    { title: 'Omitting virtual nodes', body: 'With a handful of nodes on a bare ring the arcs are wildly uneven and one machine takes most of the load. This is the difference between the idea working and not.' },
    { title: 'Assuming it prevents hot keys', body: 'It distributes *keys* evenly, not *traffic*. One key requested a million times a second still lands on one node — that needs replication or a local cache.' },
    { title: 'Different hash functions on different clients', body: 'Every participant must agree on the hash, or they disagree about where a key lives. Pin the algorithm explicitly.' },
    { title: 'Reaching for it when the node count is fixed', body: 'If nodes never change, modulo is simpler and does the same job.' },
  ],

  recommendedAfter: ['replication-sharding'],
};
