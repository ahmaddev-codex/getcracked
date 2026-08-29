# GetCracked — Task Checklist

Companion to [plan.md](plan.md). Full acceptance criteria and verification steps live there; this is the working checklist.

**Context:** greenfield rebuild — this repo has no application code, so PRD Module A is `planned`, not `existing`.

**Standing constraints:**
- Single Next.js fullstack app (H8) — pipeline jobs (H10) resolved to Inngest step functions inside the same deployment, so no H8 deviation; the inference provider (H9) remains a live dependency. Full stack in [docs/adr/0001-stack.md](../docs/adr/0001-stack.md)
- Everything free; **sign-in only for account-scoped behaviour** — progress sync, personalization, community, assistant. Every learning surface works signed out (§2.6)
- **Nothing is locked** — every lesson, problem, challenge, and lab is open to every signed-in user from minute one (§6.6, B14, B16)
- Launch languages **Python + JavaScript**; Java suspended, first to be added back (H1)
- Catalog is **pipeline-sourced**, not hand-authored (Module J)
- One visual language across every surface, modelled on roadmap.sh (Module K)

---

## Phase 0 — Foundation, Design System & Risk Spikes

- [x] **T0.1** — Next.js app skeleton and CI · *S* · deps: none
- [x] **T0.2** — 🔥 SPIKE: Python + JavaScript in-browser execution and trace capture · *M* · deps: T0.1 — findings: [docs/spikes/runtime-python-js.md](../docs/spikes/runtime-python-js.md). **QuickJS cannot trace without AST rewriting → R-2 stays High.** Trace payload is O(n²) — T2.7 must fix.
- [x] **T0.3** — Database schema and migrations · *M* · deps: T0.1 — Drizzle + Neon per [ADR 0001 §3](../docs/adr/0001-stack.md). Tests run on embedded PGlite. ✅ verified end-to-end against local Docker Postgres (migrate + seed twice, idempotent). ⚠️ auth tables still need reconciling against Better Auth's generator in T0.4.
- [x] **T0.4** — Auth for account-scoped data + reconcile Better Auth tables (A2, A15, §2.6) · *M* · deps: T0.3 — Better Auth on our schema, verified end-to-end. ⚠️ A15 anonymous-progress migration is **not** built (needs local progress from T1.4 to migrate)
- [x] **T0.5** — Analytics event pipeline, **both tiers** (F6, A16) · *S* · deps: T0.3, T0.4 — signed-in by account, signed-out by rotating device id, with the A16 notice as the disclosure surface. ✅ rate-limited via Upstash sliding window (R-17 closed)
- [x] **T0.7** — 🎨 Design system: tokens **sampled by decoding the `shots/` screenshots**, K3 node treatment, 5 components, CI contrast check over 15 pairs × 2 themes, ESLint rule banning hardcoded values (K1, K3, K8, K9, K10) · *M* · deps: T0.1
- [ ] ~~**T0.6** — SPIKE: Java execution strategy~~ · **suspended** — first task of Phase 9; nothing depends on it

### ✅ Checkpoint A — Foundation
- [x] Tests pass (122) · build clean · lint + typecheck green
- [x] Sign up → sign in → account page reachable; **and content routes reachable signed out** — both asserted
- [x] T0.2 spike doc written and **runtime decision recorded** — see [docs/spikes/runtime-python-js.md](../docs/spikes/runtime-python-js.md)
- [x] Design tokens sampled and dated; component gallery at `/components`; **zero WCAG AA contrast failures in CI**
- [ ] **Human review before Phase 1** ← Phase 0 complete, awaiting sign-off

---

## Phase 1 — First Vertical Slice (one problem, end to end)

- [x] **T1.1** — Content schema (Zod), `RunnableExercise` shared by all three tiers, declarative test spec **interpreted** per language, `two-sum` authored; `prebuild` gate runs reference-passes / starter-fails · *M* · deps: T0.1, T0.2
- [ ] **T1.2** — Problem page: brief, progressive hints, navigation (A5, A8, A9) · *M* · deps: T1.1, T0.4
- [ ] **T1.3** — Editor + test runner integration (A6, A7, H2) · *L, split if needed* · deps: T1.2, T0.2
- [ ] **T1.4** — Progress persistence and cross-device resume (A10, F6) · *M* · deps: T1.3, T0.5

### ✅ Checkpoint B — First working slice
- [ ] Tests pass · build clean · CI green
- [ ] Full flow: sign up → open problem → hint → write code → fail → fix → pass → solved → sign out → sign in elsewhere → progress + code restored
- [ ] Analytics rows exist for every step of that flow
- [ ] Runtime latency matches T0.2 measurements
- [ ] All UI built from K1 tokens — no bespoke styles
- [ ] **Human review before Phase 2** — last cheap moment to change content model or runtime architecture

---

## Phase 2 — The DSA loop, the catalog, and the differentiator

*Three parallel tracks. Track A is internally sequential.*

**Track A — the DSA learning loop**
- [ ] **T2.1** — Learn surface `/learn/dsa` + lesson content model; author 2 lessons (B9, B10, B14) · *M* · deps: T1.1, T0.4
- [ ] **T2.2** — Guided in-lesson exercises + lesson completion state (B11, B12) · *M* · deps: T2.1, T1.4
- [ ] **T2.3** — Problem sets + **recommendation engine, not locks** (B13, B15–B18, B21) · *M* · deps: T2.2

**Track B — catalog and IA**
- [ ] **T2.4** — Dashboard, three-tier navigation, difficulty/topic filters (A3, A4) · *M* · deps: T1.4
- [ ] **T2.5** — Concept map moved to `/learn/system-design` + 301 redirect (A14) · *M* · deps: T1.1, T0.4

**Track C — second language and animation** *(risk-critical)*
- [ ] **T2.6** — Second launch language behind the adapter + stub third-language conformance (H1, A6) · *M* · deps: T1.3
- [ ] **T2.7** — 🔥 Versioned, language-agnostic trace event protocol (B1 core) · *L* · deps: T2.6
- [ ] **T2.8** — First renderer (arrays) + playback; also drives lesson walkthroughs (B2, B3, B10b) · *L* · deps: T2.7, T2.1

### ✅ Checkpoint C — The loop closes and the differentiator is proven
- [ ] Tests pass · build clean · CI green
- [ ] **Defining flow:** `/learn/dsa` → read a lesson → follow the handoff into its problem set → solve in either language → watch own code animate
- [ ] **Nothing is locked** — a brand-new account opens any lesson, problem, or challenge directly by URL and it works
- [ ] Guidance works without gating: recommendation shown, struggle-nudge fires, dismissal remembered
- [ ] Progress is server-authoritative — a forged client completion claim does not persist
- [ ] Trace protocol versioned and documented; new renderers need no protocol change
- [ ] 60fps at the H5 cap (arrays ≤ 500) · accessible text fallback present (H4)
- [ ] Stub third-language adapter passes conformance — Java's return is an adapter, not a rewrite
- [ ] **Human review** — Phases 3–9 decomposed from here

---

## Phase 3 — Content pipeline (Module J) · *epic* — **now the critical path**
*Two things cannot be deferred within this phase: J3 before any crawl, J4 from the first artifact.*
- [ ] **🚧 H7 legal/ToS sign-off — before any crawler runs**
- [ ] **J3 license classification gate** — classify before ingest; unlicensed defaults to Restricted, no override
- [ ] **J4 attribution ledger** — provenance on every artifact, which is what makes J6 takedown one operation
- [ ] Source registry (J1) · polite crawling: robots.txt, rate limits, backoff (J2)
- [ ] Canonicalization for Restricted sources — substance only, never their text (J5) · takedown tooling (J6)
- [ ] Problem extraction (J7) · test-spec synthesis validated against source reference solutions (J8)
- [ ] Dedup against existing catalog (J9) · pre-review quality gates (J11)
- [ ] Editorial review queue — nothing publishes unreviewed (J10) · observability (J12)
- [ ] **Resolve H10** — long-running jobs vs. serverless limits; record the H8 deviation if there is one

## Phase 4 — Animation breadth (Module B) · *epic*
*Sequence by **lesson** coverage — a topic's lesson is much weaker without its animation.*
- [ ] Renderers: linked lists · trees/tries/segment trees · graphs · heaps · hash maps · stacks/queues · union-find · probabilistic structures · DP tables · spatial structures (B2)
- [ ] Complexity overlay and operation counters (B4) · "explain this state" (B5 — largely delivered by L5)
- [ ] GIF / shareable-link export (B6) · free-play sandbox (B7) · mobile viewing (B8)
- [ ] Problem ↔ challenge cross-links (B20)

## Phase 5 — Visual roadmaps (Module I) · *epic* — hardens the shared canvas primitive
- [ ] Canvas + color-coded legend (I1, I2) — should look native, since K3 is already the platform's card language
- [ ] Node detail panel: all three DSA tiers, with "lesson recommended first" where incomplete — shown, never locked (I3)
- [ ] Tri-state per-node progress: lesson · problem set · challenge (I4)
- [ ] DSA · System Design · Design Patterns roadmaps (I5)
- [ ] Search-within-roadmap (I6) · share/embed (I7) · PDF/PNG export (I8)
- [ ] *Deferred:* community/custom roadmaps (I9)

## Phase 6 — System Design labs (Module C) · *epic*
- [ ] Whiteboard canvas + component palette (C1) · guided scenario labs (C2)
- [ ] Capacity calculator (C3) · trade-off decision trees (C4) · design-review rubric (C5)
- [ ] "Build it" bridge to matching code challenges (C6 — key differentiator, open to all)
- [ ] Timed mode (C7) · concept-map deep links (C9) · solution gallery (C10)

## Phase 7 — Company question bank (Module D) · *epic* — reuses Module J's infrastructure
- [ ] Company/role/round tagging + freshness (D4) · question bank UI (D6)
- [ ] Company loop guides (D7) · alerts (D9) · company filters across content types (D1)
- [ ] Problem company-tagging (B19) · company-specific roadmaps (I5)

## Phase 8 — AI assistant (Module L), mocks (E), personalization (F) · *epic*
- [ ] **Module L first** — shares infrastructure with E3 and is independently valuable
  - [ ] Model selected against Groq's **live** catalog at implementation time (L1) · config-only model/prompts (L2)
  - [ ] Context-aware help (L3) · Socratic by default (L4) · "explain this state" over the visualizer (L5)
  - [ ] Code review on passing submissions (L6) · concept Q&A grounded in platform content (L7) · study-plan help (L8)
  - [ ] **Cost ceiling in the first version, not after (L9)** · transparency + prompt-injection defense against Module J content (L10)
- [ ] Timed DSA mock (E1) · timed System Design mock (E2) · AI mock interviewer on L (E3) · scorecards (E5)
- [ ] Skill-gap diagnostic (F1) · spaced repetition (F2) · streaks/badges (F3) · analytics (F4) · study plans (F5)
- [ ] *Lower priority:* human/peer matching (E4)

## Phase 9 — Community (G) + platform polish · *epic*
- [ ] Discussion threads (G1) · opt-in solution sharing (G2) · leaderboards (G3) · content hub (G4)
- [ ] Mobile responsiveness sweep (H3) · accessibility audit (H4)
- [ ] **Restore Java** (H1) — start with the suspended T0.6 spike, then one adapter
- [ ] Further languages: TypeScript, Go, C++, Rust

---

## Blocking questions (answer before the named phase)

- [x] **Phase 0** — Privacy. **Decided:** track **both** tiers — signed-in by account, signed-out by rotating device id — and make the disclosure a visible product surface (A16: "your progress is on this device only; sign in to keep it") rather than a buried policy. ⚠️ Still open (legal): whether a device id needs an EU consent banner *(PRD Q7)*
- [x] **Phase 0** — Design tokens. **Decided:** engineering samples from the live site and the `shots/` references, author reviews the token file *(K1)*
- [x] **Phase 1** — First slice language. **Decided: JavaScript.** QuickJS is 15ms cold / 0.7ms warm vs Pyodide's 1.3s cold (worse in a real browser), so it keeps a multi-MB download out of the loop while the content model and editor churn. Python lands in T2.6 *(T0.2 measurements)*
- [ ] **Phase 1** — Animation parity across both launch languages, or Python-deep first? *(PRD Q1a)*
- [ ] **Phase 2** — How aggressive should the struggle-nudge be, and after how many dismissals does it stop? *(PRD Q8, reopened)*
- [ ] **Phase 2** — Does "100 challenges" survive the rebuild, or does v1 launch fewer topics complete across all tiers? *(new)*
- [ ] **Phase 3** — 🔑 **Which sources seed the pipeline registry (J1), and who signs off on each license classification?** *(new — the gate is automated, the registry is a human decision)*
- [ ] **Phase 3** — v1 catalog size, and what share of pipeline output must pass human review? *(PRD Q9, reopened — review ratio sets the real publish rate)*
- [ ] **Phase 3** — ToS risk tolerance for sourcing *(PRD Q2)* · funding path for recurring compute *(PRD Q4)*
- [ ] **Phase 7** — Company roadmaps auto-generated or editorially reviewed? *(PRD Q6)*
- [ ] **Phase 8** — 🔑 **Which Groq model, and what monthly spend ceiling does L9 enforce?** *(new)*
- [ ] **Phase 8** — E3 voice, chat, or both? *(PRD Q3)*
- [ ] **Phase 9** — When Java returns: in-browser or server-side, and is server-side an acceptable H8 deviation? *(PRD Q1c)*
- [x] **Anytime** — PRD §9 corrected: every feature is `planned`, Module A included — this is a greenfield rebuild

**Resolved:** B16 gating *(nothing is locked)* · tier-3 gating *(nothing gates)* · C6 bridge prerequisite *(no)* · tier-2 provenance *(pipeline-sourced)* · privacy *(no signed-out tracking yet)* · token sampling *(engineering)* · first-slice language *(JavaScript)* · Module A status *(planned)*

---

## Standing Definition of Done

Every task clears this bar in addition to its own acceptance criteria:

- [ ] `pnpm build` · `pnpm lint` · `pnpm typecheck` · `pnpm test` all pass
- [ ] New behavior has tests; changed behavior has updated tests
- [ ] Content routes render signed out; every handler touching a user row is denied without a session (§2.6, AD-5)
- [ ] **No route locks content behind progress** — prerequisites recommend, never restrict (§6.6, B16)
- [ ] Progress and completion are computed server-side from real results, never client-reported (B21)
- [ ] UI is built from K1 tokens and K8 components — no hardcoded colors or spacing, no bespoke variants
- [ ] New token pairs pass the WCAG AA contrast check in CI (K10)
- [ ] New runnable content is a declarative test spec, not hand-written per-language suites (AD-3)
- [ ] Ingested content carries its license bucket and provenance (J3, J4)
- [ ] Pipeline-sourced content is treated as untrusted data by the assistant, never as instructions (L10)
- [ ] User-facing actions emit tracked analytics events (F6)
- [ ] No feature references a paywall, tier, or subscription (§2.6)
- [ ] No new `any` types; no silenced lint rules without an inline justification
