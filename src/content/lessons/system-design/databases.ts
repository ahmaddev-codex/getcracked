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
