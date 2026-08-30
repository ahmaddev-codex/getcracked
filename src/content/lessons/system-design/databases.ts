import type { LessonInput } from '../../schema';

export const databasesLesson: LessonInput = {
  tier: 'lesson',
  slug: 'databases',
  title: 'SQL and NoSQL',
  summary: 'Pick by access pattern and consistency need, not by which is fashionable.',
  order: 4,
  track: 'system-design',
  difficulty: 'core',

  operations: [
    { name: 'indexed point lookup', time: '1-10 ms', note: 'Broadly the same in either family. The difference is elsewhere.' },
    { name: 'unindexed scan', time: 'O(rows)', note: 'The single most common cause of a slow query, in both.' },
    { name: 'multi-row transaction', time: '5-50 ms', note: 'Native in SQL; limited or absent in many NoSQL stores.' },
    { name: 'join across tables', time: 'varies', note: 'Cheap in SQL, usually unavailable in NoSQL — you denormalise instead.' },
  ],

  concepts: ['sql-vs-nosql', 'indexing', 'normalization', 'n-plus-one', 'busy-database'],

  variants: [
    { name: 'Relational (Postgres, MySQL)', what: 'Rows, schemas, joins, transactions. The correct default until something rules it out.' },
    { name: 'Document (MongoDB, DynamoDB)', what: 'Self-contained documents. Good when a record is read whole and rarely joined.' },
    { name: 'Key-value (Redis, DynamoDB)', what: 'A hash map with durability. Fastest and least expressive.' },
    { name: 'Wide-column (Cassandra, HBase)', what: 'Built for enormous write throughput with a known query pattern.' },
    { name: 'Graph (Neo4j)', what: 'When traversing relationships *is* the workload — many-hop queries a join cannot express well.' },
    { name: 'Time series (InfluxDB, Timescale)', what: 'Append-heavy, time-ordered, queried by range.' },
  ],

  furtherReading: [
    { label: 'ACID', url: 'https://en.wikipedia.org/wiki/ACID', source: 'Wikipedia' },
    { label: 'NoSQL', url: 'https://en.wikipedia.org/wiki/NoSQL', source: 'Wikipedia' },
    { label: 'Database normalization', url: 'https://en.wikipedia.org/wiki/Database_normalization', source: 'Wikipedia' },
  ],

  explainer: `The SQL-versus-NoSQL question is asked as if it were about scale. It is mostly
about **access pattern and consistency requirements**, and getting that framing
right is most of the answer.

**Relational databases** store normalised rows and let you ask questions you did
not anticipate. Joins mean you do not have to know your queries in advance;
transactions mean multi-row changes are atomic; constraints mean the database
refuses to hold invalid data. Modern Postgres handles far more load than most
systems will ever see, and "just use Postgres" is the right answer more often
than the question implies.

**NoSQL** is not one thing. Each family trades a different piece of that away:

- **Document** stores drop joins in exchange for a record you read whole.
- **Key-value** stores drop queries entirely in exchange for speed.
- **Wide-column** stores drop flexible querying in exchange for write throughput
  at a scale relational systems struggle with.
- **Graph** stores are not a compromise at all — they are the right tool when
  relationships are the data.

The honest decision procedure: start relational. Move a specific workload
elsewhere when it has a specific, measured reason — write volume a single primary
cannot absorb, a document shape that fights normalisation, or a traversal that a
join expresses badly.

Two things worth being precise about in an interview. **Denormalisation is a
choice, not a property of NoSQL** — you can denormalise in Postgres and normalise
in Mongo. And **"NoSQL scales better" is imprecise**: it usually means the store
made partitioning easy by removing joins and cross-shard transactions, which is a
trade you can also make deliberately in a relational system.`,

  whenToUse: {
    reachFor: [
      'Relational when data has relationships, when you need transactions, or when future queries are unknown — which is nearly always at the start.',
      'Document when a record is read and written whole and rarely joined to anything.',
      'Key-value for sessions, caches, counters, and anything reached only by primary key.',
      'Wide-column for write volumes in the hundreds of thousands per second with a known query shape.',
      'Graph when the queries are many-hop traversals rather than lookups.',
    ],
    insteadOf: [
      { alternative: 'Reaching for NoSQL to scale', why: 'A relational database with correct indexes, read replicas and a cache handles very large systems. Move a workload out when you can name the specific limit it hit — not in anticipation.' },
      { alternative: 'Using one store for everything', why: 'Polyglot persistence is normal: Postgres for the core data, Redis for sessions, a search index for search. The cost is operational, and it is often worth paying.' },
    ],
  },

  /**
   * C4. The classic interview question, and the one people answer worst — the
   * reflex is to reach for NoSQL to "scale", which the tree makes you argue for
   * rather than assume.
   */
  decisionTree: {
    title: 'Which database?',
    prompt:
      'Answer for a system you are actually designing. Every option says where it leads before you pick it — the follow-up in an interview is always "why not the other one?".',
    root: {
      kind: 'question',
      ask: 'Do the records reference each other in ways you will query across?',
      why: 'This is the first question because it is the one that rules things out. Everything else is a performance argument; this is a correctness one.',
      options: [
        {
          label: 'Yes — orders belong to users, items belong to orders, and I will join them',
          note: 'Relationships are what relational databases are named after.',
          next: {
            kind: 'question',
            ask: 'Does more than one record have to change together, correctly, every time?',
            why: 'Transactions are the thing that is genuinely hard to add later. A store without them pushes the problem into your application, where it becomes your bug.',
            options: [
              {
                label: 'Yes — money moves, or inventory is decremented',
                note: 'This is close to a hard requirement.',
                next: {
                  kind: 'outcome',
                  recommend: 'Relational — Postgres unless something specific rules it out',
                  because:
                    'Joins and transactions are what you asked for, and they are the two things every other option gives up first. A single Postgres instance with correct indexes, read replicas and a cache in front handles systems far larger than most people expect.',
                  caveat:
                    'The limit you will actually hit is write throughput on one primary. Know roughly where that is for your workload before you design around it — and know that sharding is what you do then, not instead.',
                },
              },
              {
                label: 'No — records are updated independently',
                next: {
                  kind: 'outcome',
                  recommend: 'Still relational, and revisit only when you can name the limit',
                  because:
                    'You have joins, which is the expensive thing to give up. Not needing transactions today does not buy anything by moving off — it just means you would not miss them yet.',
                  caveat:
                    '"We might need to scale" is not a limit you have named. Move a workload out when you can say which query, at what volume, is failing.',
                },
              },
            ],
          },
        },
        {
          label: 'No — each record is read and written whole',
          note: 'This is what opens up the non-relational options honestly.',
          next: {
            kind: 'question',
            ask: 'How do you reach a record?',
            why: 'The access pattern is the whole design for a non-relational store. Choosing one before you know it is how people end up with a key-value store they have to scan.',
            options: [
              {
                label: 'Always by a key I already have',
                note: 'Sessions, carts, feature flags, counters.',
                next: {
                  kind: 'outcome',
                  recommend: 'Key-value — Redis if it can be lost, DynamoDB if it cannot',
                  because:
                    'A hash map with durability is exactly the shape of the workload, and it is the fastest thing available precisely because it does nothing else.',
                  caveat:
                    'The moment a second access pattern appears — "list all carts abandoned yesterday" — this store cannot answer it, and you will be scanning. That is the signal to move, not a reason not to start here.',
                },
              },
              {
                label: 'By key, but I also query fields inside the record',
                next: {
                  kind: 'outcome',
                  recommend: 'Document — MongoDB or DynamoDB with secondary indexes',
                  because:
                    'A self-contained record with queryable fields is what a document store is for, and it keeps the whole record in one read.',
                  caveat:
                    'Documents drift. Nothing enforces that last year\u2019s records have this year\u2019s fields, so the schema ends up in your application code whether you wanted it there or not.',
                },
              },
              {
                label: 'By a time range, and writes are relentless and append-only',
                note: 'Metrics, events, sensor readings.',
                next: {
                  kind: 'outcome',
                  recommend: 'Time series — InfluxDB or Timescale',
                  because:
                    'Append-heavy, time-ordered, queried by range is a specific enough shape that a general store wastes most of its work on it — and these compress it by orders of magnitude.',
                  caveat:
                    'Retention is a design decision here, not an afterthought. Data that is never dropped is what turns this from cheap into the largest line on the bill.',
                },
              },
              {
                label: 'By walking relationships many hops deep',
                note: 'Friends-of-friends, dependency chains, fraud rings.',
                next: {
                  kind: 'outcome',
                  recommend: 'Graph — Neo4j, and only if the traversal *is* the workload',
                  because:
                    'A five-hop traversal is five joins in SQL and one query here. When that is the product rather than a report, the difference is not marginal.',
                  caveat:
                    'If you can express it as two or three joins, use the relational database you already run. A second datastore is a permanent operational cost.',
                },
              },
            ],
          },
        },
        {
          label: 'I do not know yet — the product is still moving',
          note: 'The most common honest answer, and it has a real recommendation.',
          next: {
            kind: 'outcome',
            recommend: 'Relational. Unknown future queries is the argument *for* it',
            because:
              'A relational schema lets you ask questions you had not thought of when you wrote it. Every other option requires you to know the access pattern up front, which is exactly what you have just said you do not.',
            caveat:
              'This is a real decision, not a deferral. Say so out loud in an interview — "I would start relational because the query patterns are unsettled" is a stronger answer than a confident wrong one.',
          },
        },
      ],
    },
  },

  patternCues: [
    'The interviewer describes the data model — that is the input to this decision.',
    'The question mentions transactions, money, or inventory, which points hard at relational.',
    'Write volume is stated in the hundreds of thousands per second.',
    'Queries are described as "find everything connected to X within three hops".',
  ],

  pitfalls: [
    { title: 'Choosing by popularity rather than access pattern', body: 'The answer "we would use MongoDB" with no reference to how the data is read is the one interviewers are listening for.' },
    { title: 'Assuming NoSQL means no schema', body: 'It means the schema is enforced in your application instead of the database. It has not gone away; it has moved somewhere with fewer guarantees.' },
    { title: 'Ignoring the index', body: 'Most "the database is slow" stories are a missing index, in either family. Say what you would index and why.' },
    { title: 'Forgetting operational cost', body: 'Every additional store is another thing to back up, monitor, upgrade and be paged for at 3am.' },
  ],

  recommendedAfter: ['scaling'],
};
