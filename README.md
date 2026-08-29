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

The arrows are **recommendations, not gates**. Nothing on the platform is locked — a senior engineer skips straight to the problems, a beginner gets a path. See [§6.6](docs/getcracked-prd.md).

---

## Status

Early. Phase 0 of [the plan](tasks/plan.md) — foundations, not features.

| | State |
|---|---|
| App skeleton, CI, test tooling | ✅ Done (T0.1) |
| Code execution + trace capture | ✅ Spike proven (T0.2) — [findings](docs/spikes/runtime-python-js.md) |
| Database schema and migrations | ✅ Done (T0.3) |
| Auth for account-scoped data | ⬜ Next (T0.4) |
| Design system | ⬜ T0.7 |
| Lessons, problems, animation, roadmaps | ⬜ Phases 1–5 |

There is no product to use yet. `/runtime` is a throwaway spike page.

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

The decisions that actually determine whether this ships. Full reasoning in [ADR 0001](docs/adr/0001-stack.md).

- **The expensive compute runs in the browser.** Python (Pyodide) and JavaScript (QuickJS-WASM) both execute client-side, so a learner costs the platform essentially nothing to run code for. This is what makes a free, ungated product financially survivable — and it is why sign-in is required only for progress and personalization, never to use the product.
- **Content lives in the repo, not the database.** Lessons, problems, and challenges are typed modules validated in CI. The database holds only user-owned state. An invalid test spec fails the build rather than failing a learner.
- **One test spec compiles to every language.** Hand-maintaining parallel suites means a learner passes in Python and fails in JavaScript on identical logic. One declarative spec, per-language harness generators.
- **Tracing is language-agnostic.** CPython's `sys.settrace` and AST-instrumented QuickJS emit the same event shape, so one renderer consumes either. [Proven in CI](docs/spikes/runtime-python-js.md) — identical algorithms produce identical array-access sequences.
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
├── docs/
│   ├── getcracked-prd.md       #   product spec — the authority on scope
│   ├── adr/                    #   architecture decisions
│   └── spikes/                 #   investigation writeups
├── tasks/
│   ├── plan.md                 #   phased plan, acceptance criteria, risks
│   └── todo.md                 #   working checklist
└── tests/                      # vitest suites
```

---

## Documentation

| Document | What it answers |
|----------|-----------------|
| [PRD](docs/getcracked-prd.md) | What the product is and every feature in scope. The authority — code follows it, not the reverse |
| [ADR 0001](docs/adr/0001-stack.md) | Why this stack, what was rejected, and what is still unresolved |
| [Runtime spike](docs/spikes/runtime-python-js.md) | Whether in-browser execution and tracing actually work, with measurements |
| [Plan](tasks/plan.md) | Phased tasks with acceptance criteria, risks, and open questions |
| [Checklist](tasks/todo.md) | What is done and what is next |

---

## Why GetCracked?

Existing platforms make you choose. LeetCode has volume but no path through it. NeetCode and AlgoExpert have curation but their "animations" are pre-recorded video — nobody is watching *your* code move the data structure. ByteByteGo and Grokking teach System Design as prose, with nothing to run.

Nothing combines runnable distributed-systems labs with an interview-simulation layer on top, and nothing animates the learner's own execution. That gap is the product.

Everything is free. Sign-in exists to keep your progress, not to gate the curriculum.
