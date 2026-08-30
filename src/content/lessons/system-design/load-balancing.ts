import type { LessonInput } from '../../schema';

export const loadBalancingLesson: LessonInput = {
  tier: 'lesson',
  slug: 'load-balancing',
  title: 'Load Balancing',
  summary: 'One address in front of many machines, and the rules for choosing between them.',
  order: 2,
  track: 'system-design',
  difficulty: 'foundational',

  operations: [
    { name: 'added latency', time: '< 1 ms', note: 'A well-placed L4 balancer is essentially free.' },
    { name: 'health check interval', time: '1-10 s', note: 'The gap between a machine dying and traffic stopping.' },
    { name: 'failover time', time: 'seconds', note: 'Bounded by the health check, not by the failure.' },
    { name: 'connection draining', time: '30-300 s', note: 'How long in-flight requests get to finish during a deploy.' },
  ],

  variants: [
    { name: 'Layer 4 (transport)', what: 'Routes by IP and port without reading the request. Fast, protocol-agnostic, cannot make content-based decisions.' },
    { name: 'Layer 7 (application)', what: 'Reads the HTTP request, so it can route by path, header, or cookie. Slower, far more capable.' },
    { name: 'Round robin', what: 'Each server in turn. Correct when servers and requests are uniform, which they rarely are.' },
    { name: 'Least connections', what: 'Send to whoever is least busy. Handles uneven request costs, which is the common case.' },
    { name: 'Consistent hashing', what: 'Same key to the same server, so caches stay warm — see its own lesson.' },
  ],

  furtherReading: [
    { label: 'Load balancing (computing)', url: 'https://en.wikipedia.org/wiki/Load_balancing_(computing)', source: 'Wikipedia' },
    { label: 'Reverse proxy', url: 'https://en.wikipedia.org/wiki/Reverse_proxy', source: 'Wikipedia' },
  ],

  explainer: `A load balancer is one address in front of many machines. Clients see a single
endpoint; the balancer decides which instance actually serves each request.

It does two jobs, and the second is the one that matters more in practice.

**Distribution** spreads load so no machine is overwhelmed while others idle. The
algorithm choices differ mainly in how much they know: round robin knows nothing
and works when requests are uniform; least-connections knows how busy each server
is and handles the far more common case of uneven request cost; hashing sends the
same key to the same place, which keeps caches warm at the cost of even spread.

**Health checking** removes dead machines from rotation. This is what turns a
crashed server from an outage into a blip. It also sets the floor on your
failover time: a 10-second health check means up to 10 seconds of requests going
into a hole, no matter how fast the machine actually died.

The distinction worth being precise about is **L4 versus L7**. An L4 balancer
routes packets by address and port without reading them — fast, works for any
protocol, and blind to content. An L7 balancer parses the HTTP request, so it can
route \`/api\` to one pool and \`/static\` to another, terminate TLS, retry idempotent
requests, and rate limit. That capability costs CPU and makes it a more
interesting thing to operate.

And the balancer itself is a single point of failure unless you plan otherwise —
which is why real deployments run several behind a DNS record or an anycast
address.`,

  whenToUse: {
    reachFor: [
      'You have more than one application instance — which is the moment you need one.',
      'You want zero-downtime deploys, where traffic drains from old instances as new ones come up.',
      'Requests vary a lot in cost, which is where least-connections beats round robin.',
      'You need TLS termination, path routing, or retries in one place rather than in every service.',
    ],
    insteadOf: [
      { alternative: 'DNS round robin', why: 'Free and requires no infrastructure, but clients cache DNS and it has no health checking — a dead machine keeps receiving traffic until TTLs expire. Fine for coarse geographic distribution, not for failover.' },
      { alternative: 'A service mesh', why: 'Gives per-service load balancing, retries and observability without a central hop, at the cost of substantial operational complexity. Worth it at many services, overkill at three.' },
    ],
  },

  patternCues: [
    'The design has more than one instance of anything.',
    'The question mentions zero-downtime deploys or rolling releases.',
    'Requests need routing by path, region, or tenant.',
    'The interviewer asks what happens when a server dies mid-request.',
  ],

  pitfalls: [
    { title: 'The balancer as a single point of failure', body: 'Putting one box in front of a redundant fleet moves the outage rather than removing it. Run several, fronted by DNS or anycast.' },
    { title: 'Health checks that only prove the process is running', body: 'A server that answers /health but cannot reach the database is worse than a dead one — it fails every real request while looking healthy.' },
    { title: 'No connection draining', body: 'Terminating an instance immediately kills in-flight requests. Drain first, then stop.' },
    { title: 'Sticky sessions by default', body: 'They defeat even distribution and make instance loss user-visible. Use them only when the alternative has been genuinely ruled out.' },
  ],

  recommendedAfter: ['scaling'],
};
