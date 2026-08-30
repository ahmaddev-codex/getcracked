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

  concepts: ['cache-aside', 'write-through', 'eviction-policy', 'cache-stampede'],

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

  /**
   * C4. The caching question people get wrong is not "which eviction policy" —
   * it is "should this be cached at all", which is why that is the first
   * question rather than a footnote.
   */
  decisionTree: {
    title: 'Should this be cached, and where?',
    prompt:
      'A cache is a correctness risk you take on purpose. This walks the decision the way it is actually made — starting with whether to take it at all.',
    root: {
      kind: 'question',
      ask: 'Is the read expensive enough, and repeated enough, to be worth stale data?',
      why: 'Caching trades freshness for speed. If you are not buying much speed, you are paying the freshness for nothing — and every cache is a second copy of the truth that can disagree with the first.',
      options: [
        {
          label: 'No — it is already fast, or almost never read twice',
          note: 'The most common right answer, and the least popular one.',
          next: {
            kind: 'outcome',
            recommend: 'Do not cache it',
            because:
              'A cache in front of a cheap query adds a failure mode, a staleness window and an eviction policy to reason about, in exchange for microseconds nobody notices. The correct number of caches is not "as many as possible".',
            caveat:
              'Measure before deciding it is cheap. "Fast in development" is one row and no contention, which is not the query you are worried about.',
          },
        },
        {
          label: 'Yes — the same expensive thing is read constantly',
          next: {
            kind: 'question',
            ask: 'Who is the data for?',
            why: 'This decides *where* the cache goes, and it is the question that turns a caching discussion into a design rather than a list of technologies.',
            options: [
              {
                label: 'Everyone — the same bytes for every user',
                note: 'Product images, article bodies, JS bundles.',
                next: {
                  kind: 'outcome',
                  recommend: 'Push it to the edge — a CDN, with a long TTL and versioned URLs',
                  because:
                    'Identical bytes for every user is the one case where the cache can live nearest the user and furthest from you. Nothing you run has to be involved in the request at all.',
                  caveat:
                    'Invalidation at the edge is slow and often partial, which is why versioned URLs matter: change the name rather than trying to un-publish the old one.',
                },
              },
              {
                label: 'One user — their session, their feed, their permissions',
                next: {
                  kind: 'question',
                  ask: 'What happens if a request reads a stale copy?',
                  why: 'This is the question that decides whether the cache can be a convenience or has to be part of the write path.',
                  options: [
                    {
                      label: 'Nothing much — a slightly old feed is fine',
                      next: {
                        kind: 'outcome',
                        recommend: 'Cache-aside in a shared store, with a short TTL',
                        because:
                          'Read from the cache, fall through to the database on a miss, write what you found back. It is the simplest pattern, it survives the cache being empty, and a short TTL bounds how wrong it can be without any invalidation logic.',
                        caveat:
                          'Every miss on a hot key hits the database at once when the entry expires. That is the stampede, and it is what a short TTL makes more likely rather than less.',
                      },
                    },
                    {
                      label: 'Something bad — it decides access, or shows another user’s data',
                      note: 'Permissions, balances, anything authorising a request.',
                      next: {
                        kind: 'outcome',
                        recommend: 'Do not cache the decision. Cache the inputs, and invalidate on write',
                        because:
                          'A stale permission is a security bug with a TTL on it. Caching the underlying data and recomputing the decision keeps the answer current while still avoiding the expensive read.',
                        caveat:
                          'Invalidate-on-write means the write path now fails if the cache is down. Decide up front whether that is a failed write or a stale read — both are defensible, and not choosing is what produces the bug.',
                      },
                    },
                  ],
                },
              },
              {
                label: 'One process — it recomputes the same thing in a loop',
                next: {
                  kind: 'outcome',
                  recommend: 'An in-process cache, bounded by size',
                  because:
                    'No network hop, no serialisation, no second system. For a lookup table or a compiled regex this is the whole answer.',
                  caveat:
                    'Every instance has its own copy, so they will disagree, and the memory is your process\u2019s memory. Bounded means an eviction policy — which is the LRU cache you can build below.',
                },
              },
            ],
          },
        },
      ],
    },
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
