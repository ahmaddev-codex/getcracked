import type { ScenarioLabInput } from '../schema';

/**
 * Scenario lab for a distributed in-memory cache cluster (like Memcached/Redis).
 * Bridges to the `lru-cache` build challenge (C6).
 */
export const distributedCacheLab: ScenarioLabInput = {
  slug: 'distributed-cache',
  title: 'Design a Distributed In-Memory Cache',
  summary: 'Scaling in-memory caching with consistent hashing, LRU eviction, and protection against the thundering herd.',
  difficulty: 'medium',
  topics: ['caching', 'consistent-hashing', 'scaling'],
  timeBudgetMinutes: 30,

  brief: `> "Design a distributed in-memory key-value caching system capable of serving millions of reads/sec
> across a sharded cluster with sub-5ms response times, high availability, and automatic node rebalancing."

In-memory caching is what allows modern web applications to scale beyond database throughput limits.
However, clustering caches introduces distributed problems: partition balancing, node failures, cache invalidation,
and hotkey thundering herds.

Work through the core decisions that separate a toy dictionary from production caching infrastructure.`,

  steps: [
    {
      slug: 'requirements',
      kind: 'select',
      dimension: 'requirements',
      multiple: true,
      prompt: 'Which core requirements dictate the design of a distributed cache tier?',
      options: [
        {
          label: 'Sub-5ms read and write latency (P99)',
          correct: true,
          reason:
            'A cache layer only delivers value if its retrieval latency is an order of magnitude faster than the underlying database or remote API.',
        },
        {
          label: 'Configurable TTLs (Time-To-Live) and bounded memory eviction policies (e.g. LRU)',
          correct: true,
          reason:
            'Memory is finite and expensive. The cache must automatically evict cold keys and respect expiration timestamps to prevent unbounded growth.',
        },
        {
          label: 'Minimal key re-mapping when cache nodes are added or removed dynamically',
          correct: true,
          reason:
            'Adding a server must not invalidate all existing cached keys, which would cause an instantaneous database outage as all traffic falls through.',
        },
        {
          label: 'Full ACID transactions across multi-key operations with rollback capabilities',
          reason:
            'Caches intentionally sacrifice multi-record ACID transactions to maximize raw read/write throughput and single-key latency.',
        },
        {
          label: 'Permanent disk durability with zero data loss on power failure',
          reason:
            'Caches are transient buffers. If a cache loses data on reboot, it can repopulate from the database; requiring synchronous disk flush defeats in-memory performance.',
        },
      ],
    },

    {
      slug: 'memory-estimation',
      kind: 'estimate',
      dimension: 'estimation',
      concepts: ['latency-vs-throughput'],
      prompt: 'If caching 100M active items with an average key+value size of 1 KB, how many GB of RAM is required?',
      unit: 'GB RAM',
      answer: 100,
      tolerance: 3,
      working:
        '100 million items × 1,000 bytes = 100,000,000,000 bytes ≈ 100 GB RAM. Sizing with hash map pointer overhead and 20% buffer suggests 120-150 GB total RAM across nodes.',
    },

    {
      slug: 'sharding-strategy',
      kind: 'select',
      dimension: 'scaling',
      concepts: ['consistent-hashing'],
      prompt: 'How should keys be partitioned across the pool of cache nodes?',
      options: [
        {
          label: 'Consistent Hashing ring with virtual nodes (tokens)',
          correct: true,
          reason:
            'Consistent hashing ensures that when a node is added or removed, only k/N keys are remapped. Virtual nodes prevent hot spot clustering on uneven hash distributions.',
        },
        {
          label: 'Modulo hashing on node count: hash(key) % N',
          reason:
            'Modulo hashing remaps almost 100% of keys whenever N changes (adding or losing a node), instantly invalidating the entire cache and crashing the database.',
        },
        {
          label: 'Centralized routing coordinator with master lookup table',
          reason:
            'A centralized lookup coordinator becomes a single point of failure and bottleneck for millions of read operations per second.',
        },
      ],
    },

    {
      slug: 'eviction-policy',
      kind: 'select',
      dimension: 'data-model',
      concepts: ['cache-aside'],
      prompt: 'Which data structure combination implements O(1) Least Recently Used (LRU) eviction?',
      options: [
        {
          label: 'Doubly linked list of key-value nodes paired with a hash map of node pointers',
          correct: true,
          reason:
            'The hash map gives O(1) key lookup and node reference; the doubly linked list allows moving accessed nodes to the head and evicting from the tail in O(1) time.',
        },
        {
          label: 'A single min-heap sorted by timestamp',
          reason:
            'A min-heap requires O(log N) to update access timestamps and O(N) to look up a key by name, which is too slow for high-throughput in-memory caching.',
        },
        {
          label: 'An array sorted by access counter with periodic quicksort',
          reason:
            'Sorting an array on every read or batch operation has O(N log N) cost and blocks memory access for concurrent read requests.',
        },
      ],
    },

    {
      slug: 'thundering-herd',
      kind: 'select',
      dimension: 'bottleneck',
      concepts: ['cache-stampede'],
      prompt: 'How do you prevent a cache stampede (thundering herd) when a popular key expires under heavy load?',
      options: [
        {
          label: 'Single-flight mutual exclusion mutex (or probabilistic early refresh) so only 1 request fetches from DB',
          correct: true,
          reason:
            'Mutex locking (like singleflight) ensures only the first cache-miss worker queries the database while concurrent requests wait for the cache update, preventing DB overload.',
        },
        {
          label: 'Increase database connection pool size to 50,000 connections',
          reason:
            'Spawning tens of thousands of simultaneous database connections leads to connection exhaustion, lock contention, and catastrophic database thrashing.',
        },
        {
          label: 'Disable TTLs completely so keys never expire',
          reason:
            'Disabling TTLs leads to stale data anomalies and unbounded memory consumption as old records can never be cleared.',
        },
      ],
    },
  ],

  takeaway: `Distributed caching turns on two fundamentals: partition stability and eviction bounds.
Consistent hashing with virtual nodes ensures cluster resizing invalidates only a tiny fraction of data.
O(1) LRU eviction using a hash map and doubly linked list maintains memory bounds without latency spikes,
and single-flight mutexes shield primary databases from hotkey stampedes.`,
};
