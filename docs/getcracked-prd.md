# Product Requirements Document
## GetCracked — Interactive DSA, System Design Labs & Company-Wise Interview Prep Platform

**Version:** 1.0
**Date:** August 28, 2026
**Owner:** Ahmad (Sheu Tijani)
**Status:** Draft for handover to engineering (Claude) to generate `features.md`

---

## 1. Purpose of This Document

This PRD is a complete, end-to-end specification of every feature the platform should have — both what already exists on [getcracked.vercel.app](https://getcracked.vercel.app) today, and what needs to be built to reach the target vision: **the most interactive, hands-on place to learn DSA (with animation), System Design (with real labs), and company-specific interview prep (with scraped, structured problem banks).**

This document is written to be handed directly to an engineering assistant (Claude) to derive a `features.md` file that enumerates every feature as a discrete, buildable unit, with acceptance criteria. Section 9 is written specifically for that handover.

---

## 2. Background: What GetCracked Is Today

GetCracked is a hands-on coding platform with the tagline "Build real systems. Step by step. In your browser." Positioning: *not slides, not videos — you write the code and run it against tests.*

### 2.1 Current Site Structure (as explored)

| Area | URL | Description |
|---|---|---|
| Landing page | `/` | Marketing page, pricing, CTA |
| Dashboard | `/dashboard` | Challenge catalog, 3 categories, progress tracker (0/100 done) |
| DSA category | `/dashboard/dsa` | 34 challenges |
| Real-World Systems category | `/dashboard/real-world` | 44 challenges |
| Design Patterns category | `/dashboard/design-patterns` | 22 challenges |
| Learn (System Design concept map) | `/learn` | Free, 129 concepts, no sign-up |
| Challenge step pages | `/challenges/{slug}/{step}` | In-browser IDE + test runner per step |

### 2.1a Target Site Structure (net-new — reflects the DSA two-surface model, §7.2)

The DSA track splits into a **Learn** surface and a **Problems** surface (see 7.2.1), which requires an information-architecture change. `/learn` today means "System Design concept map"; in the target state `/learn` becomes a hub over both tracks and the concept map moves beneath it.

| Area | URL | Description |
|---|---|---|
| Learn hub | `/learn` | Landing over both learning tracks |
| **DSA Learn** | `/learn/dsa` | **Net new** — animated, structured DSA lessons by topic |
| DSA lesson | `/learn/dsa/{topic}` | **Net new** — single lesson: explainer, animated walkthrough, guided exercises |
| System Design concept map | `/learn/system-design` | **Moved** from `/learn` (A14); permanent redirect required from the old path |
| **DSA Problems** | `/problems` | **Net new** — practice problem catalog, grouped into sets |
| DSA problem set | `/problems/{topic}` | **Net new** — the problem set for one topic; always open, with its lesson recommended first |
| DSA problem | `/problems/{topic}/{slug}` | **Net new** — single problem: brief, hints, editor, test runner |
| Challenges (build-it labs) | `/dashboard/{category}`, `/challenges/{slug}/{step}` | Unchanged — the existing multi-step build-it tier |

### 2.2 Current Challenge Model

Each challenge (e.g. `kv-store`, `rate-limiter`, `raft-leader-election`) is broken into **4–6 sequential steps**. Each step has:
- A short brief describing the concept being built
- 2 hints (collapsible, revealed progressively)
- Starter code with `# TODO` / `// TODO` stubs, available in each supported language (Python and JavaScript at launch — see H1)
- An in-browser code editor
- A "Run Tests" action (⌘↩) that executes real tests against the learner's implementation
- Progress tracking per step and per challenge (e.g. "0/5 done · 0%")
- A "next step" flow and a persistent step sidebar

Two challenges per category are free (`kv-store`, `rate-limiter` in Real-World; `trie` is not free but `binary-search` and `lru-cache` are free in DSA; `strategy-cache-eviction` is free in Design Patterns) — the rest require sign-in + subscription to **run** (browsing is free).

### 2.3 Current Content Inventory

**DSA (34 challenges)** — Trie/Autocomplete, Binary Search & Variants, Hash Map, Stacks & Queues, Linked Lists, Two Pointers, Prefix Sums & Kadane, Bit Manipulation, LRU Cache, Bloom Filter, Vector Clocks, Heap/Priority Queue & Scheduler, Graph Dependency Resolver (Topo Sort), Union-Find, Sliding Window, Merge Sort & Quickselect, BST Ordered Map, Greedy & Intervals, Grid Search (BFS/DFS), Count-Min Sketch, Geohash, Quadtree, Consistent Hashing, Dynamic Programming Foundations, Dijkstra Routing, Backtracking, Segment Tree, Minimum Spanning Tree, Bellman-Ford & Floyd-Warshall, String Matching (KMP/Rabin-Karp), HyperLogLog, Cuckoo Filter, Skip List, Merkle Tree.

**Real-World Systems (44 challenges)** — KV Store, WAL & Snapshots, TTL & Active Expiry, Rate Limiter, Circuit Breaker, Thread Pool, HTTP Web Server, Object Store, API Rate Limiter, DNS Resolver, HTTP Client (curl), CDN, Message Queue, Pub/Sub Broker, URL Shortener, JWT, RBAC, Idempotency Keys, Lamport Clocks, SSE, Webhook Dispatcher, Saga Orchestrator, Transactional Outbox, Gossip Protocol, Event Sourcing, Service Registry, MapReduce, Distributed Tracing, Event Loop, Load Balancer, LSM-Tree & SSTables, Reverse Proxy, API Gateway, Database Replication, Database Sharding, Distributed Lock, CRDTs, WebSocket Framing, Two-Phase Commit, Raft Leader Election, Operational Transformation, CQRS, Stream Windowing, Reliable Transport.

**Design Patterns (22 challenges)** — Strategy (Cache Eviction), Adapter (Payments), Facade (Checkout), Factory (Notifications), Singleton (Config Registry), Command (Undo/Redo), Observer (Reactive Store), State (Order Machine), Chain of Responsibility (Middleware), Decorator (Streams), Proxy (Caching), Builder (SQL Query), Iterator (Pagination), Template Method (ETL), Abstract Factory (UI Kit), Prototype (Cloning), Bridge (Renderers), Flyweight (Glyphs), Mediator (Chat Room), Memento (Editor Snapshots), Visitor (Expression Evaluator), Interpreter (Rule Engine).

**Learn / System Design Concept Map (129 concepts, free, no sign-up)** — 20 sub-categories: Fundamentals, Consistency & Availability, Networking & Traffic, Application Layer, Databases, Caching, Asynchronism & Communication, Performance Antipatterns, Monitoring & Observability, Cloud Patterns (Design & Implementation / Data Management / Messaging), Reliability Patterns, Security Patterns.

### 2.4 Current Pricing

- **Free tier:** browse all 100 challenges, read all 129 concept-map entries, run a handful of marked "Free" challenges.
- **Paid tier:** $20/month (or annual, ~21% discount) — unlocks running tests on all 100 challenges, browser IDE with real test execution, "new challenge every newsletter issue."

> **Target-state note:** this PRD specifies the platform moving to **100% free** — see Section 2.6.

### 2.5 Current Gaps (why this PRD exists)

1. **DSA is purely code-and-test.** There is no visual/animated representation of what's happening to the data structure as code runs (no array swaps, no tree rotations, no pointer movement, no graph traversal highlighting).
1a. **DSA has no taught path — only builds.** The 34 DSA challenges are all deep "implement it from scratch" builds. There is no lesson layer that *teaches* a topic before asking the learner to apply it, and no volume tier of shorter interview-style problems between "read nothing" and "build an LRU cache from nothing." A beginner has no on-ramp. See §7.2.1.
2. **System Design is a static, text-based concept map.** There are no interactive labs for System Design specifically (the "Real-World Systems" challenges are code labs, not System Design *diagramming/capacity-planning/trade-off* labs).
3. **No company-specific interview content.** There's no way to filter or study problems by company (Google, Amazon, Meta, etc.), and no scraped/aggregated bank of real, recently-asked interview questions.
4. **No mock interview simulation** (verbal/whiteboard/timed).
5. **No community layer** (discussion, solutions sharing, leaderboards).
6. **No progress analytics / spaced repetition** beyond a raw completion percentage.

### 2.6 Target Pricing & Access Model — Everything Free, Sign In Only Where It Earns Its Keep

**Every feature in this document, existing and net-new, is free — no paywall, no subscription tier, no paid add-on.** Sign-in is required **only where an account is genuinely needed**: to keep progress, to personalize, or to spend money on the learner's behalf. Everything else works signed out.

**The line, and why it falls there.** The expensive part of this product — running code, capturing traces, animating — happens **in the learner's browser** (AD-2). An anonymous visitor solving a problem costs the platform essentially nothing. So there is no cost argument for a sign-in wall, and no product argument either: a wall in front of the first lesson is the single most effective way to lose the beginner this platform exists to serve.

What an account *is* needed for is anything that must outlive the browser tab, follow the learner between devices, know who they are, or bill someone.

| Works signed out | Requires sign-in |
|---|---|
| Browse the catalog and dashboard | Progress that persists across devices, streaks, badges, certificates (F3) |
| Read any DSA lesson (B9) and the 129-entry concept map (A14) | Roadmap per-node progress synced to an account (I4) |
| Open **and solve** any problem, challenge, or lab — editor, test runner, and animation all included | Study plans (F5), spaced repetition (F2), skill diagnostic (F1), personal analytics (F4) |
| View every roadmap (I1–I8) | Discussions, solution sharing, leaderboards (Module G) — these need an identity |
| Browse and search the company question bank (D6) | The AI assistant (Module L) — it costs real money per use (L9) and needs abuse limits |
| | Question-bank alerts and subscriptions (D9); admin and editorial tooling (D10, J10) |

Concretely:

- A11 (free-vs-paid gating) and A12 (subscription billing) remain **removed** from scope. There is no "free" versus "paid" account; there is only "signed out" and "signed in," and the difference is persistence and personalization, never access to content.
- A2 (Auth) is **not** a hard gate in front of the product. It gates account-scoped data, not the curriculum.
- **Anonymous progress is kept locally** and offered for migration at sign-up: a learner who solves three problems signed out should be invited to "keep your progress" rather than told their work is gone. See A15.
- Module D's question bank is browsable signed out; only alerts (D9) need an account.
- Monetization, if pursued at all, must come from outside the core learning surface (donations, sponsorships, job-board placements, or a separate B2B/enterprise offering) — none of that is in scope for this PRD.

**What this costs, stated honestly.** The previous model justified mandatory sign-in as the trade that "funds free access with usage data." That justification is now gone, and F6's analytics weaken accordingly: signed-out activity can be measured in aggregate against an anonymous device identifier, but it cannot be tied to a person, followed across devices, or joined to later signed-in behaviour except at the moment of migration (A15). That is a real loss of analytical fidelity, accepted deliberately in exchange for not putting a wall in front of a beginner.

**What this gains.** Public content is indexable. The lessons, the concept map, and the question bank become an organic acquisition channel rather than an invisible walled garden — which for a free product built for the tech community is likely worth more than the analytics given up. See the SEO note in [ADR 0001 §1](adr/0001-stack.md).

---

## 3. Vision & Goals

**Vision:** GetCracked becomes the single platform where a candidate can (a) *see* DSA concepts animate as they write real code, (b) *build* actual distributed systems in guided labs while also practicing System Design at the whiteboard/capacity-planning level, and (c) prepare for a *specific company's* interview loop using a continuously refreshed, scraped question bank — all in one coherent, gamified product.

**Primary goals for this PRD:**

1. **G1 — Animated DSA Learning, split into Learn and Practice:** The DSA track is delivered as two surfaces — a **Learn** surface of animated topic lessons, and a **Problems** surface of interview-style practice — where **a problem set unlocks only once its lesson is complete** (§7.2.1). Across all of it, every code exercise gets a synchronized visualization that animates the learner's own execution (not a canned demo) — array/pointer movement, tree/graph state, heap structure, hash bucket state, etc.
2. **G2 — System Design Labs:** A new lab type, distinct from "Real-World Systems" code labs, focused on System Design interview practice: interactive whiteboard/diagramming, capacity estimation calculators, guided trade-off decision trees, and scored design reviews — built on top of the existing 129-concept knowledge base.
3. **G3 — Company-Wise Interview Problems:** A structured, regularly-updated database of interview questions tagged by company, role, and round type, sourced by scraping/aggregating public data (LeetCode discuss, Glassdoor, Blind, GitHub interview-question repos, company engineering blogs), with de-duplication, tagging, and freshness tracking.
4. **G4 — Competitive Parity+:** Close feature gaps versus NeetCode, AlgoExpert, LeetCode, HelloInterview, ByteByteGo/DesignGurus (Grokking) — see Section 4 — while keeping GetCracked's differentiator (real code, real tests, real systems) as the core identity.
5. **G5 — Fully Free, Minimally Gated:** Every feature ships with no paywall and no paid tier, and sign-in is required only where an account genuinely earns its keep — persisting progress, personalization, or per-use cost. Every learning surface works signed out — see Section 2.6.
6. **G6 — Pipeline-Sourced Curriculum:** The problem catalog is built by ingesting and canonicalizing public, appropriately-licensed material at scale (Module J) rather than hand-authored, because hand-authoring several hundred multi-language problems is not a realistic commitment for this team.
7. **G7 — One Visual Language:** The whole platform adopts a single, consistent design system modelled on roadmap.sh's visual language (Module K), so a lesson card, a problem row, and a roadmap node visibly belong to the same product.

---

## 4. Competitive Feature Landscape

Research into the leading DSA and System Design prep platforms surfaced the following feature set. This directly informs Section 7 (net-new features).

### 4.1 DSA-focused competitors

| Platform | Core model | Strong features | Weaknesses vs. GetCracked |
|---|---|---|---|
| **LeetCode** | Massive problem bank (2,700+), online judge | Largest problem volume; **company-tagged problems**; contests; discuss forums; multiple language support | No guided/animated learning; no structured curriculum |
| **NeetCode** | Curated roadmap + YouTube video walkthroughs | NeetCode 150 / NeetCode All curated lists; strong free tier; pattern-based roadmap; large community (Discord/Reddit) | <cite index="7-1">Not structured as a rich learning ecosystem</cite>; primarily video-first, not code-you-write-and-see-animate |
| **AlgoExpert** | ~100 hand-picked problems with polished video explanations | <cite index="12-1">Polished video content with clean animations</cite>; <cite index="14-1">interactive coding interface built into the platform</cite> | <cite index="7-1">Doesn't go deep in quantity; small problem set relative to LeetCode</cite>; lacks a distributed-systems/real-infra angle entirely |
| **AlgoMonster** | Structured pattern-based curriculum | Emphasizes recognizing patterns in *novel* problems rather than memorization | Smaller brand/community than NeetCode/LeetCode |

**Takeaway for GetCracked:** The animation/visualization gap is the single biggest opportunity — AlgoExpert's "clean animations" are pre-recorded video, not live visualizations of the learner's *own* code. GetCracked can own "watch your own code move the data structure."

### 4.2 System-Design-focused competitors

| Platform | Core model | Strong features | Weaknesses |
|---|---|---|---|
| **ByteByteGo (Alex Xu)** | Illustrated books + online content | <cite index="17-1">Covers System Design, coding patterns, GenAI system design, ML system design, and behavioral interviews</cite>; <cite index="17-1">AI-assisted whiteboarding feature with feedback while solving problems</cite>; strong visual diagram library | Not hands-on/code-based; no live systems to build |
| **HelloInterview** | Guides + (formerly) AI mock interviews | <cite index="15-1">Company-specific rubric guides (e.g. a "Meta Guide" breaking down what interviewers look for)</cite>; <cite index="15-1">"Guided Practice" step-by-step fill-in-the-blank design flows</cite> | <cite index="15-1">Deprecated its AI Mock Interviewer in favor of static guided practice and paid human coaching</cite>; <cite index="15-1">library is narrower, focused on a "Top 20" question set</cite> |
| **Grokking the System Design Interview (DesignGurus.io)** | Structured, sequential course | Defined curriculum with a beginning/end; senior-level volume 2; lifetime-access pricing model | Text-based, not interactive labs |
| **Codemia.io** | LeetCode-style System Design practice | Structured problem-attempt-feedback loop specifically for System Design | Smaller content library |

**Takeaway for GetCracked:** No competitor combines *code-runnable infra labs* (which GetCracked already uniquely has, e.g. Raft, LSM-Trees, Consistent Hashing) with a *System-Design-interview-specific* practice mode (diagramming, capacity math, trade-off scoring, company rubrics). This is a clear white space — GetCracked's 44 Real-World Systems + 129 concepts are the raw material; what's missing is the *interview simulation layer* on top.

### 4.3 Company-specific / interview-loop competitors

- LeetCode's company-tagged problem lists (subscription-gated) are the dominant reference point.
- HelloInterview's company-specific guides show demand for "what does Company X actually ask, and what do their interviewers score."
- No platform currently combines company-tagged **DSA questions** + company-tagged **System Design questions** + a scraped/refreshed pipeline in one product — this is GetCracked's opportunity (G3).

---

## 5. Target Users & Personas

1. **New-grad / early-career candidate** — needs structured DSA fundamentals with visual intuition, not just code.
2. **Mid-level engineer prepping for a specific company loop** (e.g. "I have an Amazon onsite in 3 weeks") — needs company-tagged DSA + System Design + behavioral content.
3. **Senior/staff engineer prepping System Design rounds** — needs deep, code-backed distributed systems labs plus a way to practice articulating trade-offs under time pressure.
4. **Self-taught / bootcamp learner** — needs the free concept map plus animated fundamentals to build real understanding, not memorization.

---

## 6. Design Principles

1. **Show, don't just test.** Every learning surface should visually reflect what's actually happening in the learner's code or design, not a canned animation.
2. **Real code, real systems, real tests — never compromise this identity** even as System Design and company-prep features are added.
3. **Progressive disclosure.** Hints, animations, and solutions unlock progressively so learners aren't spoiled.
4. **Freshness as a feature.** Company-wise content must visibly show "last verified" / "last seen asked" dates — staleness kills trust in this category.
5. **Everything is free, and most of it is anonymous.** Nothing sits behind a paywall, and nothing sits behind a sign-in wall unless an account is genuinely required — to persist progress, to personalize, or because the feature costs money per use. A learner should be able to arrive, read a lesson, solve a problem, and watch their own code animate without ever creating an account. Sign-in is offered when it starts to *earn* something: keeping the work. See §2.6.
6. **Guide, never gate.** The platform has a strong opinion about the order to learn things in — and expresses it through sequencing, defaults, and visible progress, **never through locks**. Nothing on GetCracked is locked: no lesson, no problem, no challenge, no lab. A beginner is given a path; a senior engineer who already knows sliding window can go straight to the problems. The recommended order is a handrail, not a turnstile. See B16.

---

## 7. Feature Set — Full Enumeration

### 7.1 Module A — Core Platform (existing, to retain/harden — now 100% free, see 2.6)

- A1. Landing page with value prop, CTAs (no pricing page needed — platform is entirely free)
- A2. Auth (sign in / sign up) — gates **account-scoped data only** (progress sync, personalization, community identity, assistant access), never content. Every learning surface works signed out (§2.6). Powers per-user tracking (F4) for those who do sign in
- A16. **Signed-out status notice — the disclosure surface.** Every signed-out learner sees a persistent, dismissible notice explaining that their progress is saved on this device only and that signing in keeps it across devices. This is deliberately doing two jobs at once: it is the A15 migration prompt, and it is where the platform tells an anonymous visitor that their activity is being recorded (F6 tier two, Open Question 7). Burying that in a policy page nobody opens would be the dishonest version. It must state the trade plainly, link to the full privacy note, and never block the page
- A15. **Anonymous progress with migration on sign-up**: a signed-out learner's progress, submissions, and revealed hints are kept in local browser storage and surfaced as an explicit prompt to keep them ("You've solved 3 problems — create an account to save them"). On sign-up, local state is merged into the account rather than discarded. Losing a beginner's first hour of work is the fastest way to lose the beginner
- A3. Dashboard with category tabs and aggregate progress (X/N done, %), plus top-level navigation across the three DSA tiers — Learn (`/learn/dsa`), Problems (`/problems`), and Challenges (`/challenges`) — per §2.1a
- A4. Category-level filters: difficulty (beginner/intermediate/advanced), topic/domain tags
- A5. Challenge detail page: multi-step flow, step sidebar, per-step progress
- A6. In-browser code editor with syntax highlighting and a **language switcher** — Python and JavaScript supported at launch (see H1); architecture must stay extensible to further languages (Java first) without reworking the editor or test-runner contract
- A7. In-browser test runner sandbox — executes learner code against real assertions, returns pass/fail with diffs
- A8. Hints system (progressive, collapsible, 2+ per step)
- A9. Starter code scaffolding with `TODO` markers
- A10. "Copy link for later" / resume-progress across sessions and devices
- A11. ~~Free-vs-paid gating~~ — removed; all challenges are fully runnable by everyone, no tier distinction
- A12. ~~Subscription billing~~ — removed; no paid tier exists
- A13. Newsletter-linked new-challenge cadence
- A14. System Design Concept Map (129 concepts, 20 categories, expand/collapse all) — **moves from `/learn` to `/learn/system-design`** now that `/learn` is a hub over both tracks (§2.1a); a permanent redirect from the old path is required. Free and readable signed out (§2.6) — it is one of the platform's strongest organic-acquisition surfaces. This is the System Design track's tier-1 equivalent of the DSA Learn surface (B9)

### 7.2 Module B — DSA Learn & Practice (G1 — net new)

#### 7.2.1 The two-surface model (structural)

The DSA track is delivered as **two distinct surfaces with a strong recommended order between them**:

1. **Learn** (`/learn/dsa`) — structured, animated lessons that teach a topic: what the structure or pattern is, how it behaves, when to reach for it, and what it costs. This is where the animation engine (B1–B8) does its primary work.
2. **Problems** (`/problems`) — interview-style practice problems grouped into one **problem set per Learn topic**, where the learner applies what the lesson taught.

**Nothing is locked.** Every lesson, problem, challenge, and lab is open to every signed-in user from their first minute, in any order. The platform's opinion about sequencing is expressed through ordering, defaults, progress state, and contextual nudges — never through access control (B16, §6 principle 6).

What separates GetCracked from a bare problem bank is therefore not a gate but a **path**: a beginner arriving at a topic sees the lesson first, sees exactly which problems it prepares them for, and is nudged back to the lesson if they struggle. A senior engineer who already knows the pattern skips straight to the problems and is never asked to sit through a lesson to reach them. The curriculum earns its authority by being useful, not by being mandatory.

This also turns a tautology into a real measurement. Under a hard gate, "learners who completed the lesson before starting the set" is 100% by construction and tells us nothing. Ungated, it becomes a genuine signal about whether the lessons are worth doing — and that signal is what §8's funnel metrics now track.

This gives the DSA track **three tiers**, in increasing depth:

| Tier | Surface | Unit | Purpose |
|---|---|---|---|
| 1. Learn | `/learn/dsa` | Lesson | Understand the structure/pattern, with animation |
| 2. Problems | `/problems` | Problem (single-function) | Apply it under interview-shaped conditions |
| 3. Challenges | `/challenges` | Multi-step build (4–6 steps) | Build the structure itself from scratch |

The existing 34 DSA challenges (§2.3) are **tier 3** — they are not replaced by the Problems surface. Tier 2 is higher-volume, single-function, interview-style practice; tier 3 is the deep "implement an LRU cache from nothing" build. A topic's roadmap node (I4) is only fully complete when all three tiers are.

The System Design concept map (A14) is the System Design track's equivalent of tier 1, which is why it moves under the same `/learn` hub (§2.1a).

#### 7.2.2 Animation engine (powers all three tiers)

- B1. **Live execution visualizer** synced to the learner's own code: on "Run Tests," step through the learner's function call-by-call and render the data structure's state at each step (not a pre-baked demo).
- B2. Structure-specific animation renderers:
  - Arrays/lists: index highlighting, swap animations, pointer markers (two-pointer, sliding window boundaries)
  - Linked lists: node-and-arrow diagrams, pointer reassignment animation (reverse, cycle detection with Floyd's tortoise/hare visualized)
  - Trees (BST, Trie, Segment Tree): node insert/delete/rotation animation, traversal order highlighting
  - Graphs: node/edge highlighting for BFS/DFS/Dijkstra/topological sort, "visited" vs "frontier" vs "unvisited" coloring, path reconstruction animation
  - Heaps: array-as-tree dual view, sift-up/sift-down animation
  - Hash maps: bucket array with chaining visualization, collision and resize animation
  - Stacks/Queues: push/pop/enqueue/dequeue animation with LIFO/FIFO cues
  - Union-Find: forest visualization with path compression animation
  - Probabilistic structures (Bloom filter, HyperLogLog, Count-Min Sketch, Cuckoo filter): bit-array/register visualization with hash-function fan-out animation
  - DP tables: grid fill animation showing memoization/tabulation order and final traceback path
  - Spatial structures (Quadtree, Geohash, Consistent Hashing ring): 2D/ring visualization with region subdivision or key redistribution animation
- B3. Playback controls: step forward/back, play/pause, speed control, "jump to failure point" (auto-seek to the first step where learner's output diverges from expected)
- B4. Complexity overlay: live Big-O annotation and operation counters (comparisons, swaps, recursive calls) shown alongside the animation
- B5. "Explain this state" tooltip — hover any node/element mid-animation for a plain-language explanation of why it's in that state
- B6. Animation replay/export as shareable GIF or link (for study notes, social sharing — growth loop)
- B7. Sandbox/free-play mode: manipulate a structure directly (drag nodes, insert arbitrary values) outside of a challenge, to build intuition before coding
- B8. Mobile-friendly animation rendering (the existing challenge editor already requires desktop; visualizer should at minimum be viewable, if not editable, on mobile)

#### 7.2.3 Learn surface (tier 1 — net new)

- B9. **DSA Learn surface** (`/learn/dsa`): a structured, ordered catalog of topic lessons spanning the DSA curriculum — arrays, hashing, two pointers, sliding window, stacks/queues, linked lists, trees, tries, heaps, graphs, union-find, sorting/searching, greedy, dynamic programming, bit manipulation, intervals, and the advanced/probabilistic structures already covered by the tier-3 catalog (§2.3)
- B10. **Lesson content model**: every lesson contains, in order — (a) a plain-language concept explainer, (b) an **animated walkthrough** of the structure or pattern in action, driven by the B1–B8 engine on a reference implementation, (c) complexity analysis with the operation counters from B4, (d) **pattern-recognition cues** ("you are looking at a sliding-window problem when…"), and (e) common pitfalls and off-by-one traps
- B11. **Guided in-lesson exercises**: short, single-concept code tasks embedded inside a lesson and checked immediately — small enough to be a comprehension check, not a full problem. These are the learner's first execution of the pattern, with the animation running alongside
- B12. **Lesson completion tracking**: a lesson is complete when its guided exercises (B11) pass; state is `not-started` / `in-progress` / `complete`, stored per user, and feeds the recommendation engine (B16), the roadmap node state (I4), and the analytics funnel (F6). Completion state drives *guidance and progress display only* — it never controls access to anything
- B13. **Lesson → Problems handoff**: every lesson ends with an explicit bridge into its matching problem set ("You've learned sliding window — here are 12 problems that use it"), so finishing a lesson always has an obvious next action
- B14. **Free navigation everywhere**: a learner may read any lesson, open any problem, and start any challenge or lab in any order, at any time, having completed nothing. This applies to every surface in the product, not just DSA

#### 7.2.4 Problems surface (tier 2 — net new)

- B15. **DSA Problems surface** (`/problems`): a catalog of single-function, interview-style practice problems, grouped into **one problem set per Learn topic**, with each problem carrying a brief, progressive hints (A8), starter code (A9), an editor (A6), and a real test runner (A7) — the same execution machinery as tier 3, but a single problem rather than a multi-step build
- B16. **Recommended sequencing — guidance, never locks.** Problem sets declare their prerequisite lesson(s), and the platform uses that relationship to *guide* rather than restrict. Concretely:
  - A set whose prerequisite lesson is incomplete is fully enterable, but is visibly marked as such with a one-click path to the lesson ("Most people do the *Sliding Window* lesson first — 4 min read")
  - Default ordering, roadmap layout (I5), and study plans (F5) all present the recommended order first, so the guided path is the path of least resistance
  - **Struggle-triggered nudges**: a learner who fails a problem several times, or leans on every hint, is offered the prerequisite lesson at the moment it is actually useful — which is where a lock would have been merely annoying
  - Multi-prerequisite sets (e.g. graph shortest-path draws on both *Graphs* and *Heaps*) surface all recommended lessons, still without restricting entry
  - Dismissing a recommendation is remembered — a learner who skips a lesson deliberately is not asked again for that topic
- B17. **Difficulty progression within a set**: each set is ordered warm-up → core → stretch, so the first problem after a lesson is deliberately gentle and reinforces the exact pattern just taught
- B18. **Per-set mastery**: a set is complete at a defined threshold (e.g. all core problems solved; stretch problems optional), which drives streaks and badges (F3) and the roadmap node state (I4). Mastery marks progress and adjusts what is *recommended* next — it never unlocks anything, because nothing is locked
- B19. **Company tagging on problems**: problems carry the same company tags as the Module D question bank (D1/D4), so a learner can filter any set to "problems Meta has asked"
- B20. **Problem ↔ Challenge cross-links**: where a problem's topic has a matching tier-3 build-it challenge (e.g. LRU cache problems → the `lru-cache` challenge), the set offers the deeper build as a next step, mirroring the C6 bridge on the System Design side
- B21. **Progress is computed server-side**: completion and mastery state are derived on the server from real test-run results, never self-reported by the client, because they feed roadmap completion (I4), study-plan sequencing (F5), and the analytics funnel (F6). This is a data-integrity requirement, **not** an access-control one — there is nothing to enforce, since every route is open to every signed-in user (B14)

### 7.3 Module C — System Design Labs (G2 — net new)

- C1. **Interactive whiteboard/diagramming canvas**: drag-and-drop components (load balancer, cache, DB, queue, CDN, service) with connecting arrows, built on the existing 129-concept vocabulary so every component links back to its concept-map entry
- C2. **Guided design labs**: scenario-based prompts ("Design a URL shortener for 100M users/day") with a step-by-step guided mode (clarify requirements → estimate scale → high-level design → deep dive → trade-offs) mirroring the industry-standard interview framework
- C3. **Capacity estimation calculator**: interactive tool for QPS, storage, bandwidth back-of-envelope math, with guided prompts and answer-checking against reasonable ranges
- C4. **Trade-off decision trees**: for recurring decisions (SQL vs NoSQL, push vs pull CDN, sync vs async, strong vs eventual consistency), an interactive Q&A that scores the learner's reasoning against the actual constraints of the scenario
- C5. **Design review scoring rubric**: auto-graded + optionally peer/mentor-reviewed rubric (mirrors the "what interviewers actually look for" company-guide model) covering requirements gathering, API design, data model, scaling strategy, bottleneck identification, and trade-off articulation
- C6. **Linked "build it" mode**: every System Design lab that has a matching Real-World Systems code challenge (e.g. "Design a rate limiter" → `rate-limiter` challenge; "Design a URL shortener" → `url-shortener` challenge) offers a one-click bridge from the whiteboard exercise into the actual code lab — this is GetCracked's unique differentiator versus ByteByteGo/HelloInterview/Grokking, none of which have runnable code labs
- C7. **Timed mode**: 35–45 minute timer simulating real interview conditions, with a post-session self/auto review
- C8. **Company-specific design rubrics** (see Module D) surfaced contextually inside relevant labs (e.g. "This is how Meta interviewers typically weight this problem")
- C9. **Concept-map deep links**: every component/term used in a lab links directly to its existing `/learn` concept-map entry (reuses A14 rather than duplicating content)
- C10. **Solution gallery**: view sanitized example designs from other users or curated "reference" solutions after completing a lab (never before, to avoid spoiling)

### 7.4 Module D — Company-Wise Interview Problems (G3 — net new)

- D1. **Company filter across all content types** — DSA challenges, System Design labs, and a new raw "Question Bank" can all be filtered by company (Google, Amazon, Meta, Microsoft, Apple, Netflix, Uber, Stripe, etc.)
- D2. **Scraping/aggregation pipeline** (backend, not user-facing) that ingests public interview-question signals from:
  - LeetCode "Discuss" company-tagged threads
  - Glassdoor interview review text
  - Blind (teamblind.com) posts
  - Public GitHub repos of crowdsourced interview questions
  - Company engineering blogs / careers pages (where they publish sample problems)
  - Reddit (r/leetcode, r/cscareerquestions) company-tagged threads
- D3. **De-duplication & canonicalization engine**: cluster near-duplicate reports of the same underlying question (e.g. many different phrasings of "two sum" reported at multiple companies) into one canonical problem with a list of companies/dates it was reported at
- D4. **Tagging metadata per question**: company, team/org (if known), role level (new grad / mid / senior), round type (phone screen / onsite / take-home / System Design / behavioral), topic tags (reuses existing DSA/System-Design taxonomy), and a **freshness indicator** ("reported 2 weeks ago" / "last verified March 2026")
- D5. **Mapping to existing GetCracked content**: where a scraped question closely matches an existing DSA or System Design challenge, auto-link it ("Amazon asked a variant of our LRU Cache challenge — practice it here") rather than duplicating content
- D6. **Question Bank UI**: standalone browsable/searchable list (search by company, role, topic, recency) with each entry showing canonical prompt, source count ("reported by 14 candidates"), difficulty, and linked GetCracked lab if one exists
- D7. **Company interview-loop guides**: for top-tier companies, an editorial page summarizing the typical loop structure (# of rounds, what each round tests, scoring emphasis) — informed by aggregated scraped data plus curated editorial content, similar to HelloInterview's company guides but kept fresh via the pipeline
- D8. **Freshness/legal compliance layer**: source attribution, respect for `robots.txt` and platform ToS on all scraped sources, rate-limited/polite crawling, and a takedown-request process; store only question *substance* (paraphrased/canonicalized) rather than verbatim copyrighted text where source ToS requires it
- D9. **Alerting/subscription**: "notify me when a new question is reported for Company X" — ties into the existing newsletter cadence (A13)
- D10. **Admin/editorial review queue**: human-in-the-loop moderation before scraped questions go live, to catch mis-tagging and low-quality/unverifiable reports

### 7.5 Module E — Mock Interview & Assessment (competitive-parity, net new)

- E1. Timed, single-question mock mode for DSA (simulates LeetCode/HackerRank-style timed judge) with post-attempt complexity/quality feedback
- E2. Timed System Design mock mode (uses Module C's guided lab in "no hints" mode with a hard timer)
- E3. AI-assisted mock interviewer (voice or chat) that asks clarifying questions and probes trade-offs during a System Design lab attempt — differentiator vs. HelloInterview, which recently deprecated its own AI mock tool
- E4. Optional human/peer mock-interview matching (lower priority — many competitors have pulled back from this due to cost; consider as a later-phase, marketplace-style add-on)
- E5. Post-mock scorecard: correctness, time-to-solution, complexity, communication/trade-off articulation (for System Design), stored in a longitudinal history

### 7.6 Module F — Progress, Personalization & Gamification

- F1. Skill-gap diagnostic (short assessment on sign-up) that recommends a starting path across DSA/System Design/company-specific tracks
- F2. Spaced-repetition scheduler: resurfaces previously-failed or previously-hinted challenges after an interval
- F3. Streaks, badges, and completion certificates per category/company track
- F4. Personal dashboard analytics: time spent, pattern-level strength/weakness breakdown (e.g. "strong on trees, weak on DP"), not just raw % complete
- F5. Custom study plans (e.g. "Amazon SDE2 in 4 weeks") that sequence DSA challenges + System Design labs + company question bank items into a day-by-day plan
- F6. **Full-funnel usage data collection, in two tiers.** Signed-in activity (challenge starts/completions, hint reveals, test-run attempts and outcomes, time-on-task, animation interactions, roadmap-node progress, company-track selections) is attributed to the account. Signed-out activity is recorded against a rotating **anonymous device identifier**, so aggregate funnels, drop-off points, and content effectiveness are measurable from day one. It is tied to no person and cannot be followed across devices, and the learner is told it is happening (A16). The two tiers join only at the moment of migration (A15), if the learner chooses to sign up. The two join only at the moment of migration (A15), if the learner chooses to sign up.
  - This is a deliberate reduction in fidelity from the earlier mandatory-sign-in model (§2.6). Metrics that require a stable identity — retention cohorts, cross-device journeys, per-user tier progression — are only computable over the signed-in population, and every §8 metric must state which population it covers rather than silently mixing them

### 7.7 Module G — Community & Content Layer

- G1. Per-challenge/lab discussion threads (solutions, questions, hints from other learners) — moderated
- G2. Public solution sharing (opt-in, post-completion only, to avoid spoilers)
- G3. Leaderboards (per challenge, per company track, global) — optional/toggleable for users who prefer not to compete
- G4. Editorial blog/content hub for company-specific prep guides (complements D7)

### 7.8 Module H — Platform / Non-Functional Requirements

- H1. **Multi-language code execution — launch set: Python and JavaScript. Java is suspended, not cancelled.** Both launch languages are supported across the Learn, Problems, and Challenges surfaces: every exercise ships starter code, a reference solution, and an equivalent test suite in each, and the learner can switch languages at any point without losing progress.
  - **Java is deferred to a later phase.** Java was originally in the launch set, but it is the one target with no settled in-browser execution story: a JVM-in-WASM runtime (CheerpJ, TeaVM) carries licensing, bundle-size, and cold-start costs, and a server-side container runner introduces recurring compute expense on a platform with no revenue (§2.6) *and* breaks the single-deployment constraint in H8. Rather than let that unknown gate the whole platform, Java is suspended until the execution model is resolved on its own timeline. It remains the **first language to add back**, ahead of any other.
  - **The architecture must not calcify around two languages.** The execution sandbox (H2), the test-result contract (A7), and the animation trace protocol (B1) are all designed language-agnostically from day one, so restoring Java — or adding TypeScript, Go, C++, or Rust later — is a matter of implementing one runtime adapter, not reworking the platform. Python (CPython via WebAssembly) and JavaScript (native) have deliberately different execution stories precisely so the abstraction is proven against real variation rather than assumed.
  - Feature parity across languages is a launch requirement for *execution*, but the animation engine (Module B) may launch with deeper structure coverage in one language and reach parity incrementally, provided the trace protocol itself is shared.
- H2. Sandboxed, secure code execution (already implied by A7) hardened for the new visualization hooks (execution tracing must not leak or allow escapes)
- H3. Mobile-responsive read/browse experience across Learn, Question Bank, and progress dashboard (editor/labs can remain desktop-first per existing messaging)
- H4. Accessibility: animations must have a non-animated/text-equivalent fallback (screen-reader-friendly state descriptions) for B1–B8
- H5. Performance: visualizer must render at 60fps for structures up to a reasonable size cap (define cap per structure type, e.g. arrays ≤ 500 elements)
- H6. Data pipeline observability for Module D (scrape success/failure rates, dedup accuracy, freshness SLAs)
- H7. Privacy/ToS compliance review for all scraped sources prior to launch (legal sign-off gate)
- H8. **Built as a single Next.js fullstack application** — one codebase/deployment covering the frontend (dashboard, editor, animations, roadmap, whiteboard canvas) and backend (auth, API routes/server actions, code-execution orchestration, database access, scraping-pipeline triggers) rather than a separate frontend app + backend service. This is an architectural constraint for every module in Section 7, not a standalone feature: code sandboxing (A7/H2), the scraping pipeline (D2), and real-time visualizer state (B1) all need to be designed to work within a Next.js server-route/edge-function model.
- H9. **Third-party inference dependency (Groq)**: Module L introduces an external inference provider on the request path. Requires a configured model ID (L1), server-side key handling that never reaches the client, graceful degradation when the provider is slow or down (the assistant is never load-bearing for solving a problem), and the spend controls in L9.
- H10. **Long-running jobs do not fit the serverless request model**: Modules D and J both need scheduled, long-running crawl and transformation work that exceeds serverless execution limits. This is the most likely deviation from H8 and must be resolved explicitly — scheduled functions with chunked work, or a separate worker — rather than discovered at deploy time.

### 7.9 Module I — Visual Roadmaps (roadmap.sh-style, net new, free)

A dedicated, visual, node-and-connector learning roadmap for each major track (DSA, System Design, Design Patterns, and Company-Specific Prep), modeled directly on the [roadmap.sh](https://roadmap.sh) format: a large, zoomable/scrollable flowchart of topic nodes connected by directional lines, showing what to learn, in what order, and how topics branch or converge.

- I1. **Flowchart-style roadmap canvas** per track: topic nodes rendered as connected boxes in a top-to-bottom (or left-to-right) tree/graph layout, pan-and-zoom, matching roadmap.sh's visual language (rounded rectangle nodes, directional connector lines, section groupings)
- I2. **Node color-coding legend**, matching roadmap.sh's convention: e.g. *Required/Core* nodes vs *Optional* nodes vs *Alternative* (either/or) paths, with a visible legend key
- I3. **Click-to-expand node detail panel**: clicking a roadmap node (e.g. "Hash Maps," "Load Balancing," "Consistent Hashing") slides open a side panel with a short explainer and direct links to the matching GetCracked content — for a DSA node this means all three tiers in order (lesson B9 → problem set B15 → build-it challenge), with the problem set marked as "lesson recommended first" where the lesson is incomplete — shown, never locked (B16); for other tracks, the System Design lab (Module C), concept-map entry (A14), or company question bank entries (Module D) — so the roadmap is the *navigation layer* over existing content, not a content duplicate
- I4. **Per-node progress marking**: nodes visually fill in / change state (not-started, in-progress, done) as the learner completes the linked challenge or lab, exactly mirroring roadmap.sh's "mark as done/mark as learning" node states
- I5. **Multiple roadmaps**:
  - **DSA Roadmap** — sequences the DSA **topics** (not just the 34 challenges) from beginner fundamentals (arrays, hashing, stacks/queues) through advanced structures (segment trees, skip lists, Merkle trees), branching where topics are independent (e.g. Bit Manipulation branches separately from Graph algorithms) and converging where one depends on another (e.g. Heaps → Dijkstra). Each node represents one topic across all three tiers (§7.2.1) and shows tri-state progress — lesson done, problem set done, build-it challenge done — so the roadmap is the visual expression of the same B16 recommended ordering the Problems surface suggests — it shows the path, it does not bar any part of it
  - **System Design Roadmap** — sequences the 129 concept-map entries and the System Design labs (Module C) from fundamentals (CAP theorem, latency vs throughput) through networking, databases, caching, messaging, and reliability patterns, mirroring the general shape of roadmap.sh's own "System Design" roadmap but linked to GetCracked's own labs instead of external resources
  - **Design Patterns Roadmap** — sequences the 22 design-pattern challenges grouped by pattern family (Creational, Structural, Behavioral)
  - **Company-Specific Roadmap(s)** — auto-generated per company from Module D data: a roadmap that sequences the DSA/System-Design topics most frequently associated with that company's question bank, from most-to-least frequently asked
- I6. **"Skip to node" and search-within-roadmap**: search box that highlights and scrolls to a matching node
- I7. **Shareable/embeddable roadmap view**: a read-only link or embeddable image of a roadmap (or the learner's personal progress-annotated version of it), matching roadmap.sh's shareable-roadmap growth loop
- I8. **Downloadable/exportable roadmap** (PDF or PNG snapshot) for offline reference — a well-known roadmap.sh feature
- I9. **Community/custom roadmap creation** (lower priority, later phase): let advanced users fork/remix a roadmap or build their own from GetCracked content, mirroring roadmap.sh's user-generated-roadmap feature
- I10. Fully free and **viewable signed out** (§2.6) — roadmaps are the platform's most shareable artifact (I7) and gating them would defeat that. Per-node progress (I4) is held locally for anonymous visitors and synced to the account on sign-in (A15)


### 7.10 Module J — Content Sourcing & Ingestion Pipeline (net new)

The DSA Problems catalog (B15), and over time the lesson catalog (B9), are **sourced by pipeline rather than hand-authored**. This is the resolution to the largest scope risk in the document: several hundred problems, each needing a brief, hints, starter code, a reference solution, and tests in every launch language, is not a realistic hand-authoring commitment for this team.

Module J shares infrastructure with Module D — the same crawler, scheduler, de-duplication, and review queue serve both — but the two have different **outputs**: Module D produces *company-tagged interview question records*, Module J produces *runnable GetCracked content*. Where the two overlap (a scraped question that becomes a practice problem), D's record links to J's generated problem rather than duplicating it.

**Purpose:** GetCracked is built for the tech community as a free public resource (§2.6). Module J exists to turn scattered public educational material into one coherent, animated, runnable curriculum — which means the pipeline's job is *aggregation and canonicalization*, not republication.

#### 7.10.1 Sourcing

- J1. **Source registry**: a declared, versioned list of every source the pipeline ingests from — public GitHub repositories (curated problem lists, algorithm implementations, interview-prep collections), educational and documentation sites, open courseware, and public community platforms — each entry recording its URL, crawl cadence, and license classification (J3)
- J2. **Polite crawling**: `robots.txt` respected, rate-limited and backoff-aware fetching, identifying User-Agent with a contact URL, conditional requests via ETag/Last-Modified, and per-source concurrency caps. A source that returns errors or rate-limits is backed off automatically rather than hammered
- J3. **License classification gate — mandatory, blocking**: every source is classified *before* ingestion into one of four buckets, and the bucket determines what may be done with it:

  | Bucket | Examples | Permitted use |
  |---|---|---|
  | **Public domain / CC0** | Unlicensed public-domain collections | Direct use, attribution courtesy |
  | **Permissive** | MIT, Apache-2.0, BSD, CC-BY | Direct use **with required attribution preserved** (J4) |
  | **Share-alike** | GPL, CC-BY-SA | Use only where GetCracked can satisfy the share-alike terms; otherwise treat as restricted |
  | **Restricted / all-rights-reserved** | No license file, explicit "all rights reserved", ToS forbidding reuse | **Facts and problem *substance* only** — canonicalized and rewritten in GetCracked's own words (J5). Never the source's text, images, or files |

  A source with no detectable license defaults to **Restricted**. There is no "assume permissive" path.

  > **A worked example of why this gate is not optional.** roadmap.sh — the visual reference for Module K — is a public GitHub repository with 365k+ stars, and its license file reads: *"Everything including text and images in this project are protected by the copyright laws… you are not allowed to use it for any other purpose including publishing the images, the project files or the content."* Publicly visible on GitHub is not the same as reusable. Module K therefore takes visual *direction* from roadmap.sh while using none of its content, images, or files, and the pipeline must apply the same discrimination automatically at scale.

- J4. **Attribution ledger**: every ingested artifact carries immutable provenance — source URL, license bucket, retrieval timestamp, and commit/revision — surfaced publicly on the resulting content ("adapted from X, MIT licensed") wherever the license requires it, and stored regardless
- J5. **Canonicalization, not copying**: for Restricted sources the pipeline extracts only the *problem substance* — the underlying task, its inputs and outputs, its constraints — and regenerates the brief, hints, and tests as original GetCracked content. Verbatim text from a Restricted source must never reach the database, let alone a page
- J6. **Takedown process**: a documented, reachable channel for rights-holders, with the ability to purge a source and every artifact derived from it in one operation — which is only possible because of J4's provenance ledger

#### 7.10.2 Transformation

- J7. **Problem extraction**: identify discrete problems in a source, extract signature, constraints, and examples, and infer topic tags against GetCracked's existing DSA taxonomy
- J8. **Test-spec synthesis**: generate the declarative test spec (function signature, cases, edge cases, property assertions) that compiles to every launch language, so one ingested problem yields runnable exercises in all of them. Where a source supplies a reference solution, it is used to *validate* the generated spec — a spec its own reference solution fails is rejected automatically
- J9. **De-duplication against the existing catalog**: cluster near-duplicate problems (the same underlying task under many phrasings) into one canonical entry, and detect when an ingested problem already exists as a GetCracked challenge, problem, or Module D question — linking rather than duplicating
- J10. **Human editorial review queue — nothing publishes unreviewed**: every generated problem and lesson enters a review queue where an editor verifies correctness, difficulty rating, topic tags, license bucket, and quality before it goes live. Bulk approve/reject with diffs; rejection reasons are recorded and fed back as pipeline quality signal
- J11. **Quality gates before review**: an artifact reaches the queue only if it passes automated checks — the reference solution passes the generated tests in every launch language, the brief is non-empty and coherent, difficulty is inferrable, and it is not a near-duplicate of existing content
- J12. **Pipeline observability**: per-source success/failure rates, license-bucket distribution, extraction yield, dedup precision, review approve/reject ratio, and time-from-crawl-to-publish — extending H6 to cover content as well as questions

---

### 7.11 Module K — Design Language & Visual System (net new)

**The entire platform adopts the visual language of [roadmap.sh](https://roadmap.sh)** — its clarity, restraint, and distinctive node aesthetic — applied consistently across every surface: landing, dashboard, lessons, problems, editor, labs, roadmaps, and question bank.

> **Scope of the reference.** roadmap.sh's repository is explicitly all-rights-reserved (see J3's worked example): its content, images, and files cannot be reused. Module K therefore reproduces the **design language** — palette, type scale, node treatment, spacing, layout patterns — as GetCracked's own implementation, and takes none of roadmap.sh's assets, wordmark, illustrations, or roadmap content. The goal is a platform that feels like it belongs in the same visual family, not a copy of a specific site.

- K1. **Design tokens, sampled and verified**: a single token layer (color, type scale, spacing, radii, borders, shadows, motion) is the only source of visual values in the codebase — no hardcoded colors or spacing in components. Exact values are **sampled from the live reference during implementation** rather than approximated from memory, and recorded in the token file with the date sampled
- K2. **Palette**: predominantly light and near-white surfaces with high-contrast near-black text; a single strong accent (roadmap.sh's signature yellow) doing nearly all the emphasis work; dark sections used deliberately for navigation and hero areas. Restraint is the point — the palette should feel almost monochrome with one loud accent, not multicolored
- K3. **The node treatment — the signature element**: rounded-rectangle nodes with a solid dark border and a **hard offset shadow (no blur)**, filled with the accent color for primary topics and left light for secondary ones. This treatment is not confined to roadmaps — it is the platform's card, button, and panel language, so a lesson card, a problem row, and a roadmap node visibly belong to the same system
- K4. **Connectors**: dashed, gently curved lines between nodes, with clear directionality — used on roadmaps (I1) and reused for the System Design whiteboard (C1)
- K5. **Typography — system fonts, no web font.** The reference ships **no custom web font at all**: verified 2026-08-29 across all six stylesheets roadmap.sh serves, plus its HTML and JS bundles — no `@font-face` for UI text, no Google Fonts link or preconnect, no `.woff2`/`.ttf` assets. Its only font-family declarations are KaTeX's math faces, used for LaTeX inside guide markdown. The site renders in the OS system UI font (SF Pro on macOS, Segoe UI on Windows, Roboto on Android).
  - GetCracked matches this deliberately: **system font stacks only** for all interface chrome. Text looks native on every platform, costs zero network requests, has no FOUT/FOIT, and adds nothing to the bundle — which matters for the H5 60fps target and for a platform with no revenue.
  - Monospace is likewise a system stack (`ui-monospace`, SF Mono, Menlo, Consolas, …), confined to code surfaces.
  - **Correction to an earlier draft of this PRD**, which asserted an informal/hand-drawn companion face for roadmap node labels. The reference screenshots show node labels set in the same grotesque sans as the rest of the UI. There is no second typeface. Adopting a web font later is a deliberate departure from the reference, not a step toward it
- K6. **Layout**: wide max-width container, generous whitespace, thin-bordered card grids with a subtle hover lift, and section rhythm driven by spacing rather than dividers or heavy chrome
- K7. **Progress as a first-class visual state**: `not-started` / `in-progress` / `done` is a shared visual vocabulary rendered identically on roadmap nodes (I4), lesson cards, problem rows, and challenge tiles, so progress reads the same everywhere it appears
- K8. **Component library**: every recurring element — button, card, node, badge, tab, panel, table row, code block, empty state — exists once as a documented component built from K1's tokens. No surface may introduce a bespoke variant without adding it here
- K9. **Dark mode**: tokens defined for both themes from the start (light is the reference's default and remains GetCracked's), rather than retrofitted
- K10. **Accessibility is part of the design system, not a later audit**: every token pair ships with a verified contrast ratio meeting WCAG AA, focus states are visible on the accent color, and the hard-shadow node treatment is verified to remain legible at AA contrast — checked in CI, not by inspection

---

### 7.12 Module L — AI Assistant (net new)

A platform-wide AI assistant, available in-context on every learning surface, powered by **Groq** inference. Distinct from — but sharing infrastructure with — E3's System Design mock interviewer.

- L1. **Model selection via Groq**: the assistant runs on the strongest general-purpose instruction-following model available on Groq at implementation time. **The specific model ID must be chosen against Groq's live model catalog when the work is done, not fixed in this document** — Groq's lineup changes faster than this PRD will be revised, and a hardcoded model name here would be wrong within months. Selection criteria: instruction-following and code quality first, then context window, then cost per token, then latency (Groq's latency advantage means the cheapest adequate model is rarely the right pick)
- L2. **Model configuration is a single point of change**: the model ID, temperature, and system prompts live in configuration, never inline at call sites, so upgrading models is a config change and A/B-ing two models is possible without a refactor
- L3. **Context-aware help on every surface**: the assistant receives the learner's current context — which lesson, problem, or lab they are on; their code; their test results; which hints they have opened — so "why is this failing?" is answerable without the learner explaining their situation
- L4. **Socratic mode by default, not answer-vending**: for an unsolved problem the assistant asks leading questions, points at the failing case, and explains the *concept*, rather than emitting a working solution. Direct solutions unlock after the learner solves it, or on explicit repeated request — mirroring the progressive-disclosure principle (§6.3) that governs hints
- L5. **"Explain this state"** (fulfils B5): with the visualizer open, the assistant explains why the structure is in its current state at the current animation step, given the learner's actual code
- L6. **Code review on passing submissions**: once tests pass, the assistant reviews for complexity, idiomatic style, and edge cases the tests did not cover — the feedback layer that a bare pass/fail cannot give
- L7. **Concept Q&A grounded in GetCracked content**: questions about a concept are answered against the platform's own lessons and the 129-entry concept map (A14), with links to the relevant entry, so the assistant reinforces the curriculum rather than talking past it
- L8. **Study-plan assistance**: conversational help shaping a plan ("I have an Amazon onsite in 3 weeks") that produces a real F5 study plan rather than throwaway chat text
- L9. **Cost controls — mandatory on a free platform**: per-user rate limits and daily token budgets, aggressive prompt caching, context trimming, streaming responses, and a hard global spend cap with graceful degradation when it is hit. Since the platform is free (§2.6), the assistant is the largest recurring variable cost in the product and must be built with a ceiling from day one, not given one later
- L10. **Transparency and safety**: responses are labelled as AI-generated and may be wrong; the assistant never fabricates a claim about GetCracked's own content that it cannot link to; learner code and prompts sent to Groq are covered by the privacy disclosure (Open Question 7); and prompt-injection from scraped content (Module J) must not be able to steer the assistant

---
## 8. Success Metrics

| Goal | Metric |
|---|---|
| G1 Animated DSA | % of DSA exercise attempts where the visualizer is opened; completion-rate lift vs. non-animated baseline; time-to-first-correct-solution reduction |
| G1 Learn → Problems funnel | Lesson completion rate; **lesson-to-first-problem-attempt conversion**; drop-off point within a lesson |
| G1 Guidance effectiveness *(only measurable because nothing is locked)* | % of problem-set entries where the prerequisite lesson was already complete — the honest measure of whether lessons are worth doing; solve rate and hint-dependence **with vs. without** the lesson done, per topic; recommendation acceptance rate and dismissal rate (B16) |
| G1 Tier progression | % of topics where a learner completes all three tiers (lesson → problem set → build-it challenge); median time from lesson complete to set complete |
| G2 System Design Labs | # of labs completed per user; bridge-to-code conversion rate (C6 click-through from whiteboard lab to matching code challenge) |
| G3 Company Question Bank | # of unique companies with >20 verified questions; freshness (median age of "last verified" date); search-to-practice conversion rate |
| Module I Roadmap | Roadmap page visits; node-click-through rate to linked content; % of active users with at least one roadmap in progress; roadmap share/export rate |
| G6 Content pipeline (J) | Problems published per week; automated-check pass rate before review (J11); editorial approve/reject ratio (J10); dedup precision; median time from crawl to publish; **license-bucket distribution of published content** |
| G7 Design system (K) | % of UI built from tokenized components vs. bespoke styles; WCAG AA contrast failures in CI (target: zero) |
| Module L Assistant | Assistant sessions per active user; **solve-rate lift for learners who use it vs. those who don't**; Socratic-mode adherence (rate of direct-solution requests); cost per active user per month against the L9 cap |
| Signed-out to signed-in conversion | % of anonymous learners who sign up; **what they had completed when they did** (the A15 migration prompt's effectiveness); organic search traffic to public lessons and the concept map |
| G4 Overall | Monthly active users; retention/streaks; NPS vs. named competitors (monetization is out of scope per Section 2.6 — platform is fully free) |

---

## 9. Handover Instructions — Generating `features.md`

When this PRD is handed to Claude to produce `features.md`, the output should:

1. Flatten every feature ID in Section 7 (A1–A14, B1–B21, C1–C10, D1–D10, E1–E5, F1–F6, G1–G4, H1–H10, I1–I10, J1–J12, K1–K10, L1–L10) into a single checklist-style markdown file, one feature per line/section. Note A11 and A12 are removed (struck through) — do not carry them into `features.md` as active items; they may be listed under a short "deprecated/removed" note for traceability if useful.
2. For each feature, include: a one-line description (from this doc), status, and a short acceptance-criteria bullet list derived from the feature's description above.
   - **Every feature is `planned`, including Module A.** An earlier draft of this instruction said Module A was `existing` because §2.2 describes a deployed site. That site is not this codebase: **GetCracked is a greenfield rebuild**, so auth, the dashboard, the editor, the test runner, and the concept map all have to be built. Marking them `existing` would tell a reader — human or agent — to skip the foundation the entire product stands on.
3. Group by module using the same A–I structure so the file mirrors this PRD's structure exactly (traceability).
3a. Note prominently at the top of `features.md` that **every feature is free, and sign-in is required only for account-scoped behaviour** (Section 2.6) — no entry should reference a paywall, tier, or subscription gate, and each entry should state whether it works signed out. Use §2.6's table as the authority on which side of the line a feature falls.
4. Do not invent new features beyond what's listed here — this PRD is the authoritative source of scope. If gaps are noticed while drafting, flag them as open questions at the bottom of `features.md` rather than silently adding scope.
5. Keep `features.md` implementation-agnostic (no framework/library choices) — this is a product scope document, not a technical design document — **with one exception**: note H8 (single Next.js fullstack app) once, up top, as a standing architectural constraint, since it affects how every other feature is scoped for engineering (no separate frontend/backend feature split).

---

## 10. Open Questions

1. ~~Which languages beyond Python should be prioritized for H1?~~ **Resolved:** the launch set is Python and JavaScript; **Java is suspended** until its execution model is settled, and is first in line to be added back (H1). Still open: (a) does the Module B animation engine need structure-coverage parity across both launch languages at launch, or can it ship Python-deep first and reach parity incrementally? (b) what is the authoring cost of maintaining equivalent test suites per exercise across two languages — does this need a shared test-spec format that compiles to both, and would that format survive Java being added back? (c) when Java returns, does it run in-browser (JVM-in-WASM) or server-side, and is a server-side runner an acceptable deviation from H8?
2. What is the legal/ToS risk tolerance for Module D scraping — should launch start with only fully-compliant sources (company blogs, opt-in community submissions) and add higher-risk sources (Blind, Glassdoor) later?
3. Should Module E's AI mock interviewer be voice-based, chat-based, or both at launch?
4. With the platform now fully free (Section 2.6), is there any monetization path planned outside the product surface (donations, sponsorships, job-board placements, B2B/enterprise), or is the platform intended to run without direct revenue? This affects infrastructure-cost planning for compute-heavy features (B1 live visualizer, Module D scraping pipeline, E3 AI mock interviewer) but is out of scope for this PRD's feature list.
5. Should Module C's "build it" bridge (C6) require the learner to already have completed the matching code challenge, or can it be attempted standalone?
6. For Module I roadmaps: should the Company-Specific Roadmap (I5) be generated fully automatically from Module D data, or curated/reviewed editorially before publishing (similar to D10's review queue)?
7. ~~What is the privacy and data-retention policy?~~ **Resolved 2026-08-29 — track both tiers, and tell signed-out visitors why.**
   - **Signed-in:** a privacy notice at sign-up describing what F6 records. Ships with T0.4.
   - **Signed-out: tracked against a rotating anonymous device identifier** (F6 tier two), so aggregate funnels, drop-off, and content effectiveness are measurable from day one.
   - **The disclosure problem is solved by the product, not a banner.** The original objection to anonymous tracking was that it creates an obligation with *no natural consent moment* — nobody signs up, so nobody is ever shown anything. The answer is A16: a **persistent, visible notice to every signed-out learner** stating that their progress is saved on this device only and that signing in keeps it. That notice is where the learner is told what is happening, and it is honest in both directions — it earns the tracking by offering something in return rather than burying it in a policy nobody opens.
   - **Still open (legal, not product):** whether a rotating device identifier additionally requires a cookie/consent banner in the EU. A16 is the product answer; it is not a legal opinion. Resolve before any EU-targeted growth push.
8. ~~Is B16's gate absolute, or is there a test-out path?~~ **Resolved: there is no gate.** Nothing on the platform is locked (§6 principle 6, B14, B16). Sequencing is expressed through ordering, defaults, and nudges only. This resolves the senior-engineer problem outright — they simply go where they want — and, as a side effect, makes §8's guidance-effectiveness metrics measurable rather than tautological. Newly open: how aggressive should the struggle-triggered nudge be before it becomes nagging, and after how many dismissals does the platform stop suggesting a topic's lesson entirely?
9. ~~What is the tier-2 problem catalog's provenance?~~ **Resolved: sourced by pipeline, not hand-authored** — see the new **Module J** (§7.10). The catalog is built by ingesting public, appropriately-licensed material from GitHub repositories, educational sites, and other public platforms, then canonicalizing it into GetCracked's own content model. Still open: (a) what is the target catalog size for v1 — roughly 10–20 problems per topic across ~20 topics is several hundred problems, and pipeline throughput, not authoring capacity, now sets that ceiling; (b) what proportion must pass human editorial review (J10) before publishing, and does that review become the new bottleneck?
10. ~~Do the tier-3 build-it challenges gate on anything?~~ **Resolved: nothing gates on anything.** Every tier is open from day one.
