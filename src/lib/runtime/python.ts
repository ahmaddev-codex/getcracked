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
 * Cached across runs: reloading multi-MB WASM per run would be unusable.
 *
 * **Two loading strategies, because the two environments genuinely differ.**
 *
 * In Node the npm package works directly: it resolves its own assets from
 * `node_modules` and nothing bundles it.
 *
 * In the browser it must NOT be bundled. Two independent reasons:
 *
 * 1. `pyodide.mjs` runs environment detection at *module evaluation* and throws
 *    "Classic web workers are not supported" when it finds itself in a classic
 *    worker — which is what Turbopack emits in development regardless of
 *    `{ type: 'module' }`. A static import therefore killed the worker as it was
 *    being evaluated, taking every JavaScript run down with it.
 * 2. Pyodide loads its own WASM loader through a computed `import()`. A bundler
 *    that tries to follow that fails with "Cannot find module as expression is
 *    too dynamic", so even a lazy bundled import cannot work.
 *
 * Loading the browser build straight from `indexURL` solves both: the module is
 * fetched at first Python run rather than evaluated at worker startup, and the
 * bundler never sees it, so its internal dynamic imports resolve against the
 * same directory its `.wasm` assets already come from. The ignore comments are
 * what keep the bundler out of it.
 */
export function getPyodide(): Promise<PyodideInterface> {
  pyodidePromise ??= (async () => {
    if (isNodeRuntime()) {
      const mod = await import('pyodide');
      return mod.loadPyodide();
    }
    const mod = (await import(
      /* webpackIgnore: true */ /* turbopackIgnore: true */
      `${BROWSER_INDEX_URL}pyodide.mjs`
    )) as { loadPyodide: (o: { indexURL: string }) => Promise<PyodideInterface> };
    return mod.loadPyodide({ indexURL: BROWSER_INDEX_URL });
  })();
  return pyodidePromise;
}

const DEFAULT_TIMEOUT_MS = 5_000;

const RUNNER = String.raw`
import sys, json, time

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

    scope = {}
    exec(source, scope)
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
        if event == "line" and tracing and frame.f_code.co_name == entry:
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
    return json.dumps({"value": _snap(value), "events": events, "dropped": dropped[0]})
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
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ...empty, timedOut: /_Timeout/.test(message), error: message };
  }
}
