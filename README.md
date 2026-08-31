# GetCracked

**Interactive DSA, System Design labs, and company-wise interview prep.**

Not slides, not videos — you write the code, run it against real tests, and watch your own execution animate the data structure. Free, open to everyone, built for the tech community.

```
   LEARN              PRACTICE             BUILD             NAVIGATE
 ┌─────────┐       ┌───────────┐       ┌───────────┐      ┌───────────┐
 │ Lesson  │  ──▶  │  Problem  │  ──▶  │ Challenge │      │  Roadmap  │
 │animated │       │ interview │       │  4–6 step │      │ node graph│
 │walkthru │       │  shaped   │       │  system   │      │ over all  │
 └─────────┘       └───────────┘       └───────────┘      └───────────┘
 /learn/dsa         /problems           /challenges        /roadmaps
```

The arrows are **recommendations, not gates**. Nothing on the platform is locked — a senior engineer skips straight to the problems, a beginner gets a path.

---

## Status

In progress. The core loop works end to end — read a topic, practise it, build the
thing, and watch your own code animate while it runs.

| | State |
|---|---|
| Foundations — app, CI, database, auth, analytics, design system | ✅ |
| Execution in the browser — Python and JavaScript, sandboxed, no server | ✅ |
| **Tier 1** — 31 lessons across data structures, algorithms, and system design | ✅ |
| **Tier 2** — 20 practice problems, grouped by topic | ✅ |
| **Tier 3** — 3 multi-step build challenges over a multi-file workspace | ✅ |
| Animation — 9 structure-shaped renderers driven by real traces | ✅ |
| Roadmaps — three node graphs with per-node progress | ✅ |
| Catalog volume, System Design labs, company question bank, AI assistant | ⬜ |

`/runtime` is a throwaway spike page and is not part of the product.

---

## Quick Start

Requires Node 22+, [pnpm](https://pnpm.io), and Docker.

```bash
pnpm install
cp .env.example .env
pnpm db:setup      # starts services, migrates, seeds — from nothing
pnpm dev
```

Open <http://localhost:3000>.

---

## Local services

`docker-compose.yml` runs local equivalents of the managed services used in production. **Ports are deliberately offset from the defaults** so this stack coexists with other projects rather than fighting them for a port.

| Service | Local | Production | Used by |
|---------|-------|------------|---------|
| Postgres 17 | `5433` | [Neon](https://neon.tech) | Everything — schema in `src/db/schema.ts` |
| Redis | `6380` | [Upstash](https://upstash.com) | Nothing yet — arrives with L9 assistant rate limits |
| Redis HTTP proxy | `8080` | Upstash REST API | Lets `@upstash/redis` run against the same client code locally |

```bash
pnpm services:up      # start, waiting on healthchecks
pnpm services:down    # stop
pnpm services:reset   # destroy volumes, start clean
```

Postgres is pinned to 17 to match Neon's major version. A local/production major mismatch is how a migration passes locally and fails on deploy.

---

## Commands

| What you're doing | Command |
|-------------------|---------|
| Run the app | `pnpm dev` |
| Build for production | `pnpm build` |
| Run the full suite | `pnpm test` |
| Iterate on tests | `pnpm test:watch` |
| Lint and typecheck | `pnpm lint` · `pnpm typecheck` |
| Change the schema | edit `src/db/schema.ts` → `pnpm db:generate` |
| Apply migrations | `pnpm db:migrate` |
| Seed the dev user | `pnpm db:seed` (idempotent) |
| Inspect the database | `pnpm db:studio` |
| Set everything up | `pnpm db:setup` |

---

## Key design choices

The decisions that actually determine whether this ships.

- **The expensive compute runs in the browser.** Python (Pyodide) and JavaScript (QuickJS-WASM) both execute client-side, so a learner costs the platform essentially nothing to run code for. This is what makes a free, ungated product financially survivable — and it is why sign-in is required only for progress and personalization, never to use the product.
- **Content lives in the repo, not the database.** Lessons, problems, and challenges are typed modules validated in CI. The database holds only user-owned state. An invalid test spec fails the build rather than failing a learner.
- **One test spec compiles to every language.** Hand-maintaining parallel suites means a learner passes in Python and fails in JavaScript on identical logic. One declarative spec, per-language harness generators.
- **Tracing is language-agnostic.** CPython's `sys.settrace` and AST-instrumented QuickJS emit the same event shape, so one renderer consumes either. Proven in CI — identical algorithms produce identical array-access sequences.
- **The animation loop stays out of React.** 500 SVG rects is unremarkable; 500 React components reconciling every frame is not.
- **Nothing is locked.** Prerequisites drive recommendations, never access control. Guidance has to earn attention rather than compel it.

---

## Testing

Database tests run against **embedded Postgres (PGlite)**, not the Docker container and not mocks. They exercise the same migrations, constraints, and cascades that run against Neon, but need no running service — so they cannot silently stop running in CI, which is exactly when constraint regressions slip through.

Runtime tests execute real Pyodide and real QuickJS. The cross-language trace equivalence that the whole visualizer depends on is asserted, not assumed.

The Docker Postgres is for running the app. The suite does not need it.

---

## Project structure

```
getcracked/
├── src/
│   ├── app/                    # routes (App Router)
│   │   └── (spike)/runtime/    #   throwaway T0.2 prototype
│   ├── db/                     # schema, client, seed
│   └── lib/runtime/            # execution + trace capture
│       ├── trace.ts            #   language-agnostic event protocol
│       ├── instrument.ts       #   AST instrumentation (JS tracing)
│       ├── javascript.ts       #   QuickJS adapter
│       └── python.ts           #   Pyodide adapter
├── db/migrations/              # generated SQL
└── tests/                      # vitest suites
```

The product spec, the architecture decision record, and the phased plan are kept
outside the repository — they are working documents rather than part of the
codebase, and are git-ignored.

---

## Why GetCracked?

Existing platforms make you choose. LeetCode has volume but no path through it. NeetCode and AlgoExpert have curation but their "animations" are pre-recorded video — nobody is watching *your* code move the data structure. ByteByteGo and Grokking teach System Design as prose, with nothing to run.

Nothing combines runnable distributed-systems labs with an interview-simulation layer on top, and nothing animates the learner's own execution. That gap is the product.

Everything is free right now, and sign-in exists to keep your progress rather
than to gate the curriculum. A paid tier is planned but not yet designed — see
[Pricing](#pricing).

---

## Deploying

**Migrations run as part of the build**, in `prebuild`, so a deployment cannot
serve code against a schema it does not have. That failure is not hypothetical:
before this existed, a deployment pointed at an un-migrated database built green,
passed every check, served every page, and returned a 500 on the first sign-in
with `relation "verifications" does not exist` and nothing to suggest a migration
was missing.

It does **not** run on preview deployments by default. Vercel environment
variables are commonly set for every environment at once, so a build that
migrated whenever a `DATABASE_URL` was present would let any pull-request branch
change production's schema. Set `MIGRATE_PREVIEW=1` on a preview that has a
database of its own.

| Where | Migrates? |
|---|---|
| Vercel, production | yes |
| Vercel, preview | only with `MIGRATE_PREVIEW=1` |
| Local or CI | yes — disposable databases |
| No `DATABASE_URL` | no, and the build still succeeds |

**One caveat, because it is not solved.** Migrations apply before the new code
serves traffic, so the currently-live version briefly runs against the new
schema. Additive changes are fine; destructive ones are not — dropping a column
the old code still selects takes the site down until the deployment finishes.
Removing something safely takes two deploys: stop using it, then drop it.

To check a database by hand:

```bash
DATABASE_URL="<the deployment's database>" pnpm db:verify
```

`db:verify` reads the expected tables from `src/db/schema.ts` rather than a list,
so it cannot drift, and it distinguishes a missing migration from a connection
problem — which are the two things that look identical from a 500.

Two variables have no safe default and will stop the app in production rather
than guess: `BETTER_AUTH_SECRET`, and `BETTER_AUTH_URL`, which must match the
redirect URI registered with each OAuth provider exactly
(`<BETTER_AUTH_URL>/api/auth/callback/google` and `.../github`).

---

## Measurement and privacy

Three things measure this app, and they answer different questions.

| | What it answers | Where it goes |
|---|---|---|
| **First-party events** (`/api/events`) | Which lesson, which hint, which test run — the product funnel | Our own database |
| **Vercel Analytics** | How many people arrive, and from where | Vercel |
| **Vercel Speed Insights** | What the site actually feels like on a real device | Vercel |

Nothing here uses cookies. Signed-in activity is keyed to the account; signed-out
activity is counted against a **random id that resets every month**, never a
fingerprint and never anything derived from the person or their device. Vercel's
two are cookieless as well, deriving a daily-rotating visitor hash server-side.

The disclosure is a product surface rather than a policy page — a banner while
you browse signed out, and a note at the moment you sign up. That is a better
decision and a more fragile one, so `tests/analytics/disclosure.test.tsx` couples
the copy to what the code actually does: the notice cannot claim signed-out
visitors are untracked while the endpoint that tracks them accepts writes.

**All three are blocked by common content blockers**, and that is respected
rather than worked around — no renaming endpoints to slip past a filter list.
The numbers under-report, which is a known cost.

> **Deployment note.** Analytics and Speed Insights need to be enabled per
> project in the Vercel dashboard. Until they are, `/_vercel/insights/*` returns
> 404 and nothing is recorded — the app is unaffected either way.

---

## Pricing

**Free today.** Every lesson, problem, build challenge and lab is open, and every
one of them works without an account. Sign-in adds persistence and
personalization; it has never added access.

**A subscription is planned.** Nothing about its price, packaging, or the line
between free and paid has been decided, so nothing here pretends otherwise. Two
things are settled:

- **Progress will never buy access.** Prerequisites recommend what to do next;
  they do not lock anything, and a paid tier would not change that. "Finish this
  to unlock that" is a model this project rejects on its merits, separately from
  pricing.
- **The reading surfaces stay open.** Public, indexable content is how anyone
  finds this at all. Whatever is eventually metered, walling the lessons off
  would close the channel that brings people to them.

The one feature with a real per-user cost is the AI assistant, which calls a
paid inference API — so if anything is metered first, the economics point there
rather than at the curriculum.
