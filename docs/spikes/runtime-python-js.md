# Spike: Python + JavaScript execution and trace capture

**Task:** T0.2 · **Date:** 2026-08-29 · **Status:** Complete
**Question:** Can we run learner Python and JavaScript in the browser, assert against them, and capture a structured trace good enough to drive the Module B visualizer?

---

## Verdict

**Yes — but JavaScript needs its source rewritten, and Python does not.**

Both runtimes work, both terminate infinite loops cleanly, and both emit an identical event shape from an identical algorithm. The core product bet (PRD G1, "watch your own code move the data structure") is technically sound.

Two findings change the plan, and one of them is bad news that must not be glossed:

1. **QuickJS cannot trace without AST rewriting.** The acceptance criterion asked this directly. The answer is no. AST instrumentation returns, and **R-2 stays High**.
2. **Trace payload grows quadratically** with array size under the current design. At the PRD H5 cap of 500 elements, a single loop produces a ~1 MB trace. This is a protocol problem, not a runtime problem, and T2.7 must fix it.

---

## 1. The QuickJS tracing question — answered: no

`quickjs-emscripten@0.32.0` exposes exactly one execution hook:

```ts
type InterruptHandler = (runtime: QuickJSRuntime) => boolean | undefined | void;
runtime.setInterruptHandler(cb);
```

The handler receives **only the runtime**. No line number, no frame, no variable state, no opcode. It fires on QuickJS's internal interrupt-check cadence, not per source line, and the only thing it can express is "abort" or "continue".

Checked and ruled out:

| Candidate | Result |
|---|---|
| `setInterruptHandler` | Real, works — but carries no execution context. Abort-only. |
| `DEBUG_SYNC` / `DEBUG_ASYNC` variants | **Not a debugger.** Its own README: *"Release mode: debug — Enables assertions and memory sanitizers."* A build mode for catching host-binding bugs. No JS-level stepping. |
| Any `onStep` / breakpoint / line-callback API | Does not exist in the package's type surface. |

**Conclusion:** there is no route to `sys.settrace`-equivalent events from QuickJS without rewriting the learner's source. `src/lib/runtime/instrument.ts` does that rewriting: it parses with acorn and inserts a `__t(line, vars)` call before each statement in the entry function, tracking a scope stack so a trace call only references bindings that are actually live (referencing a sibling block's `let`, or one before its declaration, would throw a ReferenceError or hit the TDZ and break the learner's program rather than observe it).

**R-2 stays High.** The mitigation stands: the protocol is proven on both languages, and animation can ship Python-deep first if JS instrumentation proves fragile on real learner code.

### What this costs

Rewriting learner source has consequences the plan should carry forward:

- **Line numbers must survive the rewrite.** Insertions are applied back-to-front and never add lines, so reported line numbers still match what the learner sees. Any future multi-line insertion breaks this silently.
- **Syntax errors surface from acorn, not QuickJS**, so error messages for un-parseable code will differ between traced and untraced runs unless normalised.
- **Coverage is bounded by the instrumenter.** It currently handles blocks, `for`, `for-in`/`for-of`, `while`, `do-while`, and `if`. Anything else (`try`/`catch`, `switch`, closures, arrow-function bodies) is executed but not traced. This is a spike-level subset, not a finished implementation.

Python needs none of this. `sys.settrace` reports every line with the live frame, straight from the interpreter.

---

## 2. Measurements

Measured on macOS, Node 26, Apple Silicon. Reproduce with:

```bash
MEASURE_OUT=/tmp/m.txt pnpm test tests/runtime/measure.test.ts
```

| | First load | Warm per-run (median of 20) |
|---|---|---|
| **QuickJS** | 15 ms | **0.7 ms** |
| **Pyodide** | 1,291 ms | **3.6 ms** |

Warm latency for both is far below anything a learner perceives. First-load is where they differ, and the difference matters:

> **⚠️ These first-load figures are from Node and badly understate the browser.**
> In Node, Pyodide reads its WASM and stdlib from `node_modules` on local disk. In a browser it is a **multi-megabyte network download** (the npm package unpacks to ~13.9 MB). The real first-visit cost for a Python learner is seconds on a good connection and considerably worse on a poor one — not 1.3 s. **This number must be re-measured in a browser on a throttled connection before T1.3 commits to a loading UX.**

QuickJS has no equivalent problem: its WASM is small enough that 15 ms cold is representative.

### Tracing overhead

| | Trace off | Trace on | Multiplier |
|---|---|---|---|
| QuickJS | 0.4 ms | 0.9 ms | 2.3× |
| Pyodide | 3.4 ms | 3.4 ms | 1.0× |

Python showing **no** overhead is not good news — it is a defect. The current implementation installs `sys.settrace` on *every* run, traced or not, because the tracer doubles as the deadline check (see §4). So untraced Python runs already pay the tracing tax. Fixing that requires a separate interrupt mechanism.

---

## 3. Trace payload: the quadratic problem

For a single loop summing a 500-element array — exactly the PRD H5 cap:

| | Events | JSON payload |
|---|---|---|
| QuickJS | 1,004 | **1.0 MB** |
| Pyodide | 1,504 | **1.9 MB** |

~1 KB per event, for events describing a single integer addition.

**Cause:** every `line` event snapshots *all* live variables, and one of those variables is the 500-element array. So the trace stores 500 elements × ~1000 events. Payload is O(n²) in array size.

This is a **protocol design flaw, not a runtime limit**, and it is the most important thing T2.7 inherits. Options:

1. **Diff-based line events** — emit only variables that changed since the previous event. Natural fit: most steps change one index or one counter.
2. **Structure-by-reference** — snapshot large collections once, then emit mutations against them, reconstructing state during playback.
3. **Exclude large collections from `vars`** — array state is already tracked by `array_read`/`array_write`; snapshotting the whole array in `vars` is largely redundant.

Option 1 or 3 is likely enough. The existing `maxEvents` cap prevents an unbounded trace but does not fix per-event size — a truncated 1 MB trace is still 1 MB.

---

## 4. Killing an infinite loop

Both work. The mechanisms are completely different, and Python's is unsatisfying.

**QuickJS — clean.** `shouldInterruptAfterDeadline` fires the interrupt handler and the runtime aborts. Measured: a `while(true){}` submission with a 200 ms deadline aborted at **201 ms**.

One implementation detail worth recording, because it cost time: **the interrupt surfaces as a QuickJS error *value*, not a thrown host exception.** It arrives as `InternalError: interrupted` on `result.error`. Code that only wraps `evalCode` in `try/catch` will conclude the run succeeded.

**Pyodide — works, but by a side door.** There is no interrupt handler. The deadline is checked inside the `sys.settrace` callback, which runs on every line — which is why untraced runs still install a tracer (§2).

The proper mechanism is `setInterruptBuffer`, backed by a `SharedArrayBuffer`. That carries a **deployment constraint**: `SharedArrayBuffer` requires cross-origin isolation, meaning `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers. Those headers break embedding of any cross-origin resource that does not opt in — which will interact with Module D/J content, embeds, and analytics. **This needs deciding before T1.3, not discovered later.**

---

## 5. Bug found: proxied arrays poison their own trace

Worth recording because it will recur.

JavaScript array reads are captured with a `Proxy` on the input array. The first cross-language equivalence test failed: for a linear search that returns at index 3, JS reported a read of **index 4** — an access the algorithm never makes.

Cause: the `line` event snapshots live variables, one of which is the proxied array. Walking it to snapshot it fires the very `get` traps being recorded, inventing reads.

Fix: recording is suspended for the duration of any snapshot (`__quiet`). Python is unaffected — iterating a `list` subclass uses the C-level iterator, not `__getitem__`.

**The general lesson:** any observation mechanism that reads observed state can contaminate its own trace. T2.7 should treat this as a standing hazard, not a one-off.

### A second bug: `typeof window` is the wrong environment check

Pyodide resolves its assets differently per environment — from `node_modules` in Node, from an `indexURL` in a browser. The obvious discriminator, `typeof window === 'undefined'`, is **wrong**: jsdom (which the test suite runs in) defines `window`, so every Node test took the browser path and tried to open `https://cdn.jsdelivr.net/...` as a file path.

It is worth noting *how* this surfaced. Each test file passed when run alone and the whole suite failed, because the runtime tests had been written and passed before the browser `indexURL` was added. **Only the full-suite run caught it.** Detecting Node directly (`process.versions.node`) is correct, since Node is what actually determines asset resolution.

---

## 6. Recommendations

**Adopt for both languages.** Warm latency is excellent, both terminate hostile code, and the shared event shape is proven — a linear search over the same input produces byte-identical `array_read` sequences from CPython and QuickJS.

Carry into later tasks:

| # | Recommendation | Owner |
|---|---|---|
| 1 | Fix the O(n²) payload — diff-based events, or drop large collections from `vars` | **T2.7** |
| 2 | Re-measure Pyodide first load **in a browser, throttled**; design the loading UX around the real number | **T1.3** |
| 3 | **Self-host Pyodide assets.** The spike loads from jsDelivr; a free platform should not put a third party's uptime on its critical path, and self-hosting is also what allows COOP/COEP headers | **T1.3** |
| 4 | Decide on `SharedArrayBuffer` + COOP/COEP, or accept always-on `settrace` for Python | **T1.3** |
| 5 | Extend the instrumenter to `try`/`catch`, `switch`, and closures before real content ships | **T2.3 / T2.7** |
| 6 | Move both runtimes into a **Web Worker**. Everything here runs on the main thread; QuickJS aborts fast enough to hide it, but Pyodide's first load will block paint | **T1.3** |
| 7 | Keep `trace` opt-in. A pass/fail run should never pay tracing cost | standing |

---

## 7. What is proven, and what is not

**Proven by automated test** (30 tests, `tests/runtime/`, runs in CI):

- Both runtimes execute learner code and return correct values
- Both report runtime errors without crashing the host
- Both emit ordered `line` events carrying variable state
- Both emit `array_read` / `array_write` for subscript access
- Both terminate an infinite loop at the deadline
- **Identical algorithms produce identical array-access sequences across the two languages**
- Traces truncate with a marker rather than growing unbounded
- The pinned Pyodide asset version cannot drift from the installed package

**Not proven — needs manual browser verification:**

- The prototype page at `/runtime` builds, server-renders, and typechecks, but **its click-through has not been exercised in a real browser**. Node tests prove the runtime mechanics; they cannot prove that Pyodide's browser bundle loads from the CDN, or that the tab stays responsive during a spin.
- To verify: `pnpm dev`, open `/runtime`, then for each language click *Run with trace* (expect `[0, 1]` and a populated trace), then *Load infinite loop* → *Run with 1s timeout* (expect a timeout result), clicking the counter button throughout to confirm the tab still responds.
- Browser first-load cost for Pyodide (recommendation 2).

---

## 8. Artifacts

| Path | Purpose |
|---|---|
| `src/lib/runtime/trace.ts` | Event union + collector with snapshotting and truncation |
| `src/lib/runtime/instrument.ts` | acorn AST instrumentation (the path QuickJS forces) |
| `src/lib/runtime/javascript.ts` | QuickJS adapter — execution, Proxy array capture, interrupt |
| `src/lib/runtime/python.ts` | Pyodide adapter — `sys.settrace`, `_TracedList`, deadline |
| `src/app/(spike)/runtime/page.tsx` | Throwaway browser prototype |
| `tests/runtime/*` | 30 tests including cross-language equivalence and measurements |

The `src/lib/runtime/*` modules are spike-quality: they prove the mechanism and are **not** the production implementation. T1.3 productionises them behind the `LanguageRuntime` interface (AD-2), in a Worker, with the fixes above.
