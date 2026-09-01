import type { ConceptCategory } from './schema';

/**
 * System Design concept map content (A14).
 *
 * Definitions rather than essays: this is reference material a learner drops
 * into mid-conversation, and the concept-map entries are what the System Design
 * labs (C9) and roadmap nodes (I3) deep-link to.
 *
 * **Coverage is partial and deliberately visible.** The PRD describes 129
 * concepts across 20 categories on the existing site; this is a greenfield
 * rebuild, so they are being re-authored. `conceptCount()` reports the real
 * number and the page shows it, rather than padding the set with shallow
 * entries to hit a target.
 */

export const CONCEPT_CATEGORIES: ConceptCategory[] = [
  {
    slug: "fundamentals",
    title: "Fundamentals",
    summary: "The vocabulary everything else assumes.",
    order: 1,
    concepts: [
      {
        slug: "latency-vs-throughput",
        term: "Latency vs throughput",
        definition: "Latency is how long one operation takes; throughput is how many complete per unit time.",
        matters: "They trade off. Batching raises throughput and latency together, which is why 'make it faster' is an ambiguous requirement until you say which.",
      },
      {
        slug: "availability",
        term: "Availability",
        definition: "The fraction of time a system serves requests successfully, usually quoted in nines.",
        matters: "Each extra nine costs roughly an order of magnitude more. Knowing that 99.9% is nine hours of downtime a year makes the target a business decision rather than a wish.",
      },
      {
        slug: "scalability",
        term: "Scalability",
        definition: "Whether added capacity produces a proportional increase in work done.",
        matters: "A system that needs twice the machines for 1.5x the load does not scale, and the shape of that curve decides whether growth is survivable.",
      },
      {
        slug: "vertical-vs-horizontal",
        term: "Vertical vs horizontal scaling",
        definition: "Bigger machines versus more machines.",
        matters: "Vertical is simpler and hits a hard ceiling; horizontal is unbounded but forces you to solve coordination, which is where the real difficulty lives.",
      },
    ],
  },
  {
    slug: "consistency-availability",
    title: "Consistency & Availability",
    summary: "What you give up when the network breaks.",
    order: 2,
    concepts: [
      {
        slug: "cap-theorem",
        term: "CAP theorem",
        definition: "Under a network partition a distributed system must choose between consistency and availability.",
        matters: "It is not a menu of three. Partitions happen, so the real question is only ever what you do during one.",
      },
      {
        slug: "eventual-consistency",
        term: "Eventual consistency",
        definition: "Replicas converge given enough time without new writes.",
        matters: "Perfectly acceptable for a like count and unacceptable for a bank balance. Naming which of the two you have is most of the design.",
      },
      {
        slug: "strong-consistency",
        term: "Strong consistency",
        definition: "Every read observes the most recent write.",
        matters: "Costs coordination, and therefore latency, on every operation. Paying for it where it is not needed is a common source of slow systems.",
      },
      {
        slug: "quorum",
        term: "Quorum",
        definition: "Requiring a majority of replicas to acknowledge a read or write.",
        matters: "When reads plus writes exceed the replica count, reads are guaranteed to see the latest write \u2014 the tunable knob between consistency and latency.",
      },
    ],
  },
  {
    slug: "networking",
    title: "Networking & Traffic",
    summary: "Getting bytes to the right machine.",
    order: 3,
    concepts: [
      {
        slug: "load-balancer",
        term: "Load balancer",
        definition: "Distributes incoming requests across a pool of servers.",
        matters: "The single most common first answer to 'how do we handle more traffic', and the point where health checking and session affinity become your problem.",
      },
      {
        slug: "reverse-proxy",
        term: "Reverse proxy",
        definition: "A server that fronts backends and forwards requests to them.",
        matters: "Gives one place for TLS termination, caching, and routing, so backends stop each solving those separately.",
      },
      {
        slug: "cdn",
        term: "CDN",
        definition: "Geographically distributed caches serving content near the user.",
        matters: "Latency is bounded by the speed of light. Moving bytes closer is the only fix that beats physics.",
      },
      {
        slug: "dns",
        term: "DNS",
        definition: "Resolves names to addresses, with caching at every layer.",
        matters: "Those caches make DNS a slow lever \u2014 TTLs mean a failover is measured in minutes, not seconds.",
      },
    ],
  },
  {
    slug: "application-layer",
    title: "Application Layer",
    summary: "Shaping the service itself.",
    order: 4,
    concepts: [
      {
        slug: "api-gateway",
        term: "API gateway",
        definition: "A single entry point handling routing, auth, and rate limiting for many services.",
        matters: "Removes cross-cutting duplication, at the cost of a component every request depends on.",
      },
      {
        slug: "microservices",
        term: "Microservices",
        definition: "Independently deployable services split along business boundaries.",
        matters: "Trades in-process calls for network calls. Worth it for team autonomy, rarely worth it for a small team.",
      },
      {
        slug: "statelessness",
        term: "Statelessness",
        definition: "Servers hold no client state between requests.",
        matters: "Any instance can serve any request, which is what makes horizontal scaling and rolling deploys straightforward.",
      },
      {
        slug: "idempotency",
        term: "Idempotency",
        definition: "Repeating an operation has the same effect as performing it once.",
        matters: "Networks retry. Without idempotency, a retry after a timeout can charge a card twice.",
      },
    ],
  },
  {
    slug: "databases",
    title: "Databases",
    summary: "Where the state actually lives.",
    order: 5,
    concepts: [
      {
        slug: "sql-vs-nosql",
        term: "SQL vs NoSQL",
        definition: "Relational schemas and joins versus flexible documents and denormalisation.",
        matters: "The honest question is not which is better but whether your access patterns are known in advance.",
      },
      {
        slug: "indexing",
        term: "Indexing",
        definition: "A secondary structure making lookups fast without scanning.",
        matters: "Reads get faster, writes get slower, and storage grows. An index nobody queries is pure cost.",
      },
      {
        slug: "sharding",
        term: "Sharding",
        definition: "Splitting data across machines by a partition key.",
        matters: "The key choice is nearly irreversible and decides whether queries stay local or fan out to every shard.",
      },
      {
        slug: "replication",
        term: "Replication",
        definition: "Copying data to additional nodes.",
        matters: "Buys read capacity and durability, and introduces replication lag \u2014 the gap where a read-after-write returns stale data.",
      },
      {
        slug: "normalization",
        term: "Normalization",
        definition: "Structuring data to remove redundancy.",
        matters: "Keeps writes cheap and correct; denormalising trades that for read speed, which is the usual direction at scale.",
      },
    ],
  },
  {
    slug: "caching",
    title: "Caching",
    summary: "Not doing work twice.",
    order: 6,
    concepts: [
      {
        slug: "cache-aside",
        term: "Cache-aside",
        definition: "The application checks the cache, and on a miss loads from the store and populates it.",
        matters: "The default because it is simple and the cache failing only costs latency, not correctness.",
      },
      {
        slug: "write-through",
        term: "Write-through",
        definition: "Writes go to cache and store together.",
        matters: "Keeps them consistent at the cost of write latency, and still leaves cold data uncached.",
      },
      {
        slug: "eviction-policy",
        term: "Eviction policy",
        definition: "The rule deciding what leaves a full cache \u2014 LRU, LFU, FIFO.",
        matters: "Determines hit rate under memory pressure, which is the only condition where a cache is interesting.",
      },
      {
        slug: "cache-stampede",
        term: "Cache stampede",
        definition: "Many requests miss the same expired key at once and all hit the origin.",
        matters: "Turns a cache expiry into a self-inflicted outage. Fixed with locking, jittered TTLs, or serving stale while revalidating.",
      },
    ],
  },
  {
    slug: "asynchronism",
    title: "Asynchronism & Communication",
    summary: "Decoupling in time.",
    order: 7,
    concepts: [
      {
        slug: "message-queue",
        term: "Message queue",
        definition: "A durable buffer between producers and consumers.",
        matters: "Absorbs bursts and lets a slow consumer fall behind without dropping work or blocking the producer.",
      },
      {
        slug: "pub-sub",
        term: "Publish/subscribe",
        definition: "Producers broadcast; any number of subscribers receive independently.",
        matters: "Adding a consumer needs no change to the producer, which is what makes event-driven systems extensible.",
      },
      {
        slug: "backpressure",
        term: "Backpressure",
        definition: "Signalling upstream to slow down when a consumer cannot keep up.",
        matters: "Without it, an overloaded system fails by exhausting memory rather than by degrading.",
      },
      {
        slug: "at-least-once",
        term: "Delivery guarantees",
        definition: "At-most-once, at-least-once, and exactly-once semantics.",
        matters: "Exactly-once end to end is effectively unavailable; at-least-once plus idempotent consumers is how it is achieved in practice.",
      },
    ],
  },
  {
    slug: "reliability",
    title: "Reliability Patterns",
    summary: "Failing without falling over.",
    order: 8,
    concepts: [
      {
        slug: "circuit-breaker",
        term: "Circuit breaker",
        definition: "Stops calling a failing dependency after a threshold, then probes for recovery.",
        matters: "Prevents one slow dependency from consuming every thread and taking the caller down with it.",
      },
      {
        slug: "retry-backoff",
        term: "Retry with backoff",
        definition: "Retrying failures with growing, jittered delays.",
        matters: "Naive immediate retries turn a blip into a thundering herd that keeps the dependency down.",
      },
      {
        slug: "bulkhead",
        term: "Bulkhead",
        definition: "Isolating resources so one workload cannot starve another.",
        matters: "Named for ship compartments: a flood stays in one section instead of sinking the vessel.",
      },
      {
        slug: "graceful-degradation",
        term: "Graceful degradation",
        definition: "Shedding non-essential features to keep the core working.",
        matters: "A checkout that works without recommendations is a far better outcome than a page that does not load.",
      },
      {
        slug: "timeout",
        term: "Timeouts",
        definition: "A bound on how long a caller waits.",
        matters: "A missing timeout is an unbounded resource leak. It is the cheapest reliability control there is.",
      },
    ],
  },
  {
    slug: "performance-antipatterns",
    title: "Performance Antipatterns",
    summary: "Recognisable ways systems get slow.",
    order: 9,
    concepts: [
      {
        slug: "n-plus-one",
        term: "N+1 queries",
        definition: "Fetching a list, then querying once per item.",
        matters: "The most common cause of a page that is fine in development and unusable in production.",
      },
      {
        slug: "chatty-io",
        term: "Chatty I/O",
        definition: "Many small calls where one batched call would do.",
        matters: "Each round trip pays the network latency floor, so the cost is dominated by count rather than size.",
      },
      {
        slug: "busy-database",
        term: "Busy database",
        definition: "Pushing work into the database that the application could do.",
        matters: "The database is the hardest tier to scale, so it is the worst place to put avoidable load.",
      },
      {
        slug: "noisy-neighbour",
        term: "Noisy neighbour",
        definition: "One tenant's load degrading everyone else's.",
        matters: "The argument for quotas and isolation in any shared system.",
      },
    ],
  },
  {
    slug: "observability",
    title: "Monitoring & Observability",
    summary: "Knowing what is happening.",
    order: 10,
    concepts: [
      {
        slug: "metrics-logs-traces",
        term: "Metrics, logs, and traces",
        definition: "Aggregates, events, and per-request causal chains.",
        matters: "Each answers a different question. Metrics say something is wrong, traces say where, logs say why.",
      },
      {
        slug: "slo",
        term: "SLIs, SLOs, and error budgets",
        definition: "Measured indicators, targets over them, and the failure allowance that follows.",
        matters: "Turns reliability from an argument into a number, and makes 'ship faster' and 'be reliable' negotiable against each other.",
      },
      {
        slug: "percentiles",
        term: "Tail latency",
        definition: "The slow end of the distribution \u2014 p95, p99 \u2014 rather than the mean.",
        matters: "Averages hide the experience of the users having the worst time, who are usually the ones who leave.",
      },
      {
        slug: "health-check",
        term: "Health checks",
        definition: "An endpoint reporting whether an instance should receive traffic.",
        matters: "Distinguishing liveness from readiness prevents restarting a process that is merely warming up.",
      },
    ],
  },
  {
    slug: "cloud-design",
    title: "Cloud Patterns: Design",
    summary: "Structural patterns for distributed systems.",
    order: 11,
    concepts: [
      {
        slug: "sidecar",
        term: "Sidecar",
        definition: "A helper process deployed alongside a service.",
        matters: "Keeps cross-cutting concerns out of application code without a shared library in every language.",
      },
      {
        slug: "ambassador",
        term: "Ambassador",
        definition: "A proxy handling outbound calls for a service.",
        matters: "Centralises retries, timeouts, and routing for clients that cannot easily be changed.",
      },
      {
        slug: "strangler-fig",
        term: "Strangler fig",
        definition: "Incrementally replacing a legacy system by routing traffic away piece by piece.",
        matters: "Makes migration reversible at every step, which is what makes it survivable.",
      },
      {
        slug: "gateway-aggregation",
        term: "Gateway aggregation",
        definition: "Combining several backend calls into one client request.",
        matters: "Cuts round trips for clients on high-latency connections, which is most mobile clients.",
      },
    ],
  },
  {
    slug: "cloud-data",
    title: "Cloud Patterns: Data",
    summary: "Managing state across services.",
    order: 12,
    concepts: [
      {
        slug: "cqrs",
        term: "CQRS",
        definition: "Separating the read model from the write model.",
        matters: "Lets each be optimised independently, at the cost of a synchronisation path between them.",
      },
      {
        slug: "event-sourcing",
        term: "Event sourcing",
        definition: "Storing state as an append-only log of events.",
        matters: "Gives a full audit trail and time travel; costs you the ability to just look at a row.",
      },
      {
        slug: "saga",
        term: "Saga",
        definition: "A sequence of local transactions with compensating actions on failure.",
        matters: "How you get something transaction-shaped across services when a distributed transaction is not available.",
      },
      {
        slug: "materialized-view",
        term: "Materialized view",
        definition: "A precomputed query result kept up to date.",
        matters: "Trades storage and write cost for read latency, which is usually the right trade at scale.",
      },
    ],
  },
  {
    slug: "cloud-messaging",
    title: "Cloud Patterns: Messaging",
    summary: "Moving work between components.",
    order: 13,
    concepts: [
      {
        slug: "competing-consumers",
        term: "Competing consumers",
        definition: "Multiple consumers reading from one queue.",
        matters: "Scales processing horizontally and gives failure isolation, provided the work is order-independent.",
      },
      {
        slug: "claim-check",
        term: "Claim check",
        definition: "Storing a large payload externally and passing a reference through the queue.",
        matters: "Keeps messages small so the broker stays fast.",
      },
      {
        slug: "dead-letter",
        term: "Dead letter queue",
        definition: "Where messages go after repeatedly failing.",
        matters: "Stops one poison message blocking a partition forever, and preserves it for inspection.",
      },
      {
        slug: "outbox",
        term: "Transactional outbox",
        definition: "Writing an event to the database in the same transaction as the state change.",
        matters: "Removes the window where a system commits state but fails to publish the event.",
      },
    ],
  },
  {
    slug: "security",
    title: "Security Patterns",
    summary: "Keeping it safe.",
    order: 14,
    concepts: [
      {
        slug: "authn-authz",
        term: "Authentication vs authorization",
        definition: "Who you are versus what you may do.",
        matters: "Conflating them is how systems end up with a valid session doing something it should not.",
      },
      {
        slug: "least-privilege",
        term: "Least privilege",
        definition: "Granting only the access required.",
        matters: "Bounds the blast radius of any single compromised component.",
      },
      {
        slug: "rate-limiting",
        term: "Rate limiting",
        definition: "Capping request rate per client.",
        matters: "Protects capacity and cost, and is the first line against both abuse and accidental loops.",
      },
      {
        slug: "defense-in-depth",
        term: "Defence in depth",
        definition: "Layering controls so one failure is not fatal.",
        matters: "Assumes any single control will eventually fail, which is the correct assumption.",
      },
    ],
  },
  {
    slug: "storage-indexing",
    title: "Storage Engines & Indexing",
    summary: "How bytes are structured on disk and retrieved efficiently.",
    order: 15,
    concepts: [
      {
        slug: "b-tree-vs-lsm",
        term: "B-Tree vs LSM-Tree",
        definition: "B-Trees optimize for random reads with in-place updates; LSM-Trees append to memory and flush sorted runs for write-heavy workloads.",
        matters: "Decides whether a database handles write-heavy telemetry or read-heavy transactional records with predictable latency.",
      },
      {
        slug: "write-ahead-log",
        term: "Write-Ahead Log (WAL)",
        definition: "An append-only log recording state changes before applying them to database files.",
        matters: "Guarantees atomicity and durability (ACID) by allowing recovery and replaying uncommitted memory buffers after a crash.",
      },
      {
        slug: "bloom-filter",
        term: "Bloom filter",
        definition: "A space-efficient probabilistic data structure that tests whether an element definitely is not in a set or might be.",
        matters: "Prevents expensive disk reads for non-existent keys in LSM-tree databases like Cassandra and RocksDB.",
      },
      {
        slug: "columnar-storage",
        term: "Columnar storage",
        definition: "Storing table records column-by-column rather than row-by-row on disk.",
        matters: "Allows analytical OLAP queries (aggregations across millions of rows) to scan only relevant columns with high compression.",
      },
      {
        slug: "secondary-index",
        term: "Secondary index",
        definition: "A lookup structure on non-primary-key columns pointing to primary records.",
        matters: "Enables fast filtering on multiple attributes at the cost of additional write latency and storage overhead.",
      },
      {
        slug: "read-replicas",
        term: "Read replicas",
        definition: "Standby database copies updated via asynchronous or synchronous replication streams.",
        matters: "Offloads read-heavy query load from primary transactional instances and provides failover targets.",
      },
    ],
  },
  {
    slug: "consensus-coordination",
    title: "Consensus & Coordination",
    summary: "Reaching agreement across independent nodes over an unreliable network.",
    order: 16,
    concepts: [
      {
        slug: "paxos-raft",
        term: "Paxos & Raft",
        definition: "Consensus protocols designed to replicate a state machine consistently across a cluster despite node crashes.",
        matters: "Powers distributed metadata stores (etcd, ZooKeeper) that require absolute leader election and consistent cluster state.",
      },
      {
        slug: "leader-election",
        term: "Leader election",
        definition: "The mechanism by which nodes nominate and agree on a single coordinator node.",
        matters: "Ensures only one node orchestrates tasks or coordinates writes to prevent split-brain inconsistencies.",
      },
      {
        slug: "distributed-locking",
        term: "Distributed locking",
        definition: "A synchronization primitive that ensures mutual exclusion across different machines.",
        matters: "Prevents race conditions in distributed workflows, such as double payments or duplicate batch processing jobs.",
      },
      {
        slug: "split-brain",
        term: "Split-brain problem",
        definition: "A state where a cluster splits into two sub-clusters, each believing it is the sole active master.",
        matters: "Causes catastrophic data corruption without quorum-based majority voting (n/2 + 1).",
      },
      {
        slug: "gossip-protocol",
        term: "Gossip protocol",
        definition: "A decentralized peer-to-peer communication protocol where nodes periodically exchange state summaries.",
        matters: "Enables scalable node discovery and failure detection across massive clusters without central coordination.",
      },
    ],
  },
  {
    slug: "caching-strategies",
    title: "Advanced Caching Strategies",
    summary: "Cache lifecycle, population patterns, and invalidation mechanisms.",
    order: 17,
    concepts: [
      {
        slug: "consistent-hashing",
        term: "Consistent hashing",
        definition: "A hashing scheme that minimizes key remaps to k/N when cluster nodes are added or removed.",
        matters: "Prevents full-cluster cache invalidation during auto-scaling or hardware node replacement.",
      },
      {
        slug: "write-through-vs-write-behind",
        term: "Write-through vs Write-behind",
        definition: "Write-through updates cache and DB synchronously; write-behind queues DB writes asynchronously.",
        matters: "Write-through guarantees data consistency, while write-behind maximizes write throughput at the risk of data loss on crash.",
      },
      {
        slug: "refresh-ahead",
        term: "Refresh-ahead caching",
        definition: "Automatically reloading cached values in the background before their TTL expires.",
        matters: "Eliminates cache-miss latency spikes for consistently requested hot keys.",
      },
      {
        slug: "cache-invalidation",
        term: "Cache invalidation",
        definition: "The process of removing or updating stale cached records when the underlying data changes.",
        matters: "Known as one of the two hardest problems in computer science; directly impacts data freshness and user correctness.",
      },
      {
        slug: "two-tier-caching",
        term: "Two-tier caching (L1/L2)",
        definition: "Combining fast process-local memory (L1) with a shared distributed Redis cluster (L2).",
        matters: "Absorbs extreme hotkey reads in local memory while keeping global state synchronized across instances.",
      },
    ],
  },
  {
    slug: "distributed-messaging",
    title: "Streaming & Delivery Semantics",
    summary: "Message guarantees, event logs, and consumption architectures.",
    order: 18,
    concepts: [
      {
        slug: "delivery-semantics",
        term: "Delivery semantics (At-least-once, Exactly-once)",
        definition: "Guarantees on message transmission: at-most-once (can drop), at-least-once (can duplicate), exactly-once (deduped).",
        matters: "Dictates whether downstream consumers must implement idempotent processing to prevent duplicate operations.",
      },
      {
        slug: "consumer-group",
        term: "Consumer group",
        definition: "A set of consumers cooperating to read partitions of a topic in parallel (as in Apache Kafka).",
        matters: "Enables linear horizontal scaling of stream processing while preserving ordered processing per partition key.",
      },
      {
        slug: "change-data-capture",
        term: "Change Data Capture (CDC)",
        definition: "Streaming database write-ahead log events directly into message brokers (e.g. Debezium).",
        matters: "Enables real-time data sync to caches and search indexes without dual-write race conditions.",
      },
      {
        slug: "idempotent-consumer",
        term: "Idempotent consumer",
        definition: "A message receiver designed so processing the same message multiple times produces the identical result.",
        matters: "Enables safe at-least-once message delivery without creating duplicate business records.",
      },
      {
        slug: "partition-key",
        term: "Partition key",
        definition: "The attribute used to hash and assign a stream record to a specific queue partition.",
        matters: "Guarantees strict FIFO processing order for records sharing the same key while parallelizing across keys.",
      },
    ],
  },
  {
    slug: "microservices-architecture",
    title: "Microservices & Distributed Architecture",
    summary: "Organizing distributed services, cross-cutting concerns, and gateways.",
    order: 19,
    concepts: [
      {
        slug: "service-mesh",
        term: "Service mesh",
        definition: "An infrastructure layer using sidecar proxies (e.g. Envoy) to manage service-to-service communication.",
        matters: "Standardizes mTLS encryption, traffic routing, retries, and distributed tracing without modifying application code.",
      },
      {
        slug: "sidecar-pattern",
        term: "Sidecar pattern",
        definition: "Deploying helper components in an attached container alongside the main application container.",
        matters: "Separates cross-cutting concerns (logging, proxying, secrets rotation) from the core business logic.",
      },
      {
        slug: "bulkhead-pattern",
        term: "Bulkhead pattern",
        definition: "Isolating resources (thread pools, connections, service instances) into redundant compartments.",
        matters: "Prevents a failure in one misbehaving upstream dependency or consumer from exhausting all platform resources.",
      },
      {
        slug: "bff-pattern",
        term: "Backend For Frontend (BFF)",
        definition: "Dedicated API gateway services tailored specifically to the needs of particular UI clients (mobile vs web).",
        matters: "Prevents bloated general-purpose API responses and simplifies client network payloads.",
      },
      {
        slug: "saga-orchestration",
        term: "Saga orchestration",
        definition: "A centralized coordinator service orchestrating multi-service transactions with compensatory rollbacks.",
        matters: "Provides visibility and error handling for complex multi-step distributed business workflows.",
      },
    ],
  },
  {
    slug: "distributed-reliability",
    title: "Distributed Reliability & Resilience",
    summary: "Preventing cascading failures and recovering from faults gracefully.",
    order: 20,
    concepts: [
      {
        slug: "chaos-engineering",
        term: "Chaos engineering",
        definition: "Intentionally injecting failures (network latency, killed instances) into production to test resilience.",
        matters: "Validates automated failover mechanisms before real unplanned production outages occur.",
      },
      {
        slug: "circuit-breaker-pattern",
        term: "Circuit breaker pattern",
        definition: "Stopping requests to a failing remote service immediately once a failure threshold is crossed.",
        matters: "Prevents cascading failure across dependent services and gives failing backends time to recover.",
      },
      {
        slug: "mttr-vs-mttf",
        term: "MTTR vs MTTF",
        definition: "Mean Time to Recovery (how fast you restore service) versus Mean Time to Failure (how long between outages).",
        matters: "Focuses engineering effort on rapid automated recovery and rollback rather than assuming systems will never fail.",
      },
      {
        slug: "exponential-backoff",
        term: "Exponential backoff with jitter",
        definition: "Doubling retry intervals combined with randomized delays between retry attempts.",
        matters: "Prevents waves of retrying clients from overwhelming recovering backend servers with synchronized traffic spikes.",
      },
      {
        slug: "load-shedding",
        term: "Load shedding",
        definition: "Deliberately rejecting lower-priority requests when a system exceeds safe operating thresholds.",
        matters: "Preserves server responsiveness for critical traffic instead of degrading into complete server crash.",
      },
    ],
  },
];
