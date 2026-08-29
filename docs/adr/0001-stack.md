# ADR 0001 — Technology Stack

**Status:** Proposed — awaiting human review
**Date:** 2026-08-28
**Context sources:** [docs/getcracked-prd.md](../getcracked-prd.md) (v1.0), [tasks/plan.md](../../tasks/plan.md)
**Supersedes:** nothing. **Constrains:** every task in Phases 0–2.

---

## Context

PRD H8 mandates a single Next.js fullstack application. That constraint is inherited, not chosen — but it is also correct, and this ADR records *why* it is correct, which matters because the reasoning determines where the constraint may legitimately bend (H10) and where it may not.

The decisions below sit *underneath* the framework choice. They are the ones that actually determine whether the platform ships, and several of them resolve hedges left open in `plan.md`.

---

## Decision 1 — Next.js fullstack is the right architecture, for a reason the PRD does not state

The usual argument against a fullstack framework is that the product will outgrow the serverless request model. **This product structurally will not**, because of AD-2: the expensive compute runs in the learner's browser.

Pyodide, the test runner, and trace capture are all client-side. The server's job is authentication, progress reads and writes, content delivery, and proxying Groq. That is a near-zero-CPU-per-request workload — precisely what serverless is good at, and precisely why §2.6's free-forever model is financially survivable at all.

The rest lines up:

- Every route is auth-gated (§2.6), so SEO is irrelevant except for `/` — the usual "we need SSR for crawlers" pressure is absent, and the usual "SSR is wasted on a logged-in app" objection is answered by content-as-code static rendering.
- Content-as-code (AD-1) means most pages are statically renderable at build time.
- AD-5's fail-closed middleware allowlist is a clean single-chokepoint pattern *because* there is one app. Split the frontend and backend and that guarantee has to be re-established on the other side of a network boundary.

**Rejected alternatives.** A Vite SPA plus a separate API would iterate faster on the editor and visualizer and avoid RSC complexity, but it forfeits the single auth chokepoint, the single deploy, and static content rendering — and still needs a backend. Remix/React Router 7 and TanStack Start are comparable on merit with a thinner ecosystem for the specific pieces this product needs.

**The real risk is not Next.js — it is over-applying it.** Roughly 70% of this product is client-interactive. The editor, visualizer, and canvas should be client islands talking to plain route handlers. Do not contort them into Server Actions; Server Actions are for form-shaped mutations, not for a 60fps animation loop or a code runner.

---

## Decision 2 — Hosting: Vercel, with the pipeline as the one carve-out

**Vercel** for the application. The app is genuinely serverless-shaped (Decision 1), and edge middleware, ISR, and preview deploys are all load-bearing for the plan as written.

**H10 is real but does not require a second service.** Modules D and J need crawl and transform work measured in hours; serverless invocations are measured in minutes.

**Use Inngest.** It decomposes one logical multi-hour job into many short function invocations, each a normal Next.js route handler, with durable state carried between steps. This keeps one repo, one deploy pipeline, and one schema — and it delivers retries, concurrency limits, and per-step observability, which is **H6 obtained rather than built**.

This is the honest reading of H8: the constraint is against splitting frontend from backend, not against ever having asynchronous work. H10 already anticipates the deviation; Inngest makes it small enough not to count as one.

**Escape hatch, not day-one work:** if crawl volume outgrows step functions, add a container worker (Railway or Fly) sharing the same repo and Drizzle schema. Do not build this pre-emptively.

**Cost note.** Vercel bills bandwidth and invocations on a product with no revenue (R-5). The all-container alternative — Next.js standalone plus a worker on Railway — is more cost-predictable and collapses H10 entirely, at the price of DX and preview infrastructure. Recommendation is Vercel; revisit if the §8 MAU metrics make bandwidth material.

---

## Decision 3 — Database and ORM: Neon Postgres + Drizzle

`plan.md` T0.3 hedges: `prisma/schema.prisma` (or `drizzle/schema.ts`). **Resolved in favour of Drizzle.**

- No separate query-engine binary, so cold starts and bundle size stay small — which matters on serverless.
- SQL-shaped rather than object-graph-shaped. The F6 analytics work is aggregate queries over an append-only `events` table, and that is the exact workload Prisma's query builder handles least gracefully.
- Migrations are typed and diffable in review.

**Neon** for Postgres: scale-to-zero suits a free product with uneven traffic, and per-preview-deploy database branching is a genuine dev-velocity gain given how much of Phases 1–2 is schema work.

Per AD-1, the database holds only user-owned state — accounts, sessions, progress, submissions, events, roadmap node state, and the Module D question bank. Content stays in the repo.

---

## Decision 4 — Auth: Better Auth (fallback Auth.js v5), and AD-5 needs a correction

**Self-hosted auth, not a per-MAU vendor.** Clerk and WorkOS price per monthly active user. MAU is the metric this product exists to maximise (§8, G4), and §2.6 removes any revenue that would scale alongside it. A pricing model that punishes success is the wrong dependency here.

**Better Auth** — sessions in our own Postgres, first-class Drizzle adapter, no marginal cost per user. **Auth.js v5** is the conservative fallback if Better Auth's maturity proves a problem; the tradeoff is a rockier edge/middleware story.

### AD-5 as written will break on first contact with the edge runtime

`plan.md` AD-5 says "Auth is edge middleware." Taken literally that is not implementable: **the edge runtime cannot open a TCP connection to Postgres**, so middleware cannot validate a database-backed session.

The working pattern splits the check across two layers:

| Layer | Responsibility |
|---|---|
| Edge middleware | Verify the session cookie's **presence and signature** only. No session record lookup. Redirect to `/sign-in?next=…` when absent or malformed. |
| Server component / route handler | The **authoritative** session lookup — record exists, not revoked, not expired — and all authorization. |

This still fails closed and still has one allowlist, so AD-5's actual guarantee survives intact. What changes is that middleware is a cheap fast-path rejection, not the security boundary. **T0.4's acceptance criteria must state which layer asserts what**, or the middleware test will pass while the real check is missing.

---

## Decision 5 — Code execution: QuickJS-WASM for JavaScript, not a native Web Worker

`plan.md` AD-2 specifies "Native, in a locked-down Web Worker" for JavaScript. **Recommend changing this to QuickJS compiled to WASM (`quickjs-emscripten`).**

### The problem with a native Web Worker

**A Web Worker shares your origin.** It has no DOM access, which is what "locked-down" usually means — but it retains `fetch`, and untrusted learner code inside it can call your own API routes with the user's cookies attached. That is a live H2 vulnerability and a direct instance of R-8. Closing it properly requires hosting the worker inside a cross-origin sandboxed iframe (`sandbox="allow-scripts"`, served from a separate origin) and message-passing across two boundaries — real machinery that has to be built and kept correct.

### What QuickJS gives instead

- **No origin, no network, no ambient authority.** The interpreter has only what we explicitly inject. The isolation is structural rather than configured.
- **Deterministic interruption.** QuickJS's interrupt handler kills an infinite loop reliably — a T0.2 acceptance criterion and a T1.3 one, satisfied by the runtime rather than by a watchdog racing a blocked thread.
- **Instrumentable for tracing.** We can observe execution rather than AST-rewriting the learner's source. This removes the JavaScript half of R-2, which `plan.md` rates High.

### The honest cost

This weakens AD-2's stated rationale that the two launch runtimes were "kept deliberately dissimilar" so the adapter abstraction is proven against real variation. Both become WASM-hosted interpreters.

That rationale is the weaker of the two arguments. Sandbox integrity and reliable termination are hard requirements; adapter-shape variation is a design preference, and it is already protected by the stub-adapter conformance criterion in T2.6. QuickJS is also slower than native and does not perfectly match V8 semantics — irrelevant for teaching data structures.

**Python is unchanged:** Pyodide in a Web Worker, `sys.settrace` for tracing.

### Pyodide load cost

Pyodide is several megabytes. Load it only on exercise routes, warm the worker on route prefetch or link hover, and cache aggressively. **T0.2 must record first-load cost separately from warm per-run latency** — they have completely different UX consequences and averaging them hides the one that matters.

---

## Decision 6 — Frontend libraries

| Concern | Choice | Rationale |
|---|---|---|
| Editor (A6) | **CodeMirror 6** | Monaco is ~2MB, hostile to SSR, and poor on mobile (H3). CM6's decoration API is exactly the primitive needed to highlight the line the trace is currently executing — the editor↔visualizer sync that Module B depends on. |
| Canvas (AD-4) | **`@xyflow/react`** (React Flow v12) | MIT-licensed; pan/zoom, node types, and connectors are stock. Confirms the plan's choice. Pro features are not needed. |
| Design system (Module K) | **Tailwind v4 + `@theme` + shadcn/ui** | Tailwind v4's `@theme` directive *is* AD-8's token layer, so "tokens are the only source of visual values" becomes enforceable rather than aspirational. shadcn vendors component source into the repo, so components can be made token-pure. Radix underneath supplies most of the WCAG AA behaviour K targets. |
| Assistant (Module L) | **Vercel AI SDK + `@ai-sdk/groq`** | Streaming and provider abstraction built in. AD-10's "no call site names a model" falls out of the SDK's shape instead of relying on discipline. |
| Rate limiting (L9) | **Upstash Redis** | Works from edge middleware, free tier adequate, serves both the L9 assistant budget and general abuse limits. |
| Testing | **Vitest + Playwright** | Vitest for the AD-3 spec compiler and the trace protocol — pure logic, highest defect value. Playwright for the T0.4 auth gate and the full run→animate loop. |

---

## Decision 7 — The visualizer's animation loop stays out of React

H5 requires 60fps for arrays up to 500 elements. 500 SVG rects is unremarkable; **500 React components reconciling every frame is not.**

React owns the visualizer container, the playback controls, and the step scrubber. The frame loop is imperative — `requestAnimationFrame` interpolating over the trace, mutating DOM or canvas directly, outside React state.

This is a Phase 2 structural decision (T2.8, first renderer), not a Phase 4 optimisation. Building the first renderer in React state and porting the remaining eleven structure types later means writing the renderer layer twice.

---

## Decision 8 — Content-as-code needs a generated index

AD-1 puts several hundred problems in the repo as typed modules. Statically importing them all makes build times painful and risks bundling the entire catalog into a client chunk.

- Generate a content index at build time; `import()` individual exercises by slug at request time.
- Validate every content module against a **Zod** schema in CI. This is the mechanism that makes AD-1 and AD-3 actually enforced rather than merely intended — an invalid test spec fails the build instead of failing a learner.
- The same Zod schemas are Module J's output contract (J8), so the pipeline and hand-authored content validate through one gate.

**Rejected:** a content-layer framework (Velite, Content Collections). Zod-validated TS modules plus one CI script covers the need with no dependency to keep current, and the exercise content is more structured data than prose. MDX still applies to lesson bodies (B11).

---

## Consequences

**Changes required in `tasks/plan.md`:**

1. AD-2 — JavaScript runtime becomes QuickJS-WASM (Decision 5).
2. AD-5 — split the middleware guarantee across the two layers (Decision 4).
3. T0.3 — resolve the Prisma/Drizzle hedge to Drizzle (Decision 3).
4. T0.2 — separate first-load from warm-run latency in the acceptance criteria (Decision 5).
5. T1.3 — the runtime file list and the timeout criterion follow from Decision 5.
6. Phase 3 / R-7 — H10's resolution is Inngest step functions, decided now rather than in Phase 3 (Decision 2).
7. R-8 — the mitigation is structural isolation, not worker configuration (Decision 5).
8. T2.8 — record the out-of-React frame loop as a constraint (Decision 7).

**Open, not decided here:**

- Whether Vercel's bandwidth economics hold once MAU is real (Decision 2) — revisit against §8 metrics, not speculation.
- Better Auth's maturity under production load (Decision 4) — the Auth.js fallback exists precisely because this is unproven for us.
- Whether QuickJS tracing genuinely removes the JavaScript half of R-2 (Decision 5). **T0.2 must confirm this**; if it does not, the AST-instrumentation path returns and R-2 stays High.
