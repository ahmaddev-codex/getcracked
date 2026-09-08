// From `quickjs-emscripten-core`, never `quickjs-emscripten`. The latter's
// index re-exports every variant and each runs environment detection at module
// evaluation, so one import of the convenience package drags in loaders we
// deliberately do not use — including the single-file one, whose embedded
// binary Turbopack's minifier corrupts (see lib/runtime/quickjs.ts).
import { shouldInterruptAfterDeadline } from 'quickjs-emscripten-core';
import { getQuickJS } from './quickjs';
import { instrument } from './instrument';
import { javaScriptIndexVariables, type IndexVariables } from './index-vars';
import { DEFAULT_MAX_EVENTS, type TraceEvent } from './trace';

export interface RunOptions {
  /** Learner source, expected to declare `entry` as a function declaration. */
  source: string;
  entry: string;
  args: unknown[];
  /** Off by default: a plain pass/fail run should pay no tracing cost. */
  trace?: boolean;
  timeoutMs?: number;
  maxEvents?: number;
  /**
   * Sibling modules `source` may import, for a tier-3 build challenge.
   *
   * Absent for problems and lesson exercises, which are one function in one
   * file. Adding it as an option rather than replacing `source` with a file
   * list keeps the single-file path — the overwhelming majority of runs —
   * exactly what it was, instead of making every caller describe a workspace of
   * one.
   */
  modules?: ReadonlyArray<{ name: string; source: string }>;
  /**
   * Module name of `source` itself, so siblings can import it back.
   *
   * Required whenever `modules` is given: a module registry with a nameless
   * entry cannot express `harness` importing `lru_cache`, which is the exact
   * shape every build challenge has.
   */
  entryModule?: string;
}

export interface RunResult {
  ok: boolean;
  value?: unknown;
  error?: string;
  timedOut: boolean;
  events: TraceEvent[];
  truncated: boolean;
  /**
   * True when line-level tracing was unavailable or discarded, so the trace
   * carries structure events only.
   *
   * Reduced fidelity is an acceptable outcome; a wrong answer is not. See the
   * R-2 mitigation in instrument.ts.
   */
  traceDegraded: boolean;
  /**
   * Array name to the variables the source uses to subscript it.
   *
   * Read statically from the source, because no runtime trace can tell an index
   * from a number that happens to be in range — by the time the access fires,
   * `a[i]` and `a[0]` are the same call. See index-vars.ts.
   */
  indexedBy?: IndexVariables;
  logs?: string[];
}

const DEFAULT_TIMEOUT_MS = 5_000;

/**
 * Harness evaluated inside the QuickJS sandbox alongside the learner's code.
 *
 * Array reads and writes are captured with a Proxy rather than by instrumenting
 * subscript expressions — it is far less invasive, and it catches accesses made
 * from code the learner did not write (built-ins, callbacks) too.
 */
function harness(
  entry: string,
  /**
   * How to reach the entry function from inside the sandbox.
   *
   * A bare global for a single file; a lookup on a module's exports for a build
   * challenge. Parameterised rather than branched, so both tiers share one
   * harness — a second copy is where the two would quietly drift on what a
   * traced run records.
   */
  entryExpr: string,
  argNames: string[],
  maxEvents: number,
  tracing: boolean,
): string {
  return `
var __events = [];
var __dropped = 0;
var __tracing = ${tracing};
// Snapshotting a proxied array walks its indices, which would fire the very
// read traps we are recording and invent accesses the learner never made.
// Recording is suspended for the duration of any snapshot.
var __recording = true;
function __push(e) {
  if (!__tracing || !__recording) return;
  if (__events.length >= ${maxEvents}) { __dropped++; return; }
  __events.push(e);
}
// True once nothing more will be recorded.
//
// Checked by every call site *before* it builds the event, because building
// one is the whole cost of tracing and the cap used to bound only the payload.
// A line event snapshots every live variable, so a loop over a 1000-element
// array paid a 1000-element snapshot on each of 1000 iterations to keep the
// first 50 — quadratic work for a fixed-size result. Recording is suspended
// during a snapshot, so a suspended tracer must not count a drop.
function __dropping() {
  if (!__tracing || !__recording) return true;
  if (__events.length >= ${maxEvents}) { __dropped++; return true; }
  return false;
}
function __snap(v, d) {
  d = d || 0;
  if (d > 4) return '[nested]';
  if (v === null || typeof v !== 'object') return v;
  if (Array.isArray(v)) return v.map(function (x) { return __snap(x, d + 1); });
  if (v instanceof Map) return { __map: Array.from(v.entries()) };
  if (v instanceof Set) return { __set: Array.from(v.values()) };
  var o = {};
  for (var k in v) { if (Object.prototype.hasOwnProperty.call(v, k)) o[k] = __snap(v[k], d + 1); }
  return o;
}
function __quiet(fn) {
  var prev = __recording;
  __recording = false;
  try { return fn(); } finally { __recording = prev; }
}
function __t(line, vars) {
  if (__dropping()) return;
  var snapped = __quiet(function () {
    var o = {};
    for (var k in vars) { if (Object.prototype.hasOwnProperty.call(vars, k)) o[k] = __snap(vars[k]); }
    return o;
  });
  __push({ kind: 'line', line: line, vars: snapped });
}
function __wrapArr(name, arr) {
  if (!__tracing || !Array.isArray(arr)) return arr;
  return new Proxy(arr, {
    get: function (t, k, r) {
      if (typeof k === 'string' && /^[0-9]+$/.test(k) && !__dropping()) {
        var rv = __quiet(function () { return __snap(t[k]); });
        __push({ kind: 'array_read', array: name, index: Number(k), value: rv });
      }
      return Reflect.get(t, k, r);
    },
    set: function (t, k, v, r) {
      if (typeof k === 'string' && /^[0-9]+$/.test(k) && !__dropping()) {
        var wv = __quiet(function () { return __snap(v); });
        __push({ kind: 'array_write', array: name, index: Number(k), value: wv });
      }
      return Reflect.set(t, k, v, r);
    },
  });
}
globalThis.__invoke = function (argsJson) {
  var args = JSON.parse(argsJson);
  var names = ${JSON.stringify(argNames)};
  var wrapped = args.map(function (a, i) { return __wrapArr(names[i] || ('arg' + i), a); });
  var __fn = ${entryExpr};
  if (typeof __fn !== 'function') {
    throw new Error(${JSON.stringify(
      `No function named "${entry}" was found. Check the spelling, and that the file exports it.`,
    )});
  }
  var value = __fn.apply(null, wrapped);
  var snappedValue = __quiet(function () { return __snap(value); });
  __push({ kind: 'return', value: snappedValue });
  return JSON.stringify({
    value: snappedValue,
    events: __events,
    dropped: __dropped,
    logs: globalThis.__logs || [],
  });
};
`;
}

/**
 * A CommonJS module registry, evaluated inside the sandbox.
 *
 * QuickJS's `evalCode` takes one script and has no module loader, so a build
 * challenge's files are wrapped in factory functions and joined by a `require`
 * of our own. That is why the launch languages' build challenges are authored
 * against `module.exports` / `require` rather than ESM: it is what can actually
 * be implemented here without a resolver, and it is close enough to Python's
 * `import` that one challenge reads the same in both.
 *
 * Extensions and a leading `./` are stripped, so `require('./store')`,
 * `require('store')` and `require('./store.js')` all resolve — a learner should
 * not lose a test run to an import spelling.
 */
function moduleRegistry(modules: ReadonlyArray<{ name: string; source: string }>): string {
  const defs = modules
    .map(
      (m) =>
        `__modules[${JSON.stringify(m.name)}] = function (module, exports, require) {\n${m.source}\n};`,
    )
    .join('\n');

  return `
var __modules = {};
var __moduleCache = {};
function __require(name) {
  var key = String(name).replace(/^\\.\\//, '').replace(/\\.(js|mjs|cjs)$/, '');
  if (Object.prototype.hasOwnProperty.call(__moduleCache, key)) {
    return __moduleCache[key].exports;
  }
  var factory = __modules[key];
  if (!factory) {
    throw new Error("Cannot find module '" + name + "'. Files in this workspace: " + Object.keys(__modules).join(', '));
  }
  var module = { exports: {} };
  // Cached before the factory runs, so a cycle resolves to a partial export
  // rather than recursing until the stack gives out.
  __moduleCache[key] = module;
  factory(module, module.exports, __require);
  return module.exports;
}
var require = __require;
${defs}
`;
}

/** Parameter names of the entry function, so array events carry a real name. */
function entryParamNames(source: string, entry: string): string[] {
  const m = new RegExp(`function\\s+${entry}\\s*\\(([^)]*)\\)`).exec(source);
  if (!m) return [];
  return m[1]
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const SANDBOX_PRELUDE = `
globalThis.__logs = [];
function __fmtLogArg(a) {
  if (a === null) return 'null';
  if (a === undefined) return 'undefined';
  if (typeof a === 'string') return a;
  if (typeof a === 'number' || typeof a === 'boolean' || typeof a === 'symbol') return String(a);
  if (typeof a === 'bigint') return a.toString() + 'n';
  if (typeof a === 'function') return '[Function' + (a.name ? ': ' + a.name : '') + ']';
  if (a instanceof Error) return a.stack || (a.name + ': ' + a.message);
  try {
    var seen = [];
    var str = JSON.stringify(a, function (key, val) {
      if (typeof val === 'object' && val !== null) {
        if (seen.indexOf(val) !== -1) return '[Circular]';
        seen.push(val);
      }
      return val;
    });
    return str.length > 2000 ? str.slice(0, 2000) + '…' : str;
  } catch (e) {
    return String(a);
  }
}
function __appendLog(args) {
  if (!globalThis.__logs) globalThis.__logs = [];
  if (globalThis.__logs.length >= 500) return;
  var parts = [];
  for (var i = 0; i < args.length; i++) parts.push(__fmtLogArg(args[i]));
  var line = parts.join(' ');
  if (line.length > 2000) line = line.slice(0, 2000) + '…';
  globalThis.__logs.push(line);
}
globalThis.console = {
  log: function () { __appendLog(arguments); },
  error: function () { __appendLog(arguments); },
  warn: function () { __appendLog(arguments); },
  info: function () { __appendLog(arguments); },
  debug: function () { __appendLog(arguments); },
  dir: function () { __appendLog(arguments); },
  trace: function () { __appendLog(arguments); },
  table: function () { __appendLog(arguments); }
};
if (typeof globalThis.performance === 'undefined') {
  globalThis.performance = { now: function () { return Date.now(); } };
}

// Algorithmic Data Structures: PriorityQueue (Min/Max Heap)
function PriorityQueue(comparator) {
  this.comparator = typeof comparator === 'function' ? comparator : function (a, b) { return a < b ? -1 : a > b ? 1 : 0; };
  this.heap = [];
}
PriorityQueue.prototype = {
  size: function () { return this.heap.length; },
  isEmpty: function () { return this.heap.length === 0; },
  empty: function () { return this.heap.length === 0; },
  peek: function () { return this.heap[0]; },
  top: function () { return this.heap[0]; },
  offer: function (val) { return this.push(val); },
  add: function (val) { return this.push(val); },
  push: function (val) {
    this.heap.push(val);
    this._siftUp(this.heap.length - 1);
    return true;
  },
  poll: function () { return this.pop(); },
  pop: function () {
    if (this.heap.length === 0) return undefined;
    var top = this.heap[0];
    var bottom = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this._siftDown(0);
    }
    return top;
  },
  _siftUp: function (node) {
    while (node > 0) {
      var parent = (node - 1) >>> 1;
      if (this.comparator(this.heap[node], this.heap[parent]) < 0) {
        var tmp = this.heap[node];
        this.heap[node] = this.heap[parent];
        this.heap[parent] = tmp;
        node = parent;
      } else break;
    }
  },
  _siftDown: function (node) {
    var length = this.heap.length;
    var halfLength = length >>> 1;
    while (node < halfLength) {
      var left = (node << 1) + 1;
      var right = left + 1;
      var best = left;
      if (right < length && this.comparator(this.heap[right], this.heap[left]) < 0) {
        best = right;
      }
      if (this.comparator(this.heap[best], this.heap[node]) < 0) {
        var tmp = this.heap[node];
        this.heap[node] = this.heap[best];
        this.heap[best] = tmp;
        node = best;
      } else break;
    }
  }
};
globalThis.PriorityQueue = PriorityQueue;
globalThis.MinPriorityQueue = PriorityQueue;
globalThis.MaxPriorityQueue = function () {
  return new PriorityQueue(function (a, b) { return a > b ? -1 : a < b ? 1 : 0; });
};

// Algorithmic Data Structures: FIFO Queue / Deque
function Queue() {
  this._items = [];
  this._head = 0;
}
Queue.prototype = {
  offer: function (val) { this._items.push(val); return true; },
  push: function (val) { this._items.push(val); return true; },
  add: function (val) { this._items.push(val); return true; },
  poll: function () {
    if (this._head >= this._items.length) return undefined;
    var item = this._items[this._head++];
    if (this._head * 2 >= this._items.length && this._head > 32) {
      this._items = this._items.slice(this._head);
      this._head = 0;
    }
    return item;
  },
  pop: function () { return this.poll(); },
  peek: function () { return this._items[this._head]; },
  front: function () { return this._items[this._head]; },
  size: function () { return this._items.length - this._head; },
  isEmpty: function () { return this.size() === 0; },
  empty: function () { return this.size() === 0; }
};
globalThis.Queue = Queue;
globalThis.LinkedList = Queue;

// Collection method compatibility for Java / C++ transpiled code
if (typeof Map !== 'undefined') {
  Map.prototype.put = function (k, v) { this.set(k, v); return v; };
  Map.prototype.containsKey = function (k) { return this.has(k); };
  Map.prototype.getOrDefault = function (k, d) { return this.has(k) ? this.get(k) : d; };
}
if (typeof Set !== 'undefined') {
  Set.prototype.contains = function (v) { return this.has(v); };
  Set.prototype.remove = function (v) { return this.delete(v); };
}
if (typeof Array !== 'undefined') {
  Array.prototype.add = function (v) { this.push(v); return true; };
  Array.prototype.get = function (i) { return this[i]; };
  Array.prototype.set = function (i, v) { this[i] = v; };
  Array.prototype.isEmpty = function () { return this.length === 0; };
  Array.prototype.size = function () { return this.length; };
}

// Go language built-ins
globalThis.len = function (x) {
  if (x == null) return 0;
  if (typeof x.length === 'number') return x.length;
  if (typeof x.size === 'number') return x.size;
  if (typeof x.size === 'function') return x.size();
  return Object.keys(x).length;
};
globalThis.append = function (arr) {
  var res = Array.isArray(arr) ? arr.slice() : [];
  for (var i = 1; i < arguments.length; i++) res.push(arguments[i]);
  return res;
};
globalThis.make = function (type, cap) {
  if (typeof type === 'string' && type.startsWith('map')) return new Map();
  return new Array(typeof cap === 'number' ? cap : 0).fill(0);
};
`;

function extractVmLogs(vm: { evalCode: (code: string) => { error?: { dispose: () => void }; value?: { dispose: () => void } }; dump: (val: unknown) => unknown }): string[] {
  try {
    const handle = vm.evalCode('JSON.stringify(globalThis.__logs || [])');
    if (!handle.error && handle.value) {
      const dumped = vm.dump(handle.value);
      handle.value.dispose();
      return JSON.parse(dumped as string) as string[];
    }
    handle.error?.dispose();
  } catch {
    // Ignore extraction failure and return empty
  }
  return [];
}

/**
 * Runs the learner's code once, exactly as given.
 *
 * Split out so a traced run can be validated against an untraced one without
 * duplicating the QuickJS setup, disposal, and error handling.
 */
async function executeOnce(
  opts: RunOptions,
  useTrace: boolean,
): Promise<RunResult> {
  const {
    source,
    entry,
    args,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxEvents = DEFAULT_MAX_EVENTS,
    modules,
    entryModule,
  } = opts;

  const multiFile = (modules?.length ?? 0) > 0;

  const trace = useTrace;
  const QuickJS = await getQuickJS();
  const runtime = QuickJS.newRuntime();

  // Enforce memory bounds to prevent linear memory exhaustion or thread freezing
  runtime.setMemoryLimit(64 * 1024 * 1024); // 64 MB heap limit

  const vm = runtime.newContext();

  // The only execution hook QuickJS offers. It cannot report where execution
  // is, only whether it should stop — which is why tracing needs instrument().
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + timeoutMs));

  const empty: RunResult = {
    ok: false,
    timedOut: false,
    events: [],
    truncated: false,
    traceDegraded: false,
    logs: [],
  };

  try {
    // Preload console and safe host environment polyfills before evaluating any user code
    const preludeSetup = vm.evalCode(SANDBOX_PRELUDE);
    if (preludeSetup.error) {
      preludeSetup.error.dispose();
    } else {
      preludeSetup.value.dispose();
    }

    /**
     * Instrumentation can fail to locate the entry (a function expression, say).
     * That is not fatal: structure events come from a Proxy on the arguments and
     * need no rewriting, so the run proceeds with reduced fidelity.
     *
     * **Line tracing is single-file only, deliberately.** A trace event carries
     * one line number, and across a workspace of several files a line number is
     * ambiguous — line 12 of which file? Rewriting the composed program instead
     * would number lines against a script the learner cannot see, so the
     * highlight would land on the wrong row of the wrong tab. A build challenge
     * therefore records structure events only and reports itself degraded, which
     * is a true statement about what it captured rather than a wrong picture.
     */
    const rewritten =
      trace && !multiFile ? instrument(source, entry) : { code: source, instrumented: false };
    const degraded = trace && (multiFile || !rewritten.instrumented);

    const argNames = entryParamNames(source, entry);

    /**
     * The entry module is registered alongside its siblings rather than left at
     * the top level, so `harness` importing `lru_cache` and `lru_cache`
     * importing back both work. That means its functions are not globals, so
     * the entry is reached through its exports.
     */
    const entryName = entryModule ?? '__entry';
    const registry = multiFile
      ? moduleRegistry([...modules!, { name: entryName, source: rewritten.code }])
      : rewritten.code;
    const entryExpr = multiFile
      ? `__require(${JSON.stringify(entryName)})[${JSON.stringify(entry)}]`
      : entry;

    const program = `${registry}\n${harness(entry, entryExpr, argNames, maxEvents, trace)}`;

    const setup = vm.evalCode(program);
    if (setup.error) {
      const logs = extractVmLogs(vm);
      const err = vm.dump(setup.error);
      setup.error.dispose();
      return { ...empty, timedOut: isInterrupt(err), error: formatError(err), logs };
    }
    setup.value.dispose();

    const invoke = vm.getProp(vm.global, '__invoke');
    const argHandle = vm.newString(JSON.stringify(args));
    const called = vm.callFunction(invoke, vm.undefined, argHandle);
    argHandle.dispose();
    invoke.dispose();

    if (called.error) {
      const logs = extractVmLogs(vm);
      const err = vm.dump(called.error);
      called.error.dispose();
      return { ...empty, timedOut: isInterrupt(err), error: formatError(err), logs };
    }

    const payload = JSON.parse(vm.dump(called.value) as string) as {
      value: unknown;
      events: TraceEvent[];
      dropped: number;
      logs?: string[];
    };
    called.value.dispose();

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
      traceDegraded: degraded,
      indexedBy: javaScriptIndexVariables(source),
      logs: payload.logs ?? extractVmLogs(vm),
    };
  } catch (e) {
    const logs = extractVmLogs(vm);
    const message = e instanceof Error ? e.message : String(e);
    return { ...empty, error: message, logs };
  } finally {
    try {
      vm.dispose();
    } catch {
      // Ignore disposal failure if the VM state was abruptly unwound
    }
    try {
      runtime.dispose();
    } catch {
      // Ignore disposal failure if the runtime was aborted
    }
  }
}

/**
 * A tripped interrupt handler surfaces as a QuickJS *error value*
 * (`InternalError: interrupted`), not as a thrown host exception — so a timeout
 * has to be recognised here rather than in a catch block.
 */
function isInterrupt(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as Record<string, unknown>;
  return e.name === 'InternalError' && e.message === 'interrupted';
}

function formatError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as Record<string, unknown>;
    if (typeof e.message === 'string') {
      return typeof e.name === 'string' ? `${e.name}: ${e.message}` : e.message;
    }
  }
  return String(err);
}

/**
 * Runs learner code, optionally with tracing.
 *
 * **The correctness guarantee (R-2).** Tracing means rewriting the learner's
 * source, and rewritten code that behaves differently from what they wrote would
 * be worse than no tracing at all — it would mark a correct solution wrong.
 *
 * So a traced run is validated against an untraced one. If the two disagree on
 * the returned value or on whether it threw, the *untraced* result is
 * authoritative and the trace is discarded as unsound. Instrumentation can
 * therefore never change a learner's outcome; the worst it can do is fail to
 * animate.
 *
 * The second execution costs a warm QuickJS run — measured at 0.7ms in T0.2 —
 * which is a small price for the guarantee. Untraced runs skip it entirely.
 */
export async function runJavaScript(opts: RunOptions): Promise<RunResult> {
  const wantsTrace = opts.trace ?? false;
  const traced = await executeOnce(opts, wantsTrace);

  /**
   * A multi-file run rewrites nothing (see executeOnce), so there is no
   * behaviour to verify and the second execution would be pure cost — on the
   * tier whose runs are the longest.
   */
  const rewrote = wantsTrace && (opts.modules?.length ?? 0) === 0;
  if (!rewrote || traced.timedOut) return traced;

  const plain = await executeOnce({ ...opts, trace: false }, false);

  const sameOutcome =
    traced.ok === plain.ok && JSON.stringify(traced.value) === JSON.stringify(plain.value);

  if (sameOutcome) return traced;

  // Instrumentation altered behaviour. Report what the learner's own code does.
  return {
    ...plain,
    events: traced.events.filter((e) => e.kind !== 'line'),
    traceDegraded: true,
  };
}
