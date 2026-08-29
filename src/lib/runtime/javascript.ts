import { getQuickJS, shouldInterruptAfterDeadline } from 'quickjs-emscripten';
import { instrument } from './instrument';
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
}

export interface RunResult {
  ok: boolean;
  value?: unknown;
  error?: string;
  timedOut: boolean;
  events: TraceEvent[];
  truncated: boolean;
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
      if (typeof k === 'string' && /^[0-9]+$/.test(k)) {
        var rv = __quiet(function () { return __snap(t[k]); });
        __push({ kind: 'array_read', array: name, index: Number(k), value: rv });
      }
      return Reflect.get(t, k, r);
    },
    set: function (t, k, v, r) {
      if (typeof k === 'string' && /^[0-9]+$/.test(k)) {
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
  var value = ${entry}.apply(null, wrapped);
  var snappedValue = __quiet(function () { return __snap(value); });
  __push({ kind: 'return', value: snappedValue });
  return JSON.stringify({ value: snappedValue, events: __events, dropped: __dropped });
};
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

export async function runJavaScript(opts: RunOptions): Promise<RunResult> {
  const {
    source,
    entry,
    args,
    trace = false,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxEvents = DEFAULT_MAX_EVENTS,
  } = opts;

  const QuickJS = await getQuickJS();
  const runtime = QuickJS.newRuntime();
  const vm = runtime.newContext();

  // The only execution hook QuickJS offers. It cannot report where execution
  // is, only whether it should stop — which is why tracing needs instrument().
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + timeoutMs));

  const empty: RunResult = { ok: false, timedOut: false, events: [], truncated: false };

  try {
    const userCode = trace ? instrument(source, entry) : source;
    const argNames = entryParamNames(source, entry);
    const program = `${userCode}\n${harness(entry, argNames, maxEvents, trace)}`;

    const setup = vm.evalCode(program);
    if (setup.error) {
      const err = vm.dump(setup.error);
      setup.error.dispose();
      return { ...empty, timedOut: isInterrupt(err), error: formatError(err) };
    }
    setup.value.dispose();

    const invoke = vm.getProp(vm.global, '__invoke');
    const argHandle = vm.newString(JSON.stringify(args));
    const called = vm.callFunction(invoke, vm.undefined, argHandle);
    argHandle.dispose();
    invoke.dispose();

    if (called.error) {
      const err = vm.dump(called.error);
      called.error.dispose();
      return { ...empty, timedOut: isInterrupt(err), error: formatError(err) };
    }

    const payload = JSON.parse(vm.dump(called.value) as string) as {
      value: unknown;
      events: TraceEvent[];
      dropped: number;
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
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { ...empty, error: message };
  } finally {
    vm.dispose();
    runtime.dispose();
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
