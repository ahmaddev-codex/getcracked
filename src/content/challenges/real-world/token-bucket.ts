import type { ChallengeInput } from '../../schema';

/**
 * Rate limiting, built as the token bucket everyone actually ships.
 *
 * **Time is an argument, not a call to the clock.** Every operation takes `now`
 * rather than reading a system clock, which is the single decision that makes
 * this testable: a limiter that calls `Date.now()` internally can only be tested
 * by sleeping, and a suite that sleeps is a suite nobody runs. It is also how
 * the real thing is written, for exactly the same reason.
 *
 * **The harness changes at step 4, and that is deliberate.** Steps 1–3 drive one
 * bucket; step 4 introduces a limiter holding a bucket per client, so the
 * command vocabulary gains a key. Because the harness is read-only, replacing it
 * discards no learner work — which is the whole reason the carry-forward model
 * distinguishes editable files from scaffolding.
 */

const JS_HARNESS_BUCKET = `const { TokenBucket } = require('./bucket');

/**
 * Replays a sequence of operations against one bucket. Read-only.
 *
 *   ["allow", now]   ->  true if the request is permitted, false if throttled
 *   ["tokens", now]  ->  whole tokens available at that moment
 *
 * \`now\` is seconds since the bucket was created. Nothing here reads a real
 * clock: the tests decide what time it is.
 */
function runOps(capacity, refillPerSecond, ops) {
  const bucket = new TokenBucket(capacity, refillPerSecond);
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'allow') {
      out.push(bucket.allow(op[1]));
    } else if (op[0] === 'tokens') {
      out.push(bucket.tokens(op[1]));
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS_BUCKET = `from bucket import TokenBucket


def run_ops(capacity, refill_per_second, ops):
    """Replay a sequence of operations against one bucket. Read-only.

        ["allow", now]   ->  True if the request is permitted, False if throttled
        ["tokens", now]  ->  whole tokens available at that moment

    \`now\` is seconds since the bucket was created. Nothing here reads a real
    clock: the tests decide what time it is.
    """
    bucket = TokenBucket(capacity, refill_per_second)
    out = []

    for op in ops:
        if op[0] == "allow":
            out.append(bucket.allow(op[1]))
        elif op[0] == "tokens":
            out.append(bucket.tokens(op[1]))
        else:
            raise ValueError("Unknown operation: " + str(op[0]))

    return out
`;

const JS_HARNESS_LIMITER = `const { RateLimiter } = require('./limiter');

/**
 * Replays a sequence of operations against the limiter. Read-only.
 *
 * The vocabulary gained a client key at this step — every request now says who
 * it is from.
 *
 *   ["allow", key, now]  ->  true if permitted, false if throttled
 *   ["clients"]          ->  how many clients the limiter is tracking
 */
function runOps(capacity, refillPerSecond, ops) {
  const limiter = new RateLimiter(capacity, refillPerSecond);
  const out = [];

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i];
    if (op[0] === 'allow') {
      out.push(limiter.allow(op[1], op[2]));
    } else if (op[0] === 'clients') {
      out.push(limiter.clientCount());
    } else {
      throw new Error('Unknown operation: ' + op[0]);
    }
  }

  return out;
}

module.exports = { runOps };
`;

const PY_HARNESS_LIMITER = `from limiter import RateLimiter


def run_ops(capacity, refill_per_second, ops):
    """Replay a sequence of operations against the limiter. Read-only.

    The vocabulary gained a client key at this step - every request now says who
    it is from.

        ["allow", key, now]  ->  True if permitted, False if throttled
        ["clients"]          ->  how many clients the limiter is tracking
    """
    limiter = RateLimiter(capacity, refill_per_second)
    out = []

    for op in ops:
        if op[0] == "allow":
            out.append(limiter.allow(op[1], op[2]))
        elif op[0] == "clients":
            out.append(limiter.client_count())
        else:
            raise ValueError("Unknown operation: " + str(op[0]))

    return out
`;

/** Every version of the bucket is this class with `refill` and `allow` swapped. */
function jsBucket(refill: string, allow: string): string {
  return `class TokenBucket {
  constructor(capacity, refillPerSecond) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    // A new bucket starts full, so a client's first burst is allowed. That is
    // the point of a bucket rather than a fixed window: it tolerates bursts up
    // to \`capacity\` while still bounding the long-run rate.
    this.available = capacity;
    this.lastRefill = 0;
  }

${refill}

${allow}

  tokens(now) {
    this.refill(now);
    // Whole tokens only. Two thirds of a token buys nothing, and reporting
    // 0.67 would invite a caller to believe otherwise.
    return Math.floor(this.available);
  }
}

module.exports = { TokenBucket };
`;
}

function pyBucket(refill: string, allow: string): string {
  return `import math


class TokenBucket:
    def __init__(self, capacity, refill_per_second):
        self.capacity = capacity
        self.refill_per_second = refill_per_second
        # A new bucket starts full, so a client's first burst is allowed. That
        # is the point of a bucket rather than a fixed window: it tolerates
        # bursts up to \`capacity\` while still bounding the long-run rate.
        self.available = capacity
        self.last_refill = 0

${refill}

${allow}

    def tokens(self, now):
        self.refill(now)
        # Whole tokens only. Two thirds of a token buys nothing, and reporting
        # 0.67 would invite a caller to believe otherwise.
        return math.floor(self.available)
`;
}

const JS_REFILL_NONE = `  refill(now) {
    // Nothing yet — the clock arrives in step 2.
  }`;

const JS_REFILL_FLOORING = `  refill(now) {
    const elapsed = now - this.lastRefill;
    if (elapsed <= 0) return;
    this.available = Math.min(
      this.capacity,
      this.available + Math.floor(elapsed * this.refillPerSecond),
    );
    this.lastRefill = now;
  }`;

const JS_REFILL_EXACT = `  refill(now) {
    const elapsed = now - this.lastRefill;
    if (elapsed <= 0) return;
    // Kept as a fraction. Rounding here is what makes a slow bucket refill
    // never at all — see the brief for step 3.
    this.available = Math.min(
      this.capacity,
      this.available + elapsed * this.refillPerSecond,
    );
    this.lastRefill = now;
  }`;

const JS_ALLOW_TODO = `  allow(now) {
    // TODO: bring the bucket up to date, then spend a token if there is one.
    return false;
  }`;

const JS_ALLOW = `  allow(now) {
    this.refill(now);
    if (this.available >= 1) {
      this.available -= 1;
      return true;
    }
    return false;
  }`;

const PY_REFILL_NONE = `    def refill(self, now):
        # Nothing yet - the clock arrives in step 2.
        pass`;

const PY_REFILL_FLOORING = `    def refill(self, now):
        elapsed = now - self.last_refill
        if elapsed <= 0:
            return
        self.available = min(
            self.capacity,
            self.available + math.floor(elapsed * self.refill_per_second),
        )
        self.last_refill = now`;

const PY_REFILL_EXACT = `    def refill(self, now):
        elapsed = now - self.last_refill
        if elapsed <= 0:
            return
        # Kept as a fraction. Rounding here is what makes a slow bucket refill
        # never at all - see the brief for step 3.
        self.available = min(
            self.capacity,
            self.available + elapsed * self.refill_per_second,
        )
        self.last_refill = now`;

const PY_ALLOW_TODO = `    def allow(self, now):
        # TODO: bring the bucket up to date, then spend a token if there is one.
        return False`;

const PY_ALLOW = `    def allow(self, now):
        self.refill(now)
        if self.available >= 1:
            self.available -= 1
            return True
        return False`;

const JS_LIMITER_TODO = `const { TokenBucket } = require('./bucket');

class RateLimiter {
  constructor(capacity, refillPerSecond) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    // One bucket per client key.
    this.buckets = new Map();
  }

  allow(key, now) {
    // TODO: find this client's bucket — creating one if this is the first time
    // you have seen the key — and ask it.
    return false;
  }

  clientCount() {
    return this.buckets.size;
  }
}

module.exports = { RateLimiter };
`;

const JS_LIMITER = `const { TokenBucket } = require('./bucket');

class RateLimiter {
  constructor(capacity, refillPerSecond) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    // One bucket per client key.
    this.buckets = new Map();
  }

  allow(key, now) {
    let bucket = this.buckets.get(key);
    if (!bucket) {
      // A client seen for the first time starts with a full bucket, exactly as
      // if it had been idle since the beginning.
      bucket = new TokenBucket(this.capacity, this.refillPerSecond);
      this.buckets.set(key, bucket);
    }
    return bucket.allow(now);
  }

  clientCount() {
    return this.buckets.size;
  }
}

module.exports = { RateLimiter };
`;

const PY_LIMITER_TODO = `from bucket import TokenBucket


class RateLimiter:
    def __init__(self, capacity, refill_per_second):
        self.capacity = capacity
        self.refill_per_second = refill_per_second
        # One bucket per client key.
        self.buckets = {}

    def allow(self, key, now):
        # TODO: find this client's bucket - creating one if this is the first
        # time you have seen the key - and ask it.
        return False

    def client_count(self):
        return len(self.buckets)
`;

const PY_LIMITER = `from bucket import TokenBucket


class RateLimiter:
    def __init__(self, capacity, refill_per_second):
        self.capacity = capacity
        self.refill_per_second = refill_per_second
        # One bucket per client key.
        self.buckets = {}

    def allow(self, key, now):
        bucket = self.buckets.get(key)
        if bucket is None:
            # A client seen for the first time starts with a full bucket,
            # exactly as if it had been idle since the beginning.
            bucket = TokenBucket(self.capacity, self.refill_per_second)
            self.buckets[key] = bucket
        return bucket.allow(now)

    def client_count(self):
        return len(self.buckets)
`;

export const tokenBucketChallenge: ChallengeInput = {
  tier: 'challenge',
  slug: 'token-bucket',
  title: 'Rate Limiter (Token Bucket)',
  category: 'real-world',
  difficulty: 'medium',
  summary: 'Bound a client to a sustained rate while still tolerating a burst.',
  topics: ['rate-limiting', 'hashing'],
  recommendedAfter: ['rate-limiting'],

  brief: `A rate limiter has to do two things that pull against each other: stop a
client hammering you, and not punish a client for being briefly busy. A fixed
counter per minute fails the second — reset the window at 12:00:00 and a client
can spend its whole minute's budget at 11:59:59 and again a second later, which
is twice the rate you promised.

The **token bucket** solves both with one idea. A bucket holds up to \`capacity\`
tokens and gains \`refillPerSecond\` of them as time passes. Every request spends
one. A client that has been quiet has a full bucket and may burst; a client that
has been busy waits for the drip.

You will build it across four steps:

1. spend a token per request, refuse when empty
2. refill as time passes, never above capacity
3. survive a rate slower than one token per second — the bug that quietly makes
   a limiter refill *never*
4. give every client its own bucket

**Time is passed in, never read.** Every method takes \`now\` in seconds rather
than calling a clock. That is not a testing convenience bolted on — it is how
the real thing is written, because a limiter that reads a clock internally can
only be tested by sleeping.`,

  steps: [
    {
      slug: 'spend-a-token',
      title: 'Spend a token per request',
      brief: `Start with a bucket that never refills.

It begins full — \`capacity\` tokens. Each call to \`allow(now)\` spends one and
returns \`true\`; when there are none left it returns \`false\` and spends nothing.

\`\`\`
capacity 3
allow()  ->  true    allow()  ->  true
allow()  ->  true    allow()  ->  false
\`\`\`

\`refill\` is stubbed out and \`tokens\` is written for you. Every test in this
step happens at \`now = 0\`, so no time passes and the stub costs you nothing —
the clock is step 2.`,
      hints: [
        '`allow` should call `this.refill(now)` first even though it does nothing yet. Wiring it now means step 2 is a change to one method rather than two.',
        'Spending a token is a decrement, but only when there is one to spend. Check before you subtract, or the count goes negative and every later request is refused.',
        '`if (this.available >= 1) { this.available -= 1; return true; } return false;` — the `>= 1` rather than `> 0` matters from step 3, when tokens stop being whole numbers.',
      ],
      entryFile: 'harness',
      focus: 'bucket',
      files: [
        {
          name: 'bucket',
          starterCode: {
            javascript: jsBucket(JS_REFILL_NONE, JS_ALLOW_TODO),
            python: pyBucket(PY_REFILL_NONE, PY_ALLOW_TODO),
          },
          solution: {
            javascript: jsBucket(JS_REFILL_NONE, JS_ALLOW),
            python: pyBucket(PY_REFILL_NONE, PY_ALLOW),
          },
        },
        {
          name: 'harness',
          label: 'harness (read-only)',
          editable: false,
          starterCode: { javascript: JS_HARNESS_BUCKET, python: PY_HARNESS_BUCKET },
        },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'a full bucket allows exactly its capacity',
            args: [
              3,
              1,
              [
                ['allow', 0],
                ['allow', 0],
                ['allow', 0],
                ['allow', 0],
              ],
            ],
            expected: [true, true, true, false],
          },
          {
            name: 'a new bucket reports itself full',
            args: [3, 1, [['tokens', 0]]],
            expected: [3],
          },
          {
            name: 'tokens fall as requests are allowed',
            args: [
              2,
              1,
              [
                ['allow', 0],
                ['tokens', 0],
                ['allow', 0],
                ['tokens', 0],
              ],
            ],
            expected: [true, 1, true, 0],
          },
          {
            name: 'a refused request spends nothing',
            args: [
              1,
              1,
              [
                ['allow', 0],
                ['allow', 0],
                ['allow', 0],
                ['tokens', 0],
              ],
            ],
            expected: [true, false, false, 0],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'refill-with-the-clock',
      title: 'Refill as time passes',
      brief: `Now make \`refill(now)\` earn its name.

Between the last refill and \`now\`, the bucket should gain
\`elapsed × refillPerSecond\` tokens — and never hold more than \`capacity\`,
however long it has been idle. Record the time you refilled to, so the next call
only counts time it has not already counted.

\`\`\`
capacity 2, 1 token/second
t=0   allow -> true   allow -> true   allow -> false
t=1   allow -> true                   allow -> false
\`\`\`

Two things to get right, and both are easy to miss:

- **The cap is what bounds the burst.** A bucket idle for an hour must not wake
  up holding 3600 tokens; that would let one client spend an hour's budget in a
  second, which is the exact failure the fixed-window counter has.
- **Only count time once.** Advancing your bookmark to \`now\` after each refill
  is what stops the same second being credited twice.`,
      hints: [
        'You need to remember *when* you last refilled. The constructor already has a field for it.',
        'Cap with a minimum: the new total is `min(capacity, available + elapsed * rate)`. Adding first and clamping second is simpler to read than deciding how much you are allowed to add.',
        'If `now` is not after your bookmark there is nothing to add — return early rather than adding a negative amount, or a caller asking about the past would drain the bucket.',
      ],
      entryFile: 'harness',
      focus: 'bucket',
      files: [
        {
          name: 'bucket',
          solution: {
            javascript: jsBucket(JS_REFILL_FLOORING, JS_ALLOW),
            python: pyBucket(PY_REFILL_FLOORING, PY_ALLOW),
          },
        },
        { name: 'harness' },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'a second of waiting buys a token',
            args: [
              2,
              1,
              [
                ['allow', 0],
                ['allow', 0],
                ['allow', 0],
                ['allow', 1],
                ['allow', 1],
              ],
            ],
            expected: [true, true, false, true, false],
          },
          {
            name: 'an idle bucket never holds more than capacity',
            args: [
              2,
              1,
              [
                ['allow', 0],
                ['allow', 0],
                ['tokens', 100],
              ],
            ],
            expected: [true, true, 2],
          },
          {
            name: 'a faster rate refills faster',
            args: [
              4,
              2,
              [
                ['allow', 0],
                ['allow', 0],
                ['allow', 0],
                ['allow', 0],
                ['tokens', 1],
              ],
            ],
            expected: [true, true, true, true, 2],
          },
          {
            name: 'asking about the past does not drain the bucket',
            args: [
              2,
              1,
              [
                ['allow', 5],
                ['tokens', 0],
              ],
            ],
            expected: [true, 1],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'slower-than-one-per-second',
      title: 'Survive a rate below one per second',
      brief: `Here is the bug that ships.

Plenty of real limits are slower than one request per second — one upload every
four seconds, thirty API calls a minute. Run your bucket at
\`refillPerSecond = 0.5\` and watch what happens if the refill rounds down: each
call adds \`floor(1 × 0.5) = 0\` tokens and advances the bookmark, so the
remaining half-token is thrown away every single time. The bucket refills
**never**, and the client is throttled forever.

\`\`\`
capacity 2, 0.5 tokens/second
t=0   allow -> true   allow -> true    // empty
t=1   allow -> false                   // half a token is not a token
t=2   allow -> true                    // the halves added up
\`\`\`

The fix is to stop throwing the remainder away: hold the balance as a fraction
and only insist on a whole token at the moment one is spent. \`tokens()\` already
floors for display, which is the right place for rounding — at the boundary,
not in the accounting.`,
      hints: [
        "Nothing is wrong with `allow`. The loss happens in `refill`, at the moment it decides how much to add.",
        'Two operations are fighting: you round the credit down to zero, and then you advance the bookmark past the time that earned it. Removing either one fixes it; removing the rounding is the one that stays correct.',
        '`this.available + elapsed * this.refillPerSecond` — no flooring. `available` becomes a fractional balance, `allow` already asks for `>= 1`, and `tokens()` floors only for reporting.',
      ],
      entryFile: 'harness',
      focus: 'bucket',
      files: [
        {
          name: 'bucket',
          solution: {
            javascript: jsBucket(JS_REFILL_EXACT, JS_ALLOW),
            python: pyBucket(PY_REFILL_EXACT, PY_ALLOW),
          },
        },
        { name: 'harness' },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'a rate below one per second still refills',
            args: [
              2,
              0.5,
              [
                ['allow', 0],
                ['allow', 0],
                ['allow', 1],
                ['allow', 2],
              ],
            ],
            expected: [true, true, false, true],
          },
          {
            name: 'fractions accumulate across repeated polls',
            args: [
              1,
              0.25,
              [
                ['allow', 0],
                ['allow', 1],
                ['allow', 2],
                ['allow', 3],
                ['allow', 4],
              ],
            ],
            expected: [true, false, false, false, true],
          },
          {
            name: 'a partial token is reported as none',
            args: [
              4,
              0.5,
              [
                ['allow', 0],
                ['allow', 0],
                ['allow', 0],
                ['allow', 0],
                ['tokens', 3],
              ],
            ],
            expected: [true, true, true, true, 1],
          },
          {
            name: 'the cap still holds at a fractional rate',
            args: [
              2,
              0.5,
              [
                ['allow', 0],
                ['allow', 0],
                ['tokens', 1000],
              ],
            ],
            expected: [true, true, 2],
            hidden: true,
          },
        ],
      },
    },

    {
      slug: 'a-bucket-per-client',
      title: 'Give every client its own bucket',
      brief: `One bucket limits *everybody together*, which is a global throttle,
not a rate limit. A rate limiter bounds each client separately: one noisy caller
must not be able to throttle everyone else.

This step adds a second file. \`limiter.js\` holds a map from client key to that
client's bucket, and \`allow(key, now)\` finds — or creates — the right one and
asks it.

\`\`\`
capacity 1, 1 token/second
allow("a", 0)  ->  true
allow("a", 0)  ->  false     // a is out
allow("b", 0)  ->  true      // b is untouched
\`\`\`

A client seen for the first time gets a **full** bucket, exactly as if it had
been idle since the beginning. Anything else would penalise a new client for
being new.

> **The part this deliberately leaves out.** Nothing here ever forgets a client,
> so the map grows for as long as the process lives — an unbounded map keyed by
> something an attacker chooses. A real deployment evicts idle buckets, which is
> the same eviction question the [LRU cache](/challenges/lru-cache) build
> answers. Two builds, one problem.`,
      hints: [
        'The map is already in the constructor. The whole step is: look the key up, and if it is missing, put a fresh bucket there before you use it.',
        'Create the bucket with the limiter\'s own `capacity` and `refillPerSecond` — every client gets the same allowance, just its own copy of it.',
        'JavaScript: `let bucket = this.buckets.get(key); if (!bucket) { bucket = new TokenBucket(...); this.buckets.set(key, bucket); } return bucket.allow(now);` Python is the same three lines with `dict.get`.',
      ],
      entryFile: 'harness',
      focus: 'limiter',
      complexity: {
        time: 'O(1) per request',
        space: 'O(clients)',
        note: 'One hash lookup and a constant amount of arithmetic per request — no scan over a window of past requests, which is what a naive sliding-window counter does. The space is the honest cost: one bucket per client key, held forever unless something evicts them.',
      },
      files: [
        {
          name: 'limiter',
          starterCode: { javascript: JS_LIMITER_TODO, python: PY_LIMITER_TODO },
          solution: { javascript: JS_LIMITER, python: PY_LIMITER },
        },
        { name: 'bucket' },
        {
          name: 'harness',
          label: 'harness (read-only)',
          editable: false,
          starterCode: { javascript: JS_HARNESS_LIMITER, python: PY_HARNESS_LIMITER },
        },
      ],
      testSpec: {
        entry: 'runOps',
        entryByLanguage: { python: 'run_ops' },
        cases: [
          {
            name: 'each client gets its own allowance',
            args: [
              1,
              1,
              [
                ['allow', 'a', 0],
                ['allow', 'a', 0],
                ['allow', 'b', 0],
              ],
            ],
            expected: [true, false, true],
          },
          {
            name: 'clients are counted as they appear',
            args: [
              2,
              1,
              [
                ['allow', 'a', 0],
                ['allow', 'b', 0],
                ['allow', 'a', 0],
                ['clients'],
              ],
            ],
            expected: [true, true, true, 2],
          },
          {
            name: 'one client running dry leaves the others alone',
            args: [
              1,
              1,
              [
                ['allow', 'a', 0],
                ['allow', 'a', 0],
                ['allow', 'b', 0],
                ['allow', 'b', 0],
                ['allow', 'a', 1],
              ],
            ],
            expected: [true, false, true, false, true],
          },
          {
            name: 'a returning client keeps the bucket it had',
            args: [
              2,
              1,
              [
                ['allow', 'a', 0],
                ['allow', 'a', 0],
                ['allow', 'a', 0],
                ['clients'],
                ['allow', 'a', 2],
                ['clients'],
              ],
            ],
            expected: [true, true, false, 1, true, 1],
            hidden: true,
          },
        ],
      },
    },
  ],
};
