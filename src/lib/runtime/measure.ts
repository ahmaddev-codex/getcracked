// From `quickjs-emscripten-core`, never `quickjs-emscripten`. The latter's
// index re-exports every variant and each runs environment detection at module
// evaluation, so one import of the convenience package drags in loaders we
// deliberately do not use — including the single-file one, whose embedded
// binary Turbopack's minifier corrupts (see lib/runtime/quickjs.ts).
import { shouldInterruptAfterDeadline } from 'quickjs-emscripten-core';
import { getQuickJS } from './quickjs';
import { parse } from 'acorn';

/**
 * Runtime cost measurement (PRD B4).
 *
 * **What this is and is not.** These are *measurements* of one execution, not a
 * complexity proof. Big-O is a statement about asymptotic growth and cannot be
 * derived from running a function once — so the asymptotic figures shown to a
 * learner come from the problem author (`complexity` in the content schema),
 * and what is measured here is what actually happened: how many steps ran, how
 * many array slots were touched, how long it took, and how much memory the
 * interpreter held.
 *
 * Conflating the two would be worse than omitting either. A learner told
 * "O(n²)" by a tool that ran one 4-element input has been told a guess.
 *
 * Counting is deliberately cheaper than tracing: the instrumentation emits a
 * bare counter increment rather than building an event object with a variable
 * snapshot, so this costs a fraction of a full traced run.
 */

export interface RuntimeMetrics {
  /** Statements executed in the learner's function. */
  steps: number;
  /** Array element reads through subscript access. */
  arrayReads: number;
  /** Array element writes through subscript assignment. */
  arrayWrites: number;
  /** Wall-clock time for the sandboxed call. */
  elapsedMs: number;
  /** Interpreter memory in use, from QuickJS's own accounting. */
  memoryBytes: number | null;
}

type AnyNode = Record<string, unknown>;

/**
 * Inserts a bare `__step()` before each statement in the entry function.
 *
 * A separate, simpler pass than `instrument.ts`: that one has to track scopes so
 * it can report live variables without hitting the temporal dead zone. Counting
 * needs none of that, so it stays a flat walk and cannot introduce the class of
 * bug scope tracking exists to avoid.
 */
function instrumentForCounting(source: string, entry: string): string | null {
  let ast: unknown;
  try {
    ast = parse(source, { ecmaVersion: 2022, ranges: true });
  } catch {
    return null;
  }

  const body = (ast as AnyNode).body as AnyNode[];
  const target = body.find(
    (n) => n.type === 'FunctionDeclaration' && (n.id as AnyNode | undefined)?.name === entry,
  );
  if (!target) return null;

  const offsets: number[] = [];
  const NON_PREFIXABLE = new Set(['FunctionDeclaration', 'ClassDeclaration']);

  const walk = (node: AnyNode | null | undefined): void => {
    if (!node || typeof node !== 'object' || typeof node.type !== 'string') return;

    if (node.type === 'BlockStatement') {
      for (const stmt of node.body as AnyNode[]) {
        if (!NON_PREFIXABLE.has(stmt.type as string)) {
          offsets.push((stmt.range as [number, number])[0]);
        }
      }
    }
    for (const key of Object.keys(node)) {
      if (key === 'range' || key === 'type' || key === 'loc') continue;
      const value = node[key];
      if (Array.isArray(value)) value.forEach((v) => walk(v as AnyNode));
      else walk(value as AnyNode);
    }
  };

  walk(target);

  let out = source;
  for (const offset of [...offsets].sort((a, b) => b - a)) {
    out = `${out.slice(0, offset)}__step();${out.slice(offset)}`;
  }
  return out;
}

function harness(entry: string, argNames: string[]): string {
  return `
var __c = { steps: 0, reads: 0, writes: 0 };
function __step() { __c.steps++; }
function __wrap(name, arr) {
  if (!Array.isArray(arr)) return arr;
  return new Proxy(arr, {
    get: function (t, k, r) {
      if (typeof k === 'string' && /^[0-9]+$/.test(k)) __c.reads++;
      return Reflect.get(t, k, r);
    },
    set: function (t, k, v, r) {
      if (typeof k === 'string' && /^[0-9]+$/.test(k)) __c.writes++;
      return Reflect.set(t, k, v, r);
    },
  });
}
globalThis.__measure = function (argsJson) {
  var args = JSON.parse(argsJson);
  var names = ${JSON.stringify(argNames)};
  var wrapped = args.map(function (a, i) { return __wrap(names[i] || ('arg' + i), a); });
  ${entry}.apply(null, wrapped);
  return JSON.stringify(__c);
};
`;
}

function entryParamNames(source: string, entry: string): string[] {
  const m = new RegExp(`function\\s+${entry}\\s*\\(([^)]*)\\)`).exec(source);
  return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : [];
}

/**
 * Measures one execution. Returns null when the code cannot be measured —
 * unparseable, or the entry is not a function declaration — because a partial
 * measurement presented as a real one is worse than none.
 */
export async function measureRun(opts: {
  source: string;
  entry: string;
  args: unknown[];
  timeoutMs?: number;
}): Promise<RuntimeMetrics | null> {
  const counted = instrumentForCounting(opts.source, opts.entry);
  if (!counted) return null;

  const QuickJS = await getQuickJS();
  const runtime = QuickJS.newRuntime();
  runtime.setMemoryLimit(64 * 1024 * 1024);
  const vm = runtime.newContext();
  runtime.setInterruptHandler(shouldInterruptAfterDeadline(Date.now() + (opts.timeoutMs ?? 5_000)));

  try {
    const program = `${counted}\n${harness(opts.entry, entryParamNames(opts.source, opts.entry))}`;
    const setup = vm.evalCode(program);
    if (setup.error) {
      setup.error.dispose();
      return null;
    }
    setup.value.dispose();

    const fn = vm.getProp(vm.global, '__measure');
    const argHandle = vm.newString(JSON.stringify(opts.args));

    const started = performance.now();
    const called = vm.callFunction(fn, vm.undefined, argHandle);
    const elapsedMs = performance.now() - started;

    argHandle.dispose();
    fn.dispose();

    if (called.error) {
      called.error.dispose();
      return null;
    }

    const counts = JSON.parse(vm.dump(called.value) as string) as {
      steps: number;
      reads: number;
      writes: number;
    };
    called.value.dispose();

    let memoryBytes: number | null = null;
    try {
      const usage = runtime.computeMemoryUsage();
      const dumped = vm.dump(usage) as Record<string, number>;
      usage.dispose();
      memoryBytes = dumped.memory_used_size ?? dumped.malloc_size ?? null;
    } catch {
      // Memory accounting is a nice-to-have; its absence must not fail the run.
    }

    return {
      steps: counts.steps,
      arrayReads: counts.reads,
      arrayWrites: counts.writes,
      elapsedMs,
      memoryBytes,
    };
  } catch {
    return null;
  } finally {
    try { vm.dispose(); } catch {}
    try { runtime.dispose(); } catch {}
  }
}
