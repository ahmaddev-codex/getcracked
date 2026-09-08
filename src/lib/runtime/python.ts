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
/**
 * Enables offline & fast disk caching for Pyodide assets via the Cache Storage API.
 */
function ensurePyodideCaching(): void {
  if (typeof globalThis.caches === 'undefined' || (globalThis as unknown as { __pyodideFetchWrapped?: boolean }).__pyodideFetchWrapped) {
    return;
  }
  const originalFetch = globalThis.fetch.bind(globalThis);
  (globalThis as unknown as { __pyodideFetchWrapped?: boolean }).__pyodideFetchWrapped = true;

  globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (url && url.includes('cdn.jsdelivr.net/pyodide/')) {
      try {
        const cache = await caches.open(`getcracked-pyodide-${PYODIDE_VERSION}`);
        const cached = await cache.match(input);
        if (cached) return cached;
        const response = await originalFetch(input, init);
        if (response.ok) {
          cache.put(input, response.clone()).catch(() => {});
        }
        return response;
      } catch {
        // Fallback to original fetch if cache API errors
      }
    }
    return originalFetch(input, init);
  };
}

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
    ensurePyodideCaching();
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
    def __init__(self, values, name, sink, full):
        super().__init__(values)
        self._name = name
        self._sink = sink
        # Asked before building an event, never after - see the note on _run's
        # own full(). Snapshotting a value for an event that is about to be
        # dropped is the whole cost of tracing, paid for nothing.
        self._full = full

    def __getitem__(self, i):
        v = super().__getitem__(i)
        if isinstance(i, int) and not self._full():
            self._sink({"kind": "array_read", "array": self._name, "index": i, "value": _snap(v)})
        return v

    def __setitem__(self, i, v):
        if isinstance(i, int) and not self._full():
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


# Root for a build challenge's workspace on Pyodide's in-memory filesystem.
_WORKSPACE = "/gc_learner"


def _install(modules, entry_module, entry_source):
    # Tier 3's several files, made importable.
    #
    # Written to the virtual filesystem and imported for real, rather than
    # concatenated: an import statement has to mean what it means everywhere
    # else, or a learner's build challenge would be Python-shaped code that is
    # not Python. The JavaScript side reaches the same place by a different
    # route - QuickJS has no loader, so it gets a CommonJS registry - and both
    # end up executing files that import each other by name.
    import os, sys, shutil, importlib

    # Wiped per run. Pyodide is cached across runs for the life of the tab, so
    # a file renamed between steps would otherwise stay importable and a
    # learner would pass on code that no longer exists.
    if os.path.isdir(_WORKSPACE):
        shutil.rmtree(_WORKSPACE)
    os.makedirs(_WORKSPACE, exist_ok=True)

    files = list(modules) + [[entry_module, entry_source]]
    for name, src in files:
        with open(os.path.join(_WORKSPACE, name + ".py"), "w") as f:
            f.write(src)

    if _WORKSPACE not in sys.path:
        sys.path.insert(0, _WORKSPACE)

    # Same reason as the wipe: a cached module object would serve the previous
    # run's code back to this one.
    for name, _ in files:
        sys.modules.pop(name, None)
    importlib.invalidate_caches()

    module = importlib.import_module(entry_module)
    return module


def _run(source, entry, args_json, tracing, max_events, deadline, modules_json="", entry_module=""):
    import io
    _stdout_buf = io.StringIO()
    _orig_stdout = sys.stdout
    _orig_stderr = sys.stderr
    sys.stdout = _stdout_buf
    sys.stderr = _stdout_buf

    def _get_logs():
        raw = _stdout_buf.getvalue()
        if not raw:
            return []
        lines = raw.splitlines()
        if len(lines) > 500:
            lines = lines[:500]
        return [l[:2000] for l in lines]

    class _Console:
        @staticmethod
        def log(*args, **kwargs):
            print(*args, **kwargs)
        error = log
        warn = log
        info = log
        debug = log

    events = []
    dropped = [0]

    def full():
        if not tracing:
            return True
        if len(events) >= max_events:
            dropped[0] += 1
            return True
        return False

    def sink(e):
        if not tracing:
            return
        if len(events) >= max_events:
            dropped[0] += 1
            return
        events.append(e)

    try:
        if entry_module:
            module = _install(json.loads(modules_json or "[]"), entry_module, source)
            if not hasattr(module, "console"):
                setattr(module, "console", _Console())
            if not hasattr(module, entry):
                raise AttributeError(
                    '%s.py does not define %s. Check the spelling.' % (entry_module, entry)
                )
            fn = getattr(module, entry)
        else:
            scope = {"console": _Console()}
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
            wrapped.append(_TracedList(a, name, sink, full) if isinstance(a, list) else a)

        def tracer(frame, event, arg):
            if time.time() > deadline:
                raise _Timeout()
            if event == "line" and tracing and frame.f_code.co_filename == _SOURCE_FILE:
                if full():
                    return tracer
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
            "ok": True,
            "value": _snap(value),
            "events": events,
            "dropped": dropped[0],
            "indexedBy": _index_variables(source),
            "logs": _get_logs(),
        })
    except Exception as e:
        return json.dumps({
            "ok": False,
            "error": str(e),
            "logs": _get_logs(),
            "timedOut": isinstance(e, _Timeout),
        })
    finally:
        sys.stdout = _orig_stdout
        sys.stderr = _orig_stderr
`;

export async function runPython(opts: RunOptions): Promise<RunResult> {
  const {
    source,
    entry,
    args,
    trace = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxEvents = DEFAULT_MAX_EVENTS,
    modules,
    entryModule,
  } = opts;

  const multiFile = (modules?.length ?? 0) > 0;

  /**
   * Python never degrades on a single file: sys.settrace reports lines straight
   * from the interpreter, so there is no source rewriting that could fail.
   *
   * A build challenge does degrade, for the same reason JavaScript's does — one
   * line number cannot address a workspace of several files. Both adapters draw
   * the line in the same place, so a challenge animates identically (which is to
   * say, structurally) in either language.
   */
  const empty: RunResult = {
    ok: false,
    timedOut: false,
    events: [],
    truncated: false,
    traceDegraded: trace && multiFile,
    logs: [],
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
    const raw = run(
      source,
      entry,
      JSON.stringify(args),
      trace,
      maxEvents,
      deadline,
      // Serialised rather than passed as a Python list: Pyodide's proxying of a
      // nested JS array is one more thing to get wrong for no gain, and the
      // runner already parses JSON for the arguments.
      multiFile ? JSON.stringify(modules!.map((m) => [m.name, m.source])) : '',
      multiFile ? (entryModule ?? '__entry') : '',
    );
    const payload = JSON.parse(raw) as {
      ok?: boolean;
      error?: string;
      timedOut?: boolean;
      value?: unknown;
      events?: TraceEvent[];
      dropped?: number;
      indexedBy?: Record<string, string[]>;
      logs?: string[];
    };

    if (payload.ok === false) {
      return {
        ...empty,
        ok: false,
        timedOut: Boolean(payload.timedOut),
        error: payload.error,
        logs: payload.logs ?? [],
      };
    }

    const events = payload.events ?? [];
    if ((payload.dropped ?? 0) > 0) {
      events.push({ kind: 'truncated', dropped: payload.dropped! });
    }

    return {
      ok: true,
      value: payload.value,
      timedOut: false,
      events,
      truncated: (payload.dropped ?? 0) > 0,
      traceDegraded: trace && multiFile,
      indexedBy: payload.indexedBy ?? {},
      logs: payload.logs ?? [],
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ...empty, timedOut: /_Timeout/.test(message), error: message };
  }
}
