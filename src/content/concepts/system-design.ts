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
        dimensions: {
          problem: "A single application server runs out of compute/memory capacity and becomes a single point of failure under peak user traffic.",
          whyItHappens: "Traffic surges or organic scale exceed the CPU core limits and network bandwidth of a single physical or virtual host.",
          primitiveSolution: "Scale vertically by provisioning an oversized cloud instance with maximum CPU and RAM (e.g. 128 vCPUs, 512GB RAM).",
          scaleLimit: "Vertical scaling hits a hardware ceiling, incurs exponential cloud costs, and requires full system downtime during hardware failure or reboot.",
          component: "Load Balancer (Layer 4 TCP / Layer 7 HTTP Reverse Proxy like Nginx, Envoy, AWS ALB).",
          tradeOffs: {
            gains: [
              "Horizontal scalability by fanning out traffic across arbitrary backend worker pools",
              "Zero-downtime rolling deployments and blue/green traffic shifting",
              "Automatic health check-based failover isolating unhealthy instances",
            ],
            sacrifices: [
              "Adds an extra network hop and 1-3ms latency to the ingress request path",
              "Requires state externalization (sessions must move to Redis or stateless JWTs)",
              "Load balancer itself requires redundant active-passive/active-active setup to avoid becoming an SPOF",
            ],
          },
          failureModes: "If the load balancer itself crashes or runs out of ephemeral sockets, all inbound ingress traffic drops immediately unless DNS Anycast or BGP/ECMP failover takes over.",
          alternatives: [
            "DNS Round Robin (primitive, lacks instant health checking or weighted routing)",
            "Client-side load balancing via gRPC / service mesh (bypasses centralized LB hop)",
            "Direct IP peering with ECMP (Layer 3 routing at datacenter border)",
          ],
          interviewSignal: "Senior candidates proactively contrast L4 (transport level, ultra-fast TCP throughput) vs L7 (application level, TLS termination, path routing) and address sticky sessions without creating load skew.",
          realSystem: "GitHub uses HAProxy for L4 TCP routing into Envoy clusters for L7 application routing; AWS ALB fronting Amazon retail services.",
        },
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
        dimensions: {
          problem: "Global users suffer 150-300ms round-trip latency fetching static assets and media files from a centralized origin datacenter.",
          whyItHappens: "Physical distance and speed-of-light propagation across transoceanic fiber links introduce irreducible geographic latency.",
          primitiveSolution: "Host all static assets directly on the main application origin servers or an origin blob storage bucket.",
          scaleLimit: "Origin servers drown in concurrent bandwidth consumption (gigabits/sec), starving API capacity while international latency remains unbearable.",
          component: "Content Delivery Network (CDN) with geo-distributed Edge Points of Presence (PoPs) like Cloudflare, Fastly, or CloudFront.",
          tradeOffs: {
            gains: [
              "Sub-20ms edge latency for cached assets by terminating TLS and HTTP requests near the user",
              "Shields origin database and web servers from 80-95% of asset traffic spikes",
              "Built-in DDoS mitigation and edge SSL termination",
            ],
            sacrifices: [
              "Cache invalidation complexity (stale CSS/JS/images requiring content-hashing)",
              "Cache-miss penalty adds 1 extra round-trip to origin on initial fetch",
              "High egress bandwidth bill if hit-rates plummet or large media is poorly cached",
            ],
          },
          failureModes: "Edge network configuration drift, widespread BGP routing hijacking, or massive cache stampede when all edge PoPs simultaneously expire a hot asset.",
          alternatives: [
            "Multi-region origin server deployments (cost-prohibitive for static file distribution)",
            "Browser HTTP caching via Cache-Control headers alone (no geo-routing or DDoS shield)",
          ],
          interviewSignal: "Strong candidates differentiate cacheable static content from dynamic edge computation, mention cache-busting hashing strategies, and calculate bandwidth egress cost savings.",
          realSystem: "Netflix serves 100% of video streaming bytes via Open Connect CDN appliances colocated inside ISP datacenters worldwide.",
        },
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
        dimensions: {
          problem: "Clients must discover, authenticate, and call dozens of internal microservices individually across changing internal IP addresses and protocols.",
          whyItHappens: "Service decomposition splits a monolith into multiple bounded contexts with different auth tokens, rate limits, and network ports.",
          primitiveSolution: "Expose every microservice directly to the public internet, requiring each client to orchestrate calls and each service to implement auth and TLS.",
          scaleLimit: "Security nightmare (huge public attack surface), massive network chatter on mobile networks (N network calls per screen), and zero centralized observability.",
          component: "API Gateway (Kong, Envoy, AWS API Gateway, Zuul) providing a single reverse-proxy entrypoint with cross-cutting plugins.",
          tradeOffs: {
            gains: [
              "Centralized authentication, rate limiting, SSL termination, and request telemetry",
              "Protocol translation (e.g. public HTTPS/JSON to internal high-performance gRPC)",
              "Request aggregation (combining multiple backend calls into one client payload)",
            ],
            sacrifices: [
              "Creates a centralized bottleneck and single point of failure in the ingress architecture",
              "Can become a dumping ground for business logic ('fat gateway' anti-pattern)",
              "Introduces an additional latency hop (2-10ms depending on plugin pipeline)",
            ],
          },
          failureModes: "Gateway CPU exhaustion due to unbounded JSON parsing or misconfigured Lua/WASM plugins, causing all ingress traffic for the entire company to fail with 504 Gateway Timeout.",
          alternatives: [
            "BFF (Backend-for-Frontend) per client platform (web, mobile, third-party)",
            "Direct ingress via Envoy service mesh ingress router",
            "Monolithic reverse proxy with simple path routing (Nginx)",
          ],
          interviewSignal: "Interviewers look for candidates who keep the gateway thin (auth, rate limiting, routing) and avoid putting domain business logic or DB queries into the gateway layer.",
          realSystem: "Netflix Zuul handles 2+ trillion daily API calls, doing dynamic routing, token validation, and canary traffic shaping at edge ingress.",
        },
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
        dimensions: {
          problem: "A rapidly growing application needs to choose a persistent data storage paradigm that balances complex relational integrity with unbounded horizontal write throughput.",
          whyItHappens: "Relational constraints (ACID, foreign keys, multi-table joins) conflict mathematically with distributed partition tolerance (CAP theorem).",
          primitiveSolution: "Default to a single relational database (PostgreSQL/MySQL) for every data type regardless of access patterns or volume.",
          scaleLimit: "Relational databases struggle to scale writes beyond single-server I/O limits, and complex cross-table joins grind to a halt under terabyte-scale datasets.",
          component: "Polyglot Persistence (relational SQL like PostgreSQL for transactional financial ledger alongside distributed NoSQL like DynamoDB/Cassandra for high-velocity telemetry/feeds).",
          tradeOffs: {
            gains: [
              "SQL provides ACID guarantees, flexible ad-hoc querying, and strict schema validation",
              "NoSQL provides predictable single-digit millisecond latency and horizontal partitioning to petabytes",
            ],
            sacrifices: [
              "SQL requires complex manual sharding to scale writes horizontally",
              "NoSQL sacrifices ad-hoc joins and multi-record transactions, forcing denormalization and client-side joins",
            ],
          },
          failureModes: "Running unindexed full-table joins in SQL locking database connections; choosing an improper partition key in NoSQL causing hot partition throttling.",
          alternatives: [
            "NewSQL distributed relational engines (CockroachDB, Google Spanner) offering distributed ACID at higher hardware cost",
            "Document stores (MongoDB) for semi-structured dynamic schemas",
          ],
          interviewSignal: "Never declare SQL or NoSQL as universally superior. Ground the choice in access patterns: known primary-key lookups vs ad-hoc multi-table reporting queries.",
          realSystem: "Uber uses PostgreSQL for schemas requiring strict relational constraints while running Schemaless (built on MySQL) and Cassandra for high-throughput trip telematics.",
        },
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
        dimensions: {
          problem: "A monolithic database exceeds disk capacity, IOPS limits, and memory buffer pool size on the largest available cloud instance.",
          whyItHappens: "Data volume and write traffic grow exponentially beyond the physical limits of single-node storage and memory architectures.",
          primitiveSolution: "Scale the database instance vertically to the largest available instance or run periodic batch archival scripts deleting historical data.",
          scaleLimit: "Vertical limits are reached (e.g. AWS RDS 64TB / 256GB RAM limit), and vacuuming/indexing multi-billion row tables degrades read and write latencies.",
          component: "Database Sharding (horizontal range-based, hash-based, or directory-based partitioning across independent database nodes).",
          tradeOffs: {
            gains: [
              "Unbounded horizontal write throughput and storage capacity linearly proportional to shard count",
              "Isolates hardware failure to a subset (1/N) of total user data",
            ],
            sacrifices: [
              "Cross-shard joins and distributed transactions (two-phase commit) are prohibitively slow and complex",
              "Re-sharding when changing partition keys or adding shards is an operationally hazardous live migration",
              "Hot shard skew if the partition key is unevenly distributed (e.g. celebrity user problem)",
            ],
          },
          failureModes: "A single hot shard exhausts CPU/IOPS while neighboring shards sit idle, causing localized outages for users hashed to that node.",
          alternatives: [
            "Read replicas (scales read queries only, does not solve write or disk limits)",
            "Distributed NewSQL (CockroachDB/Spanner) handling automatic transparent re-balancing",
            "Time-series table partitioning (PostgreSQL native partitioning)",
          ],
          interviewSignal: "Interviewers listen for the specific choice of shard key: hashing vs range, how to prevent hotspotting, and acknowledging that secondary index lookups require scatter-gather queries.",
          realSystem: "Slack shards MySQL databases by workspace ID; Instagram initially sharded PostgreSQL instances using custom 64-bit ID generation algorithms incorporating shard IDs.",
        },
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
        dimensions: {
          problem: "Read-heavy traffic repeatedly hits the relational database with the same queries, driving DB CPU to 100% and causing connection timeouts.",
          whyItHappens: "Databases read from disk/B-trees with query planning overhead, taking 5-50ms per query, which exhausts database thread pools at thousands of QPS.",
          primitiveSolution: "Increase database connection pool size or rely solely on the database's internal shared buffer pool.",
          scaleLimit: "Database connection limits (e.g. 5,000 connections) are exhausted, memory pressure causes disk thrashing, and database queries fail under spike traffic.",
          component: "Cache-Aside Pattern (Lazy Loading) using an in-memory key-value store (Redis or Memcached).",
          tradeOffs: {
            gains: [
              "Sub-millisecond read latency from RAM memory lookups",
              "Protects the persistent database from 80-99% of read volume",
              "Resilient to cache outages — a cache crash drops performance to DB baseline without data loss",
            ],
            sacrifices: [
              "Cache invalidation difficulty: risk of serving stale data until TTL expires or write-path invalidates",
              "Cache-miss penalty adds latency on first request",
              "Cache stampede risk when popular cached keys expire simultaneously",
            ],
          },
          failureModes: "Cache stampede (thundering herd) where 10,000 concurrent requests miss the same expired key simultaneously, slamming the primary database and knocking it offline.",
          alternatives: [
            "Write-Through / Write-Behind Cache (higher write consistency, higher broker complexity)",
            "Read-Through Cache with automatic population",
            "Application in-memory local caching (Guava/LRU, fast but causes memory divergence across servers)",
          ],
          interviewSignal: "Mention TTL strategies, jitter to prevent synchronized expiration, and lock-based cache stampede prevention (single-flight / mutex on cache miss).",
          realSystem: "Twitter and Reddit cache timelines and user profiles in massive Redis/Memcached clusters fronting their persistent datastores.",
        },
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
        dimensions: {
          problem: "Synchronous HTTP request handlers attempt to execute heavy tasks (video transcoding, email sending, PDF generation), causing client timeouts and server thread exhaustion.",
          whyItHappens: "Synchronous request-response coupling blocks web worker threads until long-running downstream I/O operations complete.",
          primitiveSolution: "Spawn background threads or asynchronous promises inside the active web server process.",
          scaleLimit: "If the web process crashes or restarts during a deployment, in-flight background jobs vanish; traffic spikes cause memory bloat and thread starvation.",
          component: "Message Queue (Point-to-Point Task Queue like RabbitMQ, Amazon SQS, or Redis BullMQ).",
          tradeOffs: {
            gains: [
              "Temporal decoupling: producers return 202 Accepted in 10ms while workers process jobs asynchronously",
              "Peak traffic smoothing: spikes are buffered in the queue rather than dropping requests",
              "Independent elastic autoscaling of consumer worker fleets based on queue depth",
            ],
            sacrifices: [
              "Eventual consistency: clients must poll or use WebSockets/SSE to learn when background work finishes",
              "Message duplication risk requiring idempotent consumer processing",
              "Operational overhead of monitoring queue depth, lag, and dead-letter backlogs",
            ],
          },
          failureModes: "Consumer starvation or slow consumer lag where messages accumulate faster than workers drain them, leading to storage exhaustion or hours-long processing delays.",
          alternatives: [
            "Cron jobs polling a database table (primitive, high polling DB load, high latency)",
            "Distributed log streaming (Kafka) when ordering across millions of events or replay is mandatory",
          ],
          interviewSignal: "Strong candidates emphasize producer-consumer decoupling, at-least-once delivery implications, and why consumer idempotency is mandatory.",
          realSystem: "Shopify buffers flash sale order checkout jobs through message queues; Stripe queues asynchronous webhook deliveries to merchants.",
        },
      },
      {
        slug: "pub-sub",
        term: "Publish/subscribe",
        definition: "Producers broadcast; any number of subscribers receive independently.",
        matters: "Adding a consumer needs no change to the producer, which is what makes event-driven systems extensible.",
        dimensions: {
          problem: "When an event occurs (e.g. user signs up), multiple disparate services (billing, analytics, notification, fraud detection) must react without tight point-to-point coupling.",
          whyItHappens: "Direct HTTP RPC calls from producer to N consumer services create high latency, cascading failures, and tight deployment dependencies.",
          primitiveSolution: "The primary service loops through and synchronously calls HTTP APIs of every interested downstream service.",
          scaleLimit: "If any downstream service is slow or down, the main transaction blocks or fails; adding a new consumer requires editing and redeploying the producer.",
          component: "Publish/Subscribe Event Stream (Kafka, Apache Pulsar, Google Cloud Pub/Sub, AWS SNS).",
          tradeOffs: {
            gains: [
              "Zero coupling: producers emit immutable events without knowing who or how many consumers exist",
              "High-throughput log retention allowing replay of historical data for auditing or new service bootstrapping",
              "Independent consumer group offsets and processing rates",
            ],
            sacrifices: [
              "Eventual consistency across downstream projections and read models",
              "Complex schema evolution requiring strict contracts (Protobuf/Avro with Schema Registry)",
              "Distributed partition coordination and rebalance pauses",
            ],
          },
          failureModes: "Unhandled consumer crashes causing repeated partition rebalancing, halting event consumption across healthy consumers in the group.",
          alternatives: [
            "Point-to-point message queues with fan-out exchanges (RabbitMQ)",
            "Database Change Data Capture (CDC via Debezium) streaming WAL logs",
            "Synchronous HTTP Webhooks (brittle, lacks durable replay)",
          ],
          interviewSignal: "Interviewers listen for the difference between a task queue (competing consumers, message deleted on ACK) and an append-only event stream (Kafka log, persistent offsets, multiple independent consumer groups).",
          realSystem: "LinkedIn processes over 7 trillion messages per day through Apache Kafka for activity feeds, telemetry, and distributed data pipelines.",
        },
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
        dimensions: {
          problem: "A degraded downstream microservice responding slowly (10-30s timeouts) causes upstream services to exhaust thread pools, creating cascading outages across the entire platform.",
          whyItHappens: "Synchronous network calls hold server worker threads and socket connections open waiting for hung dependencies.",
          primitiveSolution: "Rely on client timeouts or simple immediate retry loops.",
          scaleLimit: "Timeouts still tie up threads for the duration of the timeout, and immediate retries amplify traffic against a struggling dependency (the thundering herd effect).",
          component: "Circuit Breaker Pattern (Netflix Hystrix, Resilience4j, Envoy Circuit Breaking) with Closed, Open, and Half-Open states.",
          tradeOffs: {
            gains: [
              "Fails fast in <1ms when a dependency is unhealthy, freeing up upstream threads immediately",
              "Provides breathing room for degraded downstream services to recover without receiving traffic",
              "Enables graceful fallback paths (e.g. serving cached data or degraded default UI)",
            ],
            sacrifices: [
              "Increased application architectural complexity and configuration tuning (failure thresholds, sleep windows)",
              "Risk of false-positive tripping on temporary network blips if threshold is tuned too aggressively",
              "State coordination required across distributed instances or local per-process breaker state",
            ],
          },
          failureModes: "Breaker threshold set too loose (never trips during outage) or fallback mechanism itself throws an exception or calls another failing dependency.",
          alternatives: [
            "Aggressive client timeouts + jittered exponential backoff alone",
            "Bulkhead pattern (isolating thread pools so exhaustion is contained to one dependency)",
            "Rate limiting and adaptive concurrency limits",
          ],
          interviewSignal: "Candidates who explain the 3 states (Closed, Open, Half-Open) and immediately describe a meaningful graceful fallback (e.g. stale cache or partial payload) demonstrate senior production maturity.",
          realSystem: "Amazon retail checkout pages use circuit breakers to degrade recommendation and review widgets if services stall, ensuring the 'Buy Now' button never fails.",
        },
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
        dimensions: {
          problem: "A corrupted or malformed message ('poison pill') repeatedly crashes consumer workers, blocking the entire queue partition and preventing healthy messages from processing.",
          whyItHappens: "Uncaught exceptions (e.g. null pointer, unexpected schema, data bug) trigger infinite consumer retries according to queue redelivery policies.",
          primitiveSolution: "Catch exceptions and silently drop failed messages or log them to an unstructured application log file.",
          scaleLimit: "Silently dropping messages causes silent business data loss (lost payments, missing emails) with zero auditability; retrying endlessly halts the queue.",
          component: "Dead Letter Queue (DLQ / Poison Message Queue) with configurable MaxReceiveCount.",
          tradeOffs: {
            gains: [
              "Unblocks the main queue partition immediately, allowing healthy downstream messages to flow",
              "Preserves failed messages with error metadata, stack traces, and headers for root-cause inspection",
              "Enables automated or manual replay once the underlying bug or downstream dependency is fixed",
            ],
            sacrifices: [
              "Requires operational alerting and backlog monitoring to prevent DLQ from silently overflowing",
              "Messages replayed from DLQ arrive out of order relative to newer messages",
              "Additional cloud queue resources and reprocessing pipeline overhead",
            ],
          },
          failureModes: "DLQ monitoring is unmonitored, allowing thousands of business-critical events to expire and disappear after the DLQ retention period (e.g. 14 days).",
          alternatives: [
            "Retry topics with exponential backoff delays (delayed retry queues before DLQ)",
            "Parking lot pattern with manual inspection UI",
            "Circuit breaker on consumer processing",
          ],
          interviewSignal: "Interviewers want to hear that a DLQ is not a trash can: it requires monitoring, automated alerts, and a safe redrive/replay mechanism once code fixes deploy.",
          realSystem: "Stripe and PayPal route failed payment webhook payloads to dead-letter queues, alerting engineers and automatically replaying messages once merchants fix their endpoints.",
        },
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
        dimensions: {
          problem: "Malicious actors or buggy client loops flood APIs with millions of requests, causing denial of service, resource starvation, and massive cloud bills.",
          whyItHappens: "Public APIs without request admission control allow individual clients to monopolize shared server and database capacity.",
          primitiveSolution: "IP-based firewall rules blocking suspicious traffic manually or basic Nginx connection limits.",
          scaleLimit: "Manual blocking is too slow during automated attacks; IP blocking breaks corporate proxies where thousands of legitimate users share one egress IP; no tier-based business quotas.",
          component: "Distributed Rate Limiter (Token Bucket / Sliding Window Counter in Redis / Envoy).",
          tradeOffs: {
            gains: [
              "Protects downstream infrastructure from capacity collapse and noisy neighbor starvation",
              "Enables tiered API monetization (e.g. Free: 60 req/min, Pro: 10,000 req/min)",
              "Returns standard HTTP 429 Too Many Requests with Retry-After headers",
            ],
            sacrifices: [
              "Introduces a fast centralized lookup hop (1-2ms to Redis) on every inbound request",
              "Race conditions in high-concurrency counter increments unless atomic Lua scripts are used",
              "Risk of false positive rejections for legitimate bursts of user activity",
            ],
          },
          failureModes: "Centralized rate limiter store (Redis) crashes or latency spikes, either blocking all incoming traffic (fail-closed) or allowing traffic floods to swamp the backend (fail-open).",
          alternatives: [
            "Client-side request throttling and token bucket smoothing",
            "WAF (Web Application Firewall) Layer 7 DDoS mitigation rules (Cloudflare)",
            "Adaptive Concurrency Limiting based on service latency",
          ],
          interviewSignal: "Strong candidates compare algorithms (Token Bucket vs Leaky Bucket vs Sliding Window Counter), address fail-open vs fail-closed strategy, and specify HTTP 429 response headers.",
          realSystem: "GitHub, Stripe, and Twitter enforce strict sliding window rate limits on API keys, returning X-RateLimit-Remaining and Retry-After headers.",
        },
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
        dimensions: {
          problem: "Read query volume (SELECT statements) overwhelms the primary database, driving CPU and IOPS to saturation and causing transactional write operations to stall.",
          whyItHappens: "Most web applications exhibit heavily skewed read-to-write ratios (e.g. 99:1 reads on social feeds, blogs, e-commerce listings).",
          primitiveSolution: "Route all read and write queries directly to the single primary database instance.",
          scaleLimit: "Database CPU reaches 100%, read locks block write locks, and the database begins refusing new connections.",
          component: "Asynchronous Read Replicas (Primary-Replica Replication via PostgreSQL WAL streaming or MySQL binlog).",
          tradeOffs: {
            gains: [
              "Scales read query capacity linearly by adding replica nodes across multiple availability zones",
              "Shields primary instance write capacity for transactional operations",
              "Replicas can serve as standby promotion targets in high-availability failover",
            ],
            sacrifices: [
              "Replication lag: asynchronous propagation means reads from a replica can return stale data",
              "Read-your-own-writes inconsistency (user posts a comment, refreshes, but does not see it yet)",
              "Increased cloud infrastructure costs and connection pool management complexity",
            ],
          },
          failureModes: "Replication lag spikes (seconds or minutes) during heavy write bursts or network partitions, serving severely outdated data or failing health checks.",
          alternatives: [
            "In-memory caching (Redis) mitigating read volume before it reaches SQL",
            "Horizontal database sharding (solves both write and read limits)",
            "Multi-primary replication (complex conflict resolution)",
          ],
          interviewSignal: "The key differentiator in interviews is explaining how to handle replication lag: routing read-your-own-writes back to the primary for 5-10 seconds after a user write.",
          realSystem: "Reddit, GitHub, and Shopify route read queries to fleets of MySQL/PostgreSQL read replicas while reserving primary instances for writes.",
        },
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
