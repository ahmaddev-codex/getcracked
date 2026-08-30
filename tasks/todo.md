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
- [x] **Google and GitHub OAuth (A2)** — a provider is offered only when *both* halves of its credential are present, so a button that cannot complete is never rendered; an empty client id fails after the redirect, which reads as the product being broken rather than a deployment being incomplete. `accounts` already had every OAuth column, so no migration. Account linking is on for these two and restricted to them: without it, signing up with a password and later using Google on the same address silently splits a learner's progress across two accounts. No secrets reach the client — asserted by a test, since that is the worst available outcome here
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
- [x] **T1.2** — Problem page: markdown brief, progressive hints persisted locally, set navigation, 404s (A5, A8, A9) · *M* · deps: T1.1, T0.4 — renders signed out; statically prerendered
- [x] **T1.3** — Editor (CodeMirror 6) + worker-hosted test runner, per-case results, humanized errors, draft persistence (A6, A7, H2) · *L* · deps: T1.2, T0.2 — ⚠️ browser click-through of Run/timeout still needs manual verification
- [x] **T1.4** — Progress persistence, cross-device resume, A15 claim path (A10, F6) · *M* · deps: T1.3, T0.5 — ⚠️ B21 corrected: progress is client-attested, not server-derived

### ✅ Checkpoint B — First working slice
- [x] Tests pass (213) · build clean · lint + typecheck green
- [x] Progress + latest submission restore across sessions, verified against the live API
- [x] `exercise_started`, `test_run`, `exercise_solved` all emitted
- [x] Runtime latency matches T0.2 measurements
- [x] All UI built from K1 tokens — no bespoke styles
- [x] **Human review** — Phase 1 signed off 2026-08-29. Run, Reset, and ⌘↩ manually verified in-browser

---

## Phase 2 — The DSA loop, the catalog, and the differentiator

*Three parallel tracks. Track A is internally sequential.*

**Track A — the DSA learning loop**
- [x] **T2.1** — Learn surface `/learn/dsa` + B10's five-section lesson model; `hashing` and `two-pointers` authored; read-ahead asserted structurally (B9, B10, B14) · *M* · deps: T1.1, T0.4
- [x] **T2.2** — Guided in-lesson exercises reusing the same runner, collapsible; lesson state derived once and shared by both tiers (B11, B12) · *M* · deps: T2.1, T1.4
- [x] **T2.3** — `/problems` + per-topic sets, recommendation engine with struggle-nudge and remembered dismissals — no locks anywhere (B13, B15–B18, B21) · *M* · deps: T2.2

**Track B — catalog and IA**
- [x] **T2.4** — Dashboard, three-tier navigation, URL-persisted difficulty/topic filters (A3, A4) · *M* · deps: T1.4
- [x] **T2.5** — `/learn` hub + concept map at `/learn/system-design` with deep-linkable anchors and 308 redirect (A14) · *M* · deps: T1.1, T0.4 — ⚠️ **58 of the PRD's 129 concepts authored**; remainder is content backlog

**Track C — second language and animation** *(risk-critical)*
- [x] **T2.6** — Python wired behind the adapter registry, per-language entry names, editor language switcher, stub third-language conformance (H1, A6) · *M* · deps: T1.3
- [x] **T2.7** — Versioned trace protocol with diffed line events and hoisted collections; **0.96MB → 58KB (17×)** on a 500-element loop (B1 core) · *L* · deps: T2.6
- [x] **T2.8** — Array renderer + playback (play/pause, step, speed, scrub), lesson walkthrough filled, **1.5ms/frame at 500 elements** (B2, B3, B10b) · *L* · deps: T2.7, T2.1

### ✅ Checkpoint C — The loop closes and the differentiator is proven
- [x] Tests pass (314) · build clean · lint + typecheck green
- [x] **Defining flow:** `/learn/dsa` → lesson → handoff → solve in either language → watch own code animate
- [x] **Nothing is locked** — every Phase 2 route returns 200 signed out
- [x] Guidance works without gating: recommendation, struggle-nudge, remembered dismissal
- [x] Progress writes are session-scoped; a forged userId in the body is ignored
- [x] Trace protocol versioned; **0.96MB → 58KB (17×)**; new renderers need no protocol change
- [x] **1.5ms/frame at 500 elements** (budget 16.7ms) · text equivalent present (H4)
- [x] Stub third-language adapter passes conformance
- [ ] **Human review** — Phases 3–9 decomposed from here

---

## Phase 3 — Content pipeline (Module J) · *epic* — **descoped, foundations built**

**The descope, and why.** The pipeline's justification was catalog volume, and
the obvious sources for that are the ones we cannot use: the large practice sites
forbid scraping, so J3 classifies them Restricted and J5 reduces us to "substance
only, never their text" — authoring with extra steps *plus* legal exposure. With
20 problems and 31 lessons now authored directly at a quality no crawler would
reach, the registry holds only sources whose licence already permits reuse. That
turns **H7 from a legal review into a one-line policy**: we ingest CC-licensed
and public-domain sources, attribution is mandatory, and no ToS-restricted site
is crawled.

- [x] **J3 licence classification gate** — classify before ingest; absent or unrecognised is `restricted`, and there is deliberately **no override**, because a per-source "trust me" flag is exactly how unlicensed content reaches production
- [x] **J4 attribution ledger** — provenance on every artifact, which is what makes J6 takedown one operation (delete by source id) and what makes a share-alike obligation survivable months later
- [x] **Source registry (J1)** — Wikipedia · CP-Algorithms · Competitive Programmer's Handbook · MIT OCW, each with its licence, the evidence for it, and its own crawl delay. Every entry is reproducible, so no ingest-time judgement call is ever needed
- [ ] Polite crawling: robots.txt, rate limits, backoff (J2)
- [ ] Canonicalization for Restricted sources — substance only, never their text (J5) · takedown tooling (J6)
- [ ] Problem extraction (J7) · test-spec synthesis validated against source reference solutions (J8)
- [ ] Dedup against existing catalog (J9) · pre-review quality gates (J11)
- [ ] Editorial review queue — nothing publishes unreviewed (J10) · observability (J12)
- [ ] **Resolve H10** — long-running jobs vs. serverless limits; record the H8 deviation if there is one

## Curriculum — two tracks, 20 lessons

- [x] **Data Structures track (9)** — arrays · linked lists · stacks & queues · hash maps · trees · heaps · graphs · tries · union-find
- [x] **Algorithms track (11)** — two pointers · sliding window · prefix sums · binary search · sorting · recursion · backtracking · greedy · dynamic programming · intervals · bit manipulation
- [x] **Every lesson answers "why this one"** — `whenToUse.reachFor` plus `insteadOf`, which names the thing a learner would otherwise have used and says what it costs. Knowing how a heap works does not tell you when to reach for one, and that is the skill an interview tests
- [x] **Per-operation asymptotics** — separate from the pattern-level `complexity`, because "insert is O(1) but lookup is O(n)" is the sentence that decides between a list and an array, and one summary figure cannot express it
- [x] **Variants, and further reading** — named kinds worth recognising, plus external links carrying their source. Linked rather than ingested, so they raise no licence question (contrast Module J, which reproduces text)
- [x] **Difficulty ranking** — foundational · core · advanced, so a learner knows where to start. Guidance only: every topic stays one click away (§6.6, B14). Shown in the panel and explained in the legend, deliberately *not* on the node, where a badge per card competes with the name
- [x] Order restarts per track, so adding a structure does not renumber every algorithm
- [x] **System Design track (11)** — scaling · load balancing · caching · SQL and NoSQL · replication and sharding · consistency and CAP · message queues · rate limiting · CDNs · consistent hashing · idempotency. Same lesson model as DSA, with latency budgets where the code tracks have asymptotics; the concept reference stays on the same URL, since its anchors are deep-linked (A14)
  - These carry no walkthrough and no guided exercises, because there is no code to run. `deriveLessonState` already reports a lesson with no exercises as `not_started` rather than counting it complete (B12), so the absence is handled rather than inflating the roadmap

## Phase 4 — Animation breadth (Module B) · *epic* — **in progress**
*Sequence by **lesson** coverage — a topic's lesson is much weaker without its animation.*
- [x] **Structure-shaped renderers, driven by a content-declared `visual`** — the shape cannot be inferred, since a heap, a DP table and a queue are all arrays to the trace. Registry selects by declared kind; unknown falls back to the array picture, which is always truthful (B2)
  - [x] arrays — indexed boxes with a magnitude fill, the ordering cue the old bars carried
  - [x] stacks · queues — top marked; front/back marked, because where you may touch it is the whole difference
  - [x] trees · heaps — circles and edges laid out by **in-order rank**, following VisuAlgo; per-level slotting wasted the width on any tree that is not perfect
  - [x] linked lists — circular vertices joined by arrows, head/tail labelled, null terminator. Adjacent rectangles are a picture of an array, the one structure a list is defined by not being
  - [x] graphs — nodes joined to their neighbours (the adjacency the lesson's algorithm actually uses; not a general force-directed layout the trace cannot justify)
  - [x] hash maps — key-to-value entries appearing as they are inserted, telling a first sighting apart from an increment. **Not drawn as buckets**: the trace knows nothing about placement, so numbered slots would invent a hash the code never chose. Rows are pre-allocated from the trace's own future and hidden until inserted, which keeps H5's no-allocation-per-frame rule without leaking where the run is going
    - The blocker turned out to be imaginary: both adapters already snapshot every live variable on every line, so the map's contents were in the raw trace all along and `toProtocol` was discarding them. Diffing consecutive snapshots recovers `map_put`/`map_delete` with **no runtime change in either language**
  - [x] **DP tables (2-D grid)** — the tracecode.app gap, closed. A rectangular array is recognised as a table and drawn with row and column headers, which is what makes a recurrence legible: `dp[r][c] = dp[r-1][c] + dp[r][c-1]` means nothing against an unlabelled block of numbers and everything when you can watch a cell take the value above plus the one to its left. A ragged array stays a plain collection, since drawing it as a grid would imply a rectangle the data does not have
    - Same blind spot as maps, one dimension up: only the *outer* array of an argument is proxied, so `grid[r][c] = v` writes into an inner array nothing is watching and produces no event. Recovered by diffing the line snapshots both runtimes already emit — again no runtime change, and identical in both languages
    - The DP lesson's walkthrough is now genuinely 2-D (unique paths on a 3×4 grid) rather than a 1-D table standing in for one
  - [ ] segment trees · probabilistic · spatial — no lesson uses them yet; building them now would be speculative
- [x] **B4 complexity overlay and operation counters** — measured steps/reads/writes/time/memory, stated as measurements of one run, never as a complexity proof
- [x] **B5 "explain this state"** — narration generated from the same state the renderer draws, so the two cannot describe different things. Reports the change (`nums[1] changed from 1 to 4`), not just the position
- [x] **Pointer marks earn their claim** — a variable is drawn on the structure only where the source subscripts that collection with it, read statically because no trace can tell an index from a number that happens to be in range
- [x] **Both launch languages per walkthrough**, with a switcher that re-runs rather than relabels — the Python trace comes from `sys.settrace`, the JavaScript one from instrumented QuickJS
- [ ] GIF / shareable-link export (B6) · free-play sandbox (B7) · mobile viewing (B8)
- [ ] Problem ↔ challenge cross-links (B20)

## Phase 5 — Visual roadmaps (Module I) · *epic* — **in progress**
- [x] **Canvas (I1)** — a spine of lesson nodes with each topic's problems fanning off on curved dotted connectors, measured from the reference. Drawn with layout + measured SVG rather than a fixed viewBox, so it reflows and every node stays a focusable link read in curriculum order
- [x] **Node detail panel (I3)** — opens over the roadmap instead of navigating, so a learner keeps their place in the path they were scanning. Lesson pages remain the canonical URLs and the SEO surface; nodes stay real anchors, so only a plain left click is intercepted
- [x] **Self-reported topic status** — Learning · Done · Skip, deliberately *separate* from `deriveLessonState`. That derives what was completed; this is what the learner says. Merging them would let a click count as a completion in the F6 funnel
- [x] **Design Patterns split from System Design (I5)** — 17 named patterns (circuit breaker, saga, CQRS, sidecar) moved to their own catalogue at `/learn/design-patterns`, leaving 41 system design terms. They answer different questions: a pattern has a proper name and is something you *apply*; eventual consistency is something you *reason about*. Keeping them together meant scrolling past forty non-solutions to find a solution
- [x] **Concept reference merged into the path** — System Design lessons declare the terms they cover, so the vocabulary hangs off the lesson that teaches it, exactly as practice problems hang off a DSA lesson. Authored deliberately rather than inferred from category names, because the mapping is genuinely uneven — `networking` splits across load balancing and CDNs, and some terms belong to no lesson. Gated: a lesson claiming a concept that does not exist fails the content check
- [x] **Concept reference as a mind map** — was an accordion of 14 collapsed categories, so finding a term meant guessing which one held it. Now the same spine-and-fan language as the path above it, every term visible without opening anything, with a search that reaches definitions as well as names (you can find Quorum by "majority of replicas"). Slugs stay as anchors, and a deep link opens that term's definition
- [x] **I2 colour-coded legend** — a bordered key beside the graph, as the reference does: what each node fill means, what the done marker means, and what each difficulty rank means. A graph whose colour carries meaning needs a key, or the meaning is decoration
- [x] **I5 three roadmaps** — DSA (two tracks), System Design, and Design Patterns, each on its own surface with the same spine-and-fan language
- [x] **I6 search** — over the concept and pattern maps, reaching definitions as well as names
- [ ] **I4 tri-state per-node progress** (lesson · problem set · challenge) — only the self-reported mark exists; *derived* progress is not shown on a node yet, even though the listings now carry it
- [ ] Search across the DSA roadmap itself (I6, partial) · share/embed (I7) · PDF/PNG export (I8)
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

## Navigation and surfaces

- [x] **Sign-out existed nowhere** — a learner could create an account and had no way out short of clearing cookies, which on a shared machine is a real problem. The header now carries an account menu with the signed-in email, Dashboard, Account, and Sign out
- [x] **Account page made robust (A2, A10)** — was a heading and an email address, which told a signed-in learner nothing they did not know. Now: what the account is holding (problems solved and lesson exercises counted *separately*, so reading lessons cannot inflate a practice number), how they sign in and when each method was added, and a plain statement about data and deletion — including that self-service deletion is not built, which beats a button that does not work
- [x] **Dashboard rebuilt** — it was the one page a signed-in learner lands on and the one that looked least like the product. Same masthead and node treatment as every other surface, all four tracks as destinations, and an honest note that build challenges are unwritten rather than a card going nowhere
- [x] **Profile picture from the provider** — Better Auth already stored `user.image` from Google or GitHub; it is now rendered in the header menu and on the account page, falling back to a coloured initial for password accounts and for a URL that later 404s. Image hosts are allowlisted to the two providers, because `next/image` re-serves whatever URL it is handed and that column is populated from an external profile
- [x] **Run and Submit are separate on problems** — running tests or the visualizer records nothing; only Submit counts toward progress. Running used to mark a problem attempted the first time someone pressed it to see what the cases even were, and passing by accident while exploring silently counted as solving it. Guided lesson exercises still record on a plain run: they are comprehension checks with no submit step
- [x] **Watch it run, with an editable input** — traces the learner's code without grading it, defaulting to the problem's own case. Understanding usually comes from asking "what does it do on an empty array?", which the fixed cases cannot answer. Parsed as JSON rather than evaluated
- [x] **The walkthrough stopped duplicating the editor** — it rendered a read-only copy of the code directly under the real one. The executing line is now pushed back into the learner's own editor, so they watch their own code move
- [x] **Variables pane rebuilt as a debugger's** — was a run-on line, "target 9 i 1 complement 2", with no separation, no types, and a change visible only as a number that quietly differed. Now boxed side by side with the type stated and a change shown as `before → after`. **Collections are listed too**: only one structure is drawn, so the `seen` map two-sum builds was previously invisible while the array it scans was animated
- [x] **Problem difficulty is easy · medium · hard** — the industry's words. Deliberately not the lesson scale (foundational · core · advanced): a lesson is ranked by how much it assumes, a problem by how hard it is to solve, and sharing a vocabulary would imply a mapping that does not exist
- [x] **Profile: LeetCode-style ring, difficulty split, activity heatmap, streaks** — the ring covers the whole catalogue with solved in bold and the rest faded, because a ring showing only solved work always looks complete. Streak tolerates today being empty, since counting strictly back would show zero every morning until someone practised
- [x] **Solved marks on every listing (LeetCode-style)** — a tick per row and an "N / total solved" count, merging server progress with local so a signed-out learner's ticks do not vanish while the A15 migration catches up. One bulk endpoint rather than one request per row, returning ids only — a catalogue needs to know *whether*, never *what*
- [x] **Problem set page restyled** — the last surface still wearing the pre-design-system heading
- [x] **Problems surface rebuilt** — same masthead and node language, topic sets first, then a scannable table shared with the dashboard's filtered view. Deliberately a table rather than the roadmap graph: the roadmap answers "what order?", which is right for a curriculum and wrong for a practice catalogue, where the question is "find me an easy graph problem I have not done"

- [x] **`/learn` hub removed** — the site header lists every track directly, so a page whose only content was links to them was a click of pure overhead. Redirected rather than 404'd: it was linked from inside the product and is exactly the kind of path that ends up in a bookmark
- [x] Four surfaces in the nav: Learn DSA · System Design · Patterns · Problems

## Module K — visual language *(cuts across phases; recorded here because it is not any one phase's task)*

- [x] **Site header (K1)** — dark bar carrying the wordmark, the three surfaces and auth actions; its own tokens, since the notice bar is yellow-on-dark to read as an interruption and sharing them meant restyling one silently restyled the other
- [x] **K5 typography — corrected.** The PRD claimed the reference ships no web font. Re-verified in Chromium: it serves exactly one, `balsamiq.woff2`, applied only to node text; header and headings compute to the system stack. There is no Cerebri Sans, Mona Sans, Inter or JetBrains Mono anywhere in its DOM, CSS or assets. Balsamiq Sans (SIL OFL) is self-hosted via `next/font` and, per direction, carries body copy site-wide with page headings in the system stack — a deliberate departure from the reference
- [x] **Connector blue corrected** — the graph was drawing `--link`, which is the reference's blue *darkened to clear AA as text*, a threshold that never applied to a decorative line. `--connector` is now its own token at the measured `rgb(43,120,228)` / 3.5px
- [x] **Contrast harness gained a `graphic` flag** alongside `large` — same 3:1 bar, different reason. Reading `large: true` on a 2px border says the border is big text, which is the mislabel that darkened the connector in the first place
- [x] **Hover without motion** — a card that lifts moves the text the pointer is aimed at, and on a dense roadmap the whole graph twitched as the cursor crossed it

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
