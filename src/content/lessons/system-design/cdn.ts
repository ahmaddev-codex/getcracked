import type { LessonInput } from '../../schema';

export const cdnLesson: LessonInput = {
  tier: 'lesson',
  slug: 'cdn',
  title: 'CDNs and Edge Delivery',
  summary: 'Move the bytes closer to the user, because distance is the one thing you cannot optimise.',
  order: 9,
  track: 'system-design',
  difficulty: 'foundational',

  operations: [
    { name: 'edge cache hit', time: '10-50 ms', note: 'Served from a nearby city. Never touches your servers.' },
    { name: 'origin fetch, same region', time: '50-100 ms', note: 'The miss path.' },
    { name: 'origin fetch, cross-continent', time: '150-400 ms', note: 'What the CDN exists to avoid.' },
    { name: 'cache purge propagation', time: 'seconds to minutes', note: 'Global invalidation is not instant. Version your URLs instead.' },
  ],

  concepts: ['cdn'],

  variants: [
    { name: 'Static asset CDN', what: 'Images, CSS, JavaScript, video. The original use, and still the biggest win.' },
    { name: 'Full-page caching', what: 'Whole HTML responses at the edge, for pages that are the same for everyone.' },
    { name: 'Edge compute', what: 'Small functions running at the edge — auth checks, redirects, personalisation.' },
    { name: 'Origin shield', what: 'A middle cache layer so a hundred edge misses become one origin request.' },
  ],

  furtherReading: [
    { label: 'Content delivery network', url: 'https://en.wikipedia.org/wiki/Content_delivery_network', source: 'Wikipedia' },
    { label: 'Cache-Control header', url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control', source: 'MDN' },
  ],

  explainer: `Light takes about 40 ms to cross the Atlantic, and a TCP handshake needs several
round trips before a byte of content moves. No amount of server tuning changes
that. The only fix for distance is to be closer, which is what a CDN is: copies
of your content in hundreds of cities, so the user's request terminates nearby.

The bandwidth saving matters too. A cached asset never reaches your servers at
all, so a traffic spike on a popular image costs you nothing.

The whole system is controlled by **cache headers**, and being precise about them
is what separates a real answer from a vague one:

- \`Cache-Control: public, max-age=31536000, immutable\` — for content-hashed
  assets like \`app.4f2a9.js\`. Cache forever, because the URL changes when the
  content does.
- \`Cache-Control: no-store\` — for anything user-specific. This is the one that
  prevents serving one user's page to another.
- \`stale-while-revalidate\` — serve the cached copy immediately and refresh in
  the background. Excellent for content that should be fast and roughly fresh.

**Versioned URLs beat purging.** A global purge takes seconds to minutes to
propagate and is easy to get wrong. Changing the filename when the content
changes makes invalidation instant and free, because the new URL was never
cached.

The trap worth naming: **caching a personalised page at the edge**. If the
response varies by cookie and the CDN is not told, one user's dashboard is served
to the next visitor. Either mark it \`no-store\`, or vary on the specific header
and accept the hit rate that follows.`,

  whenToUse: {
    reachFor: [
      'Any static asset — images, scripts, stylesheets, fonts, video. There is no argument against it.',
      'A geographically spread audience, where origin distance dominates the latency.',
      'Traffic spikes on public content, which the edge absorbs entirely.',
      'Large downloads, where bandwidth cost at the origin is the real bill.',
    ],
    insteadOf: [
      { alternative: 'An application-level cache', why: 'Redis speeds up producing a response; a CDN removes the request from your infrastructure entirely. They stack — the CDN handles the anonymous majority, the app cache handles the rest.' },
      { alternative: 'More origin servers', why: 'Adds capacity but not proximity. A user in Sydney hitting a Virginia origin waits for the distance no matter how many servers are there.' },
    ],
  },

  patternCues: [
    'The design serves images, video, or a JavaScript bundle.',
    'Users are described as global.',
    'The question involves a traffic spike on public content.',
    'The interviewer asks how to reduce bandwidth cost or page load time.',
  ],

  pitfalls: [
    { title: 'Caching personalised responses', body: 'The highest-severity mistake in this topic: a logged-in page cached at the edge is served to the next visitor. Mark it no-store, or vary correctly.' },
    { title: 'Relying on purge for invalidation', body: 'It is slow, global, and easy to get wrong. Put a content hash in the filename and the problem disappears.' },
    { title: 'Short max-age on immutable assets', body: 'A hashed filename can be cached for a year. Setting an hour throws away most of the benefit for no gain.' },
    { title: 'Forgetting the origin still needs protection', body: 'A cold cache, or a purge, sends every edge to the origin at once. An origin shield or request coalescing is what stops that being an outage.' },
  ],

  recommendedAfter: ['caching'],
};
