# Implementation Plan: GetCracked

**Source of truth:** [docs/getcracked-prd.md](../docs/getcracked-prd.md) (v1.0, 2026-08-28)
**Stack decisions:** [docs/adr/0001-stack.md](../docs/adr/0001-stack.md) — resolves the library and hosting choices this plan left open
**Plan status:** Draft — awaiting human review
**Planning mode:** read-only analysis; no implementation code written

---

## Overview

GetCracked is a single Next.js fullstack application (PRD H8) delivering three learning surfaces — animated DSA challenges, System Design labs, and a company-tagged interview question bank — plus visual roadmaps over all of it. Every feature is free; every feature requires sign-in (PRD §2.6).

This plan sequences ~117 PRD features (A1–A14, B1–B21, C1–C10, D1–D10, E1–E5, F1–F6, G1–G4, H1–H10, I1–I10, J1–J12, K1–K10, L1–L10) into vertical slices. Phases 0–2 are broken into implementable S/M tasks with acceptance criteria. Phases 3–8 are epic-level and will be decomposed when reached, per the agreed planning depth.

### Critical correction to the PRD's premise

The PRD labels Module A as **existing** ("what already exists on getcracked.vercel.app today"). **This repository contains no application code** — only the PRD. Per the confirmed decision, this is a **greenfield rebuild**: Module A is `planned`, not `existing`, and must be built before any net-new module has anything to attach to.

This inverts the PRD's implied sequencing. The PRD's Section 9 handover instruction to mark Module A items as `existing` in `features.md` should be corrected to `planned` before that file is generated.

---

## Stack at a glance

Resolved in [ADR 0001](../docs/adr/0001-stack.md); repeated here because the tasks below assume it. H8's single-Next.js-app constraint is inherited from the PRD and is correct — the expensive compute runs in the learner's browser (AD-2), so the server does auth, progress I/O, content, and a Groq proxy, which is a near-zero-CPU-per-request workload and the reason §2.6's free-forever model is survivable at all.

| Layer | Choice |
|---|---|
| Framework / hosting | Next.js App Router (TS strict) on Vercel |
| Long-running jobs (H10) | Inngest step functions — same repo, same deploy, so **no H8 deviation** |
| Database / ORM | Neon Postgres + Drizzle |
| Auth | Better Auth, sessions in our own Postgres (fallback: Auth.js v5) |
| Code execution (H1/H2) | Pyodide + QuickJS-WASM, both in Web Workers |
| Editor | CodeMirror 6 |
| Canvas (AD-4) | `@xyflow/react` |
| Design system (K) | Tailwind v4 `@theme` + shadcn/ui + Radix |
| Assistant (L) | Vercel AI SDK + `@ai-sdk/groq`; Upstash Redis for L9 limits |
| Tests | Vitest + Playwright |

**The standing risk is not Next.js, it is over-applying it.** Roughly 70% of this product is client-interactive. The editor, visualizer, and canvas are client islands talking to plain route handlers — Server Actions are for form-shaped mutations, not for a 60fps animation loop or a code runner.

---

## Architecture Decisions

Recorded here because each one constrains multiple downstream tasks. These are proposals for review, not settled facts.

### AD-1 — Content lives in the repo, user state lives in Postgres

Challenge definitions, step briefs, hints, starter code, reference solutions, test specs, and the 129 concept-map entries are **content-as-code** (typed TS/MDX modules, versioned in git, validated in CI). The database stores only user-owned data: accounts, progress, events, submissions, roadmap node states, question-bank records.

*Rationale:* 100 challenges × 4–6 steps × 3 languages is a large authoring surface that benefits from code review, type checking, and CI validation. It also keeps the free tier's infrastructure cost near zero and avoids a CMS dependency. The tradeoff is that content edits require a deploy — acceptable for curriculum content, and the Module D question bank (which genuinely needs runtime writes) is DB-backed instead.

### AD-2 — Language runtimes behind one adapter interface (the H1 keystone)

The launch language set is **Python and JavaScript** (PRD H1, amended). **Java is suspended** — not cancelled — and is first in line to be added back. Both launch runtimes sit behind a single `LanguageRuntime` interface exposing `run(code, testSpec) → TestResult` and `trace(code, input) → TraceEvent[]`.

| Language | Runtime | Risk |
|---|---|---|
| Python | Pyodide (CPython→WASM) in a Web Worker | Low — mature; `sys.settrace` gives tracing for free |
| JavaScript | **QuickJS compiled to WASM** (`quickjs-emscripten`), in a Web Worker | Low — no ambient authority, interruptible, instrumentable |
| ~~Java~~ | *Suspended* — JVM-in-WASM vs. server-side runner unresolved | Deferred; see R-1 |

*Rationale:* Client-side execution costs nothing per run, has no cold start, cannot escape into our infrastructure, and gives the animation engine direct access to execution state. Java was the one language that might not fit this model; suspending it removes the largest unknown from the critical path without giving up on it.

**JavaScript runs in QuickJS, not natively** ([ADR 0001 §5](../docs/adr/0001-stack.md#decision-5--code-execution-quickjs-wasm-for-javascript-not-a-native-web-worker)). A Web Worker shares our origin: it has no DOM, but it keeps `fetch`, so learner code inside it can call our own API routes with the user's cookies. Closing that properly needs a cross-origin sandboxed iframe and a second message boundary. QuickJS has no origin, no network, and no ambient authority — the isolation is structural rather than configured. It also interrupts deterministically, which is what makes the infinite-loop criterion in T0.2 and T1.3 a runtime guarantee instead of a watchdog racing a blocked thread, and it can be instrumented for tracing instead of AST-rewriting the learner's source (halving R-2).

*The cost, stated plainly:* an earlier draft kept the two runtimes deliberately dissimilar — a WASM interpreter against a native runtime — so the adapter abstraction would be proven against real variation rather than assumed. Both are now WASM-hosted interpreters, and that argument is given up. Sandbox integrity and reliable termination are hard requirements; adapter-shape variation is a preference, and it is still protected by T2.6's stub-adapter conformance criterion. A two-language codebase that quietly hardcodes two-language assumptions would make Java's return a rewrite; that criterion exists to prevent exactly that.

### AD-7 — Three content types, one execution engine, one gating rule

The DSA track has three tiers (PRD §7.2.1): **lessons** (`/learn/dsa`), **problems** (`/problems`), and **challenges** (`/challenges`). They are three content *shapes* over one shared execution and animation engine — not three subsystems.

- A **lesson** is prose + an animated reference walkthrough + small guided exercises (B11).
- A **problem** is a single function with a test spec (B15).
- A **challenge** is an ordered sequence of 4–6 problem-shaped steps (the existing model).

So a challenge step and a problem are the same runnable unit with different packaging, and a lesson's guided exercise is a third packaging of it. One `RunnableExercise` type underlies all three; tier is metadata.

**Nothing is locked (PRD §6.6, B14, B16).** Every route is open to every signed-in user. Prerequisites exist in the content model, but they drive a **recommendation engine**, not an authorization check: `recommendations(user, target)` returns what the platform suggests doing first and why, and the UI surfaces that as a nudge. There is no `canAccess`.

Progress is still computed **server-side** (B21) — from real test-run results, never client-reported — but that is a *data-integrity* requirement, because progress feeds roadmap state (I4), study plans (F5), and analytics (F6). It is not access control, and it must not be built as if it were.

*Rationale:* Modelling three tiers as three content systems would triple the editor, runner, progress, and analytics surface for one mechanism wearing three hats. And separating recommendation from authorization keeps the guidance layer free to get smarter — struggle-triggered nudges, dismissal memory, personalized ordering — without any of it touching a security boundary.

### AD-8 — The design system is built before the surfaces that use it

Module K's token layer and core components (K1, K3, K8) land in Phase 0, not as a later restyle. Tokens are the only source of visual values; no component hardcodes a color or spacing step.

**Exact values are sampled from the live reference during implementation** and recorded with the date sampled — not approximated from memory. This plan deliberately does not assert hex codes.

*Rationale:* Retrofitting a design system across a built product is a rewrite of every component. Building it first costs a few days; adding it in Phase 6 costs the whole UI. The node treatment (K3) in particular is the platform's card/button/panel language, not a roadmap-only flourish, so it has to exist before the first card is built.

**One constraint on the reference.** roadmap.sh's repository is explicitly all-rights-reserved — its license forbids reuse of content, images, and files. Verified directly: `github.com/kamranahmedse/developer-roadmap/license`. So Module K reproduces the *design language* as our own implementation and takes none of their assets, wordmark, illustrations, or roadmap content. This is also the worked example the Module J license gate (AD-9) is built around.

### AD-9 — The content pipeline is a product, and its license gate is blocking

The problem catalog is pipeline-sourced (PRD Module J), which makes ingestion a first-class subsystem rather than a one-off script. Its non-negotiable component is the **license classification gate (J3)**: every source is classified before ingestion, an unlicensed source defaults to *Restricted*, and Restricted sources yield only canonicalized substance rewritten in our own words — never their text.

Provenance (J4) is captured for every artifact regardless of bucket, which is what makes a targeted takedown (J6) a single operation instead of an archaeology project.

*Rationale:* "Public on GitHub" and "reusable" are unrelated properties, and the reference site for our own design is the proof — 365k stars, all rights reserved. A pipeline that ingests at scale without classifying at scale will accumulate a liability nobody can unwind later, because nothing recorded where anything came from.

### AD-10 — The assistant is configured, never hardcoded

Module L runs on Groq via the **Vercel AI SDK** (`@ai-sdk/groq`). The model ID, temperature, and system prompts live in configuration (L2); no call site names a model. Rate limits and the L9 budget are enforced with **Upstash Redis**, which works from edge middleware and also serves general abuse limiting.

**This plan does not name the model.** Groq's catalog moves faster than this document will be revised, so the selection happens against Groq's live model list at implementation time (L1), scored on instruction-following and code quality first, then context window, cost, and latency. A model ID written here would be stale before it was used.

*Rationale:* Beyond staleness, config-level model selection is what makes A/B-ing two models and reacting to a deprecation a config change rather than a refactor. The assistant is also the platform's largest recurring variable cost on a free product, so the L9 spend ceiling is part of the first implementation, not a follow-up.

### AD-3 — One declarative test spec compiles to every language

Rather than hand-authoring a test suite per language per exercise, each exercise defines **one** declarative spec — function signature, cases as input/expected pairs, property assertions, edge cases — and per-language harness generators emit the runnable suite.

The catalog this must cover is larger than the PRD's headline numbers suggest: ~34 challenges × 4–6 steps, **plus several hundred tier-2 problems**, plus guided lesson exercises — all × 2 launch languages, and × 3 when Java returns.

This format is also the pipeline's **output contract** (J8): Module J synthesizes test specs, not language-specific suites, so one ingested problem becomes runnable in every language at once. That makes the spec format load-bearing twice over — for authoring and for ingestion.

*Rationale:* Hand-maintained parallel suites drift, and drift means a learner passes in Python and fails in JavaScript on identical logic. At this catalog size the spec format is not a convenience, it is the only thing that makes multi-language viable at all. Escape hatch: an exercise may supply a hand-written suite when the spec cannot express it.

### AD-4 — One canvas primitive serves both the whiteboard and the roadmaps

Module C's diagramming canvas (C1) and Module I's roadmap canvas (I1) are both node-and-connector surfaces with pan/zoom, selection, and detail panels. Build one canvas layer (`@xyflow/react`, React Flow v12 — MIT) with two configurations.

*Rationale:* Roadmaps (Module I) are lower-risk and lower-complexity than System Design labs, so building roadmaps first exercises and hardens the canvas layer before Module C depends on it.

### AD-5 — One allowlist, enforced across two layers

Sign-in gates the entire product (PRD §2.6, A2) — dashboard, challenges, labs, roadmap, question bank, and `/learn`. There is a single explicit public allowlist (`/`, `/sign-in`, `/sign-up`, auth callbacks, static assets), so the default for any new route is *denied*.

**The check is split, because the edge runtime cannot reach Postgres over TCP** and therefore cannot validate a database-backed session ([ADR 0001 §4](../docs/adr/0001-stack.md#decision-4--auth-better-auth-fallback-authjs-v5-and-ad-5-needs-a-correction)):

| Layer | Responsibility |
|---|---|
| Edge middleware | Session cookie **presence and signature** only — no record lookup. Redirects to `/sign-in?next=…` when absent or malformed. |
| Server component / route handler | The **authoritative** lookup: record exists, not revoked, not expired — plus all authorization. |

*Rationale:* An allowlist fails closed. Per-page guards fail open every time someone adds a route and forgets. Splitting the layers preserves that guarantee — middleware is a cheap fast-path rejection, not the security boundary. The failure mode to guard against is a middleware test passing while the real check was never written, which is why T0.4 asserts both layers separately.

*Implementation:* **Better Auth** with sessions in our own Postgres. Per-MAU vendors (Clerk, WorkOS) are rejected: MAU is the metric §8 exists to maximize and §2.6 removes any revenue that scales with it.

### AD-6 — Analytics events are first-class from day one

PRD F6 makes full-funnel tracking the stated justification for mandatory sign-in. A typed `track(event)` helper and an append-only events table land in Phase 0, not retrofitted later.

*Rationale:* Retrofitted analytics produce gaps precisely where the earliest and most interesting behavioral data would have been. Also forces the §2.6 privacy-disclosure question (Open Question 7) to be answered before first sign-up, not after.

---

## Dependency Graph

```
Next.js app skeleton + CI (T0.1)
    │
    ├── DB schema + migrations (T0.3)
    │       ├── Auth hard gate (T0.4) ──────────────┐
    │       └── Analytics event pipeline (T0.5)     │
    │                                               │
    ├── SPIKE: Python + JS runtime & trace (T0.2) ──┤
    │                                               │
    └── Content schema: RunnableExercise +          │
        lesson/problem/challenge tiers (T1.1) ──────┤
                                                    │
                            ┌───────────────────────┘
                            │
                 Problem page + editor + runner (T1.2–T1.4)
                            │  [FIRST WORKING SLICE — one problem, one language]
                            │
        ┌───────────────────┼────────────────────┬─────────────────────┐
        │                   │                    │                     │
   TRACK A             TRACK B              TRACK C                    │
   DSA loop            catalog & IA         languages + animation      │
        │                   │                    │                     │
  Lessons (T2.1)      Dashboard/nav (T2.4)  2nd language (T2.6)        │
        │                   │                    │                     │
  Guided ex. +        Concept map move      Trace protocol (T2.7)      │
  completion (T2.2)   /learn/system-        [B1 core]                  │
        │             design (T2.5)              │                     │
  Problem sets +                            First renderer +           │
  SERVER GATING (T2.3)                      playback (T2.8)            │
        │                                        │                     │
        └───────────────────┬────────────────────┴─────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬────────────────────┐
        │                   │                   │                    │
   Phase 3:           Phase 4:            Phase 5:             Phase 6:
   Animation          Roadmaps (I)        Sys Design           Question Bank
   breadth (B2-B8)    [canvas layer]      Labs (C)             (D)
                            │                   │                    │
                            └───────────────────┴────────────────────┘
                                                │
                                     Phase 7: Mock (E) + Personalization (F)
                                                │
                                     Phase 8: Community (G) + polish
```

**Two structural notes:**

- **Gating (T2.3) is the DSA track's keystone.** Lessons must be completable (T2.2) before problem sets can gate on them, so Track A is strictly sequential internally even though it runs parallel to Tracks B and C.
- Module D (question bank) feeds Module I's company roadmaps (I5), Module C's company rubrics (C8), and problem company-tags (B19), so D lands before those sub-features — but D's *pipeline* is independent of every learning surface and can be parallelized early once the DB schema exists, subject to the H7 legal gate.

## Task List

### Phase 0 — Foundation & Risk Spikes

Highest-risk work first. If T0.2/T0.6 fail, the entire product architecture changes, and that must be known in week one rather than month three.

#### Task 0.1: Next.js app skeleton and CI

**Description:** Initialize the single fullstack Next.js application (App Router, TypeScript, strict mode) with formatting, linting, **Vitest** for unit tests, **Playwright** for end-to-end, and a CI workflow that runs all of it on every push. Establishes the commands every later task's verification step refers to.

**Acceptance criteria:**
- [ ] `pnpm dev` serves an app shell at `/` with no console errors
- [ ] `pnpm build`, `pnpm lint`, `pnpm test`, and `pnpm typecheck` all exit 0
- [ ] CI runs build + lint + typecheck + test on push and blocks merge on failure

**Verification:**
- [ ] Build succeeds: `pnpm build`
- [ ] Tests pass: `pnpm test`
- [ ] Manual check: CI shows green on a trivial PR

**Dependencies:** None
**Files likely touched:** `package.json`, `tsconfig.json`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `.github/workflows/ci.yml`
**Estimated scope:** S

---

#### Task 0.2: SPIKE — Python and JavaScript in-browser execution + trace capture

**Description:** Timeboxed spike (max 2 days) proving the core technical bet: run learner-authored Python (Pyodide) and JavaScript (QuickJS-WASM) in a Web Worker, execute assertions against it, and capture a structured, ordered trace of execution state suitable for driving the Module B visualizer. Output is a throwaway prototype plus a written recommendation, not production code.

**Acceptance criteria:**
- [ ] A hardcoded `two_sum` implementation runs in-browser in both Python and JavaScript and reports pass/fail per assertion
- [ ] Each run emits an ordered `TraceEvent[]` capturing at minimum: line number, named-variable state, and array index reads/writes
- [ ] **First-load cost and warm per-run latency are measured and recorded separately** for both languages — Pyodide is several MB and the two numbers have completely different UX consequences; an average hides the one that matters
- [ ] QuickJS tracing is confirmed to capture the same event shape as `sys.settrace` **without AST-rewriting learner source**. If it cannot, the AST-instrumentation path returns and R-2 stays High — say so explicitly in the writeup
- [ ] Written recommendation covers: chosen approach per language, both latency figures, payload size for a 500-element array trace (PRD H5 cap), and confirmation that an infinite loop is terminated by QuickJS's interrupt handler without hanging the tab

**Verification:**
- [ ] Manual check: prototype page runs both languages and prints the trace
- [ ] Manual check: an infinite-loop submission is killed by a timeout, tab stays responsive
- [ ] Findings written to `docs/spikes/runtime-python-js.md`

**Dependencies:** T0.1
**Files likely touched:** `app/(spike)/runtime/page.tsx`, `lib/runtime/*`, `docs/spikes/runtime-python-js.md`
**Estimated scope:** M — **highest-risk task in the plan**

---

#### Task 0.3: Database schema and migrations

**Description:** Provision **Neon** Postgres and define the initial schema with **Drizzle** ([ADR 0001 §3](../docs/adr/0001-stack.md#decision-3--database-and-orm-neon-postgres--drizzle)) covering accounts/sessions, per-step progress, submissions, and the append-only analytics event log. Content is *not* in the DB (AD-1); only user-owned state. Drizzle over Prisma because F6's analytics are aggregate queries over an append-only table — the workload Prisma's query builder handles least gracefully — and because no query-engine binary keeps serverless cold starts small.

**Acceptance criteria:**
- [ ] Migrations create tables for: `users`, `sessions`, `challenge_progress` (user × challenge × step × language × state), `submissions`, `events`
- [ ] Migrations run cleanly forward from empty, and a seed script creates one test user
- [ ] Typed client is generated and importable from server code with no `any`

**Verification:**
- [ ] Tests pass: migration + seed integration test against a scratch database
- [ ] Manual check: seed script runs twice without error (idempotent)

**Dependencies:** T0.1
**Files likely touched:** `db/schema.ts`, `db/migrations/*`, `drizzle.config.ts`, `lib/db.ts`, `scripts/seed.ts`
**Estimated scope:** M

---

#### Task 0.4: Auth hard gate (A2, §2.6)

**Description:** Sign-in/sign-up with session persistence (**Better Auth**, sessions in our own Postgres), plus the two-layer fail-closed gate of AD-5: edge middleware rejects on a missing or malformed session cookie against an explicit public allowlist, and the server layer performs the authoritative session lookup. Implements the PRD's defining access constraint: everything free, nothing anonymous.

**Acceptance criteria:**
- [ ] A user can sign up, sign out, and sign back in; the session survives a full page reload
- [ ] Requesting any non-allowlisted route while signed out redirects to `/sign-in` with a return URL that is honored after auth
- [ ] The public allowlist is a single named constant, and a test asserts a representative protected route is denied while signed out
- [ ] **Both AD-5 layers are asserted separately:** middleware rejects a request with no cookie, *and* the server layer rejects a syntactically valid cookie whose session record was deleted. A middleware-only test would pass with the real check missing
- [ ] The privacy notice required by PRD Open Question 7 is presented at sign-up (see R-6 — it ships with this task, not after)

**Verification:**
- [ ] Tests pass: middleware test covering signed-out denial, signed-in pass, and return-URL round trip
- [ ] Manual check: sign up → land on dashboard → sign out → direct-navigate to `/dashboard` → redirected

**Dependencies:** T0.3
**Files likely touched:** `middleware.ts`, `lib/auth.ts`, `app/(auth)/sign-in/page.tsx`, `app/(auth)/sign-up/page.tsx`, `tests/middleware.test.ts`
**Estimated scope:** M

---

#### Task 0.5: Analytics event pipeline (F6)

**Description:** A typed `track(event, props)` helper plus a server endpoint that appends to the `events` table, with the small set of events the next phase needs. Lands now so no early behavioral data is lost (AD-6).

**Acceptance criteria:**
- [ ] `track()` is typed against a discriminated union of event names — an unknown event name is a compile error
- [ ] `sign_up`, `sign_in`, and `page_view` are recorded against the user id, with timestamp and route
- [ ] Events fire without blocking navigation, and a failed write never surfaces an error to the user

**Verification:**
- [ ] Tests pass: unit test for the client helper, integration test asserting a row lands
- [ ] Manual check: sign in, then confirm rows in the `events` table

**Dependencies:** T0.3, T0.4
**Files likely touched:** `lib/analytics/events.ts`, `lib/analytics/track.ts`, `app/api/events/route.ts`, `tests/analytics.test.ts`
**Estimated scope:** S

---

#### ~~Task 0.6: SPIKE — Java execution strategy~~ · **Suspended**

Java is deferred per the amended PRD H1. This spike is not cancelled — it is the first task of whatever phase restores Java, and its original scoring criteria (feasibility, licensing, bundle size, cold start, per-run cost, and above all **trace feasibility** for Module B) still stand. Nothing in Phases 0–8 depends on it.

The obligation that survives suspension is architectural, not scheduled: **T2.3's stub-adapter criterion must be met**, or Java's return becomes a rewrite rather than an adapter.

---

#### Task 0.7: Design system foundation (K1, K3, K8, K10)

**Description:** The token layer and the first components, built before any product surface exists (AD-8). Sample exact values from the live reference, define tokens for color/type/spacing/radii/borders/shadows/motion, and implement the signature node treatment plus the handful of components Phase 1 needs.

**Acceptance criteria:**
- [ ] Tokens are defined once and are the only source of visual values; a CI lint fails the build on a hardcoded hex or raw pixel spacing in a component
- [ ] Reference values are **sampled from the live site**, recorded in the token file with the sample date — not approximated
- [ ] The K3 node treatment (rounded rect, solid dark border, hard offset shadow, accent fill) exists as one component and is demonstrably reused as card, button, and panel
- [ ] Light and dark token sets both defined (K9)
- [ ] **Every token pair's contrast ratio is verified against WCAG AA in CI** (K10) — zero failures, checked automatically rather than by eye
- [ ] Components needed by Phase 1 exist: button, card/node, badge, code block, empty state

**Verification:**
- [ ] Tests pass: contrast-ratio test suite over all token pairs; hardcoded-value lint
- [ ] Build succeeds
- [ ] Manual check: a component gallery route renders every component in both themes

**Dependencies:** T0.1
**Files likely touched:** `app/globals.css` (Tailwind v4 `@theme`), `lib/design/tokens.ts`, `components/ui/*`, `app/(dev)/components/page.tsx`, `tests/contrast.test.ts`, `eslint.config.mjs`

**Library note:** Tailwind v4's `@theme` directive *is* the token layer — AD-8's "tokens are the only source of visual values" becomes mechanically enforceable rather than aspirational. shadcn/ui vendors component source into the repo (so components can be made token-pure, unlike an installed library), and Radix underneath supplies most of the WCAG AA behavior K10 targets.
**Estimated scope:** M

---

### ✅ Checkpoint A — Foundation

- [ ] All tests pass; `pnpm build` clean; CI green
- [ ] A user can sign up, sign in, and reach a protected empty dashboard; signed-out access is denied
- [ ] The T0.2 spike document is written, with a **decision recorded** on the Python and JavaScript runtimes
- [ ] Design tokens sampled and recorded; component gallery renders in both themes; **zero WCAG AA contrast failures in CI**
- [ ] **Human review required before proceeding**

---

### Phase 1 — First Vertical Slice: one problem, end to end

The goal is one learner solving one real problem — signed in, code written, tests run, progress saved. A tier-2 **problem** is the thinnest runnable unit (AD-7), so it makes the leanest first slice; lessons and gating arrive in Phase 2 on top of a proven engine. Single language (the T0.2 winner) keeps the slice thin.

#### Task 1.1: Content schema, exercise model, and test-spec format (AD-1, AD-3, AD-7)

**Description:** Define the typed content model: one `RunnableExercise` (signature, starter code per language, reference solution, test spec, hints) plus the three tier wrappers that package it — `Lesson`, `Problem`/`ProblemSet`, and `Challenge`. Define the declarative test spec that compiles to a runnable suite per language. Author one real problem end-to-end to prove the model.

**Acceptance criteria:**
- [ ] `RunnableExercise` is defined once and reused by all three tier wrappers — no tier redefines starter code, hints, or test-spec shape
- [ ] Content is typed and validated at build time; a malformed exercise fails `pnpm build` with a message naming the file and field
- [ ] One problem (`two-sum`, topic `hashing`) is authored with brief, ≥2 progressive hints, starter code, and reference solution
- [ ] The test spec compiles to a runnable suite for the Phase 1 language; the reference solution passes every case and the starter stub fails
- [ ] **Content is loaded through a build-time generated index and `import()`ed by slug, never statically imported en masse** ([ADR 0001 §8](../docs/adr/0001-stack.md#decision-8--content-as-code-needs-a-generated-index)). With several hundred problems ahead (AD-3), static imports make builds slow and risk bundling the whole catalog into a client chunk — the index costs little now and cannot be retrofitted cheaply
- [ ] Validation is **Zod** schemas run in CI, and the same schemas are declared as Module J's output contract (J8), so pipeline-generated and hand-authored content pass through one gate

**Verification:**
- [ ] Tests pass: content validation; reference-passes / starter-fails assertions
- [ ] Build succeeds with the problem registered
- [ ] Manual check: introduce a deliberate schema violation, confirm the build fails with a useful message

**Dependencies:** T0.1, T0.2
**Files likely touched:** `lib/content/{schema,exercise,test-spec,index}.ts`, `scripts/build-content-index.ts`, `content/problems/hashing/two-sum/*`, `tests/content.test.ts`
**Estimated scope:** M

---

#### Task 1.2: Problem page — brief, hints, navigation (A5, A8, A9)

**Description:** The problem route rendering the brief, progressive hint disclosure, and set navigation. Read-only at this stage — no editor yet.

**Acceptance criteria:**
- [ ] `/problems/[topic]/[slug]` renders the brief and the problem's position within its set
- [ ] Hints reveal one at a time, stay revealed on reload, and each reveal fires a tracked event (F6)
- [ ] Unknown topic or problem slugs return a 404, not a crash

**Verification:**
- [ ] Tests pass: route rendering test; hint-disclosure interaction test
- [ ] Manual check: open the problem, reveal both hints, reload, confirm state holds

**Dependencies:** T1.1, T0.4
**Files likely touched:** `app/problems/[topic]/[slug]/page.tsx`, `components/exercise/Hints.tsx`
**Estimated scope:** M

---

#### Task 1.3: Editor + test runner integration (A6, A7, H2)

**Description:** Wire the editor and the Phase 1 runtime into the problem page: edit starter code, trigger "Run Tests" (including ⌘↩), see per-assertion pass/fail with input/expected/actual diffs. Productionizes the T0.2 prototype behind the `LanguageRuntime` interface.

**Acceptance criteria:**
- [ ] Editor (**CodeMirror 6**) loads starter code with syntax highlighting; edits persist across reload within the session
- [ ] "Run Tests" executes in a Web Worker and renders per-case pass/fail with expected-vs-actual on failures
- [ ] An infinite-looping submission is terminated — by QuickJS's interrupt handler for JS, by a worker-level timeout for Pyodide — shows a clear message, and leaves the UI responsive
- [ ] Pyodide loads only on exercise routes and is warmed on route prefetch; first-load and warm-run costs are visible in the dev console
- [ ] Syntax errors and runtime exceptions render as readable messages, not raw stack dumps or a blank panel

**Verification:**
- [ ] Tests pass: runtime adapter unit tests covering pass, fail, exception, and timeout
- [ ] Manual check: paste the reference solution → all pass; break it → targeted failure; `while True: pass` → clean timeout

**Dependencies:** T1.2, T0.2
**Files likely touched:** `components/exercise/{Editor,TestResults}.tsx`, `lib/runtime/{index,python,quickjs,worker}.ts`

**Library note:** CodeMirror 6 over Monaco — Monaco is ~2MB, hostile to SSR, and poor on mobile (H3), and CM6's decoration API is the primitive the T2.8 editor↔visualizer line-sync depends on.
**Estimated scope:** L — **split if it exceeds one session; the seam is editor shell vs. runtime adapter**

---

#### Task 1.4: Progress persistence and resume (A10, F6)

**Description:** Persist solve state and the latest submission server-side so progress and code survive across sessions and devices. Emits the events the analytics layer and, later, the gating rule depend on.

**Acceptance criteria:**
- [ ] Passing every assertion marks the problem solved; state is stored per user × exercise × language
- [ ] The most recent submission is restored on return, on any device
- [ ] `exercise_started`, `test_run` (with outcome), and `exercise_solved` events are recorded
- [ ] Progress is written through one `lib/progress.ts` module — the single place T2.3's gating will later read from

**Verification:**
- [ ] Tests pass: progress-persistence integration test
- [ ] Manual check: solve, sign out, sign in from another browser, confirm progress and code restored

**Dependencies:** T1.3, T0.5
**Files likely touched:** `app/api/progress/route.ts`, `lib/progress.ts`, `tests/progress.test.ts`
**Estimated scope:** M

---

### ✅ Checkpoint B — First working slice

- [ ] All tests pass; build clean; CI green
- [ ] **End-to-end flow works:** sign up → open a problem → reveal a hint → write code → fail → fix → pass → solved → sign out → sign back in elsewhere → progress and code restored
- [ ] Analytics rows exist for every step of that flow
- [ ] Runtime latency matches the T0.2 spike measurements; no regression
- [ ] **Human review required** — last cheap moment to change the content model or runtime architecture

---

### Phase 2 — The DSA loop, the catalog, and the differentiator

Three independent tracks. Track A is the product-critical work (the Learn → gate → Problems loop the PRD's §7.2.1 is built around); Track C is the risk-critical work (the trace protocol). They can run in parallel across workers; Track A is internally sequential.

#### Track A — The DSA learning loop

#### Task 2.1: Learn surface and lesson content model (B9, B10, B14)

**Description:** The `/learn/dsa` surface and the lesson content type: concept explainer, animated walkthrough slot, complexity analysis, pattern-recognition cues, and common pitfalls. Author two lessons on adjacent topics so the sequencing and prerequisite wiring is exercised by real content, not a single case.

**Acceptance criteria:**
- [ ] `/learn/dsa` lists lessons in curriculum order with per-lesson progress state
- [ ] `/learn/dsa/[topic]` renders all five content sections (B10 a–e) from typed content
- [ ] Two lessons are authored (e.g. `hashing`, `two-pointers`), one declaring the other as a prerequisite
- [ ] **Read-ahead works (B14):** any lesson is readable in any order, with no lock on lesson content — asserted by test
- [ ] The animated-walkthrough slot renders a placeholder that T2.8 fills, without blocking this task

**Verification:**
- [ ] Tests pass: content validation; read-ahead-permitted test
- [ ] Manual check: open the second lesson first; it reads fully with no lock

**Dependencies:** T1.1, T0.4
**Files likely touched:** `app/learn/dsa/page.tsx`, `app/learn/dsa/[topic]/page.tsx`, `content/lessons/*`, `components/learn/*`
**Estimated scope:** M (content authoring is the bulk)

---

#### Task 2.2: Guided in-lesson exercises and lesson completion (B11, B12)

**Description:** Embed short single-concept exercises inside a lesson, checked immediately using the Phase 1 runner, and define lesson completion as "all guided exercises pass." This completion state is the input the entire gating rule depends on.

**Acceptance criteria:**
- [ ] A lesson embeds ≥2 guided exercises reusing the `RunnableExercise` model and the T1.3 runner — no second execution path
- [ ] Lesson state resolves to exactly one of `not-started` / `in-progress` / `complete`, computed server-side from exercise results, never client-reported
- [ ] Completing the final guided exercise flips the lesson to `complete` and fires `lesson_completed`
- [ ] Lesson state is exposed by one function that T2.3, roadmap nodes (I4), and analytics all consume

**Verification:**
- [ ] Tests pass: state-transition tests across all three states, including partial completion
- [ ] Manual check: complete one of two exercises → `in-progress`; complete both → `complete`

**Dependencies:** T2.1, T1.4
**Files likely touched:** `components/learn/GuidedExercise.tsx`, `lib/progress/lessons.ts`, `tests/lesson-state.test.ts`
**Estimated scope:** M

---

#### Task 2.3: Problem sets and the recommendation engine (B13, B15, B16, B17, B18, B21)

**Description:** The `/problems` surface, one problem set per topic, and the guidance layer that replaces gating. Prerequisites are content metadata that drive **recommendations**, never access. Every route stays open (AD-7).

**Acceptance criteria:**
- [ ] `/problems` lists sets with progress state; `/problems/[topic]` renders a set ordered warm-up → core → stretch (B17)
- [ ] **Nothing is locked:** any problem is reachable by any signed-in user having completed nothing — asserted by a test that opens a problem whose lesson is untouched and expects success, not a redirect
- [ ] A set whose prerequisite lesson is incomplete shows a dismissible recommendation with a one-click path to that lesson; multi-prerequisite sets list all of them (B16)
- [ ] **Struggle-triggered nudge:** repeated failures or full hint exhaustion surfaces the prerequisite lesson at that moment (B16)
- [ ] **Dismissals are remembered** — a learner who dismisses a topic's recommendation is not asked again for that topic
- [ ] Set mastery (B18) is computed server-side from real test results and adjusts what is recommended next — it unlocks nothing
- [ ] Progress is server-computed and never client-reported (B21), verified by a test that a forged client-side completion claim does not persist

**Verification:**
- [ ] Tests pass: open-access test; recommendation-shown test; dismissal-persistence test; struggle-trigger test; server-authoritative-progress test
- [ ] Manual check: with the lesson untouched, open a problem directly by URL → it opens, with a recommendation banner. Dismiss it, reload → banner stays gone.

**Dependencies:** T2.2
**Files likely touched:** `app/problems/**`, `lib/recommendations.ts`, `lib/progress/sets.ts`, `tests/recommendations.test.ts`
**Estimated scope:** M

---

#### Track B — Catalog and information architecture

#### Task 2.4: Dashboard, tier navigation, and filters (A3, A4)

**Description:** The signed-in dashboard with aggregate progress and top-level navigation across the three tiers (Learn / Problems / Challenges, per PRD §2.1a), plus difficulty and topic filters with URL-persisted state.

**Acceptance criteria:**
- [ ] `/dashboard` shows aggregate progress derived from real progress rows — never hardcoded — and navigation into all three tiers
- [ ] Category routes render their filtered subsets; difficulty and topic filters combine correctly
- [ ] Filter state lives in the URL query string and restores on direct navigation; empty results render an explicit empty state

**Verification:**
- [ ] Tests pass: aggregate-progress calculation; filter combination including the empty case
- [ ] Manual check: solve a problem, return to dashboard, confirm counts moved; copy a filtered URL into a new tab, same view

**Dependencies:** T1.4
**Files likely touched:** `app/dashboard/**`, `components/dashboard/*`, `lib/content/query.ts`
**Estimated scope:** M

---

#### Task 2.5: Concept map at `/learn/system-design` (A14)

**Description:** The 129-entry System Design concept map across its 20 sub-categories, now under the `/learn` hub rather than at `/learn` itself, with a permanent redirect from the old path. Prerequisite for the deep links in Modules C and I.

**Acceptance criteria:**
- [ ] All 129 concepts render grouped by their 20 sub-categories, individually expandable plus expand/collapse-all
- [ ] Each concept has a stable anchor URL that deep-links and auto-expands that entry (needed by C9 and I3)
- [ ] `/learn` serves the hub over both tracks; the old concept-map path 301s to `/learn/system-design`
- [ ] Mobile-responsive (H3)

**Verification:**
- [ ] Tests pass: content validation asserting exactly 129 entries across 20 categories; redirect test
- [ ] Manual check: deep-link to a concept on a narrow viewport; it expands and is readable

**Dependencies:** T1.1, T0.4
**Files likely touched:** `app/learn/page.tsx`, `app/learn/system-design/page.tsx`, `content/concepts/*`, `next.config.ts`
**Estimated scope:** M (content authoring is the bulk)

---

#### Track C — Second language and the animation engine

#### Task 2.6: Second language behind the adapter interface (H1, A6)

**Description:** Land the second launch runtime behind `LanguageRuntime` and add the editor language switcher, with progress tracked per language so switching never destroys work. Java is suspended (AD-2), so this task carries the whole burden of proving the abstraction is real.

**Acceptance criteria:**
- [ ] Both launch languages execute the same exercises correctly: reference solution passes, starter stub fails, in each
- [ ] Switching language swaps starter code and preserves any prior submission for the language being left
- [ ] **The abstraction is proven, not assumed:** a documented stub adapter for a third language is added and passes the conformance suite with **zero changes** to editor, results, progress, or content components — this is the check that keeps Java's eventual return an adapter rather than a rewrite
- [ ] The declarative test spec (AD-3) generates both suites with no hand-written per-language duplication

**Verification:**
- [ ] Tests pass: adapter conformance suite run against both runtimes and the stub
- [ ] Manual check: solve the same problem in each language, switch back and forth, confirm no work lost

**Dependencies:** T1.3
**Files likely touched:** `lib/runtime/javascript.ts`, `lib/content/test-spec-compilers/*`, `components/exercise/LanguageSwitcher.tsx`
**Estimated scope:** M

---

#### Task 2.7: Trace event protocol (B1 core)

**Description:** Formalize the throwaway T0.2 trace into a versioned, language-agnostic protocol: a typed, ordered event stream describing data-structure state transitions, emitted identically regardless of source language. Every animation renderer consumes this contract; it is the foundation of the product's core differentiator.

**Acceptance criteria:**
- [ ] A versioned `TraceEvent` union covers at minimum: variable assignment, array read/write, array swap, pointer/index move, function enter/exit
- [ ] Both launch adapters emit conforming events; identical logic in each produces equivalent event sequences — asserted by test
- [ ] Trace capture respects the H5 cap (arrays ≤ 500) and truncates with an explicit marker rather than dropping events silently
- [ ] Tracing can be disabled per run; a normal test run with tracing off is no slower than before this task

**Verification:**
- [ ] Tests pass: cross-language trace-equivalence test; truncation-boundary test
- [ ] Manual check: run a bubble sort, inspect the event stream for correct swap ordering

**Dependencies:** T2.6
**Files likely touched:** `lib/trace/protocol.ts`, `lib/runtime/trace/*`, `tests/trace-equivalence.test.ts`
**Estimated scope:** L — **the core differentiator; treat as high-risk**

---

#### Task 2.8: First animation renderer + playback controls (B2 arrays, B3, B10b)

**Description:** The first visualizer: render array state from the trace stream with index highlighting, pointer markers, and swap animation, driven by playback controls. Fills the lesson walkthrough slot left by T2.1 and proves the renderer-registry pattern every later structure plugs into.

**Acceptance criteria:**
- [ ] Running a two-pointer or binary-search solution renders a live array visualization of the learner's own execution — not a canned demo
- [ ] Playback supports step forward/back, play/pause, and speed control, staying in sync with a step counter
- [ ] "Jump to failure point" seeks to the first event where behavior diverges from expected
- [ ] The same renderer drives a lesson's animated walkthrough (B10b) on a reference implementation — one renderer, two contexts
- [ ] A text-equivalent state description is available to screen readers (H4)
- [ ] Renders at 60fps for arrays up to the H5 cap, with **the frame loop outside React** — React owns the container, controls, and scrubber; interpolation runs on `requestAnimationFrame` mutating DOM/canvas directly. 500 SVG rects is unremarkable; 500 React components reconciling per frame is not ([ADR 0001 §7](../docs/adr/0001-stack.md#decision-7--the-visualizers-animation-loop-stays-out-of-react)). This is structural here, not a Phase 4 optimization — getting it wrong means writing the renderer layer twice

**Verification:**
- [ ] Tests pass: renderer unit tests driven by fixture trace streams
- [ ] Manual check: solve a problem, scrub the timeline, confirm the animation matches actual behavior
- [ ] Manual check: profile a 500-element array; confirm 60fps

**Dependencies:** T2.7, T2.1
**Files likely touched:** `components/visualizer/{Canvas,Controls}.tsx`, `components/visualizer/renderers/array.tsx`, `lib/visualizer/registry.ts`
**Estimated scope:** L

---

### ✅ Checkpoint C — The loop closes and the differentiator is proven

- [ ] All tests pass; build clean; CI green
- [ ] **The defining flow works:** open `/learn/dsa` → a problem set shows locked → complete the lesson → the set unlocks → solve a problem in either language → watch own code animate
- [ ] **Gating holds under direct attack:** a locked problem URL and a locked test-run API call are both refused server-side
- [ ] Read-ahead still works — lesson content is never locked (B14)
- [ ] Trace protocol versioned and documented; adding a renderer requires no protocol change
- [ ] 60fps at the H5 cap; accessible text fallback present (H4)
- [ ] Stub third-language adapter passes conformance — Java's return path is an adapter, not a rewrite
- [ ] **Human review required** — Phases 3–8 decomposed from here

---

### Phase 3 — Content pipeline (Module J) · *epic-level* — **promoted; now the critical path**

Pipeline-sourcing the catalog (PRD G6) turns content from "the thing that quietly sinks the schedule" into a buildable subsystem — and makes this the phase that decides whether the product has enough content to be worth using. Promoted ahead of animation breadth for that reason.

Source registry and polite crawling (J1, J2); **the license classification gate (J3)**; attribution ledger (J4); canonicalization for restricted sources (J5); takedown tooling (J6); problem extraction (J7); test-spec synthesis validated against source reference solutions (J8); dedup against existing content (J9); editorial review queue (J10); pre-review quality gates (J11); observability (J12).

Two things cannot be deferred within this phase: **J3 lands before any crawler runs** — an unclassified corpus cannot be retroactively classified — and **J4 provenance is captured from the first artifact**, since it is what makes J6 takedown a single operation rather than an archaeology project.

**H10 is resolved ahead of this phase, not within it** ([ADR 0001 §2](../docs/adr/0001-stack.md#decision-2--hosting-vercel-with-the-pipeline-as-the-one-carve-out)): crawl and transform work runs as **Inngest** step functions — one logical multi-hour job decomposed into many short invocations, each a normal Next.js route handler with durable state between steps. One repo, one deploy, one schema, so this is not an H8 deviation. It also supplies retries, concurrency limits, and per-step observability, which is **J12/H6 obtained rather than built**. Escape hatch if crawl volume outgrows it: a container worker sharing the same repo and Drizzle schema — not day-one work.

**Decompose into tasks when Checkpoint C passes.**

---

### Phase 4 — Animation breadth (Module B) · *epic-level*

Remaining renderers (B2): linked lists, trees/tries/segment trees, graphs, heaps, hash maps, stacks/queues, union-find, probabilistic structures, DP tables, spatial structures. Then complexity overlay and operation counters (B4), "explain this state" tooltips (B5 — largely delivered by L5), GIF/link export (B6), free-play sandbox mode (B7), mobile viewing (B8). Plus problem ↔ challenge cross-links (B20); company tagging (B19) waits on Phase 7.

Parallelizes well — each renderer is independent once the T2.7 protocol is frozen. Sequence by **lesson** coverage: a topic's lesson is much weaker without its animation, and lessons are the guided entry point to every topic.

**Decompose into tasks when Phase 3 completes.**

---

### Phase 5 — Visual roadmaps (Module I) · *epic-level*

Canvas layer (I1) and node color-coding legend (I2); node detail panel deep-linking into all three DSA tiers, labs, and concept entries (I3); per-node progress from real completion data (I4); the DSA, System Design, and Design Patterns roadmaps (I5; company roadmaps wait on Phase 7); search-within-roadmap (I6); share/embed (I7) and PDF/PNG export (I8). Community roadmap creation (I9) is explicitly later-phase.

Scheduled before Module C deliberately: it hardens the shared canvas primitive (AD-4) on the simpler of its two use cases. Note that Module K's node treatment (K3) is already the platform's card language by this point, so the roadmap should look native on arrival rather than needing bespoke styling.

**Decompose into tasks when Phase 4 completes.**

---

### Phase 6 — System Design labs (Module C) · *epic-level*

Whiteboard canvas with component palette (C1); guided scenario labs (C2); capacity calculator (C3); trade-off decision trees (C4); design-review rubric scoring (C5); the "build it" bridge into matching code challenges (C6 — the PRD's stated differentiator); timed mode (C7); concept-map deep links (C9); post-completion solution gallery (C10). Company rubrics (C8) depend on Phase 7.

**Decompose into tasks when Phase 5 completes.**

---

### Phase 7 — Company question bank (Module D) · *epic-level* — shares Module J's infrastructure

Substantially cheaper than originally scoped, because Phase 3 already built the crawler, scheduler, license gate, dedup engine, review queue, and observability. What remains is D-specific: company/role/round tagging and freshness (D4), question bank UI (D6), company loop guides (D7), alerts (D9), and company filters across all content types (D1) — plus problem company-tagging (B19) and company-specific roadmaps (I5), both of which depend on this data.

Still gated on H7 sign-off, though J3's license classification will have done most of that work in practice.

**Decompose when the legal gate clears.**

---

### Phase 8 — AI assistant (Module L), mocks (E), personalization (F) · *epic-level*

**Module L first** — it shares infrastructure with E3 and is independently valuable. Built on the **Vercel AI SDK** with `@ai-sdk/groq`: streaming and provider abstraction come built in, so AD-10's "no call site names a model" falls out of the SDK's shape rather than relying on discipline. Model selection against Groq's live catalog (L1); config-level model and prompt management (L2); context-aware help across surfaces (L3); Socratic-by-default behavior (L4); "explain this state" over the visualizer, which delivers B5 (L5); code review on passing submissions (L6); concept Q&A grounded in platform content (L7); study-plan assistance (L8); **cost controls with a hard spend ceiling, in the first version rather than after (L9)**; transparency and prompt-injection defense against Module J's scraped content (L10).

Then: timed DSA mock (E1), timed System Design mock (E2), AI mock interviewer on L's infrastructure (E3 — modality still open), post-mock scorecards (E5). Skill-gap diagnostic (F1), spaced repetition (F2), streaks/badges/certificates (F3), personal analytics (F4), custom study plans (F5). Human/peer matching (E4) is explicitly lower priority.

**Decompose when Phase 6 completes.**

---

### Phase 9 — Community layer (G) and platform polish · *epic-level*

Discussion threads (G1), opt-in solution sharing (G2), toggleable leaderboards (G3), editorial content hub (G4). Plus remaining non-functional work: mobile responsiveness sweep (H3), accessibility audit (H4), and **restoring Java** (H1) — starting with the suspended T0.6 spike, then one adapter. Further languages after that.

**Decompose when Phase 8 completes.**

---

## Risks and Mitigations

| ID | Risk | Impact | Mitigation |
|---|---|---|---|
| R-3 | **Content volume — now a pipeline-throughput risk rather than an authoring one.** Module J converts "nobody can hand-write several hundred multi-language problems" into "can the pipeline extract, synthesize, and pass review fast enough?" A better problem, but not a solved one: **editorial review (J10) becomes the new bottleneck**, since nothing publishes unreviewed. | **High** | AD-3's spec format means one ingestion yields every language. J11's automated gates must be strict enough that review is confirmation rather than correction — track the approve/reject ratio from day one and treat a low approve rate as a pipeline bug, not a reviewer-throughput problem. |
| R-11 | **The pipeline ingests something it may not use.** At scale an unlicensed or restrictively-licensed source gets ingested and published, and without provenance nobody can tell which artifacts are affected. The reference site for our own design proves how easy this is to get wrong: 365k GitHub stars, all rights reserved. | **High** | J3 classifies **before** ingestion, and unlicensed defaults to Restricted with no override path. J4 captures provenance for every artifact regardless of bucket, making J6 takedown one operation. Neither may be deferred within Phase 3. |
| R-12 | **Pipeline output is subtly wrong at scale.** A generated test spec that is plausible but incorrect — an off-by-one in an edge case, a wrong complexity tag — teaches the wrong thing, hundreds of times over. | **High** | J8 validates every generated spec against the source's own reference solution; a spec its reference fails is auto-rejected. J11 requires the reference to pass in *every* launch language. Human review (J10) is the last line, not the only one. |
| R-4 | **Scraping is a legal exposure, not a technical problem**, and Module J widens it from question text to whole learning content. | **High** | J3's classification gate plus H7 sign-off before any crawler runs. Start with unambiguously permissive sources; Restricted sources yield canonicalized substance only (J5), never their text. |
| R-2 | **Trace-driven animation may not generalize.** `sys.settrace` gives Python this nearly free. JavaScript was the harder half — AST instrumentation of learner source — until AD-2 moved it to QuickJS, which is instrumentable directly. | **Medium** (was High) | T0.2 and T2.7 prove the protocol on both languages before committing; T0.2 now has an explicit criterion for QuickJS tracing without AST rewriting. **If that criterion fails, this returns to High** and the AST path comes back. Fallback either way: launch animation Python-deep and reach parity incrementally — permitted by the amended H1. |
| R-5 | **Zero revenue meets compute-heavy features.** Pyodide bundles, trace payloads, the ingestion pipeline, and now a Groq-backed assistant all cost money with no offsetting income. | **Medium** | Client-side execution (AD-2) keeps the dominant learning cost near zero. L9's hard ceiling bounds the assistant. PRD Open Question 4 needs an answer before Phase 3. |
| R-6 | **Mandatory sign-in with full-funnel tracking is a privacy-disclosure obligation** (§2.6, F6) — and Module L now sends learner code to a third party. | **Medium** | Answer PRD Open Question 7 and ship the privacy notice *with* T0.4. Extend it to cover Groq before Module L ships (L10). |
| R-9 | ~~Gating enforced only in the UI.~~ **Retired — nothing is locked.** Replaced by: guidance is *too easy to ignore*, and beginners get no more of a path than a bare problem bank would give them — losing the product's stated advantage. | **Medium** | Guidance must earn attention rather than compel it: recommended ordering as the default, the B16 struggle-triggered nudge at the moment of real need, and the roadmap as primary navigation. §8's guidance-effectiveness metrics exist to detect this failing — and unlike under a gate, they can actually measure it. |
| R-10 | **Assistant cost is unbounded by default.** Module L is the largest recurring variable cost on a free platform, and spend scales with engagement — success makes it worse. | **Medium** | L9's ceiling ships with the first version: per-user rate limits, daily token budgets, prompt caching, context trimming, and a hard global cap with graceful degradation. Cost per active user is tracked (§8), not discovered monthly. |
| R-13 | **Design system arrives too late.** If Module K slips past Phase 0, every component built meanwhile needs restyling and "make it look like roadmap.sh" becomes a UI rewrite. | **Medium** | T0.7 lands in Phase 0, before the first product surface. The hardcoded-value lint and CI contrast check make drift a build failure rather than a code-review argument. |
| R-14 | **Prompt injection via scraped content.** Module J ingests untrusted third-party text; Module L reads platform content into its context. A crafted problem brief could steer the assistant. | **Medium** | L10 treats pipeline-sourced content as untrusted data, never instructions. J10's review is a second filter. Worth an explicit test case — the two modules are built phases apart and the interaction is easy to miss. |
| R-1 | ~~Java has no viable in-browser runtime.~~ **Retired by suspending Java.** Replaced by: the codebase quietly hardcodes two-language assumptions, making Java's return a rewrite. | Low (was High) | T2.6's stub-adapter criterion — a third-language adapter passes conformance with zero changes to editor, results, progress, or content. If that criterion is quietly dropped, this risk returns at full strength. |
| R-7 | ~~Vercel serverless limits conflict with H8.~~ **Retired — decided in ADR 0001 §2.** Crawl and transform run as Inngest step functions inside the same Next.js deployment, so H10 costs no H8 deviation. Replaced by: Vercel's bandwidth and invocation billing on a zero-revenue product. | Low (was Medium) | Revisit hosting against §8's real MAU numbers, not speculation. The all-container alternative (Next.js standalone + worker on Railway) is more cost-predictable and is the fallback if bandwidth becomes material. |
| R-8 | **Sandbox escape.** Executing arbitrary learner code with tracing hooks (H2) widens the attack surface. A same-origin Web Worker keeps `fetch`, so native JS in one could call our own API routes with the user's cookies. | Low (was Medium) | **Structural, not configured:** both runtimes are WASM interpreters with no ambient authority (AD-2) — QuickJS has no origin or network at all, and Pyodide's worker is denied both. Hard timeouts plus QuickJS interrupts bound runtime. Security review before public launch still stands. |

---

## Open Questions

Carried from PRD §10, plus questions this plan surfaced. Those marked **blocking** must be answered before the phase named.

1. **[Blocking Phase 1]** Does Module B animation need structure-coverage parity across both launch languages, or can it ship Python-deep first? (PRD Q1a)
2. **[Blocking Phase 3]** What is the ToS risk tolerance for sourcing — compliant-sources-only at launch? (PRD Q2; now bites at Module J, not just Module D)
3. **[Blocking Phase 8]** Is E3's AI mock interviewer voice, chat, or both? (PRD Q3)
3a. **[Blocking Phase 0]** Does QuickJS tracing capture the full trace-event shape without AST-rewriting learner source? T0.2 answers this; a "no" restores R-2 to High and adds AST instrumentation to Phase 2. (ADR 0001 §5)
3b. **[Blocking Phase 1]** Is Better Auth mature enough to carry the §2.6 hard gate, or does T0.4 fall back to Auth.js v5? Decide during T0.4, not after surfaces depend on it. (ADR 0001 §4)
4. **[Blocking Phase 3]** Is there any funding path for compute-heavy features, or must every feature be cost-free? (PRD Q4 — now bites earlier: the pipeline and the assistant are both recurring costs)
5. ~~Must C6's "build it" bridge require prior completion?~~ **Resolved: no — nothing is locked** (PRD Q5, Q10).
6. **[Blocking Phase 7]** Are company-specific roadmaps auto-generated or editorially reviewed? (PRD Q6)
7. **[Blocking Phase 0]** What is the data-retention and privacy-disclosure policy, and does the sign-up flow need a privacy notice? (PRD Q7 — gates T0.4)
8. ~~Is B16's gate absolute?~~ **Resolved: nothing is locked** (PRD §6.6, Q8). Newly open, and blocking Phase 2: how aggressive should the struggle-triggered nudge be before it reads as nagging, and after how many dismissals does the platform stop suggesting a topic's lesson entirely?
9. ~~Tier-2 catalog provenance?~~ **Resolved: pipeline-sourced** (Module J). Newly open, and **blocking Phase 3**: what is the v1 target catalog size, and what proportion of pipeline output must pass human review (J10) — since that ratio, not extraction throughput, sets the real publish rate.
10. ~~Do tier-3 challenges gate?~~ **Resolved: nothing gates on anything.**
11. **[Blocking Phase 1]** Which language does the Phase 1 vertical slice use — whichever T0.2 proves easiest, or Python as the PRD's incumbent?
12. **[Blocking Phase 3]** Which sources seed the pipeline's initial registry (J1), and who signs off on each one's license classification? The gate is automated; the registry is a human decision.
13. **[Blocking Phase 8]** Which Groq model, selected against their live catalog at implementation time (L1)? And what monthly spend ceiling does the L9 cap enforce?
14. **[Blocking Phase 0]** Who samples the design reference for K1's tokens — is there a designer in the loop, or does engineering sample values directly from the live site?
15. **[Blocking Phase 2]** Does the PRD's "100 challenges" figure survive a greenfield rebuild, or does v1 launch a narrow set of topics complete across all three tiers?
16. **[New]** The PRD marks Module A as `existing`. Section 9's handover instruction should be corrected to `planned` before `features.md` is generated — confirm.

---

## Parallelization

- **Safe to parallelize now:** Phase 0's T0.7 design system alongside the T0.2 runtime spike; Phase 2's three tracks (A: the DSA loop, B: catalog/IA, C: languages + animation) touch disjoint files; in Phase 4, every renderer once the trace protocol is frozen. Module J's crawler is independent of every learning surface and can start as soon as the DB schema and the J3 license gate exist.
- **Must stay sequential:** database migrations; Track A internally (lessons → completion state → recommendations); the trace protocol before any renderer; the design tokens before any component; the J3 license gate before any crawl; the canvas primitive before Module C.
- **Needs contract-first coordination:** `LanguageRuntime` (AD-2), `TraceEvent` (T2.7), `RunnableExercise` (AD-7), and the design tokens (K1) — freeze all four before parallelizing behind them. `RunnableExercise` has the widest blast radius: every tier, both surfaces, all three content types, *and* Module J's output contract depend on its shape.
