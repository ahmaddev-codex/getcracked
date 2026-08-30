import type { PyodideInterface } from 'pyodide';
import { DEFAULT_MAX_EVENTS, type TraceEvent } from './trace';
import type { RunOptions, RunResult } from './javascript';

/**
 * Python runtime via Pyodide (CPython compiled to WebAssembly).
 *
 * Unlike QuickJS, Python needs no source rewriting: `sys.settrace` reports a
 * callback per executed line with the live frame, so line numbers and variable
 * state come straight from the interpreter. Subscript reads and writes still
 * need help — there is no Proxy equivalent — so input lists are wrapped in a
 * `list` subclass that overrides `__getitem__`/`__setitem__`.
 */

let pyodidePromise: Promise<PyodideInterface> | null = null;

/**
 * In Node, Pyodide resolves its own assets from node_modules. In the browser it
 * needs an explicit indexURL. The spike points that at a CDN; **production must
 * self-host** — a free platform should not make its core runtime depend on a
 * third party's uptime, and self-hosting is also what allows the assets to be
 * served with the COOP/COEP headers SharedArrayBuffer would need.
 */
export const PYODIDE_VERSION = '314.0.6';
const BROWSER_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

/**
 * Detects Node rather than the absence of `window`.
 *
 * jsdom — which the test suite runs in — defines `window`, so a `typeof window`
 * check sends tests down the browser path and Pyodide tries to open a URL as a
 * file path. Node is the thing that actually determines how assets resolve.
 */
function isNodeRuntime(): boolean {
  return typeof process !== 'undefined' && Boolean(process.versions?.node);
}

/**
 * Whether Pyodide can load in the current environment.
 *
 * **Pyodide 314 refuses to run in a classic worker at all.** Its environment
 * detection throws `Classic web workers are not supported` at module evaluation,
 * and there is no flag or entry point that opts out — the UMD build carries the
 * same check. Turbopack emits a classic worker in development regardless of
 * `{ type: 'module' }`, so in dev this is simply false inside the worker.
 *
 * Verified directly in Chromium rather than inferred: importing the module URL
 * inside a deliberately-classic worker fetches it (HTTP 200) and then throws on
 * evaluation. Lazy loading does not help, because the throw is in the module
 * body, not in `loadPyodide`.
 *
 * The caller's job is therefore to run Python somewhere else — the main thread
 * supports it — rather than to retry here.
 */
export function pythonRuntimeAvailable(): boolean {
  return typeof (globalThis as { importScripts?: unknown }).importScripts !== 'function';
}

/**
 * Cached across runs: reloading multi-MB WASM per run would be unusable.
 *
 * **Two loading strategies, because the two environments genuinely differ.**
 *
 * In Node the npm package works directly: it resolves its own assets from
 * `node_modules` and nothing bundles it.
 *
 * In the browser it must NOT be bundled. Pyodide loads its own WASM loader
 * through a computed `import()`, which a bundler that follows it fails on with
 * "Cannot find module as expression is too dynamic". Loading the browser build
 * straight from `indexURL` means the bundler never sees it, so those internal
 * imports resolve against the same directory the `.wasm` assets come from.
 *
 * A failed load clears the cache. Caching a rejected promise would turn one
 * transient failure — a dropped connection on a multi-megabyte download — into a
 * permanent one for the rest of the session.
 */
export function getPyodide(): Promise<PyodideInterface> {
  pyodidePromise ??= (async () => {
    if (isNodeRuntime()) {
      const mod = await import('pyodide');
      return mod.loadPyodide();
    }
    if (!pythonRuntimeAvailable()) {
      throw new Error(
        'Python cannot run here: Pyodide does not support classic web workers.',
      );
    }
    const mod = (await import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */
      `${BROWSER_INDEX_URL}pyodide.mjs`
    )) as { loadPyodide: (o: { indexURL: string }) => Promise<PyodideInterface> };
    return mod.loadPyodide({ indexURL: BROWSER_INDEX_URL });
  })().catch((error: unknown) => {
    pyodidePromise = null;
    throw error;
  });
  return pyodidePromise;
}

const DEFAULT_TIMEOUT_MS = 5_000;

const RUNNER = String.raw`
import sys, json, time

# Filename stamped on the learner's compiled code, so the tracer can recognise
# its frames and ignore this runner's own.
_SOURCE_FILE = "<learner>"


def _index_variables(src):
    # Which variables the source uses as array subscripts. The mirror of
    # index-vars.ts, kept here because Python's own parser is the only thing
    # that can answer it for Python - and both runtimes must answer the same
    # question the same way, or the same walkthrough would label different
    # pointers in each language.
    #
    # Only a bare name counts: a[i + 1] names no single position and a[f(x)]
    # names none at all, so neither earns a pointer mark.
    import ast as _ast
    found = {}
    try:
        tree = _ast.parse(src)
    except SyntaxError:
        return found
    for node in _ast.walk(tree):
        if not isinstance(node, _ast.Subscript):
            continue
        target = node.value
        key = node.slice
        if isinstance(target, _ast.Name) and isinstance(key, _ast.Name):
            found.setdefault(target.id, set()).add(key.id)
    return {name: sorted(vars) for name, vars in found.items()}

class _TracedList(list):
    def __init__(self, values, name, sink):
        super().__init__(values)
        self._name = name
        self._sink = sink

    def __getitem__(self, i):
        v = super().__getitem__(i)
        if isinstance(i, int):
            self._sink({"kind": "array_read", "array": self._name, "index": i, "value": _snap(v)})
        return v

    def __setitem__(self, i, v):
        if isinstance(i, int):
            self._sink({"kind": "array_write", "array": self._name, "index": i, "value": _snap(v)})
        super().__setitem__(i, v)


def _snap(v, d=0):
    if d > 4:
        return "[nested]"
    if isinstance(v, (str, int, float, bool)) or v is None:
        return v
    if isinstance(v, (list, tuple)):
        return [_snap(x, d + 1) for x in v]
    if isinstance(v, dict):
        return {str(k): _snap(x, d + 1) for k, x in v.items()}
    if isinstance(v, set):
        return {"__set": [_snap(x, d + 1) for x in v]}
    return repr(v)


class _Timeout(Exception):
    pass


def _run(source, entry, args_json, tracing, max_events, deadline):
    events = []
    dropped = [0]

    def sink(e):
        if not tracing:
            return
        if len(events) >= max_events:
            dropped[0] += 1
            return
        events.append(e)

    # Compiled explicitly so the frames carry a filename we can recognise: the
    # tracer below uses it to tell the learner's code from this runner's.
    scope = {}
    code = compile(source, _SOURCE_FILE, "exec")
    exec(code, scope)
    fn = scope[entry]

    args = json.loads(args_json)
    import inspect
    try:
        names = list(inspect.signature(fn).parameters.keys())
    except (TypeError, ValueError):
        names = []

    wrapped = []
    for i, a in enumerate(args):
        name = names[i] if i < len(names) else "arg%d" % i
        wrapped.append(_TracedList(a, name, sink) if isinstance(a, list) else a)

    def tracer(frame, event, arg):
        # Runs on every line, so it doubles as the deadline check. Pyodide's
        # alternative (setInterruptBuffer) needs SharedArrayBuffer, which needs
        # COOP/COEP headers — see the spike writeup.
        if time.time() > deadline:
            raise _Timeout()
        # Every frame from the learner's source, not just the entry function.
        # Matching on the entry name alone skipped nested helpers entirely,
        # which meant the two lessons about recursion - where the recursive
        # call lives in an inner helper - animated nothing in Python while
        # animating fully in JavaScript.
        if event == "line" and tracing and frame.f_code.co_filename == _SOURCE_FILE:
            sink({
                "kind": "line",
                "line": frame.f_lineno,
                "vars": {k: _snap(v) for k, v in frame.f_locals.items() if not k.startswith("_")},
            })
        return tracer

    sys.settrace(tracer)
    try:
        value = fn(*wrapped)
    finally:
        sys.settrace(None)

    sink({"kind": "return", "value": _snap(value)})
    return json.dumps({
        "value": _snap(value),
        "events": events,
        "dropped": dropped[0],
        "indexedBy": _index_variables(source),
    })
`;

export async function runPython(opts: RunOptions): Promise<RunResult> {
  const {
    source,
    entry,
    args,
    trace = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxEvents = DEFAULT_MAX_EVENTS,
  } = opts;

  // Python never degrades: sys.settrace reports lines straight from the
  // interpreter, so there is no source rewriting that could fail.
  const empty: RunResult = {
    ok: false,
    timedOut: false,
    events: [],
    truncated: false,
    traceDegraded: false,
  };

  let py: PyodideInterface;
  try {
    py = await getPyodide();
  } catch (e) {
    return { ...empty, error: `Pyodide failed to load: ${String(e)}` };
  }

  try {
    py.runPython(RUNNER);
    const run = py.globals.get('_run') as (
      ...a: unknown[]
    ) => string;

    const deadline = Date.now() / 1000 + timeoutMs / 1000;
    const raw = run(source, entry, JSON.stringify(args), trace, maxEvents, deadline);
    const payload = JSON.parse(raw) as {
      value: unknown;
      events: TraceEvent[];
      dropped: number;
      indexedBy?: Record<string, string[]>;
    };

    const events = payload.events ?? [];
    if (payload.dropped > 0) {
      events.push({ kind: 'truncated', dropped: payload.dropped });
    }

    return {
      ok: true,
      value: payload.value,
      timedOut: false,
      events,
      truncated: payload.dropped > 0,
      traceDegraded: false,
      indexedBy: payload.indexedBy ?? {},
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ...empty, timedOut: /_Timeout/.test(message), error: message };
  }
}
