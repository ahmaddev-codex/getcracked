import type { LessonInput } from '../../schema';

export const cachingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'caching',
  title: 'Caching',
  summary: 'The cheapest performance win there is, and the easiest way to serve stale data.',
  order: 3,
  track: 'system-design',
  difficulty: 'foundational',

  operations: [
    { name: 'in-process memory read', time: '~100 ns', note: 'Same machine, no network. Nothing else is close.' },
    { name: 'Redis or Memcached hit', time: '0.5-2 ms', note: 'One network round trip on the same network.' },
    { name: 'database query', time: '5-50 ms', note: 'Indexed and warm. Far worse cold, or across a region.' },
    { name: 'cross-region round trip', time: '50-150 ms', note: 'Physics. No amount of tuning removes it.' },
  ],

  variants: [
    { name: 'Cache-aside (lazy)', what: 'The app checks the cache, then the database, then populates. The default, and the one to describe unless asked otherwise.' },
    { name: 'Write-through', what: 'Writes go to cache and database together. Consistent, and slower on every write.' },
    { name: 'Write-behind', what: 'Writes hit the cache and flush later. Fast, and loses data if the cache dies first.' },
    { name: 'Read-through', what: 'The cache itself fetches on a miss, so the app only talks to the cache.' },
    { name: 'CDN / edge cache', what: 'Caching at the network edge, close to users — see its own lesson.' },
  ],

  furtherReading: [
    { label: 'Cache (computing)', url: 'https://en.wikipedia.org/wiki/Cache_(computing)', source: 'Wikipedia' },
    { label: 'Cache replacement policies', url: 'https://en.wikipedia.org/wiki/Cache_replacement_policies', source: 'Wikipedia' },
  ],

  explainer: `Caching keeps a copy of expensive-to-produce data somewhere cheap to reach. It is
usually the highest-leverage change available: the numbers in the table above
differ by four orders of magnitude, and a cache turns the bottom row into the
top one.

The reason it is not free is that a cache is a **second copy of the truth**, and
the moment there are two copies they can disagree. Every hard caching question is
some version of "how wrong are we willing to be, and for how long?"

**Invalidation** is where that question is answered. Three strategies, in
increasing order of difficulty:

- **TTL** — let entries expire after a fixed time. Simple, predictable, and
  bounded staleness. Correct for the large majority of cases.
- **Explicit invalidation** — delete the entry when the underlying data changes.
  Fresher, but every write path now has to remember, and one that forgets is a
  bug you find months later.
- **Versioned keys** — put a version in the key so new data writes to a new key
  and old entries age out on their own. No invalidation logic at all, at the cost
  of holding both copies briefly.

**What not to cache** matters as much: data that must be exactly right at read
time, data cheap to compute anyway, and anything user-specific being stored in a
shared cache — which is how one user is served another user's page.

Finally, know the failure mode. A **cache stampede** is what happens when a
popular key expires and a thousand requests all miss simultaneously and all hit
the database at once. The fixes are to stagger expiry with jitter, or to let one
request repopulate while the others serve the stale value.`,

  whenToUse: {
    reachFor: [
      'Reads vastly outnumber writes and the same data is requested repeatedly.',
      'Producing the value is expensive — a join, an aggregation, an external API call.',
      'Slightly stale data is acceptable, which is true far more often than people admit.',
      'You need to absorb traffic spikes without scaling the database behind it.',
    ],
    insteadOf: [
      { alternative: 'A read replica', why: 'Gives fresh data and scales reads without staleness, at the cost of a full database rather than a key-value store. Prefer a replica when correctness at read time matters; prefer a cache when latency does.' },
      { alternative: 'A database index', why: 'Often the real fix. A query taking 500 ms because it lacks an index does not need a cache in front of it; it needs the index. Cache after optimising, not instead.' },
      { alternative: 'Materialised views', why: 'Precomputed in the database itself, so there is no second system and no invalidation code. Slower to update, and the right answer for expensive aggregations that change rarely.' },
    ],
  },

  patternCues: [
    'The same expensive result is requested many times.',
    'A read-heavy workload with a clear hot set — the top posts, the popular products.',
    'The interviewer asks how to reduce database load or tail latency.',
    'Data has a natural freshness tolerance measured in seconds or minutes.',
  ],

  pitfalls: [
    { title: 'No invalidation strategy at all', body: 'A cache with no TTL and no invalidation serves the first value it ever saw, forever. Decide the staleness budget before adding the cache.' },
    { title: 'Caching user-specific data in a shared key', body: 'The classic security incident: one user is served another user\'s page. Scope the key by user, or do not cache it.' },
    { title: 'Cache stampede on expiry', body: 'A thousand simultaneous misses on a hot key can take down the database the cache was protecting. Add jitter to TTLs, or serve stale while one request refreshes.' },
    { title: 'Treating the cache as durable', body: 'It is not a database. The system must work, slower, with the cache entirely empty — that is what happens after every restart.' },
  ],

  recommendedAfter: ['scaling'],
};
