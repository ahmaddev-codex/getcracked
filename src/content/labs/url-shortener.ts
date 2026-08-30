import type { ScenarioLabInput } from '../schema';

/**
 * The first authored lab. Its shape is the template later ones follow, so it is
 * deliberately complete rather than minimal.
 *
 * A URL shortener is the standard opener for a reason: it is small enough to
 * hold in your head, and every one of the six rubric dimensions has a real
 * answer in it — including a read/write ratio so lopsided it changes the design,
 * which is the insight the scenario exists to produce.
 */
export const urlShortenerLab: ScenarioLabInput = {
  slug: 'url-shortener',
  title: 'Design a URL shortener',
  summary: 'The classic opener, and the one where the read/write ratio decides everything.',
  difficulty: 'easy',
  topics: ['caching', 'databases', 'consistent-hashing'],

  brief: `> "Design a service like bit.ly. A user gives us a long URL and we hand back a
> short one. Anyone who visits the short one ends up at the original."

That is the whole prompt, and it is deliberately thin — the first thing being
assessed is whether you fill the gaps yourself or start drawing boxes.

Work through it the way an interview goes: agree what you are building, size it,
design the interface, choose where the data lives, decide how it scales, and say
what breaks first. Six questions, and you will get a scorecard at the end
naming which of the six was weakest.

There is no single right architecture here. There are answers you can defend and
answers you cannot, and every option below tells you which it is once you have
committed.`,

  steps: [
    {
      slug: 'requirements',
      kind: 'select',
      dimension: 'requirements',
      multiple: true,
      prompt: 'Which of these belong in the requirements you agree before designing anything?',
      detail: `The prompt gave you two sentences. Before any box is drawn, you have to turn
that into something you can be held to.

Pick everything that genuinely shapes the design. Leave out the things that
sound thorough but change nothing — reciting a long list is a common way to
spend five minutes and learn nothing about the system.`,
      options: [
        {
          label: 'How many URLs are created per day, and how many are visited',
          correct: true,
          reason:
            'The single most load-bearing question here. The whole design turns on the read/write ratio, and until you have asked, every later choice is a guess dressed as a decision.',
        },
        {
          label: 'How long a short link must keep working',
          correct: true,
          reason:
            'Retention decides your storage total and whether you ever delete anything. "Forever" and "90 days" are different systems, and only one of them needs an expiry story.',
        },
        {
          label: 'Whether a given long URL must always produce the same short URL',
          correct: true,
          reason:
            'A genuine fork. Deduplicating means a read before every write and a second index; not deduplicating means the same target can have many short links. Either is defensible, but it must be decided rather than discovered.',
        },
        {
          label: 'Acceptable latency for a redirect',
          correct: true,
          reason:
            'A redirect sits in front of someone else’s page load, so the budget is tight and it is what justifies a cache. Without a number, "we’ll add caching" is a reflex rather than a decision.',
        },
        {
          label: 'Which programming language and web framework the service is written in',
          reason:
            'Not a requirement — an implementation detail, and one that no answer here depends on. Raising it early is the clearest signal that someone is reaching for the familiar instead of the unresolved.',
        },
        {
          label: 'The exact character set used in the short code',
          reason:
            'It matters eventually, but it is an output of the design, not an input: you can only choose the alphabet once you know how many codes you need. Deciding it first is solving the easy part to avoid the hard one.',
        },
        {
          label: 'Whether the company already runs Kubernetes',
          reason:
            'Deployment substrate, not requirement. It constrains how you ship, never what the system has to do, and an interviewer asking about a URL shortener is not asking about your cluster.',
        },
      ],
    },

    {
      slug: 'write-volume',
      kind: 'estimate',
      dimension: 'estimation',
      prompt: 'Roughly how many writes per second does this need to sustain, on average?',
      unit: 'writes per second',
      answer: 38.6,
      tolerance: 3,
      detail: `You agreed the numbers with your interviewer:

- **100 million** new short links created per month
- Links are read far more than they are written
- Traffic is uneven, but you are asked for the **average** first

Give the sustained write rate. Round however you like — this is an
order-of-magnitude question, and saying it out loud roughly right is the skill.`,
      working: `A month is about **2.6 million seconds** (30 × 86,400 ≈ 2,592,000), which is
the one number worth memorising for this kind of question.

100,000,000 ÷ 2,600,000 ≈ **38 writes per second**.

Forty writes a second is a small number, and noticing that is the point of doing
the arithmetic: it rules out most of the scaling machinery people reach for on
the write path, and it is the figure the scaling question below turns on.`,
    },

    {
      slug: 'api',
      kind: 'select',
      dimension: 'api',
      multiple: false,
      prompt: 'Which interface would you propose for the redirect?',
      detail: `Two endpoints: one to create a short link, one to follow it. The creation side
is uncontroversial — a POST that takes a long URL and returns a short one.

The redirect is where the interesting choice is.`,
      options: [
        {
          label: 'GET /{code} returning HTTP 301 Moved Permanently',
          reason:
            'Tempting, and it is what the naive answer reaches for. But 301 is cached by the browser indefinitely, so the second visit never reaches you — which destroys click analytics and makes a link impossible to retarget or disable.',
        },
        {
          label: 'GET /{code} returning HTTP 302 Found',
          correct: true,
          reason:
            'The right default. A temporary redirect keeps every visit coming through you, which is what makes analytics, expiry and revocation possible at all. You pay for it in traffic, and that is exactly the trade the caching question below is about.',
        },
        {
          label: 'GET /api/resolve?code={code} returning the long URL as JSON',
          reason:
            'Works for a programmatic client and is wrong for the actual use case: the short link is pasted into a browser address bar, and a browser wants a redirect, not a JSON body it will render as text.',
        },
        {
          label: 'POST /resolve with the code in the request body',
          reason:
            'A short link has to be a URL somebody can click. A POST cannot be typed into an address bar, which rules it out before any other consideration.',
        },
      ],
    },

    {
      slug: 'data-model',
      kind: 'select',
      dimension: 'data-model',
      multiple: false,
      prompt: 'How would you generate and store the short code?',
      detail: `You need a code that is short, unique, and cheap to look up. At 100M links a
month, a six-character code over 62 characters gives ~57 billion possibilities,
so the space is not the constraint — collisions and coordination are.`,
      options: [
        {
          label: 'Hash the long URL and take the first six characters',
          reason:
            'Deduplicates for free, which is nice, but the birthday problem arrives sooner than intuition suggests — and every collision needs a read, a compare and a retry. You have swapped a coordination problem for a correctness one.',
        },
        {
          label: 'A random six-character code, retried on collision',
          reason:
            'Workable and often the pragmatic answer, but each write costs a uniqueness check, and the retry rate climbs as the space fills. It is the right answer when links must be unguessable; here nothing said they must be.',
        },
        {
          label: 'A monotonic counter, base-62 encoded, with ranges handed out per server',
          correct: true,
          reason:
            'No collisions by construction, so a write is one insert with no read first. Handing each server a block of the counter removes the per-write coordination that a single shared counter would need. The cost is that codes are guessable and leak volume — acceptable unless the requirements said otherwise.',
        },
        {
          label: 'The database’s auto-increment primary key, exposed directly',
          reason:
            'Half right — the counter is the correct idea — but exposing the raw key ties your public URLs to one database’s sequence, which makes sharding or migrating it a breaking change to every link ever issued.',
        },
      ],
    },

    {
      slug: 'scaling',
      kind: 'select',
      dimension: 'scaling',
      multiple: true,
      prompt: 'Given the read/write ratio, which of these earn their place?',
      detail: `You agreed roughly **100:1** reads to writes. That single number should be
doing most of the work in this answer.`,
      options: [
        {
          label: 'A cache in front of the lookup, keyed by short code',
          correct: true,
          reason:
            'The highest-value thing on the list. Reads dominate by two orders of magnitude and the mapping is immutable once created, so a cache hit is always correct — this is the rare case where caching carries no staleness argument.',
        },
        {
          label: 'Read replicas for the database',
          correct: true,
          reason:
            'What catches the reads the cache misses. Replication lag is normally the objection, and here it barely applies: a row is written once and never updated, so a replica can only be missing a brand-new link rather than serving a stale one.',
        },
        {
          label: 'A CDN or edge layer serving the redirect',
          correct: true,
          reason:
            'A redirect is tiny and geographically indifferent, so serving it near the visitor removes most of the latency budget. It is the one change that improves the number the requirements actually pinned.',
        },
        {
          label: 'Sharding the write path across many primaries',
          reason:
            'Roughly 40 writes per second is nowhere near needing this. Sharding a workload this small buys operational complexity and a distributed-transaction story you do not need — and it is the most common way to over-engineer this exact question.',
        },
        {
          label: 'A message queue between the API and the database for writes',
          reason:
            'Adds asynchrony to an operation that must return the short code to the caller immediately. You would be queueing the one thing the user is waiting on, to relieve a write path that is not under pressure.',
        },
      ],
    },

    {
      slug: 'bottleneck',
      kind: 'select',
      dimension: 'bottleneck',
      multiple: false,
      prompt:
        'One link goes viral: a single code takes ten million hits an hour. What gives first?',
      detail: `Everything else is unchanged — the same write rate, the same total traffic
otherwise. One code, enormous read volume.`,
      options: [
        {
          label: 'The database, from the read volume',
          reason:
            'The intuitive answer, and the one the design has already handled: a single hot code is the best possible case for a cache, so those reads never reach the database at all.',
        },
        {
          label: 'Nothing structural — one hot key is the case the cache handles best',
          correct: true,
          reason:
            'Correct, and the point of the question. A single code read ten million times is one cache entry with a ~100% hit rate. What you actually watch is bandwidth and connection count at the edge, which is a capacity problem rather than a design flaw.',
        },
        {
          label: 'The counter that issues short codes',
          reason:
            'The counter is on the *write* path, and nothing about this scenario changes the write rate. Reaching for it is a sign of not having separated the two paths.',
        },
        {
          label: 'The cache, from eviction pressure',
          reason:
            'Backwards: one very hot key is the thing least likely to be evicted, because every eviction policy worth the name keeps what is being read. Pressure would come from many cold keys, which is the opposite scenario.',
        },
      ],
    },
  ],

  takeaway: `The whole design falls out of one number. A 100:1 read/write ratio says the write
path can stay boring — one insert, no coordination beyond a counter range — and
that every interesting decision belongs on the read path: cache it, replicate it,
push it to the edge.

The two mistakes that cost people this question are symmetric. One is drawing the
architecture before asking for the ratio, which produces a design that cannot be
justified. The other is over-building the write path — sharding forty writes a
second — which is easy to spot precisely because the ratio was never used.

If you can say "reads outnumber writes a hundred to one, the mapping never
changes once written, so the read path is cache-and-replicate and the write path
is a counter" out loud, you have answered the question. Everything else is
detail you can be led to.`,
};
