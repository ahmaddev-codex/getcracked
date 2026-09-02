import { runJavaScript } from '@/lib/runtime/javascript';
import { runPython } from '@/lib/runtime/python';
import { runTypeScript } from '@/lib/runtime/typescript';
import { runJava, runCpp, runGo } from '@/lib/runtime/adapters/compiled-languages';
import type { RunOptions, RunResult } from '@/lib/runtime/javascript';
import { measureRun, type RuntimeMetrics } from '@/lib/runtime/measure';
import { toProtocol, type Trace } from '@/lib/trace/protocol';
import { entryFor, type RunnableLanguage, type TestSpec } from './schema';

/**
 * Runs a declarative test spec against learner code (AD-3).
 *
 * **One spec, every language — by interpretation, not code generation.**
 *
 * The obvious implementation is to compile the spec into a test file per
 * language: a Jest suite for JavaScript, a pytest module for Python. That means
 * writing and maintaining a code generator per language, and a bug in any one of
 * them shows up as a learner failing a test they actually passed.
 *
 * Since the runtime adapters already execute a named function with arguments and
 * hand back a value, the spec can simply be *interpreted*: call, compare,
 * repeat. Adding a language means implementing the adapter — which T2.6 has to
 * do anyway — and no generator at all.
 */

export interface CaseResult {
  name: string;
  passed: boolean;
  args: unknown[];
  expected: unknown;
  actual?: unknown;
  error?: string;
  hidden: boolean;
}

export interface SpecResult {
  passed: boolean;
  cases: CaseResult[];
  timedOut: boolean;
  /**
   * Encoded trace (T2.7), or null when tracing was not requested.
   *
   * The protocol form rather than raw events: diffed and with collections
   * hoisted, which is a ~17x payload reduction on a 500-element loop and what
   * makes the trace safe to hand to a renderer at all.
   */
  trace: Trace | null;
  traceDegraded: boolean;
  /**
   * Measured cost of the largest passing case — null when the code could not be
   * measured, or when nothing passed and there is nothing meaningful to measure.
   */
  metrics: RuntimeMetrics | null;
}

/**
 * Structural equality over JSON-representable values.
 *
 * Both runtimes hand back values that have crossed a JSON boundary, so
 * comparing that way is faithful rather than lossy — and it gives order-
 * sensitive array comparison, which matters for problems whose answer is a
 * sequence.
 */
function equal(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function describeCase(index: number, args: unknown[], name?: string): string {
  return name ?? `case ${index + 1}: (${args.map((a) => JSON.stringify(a)).join(', ')})`;
}

/**
 * The language registry — the whole of AD-2's extensibility claim.
 *
 * Adding a language is one entry here plus an adapter satisfying
 * `LanguageRuntime`. Nothing else in the spec runner, the worker, the editor,
 * or the results UI knows how many languages exist, which is what keeps Java's
 * eventual return an adapter rather than a rewrite.
 */
export type LanguageRuntime = (opts: RunOptions) => Promise<RunResult>;

const RUNTIMES: Record<RunnableLanguage, LanguageRuntime> = {
  javascript: runJavaScript,
  python: runPython,
  typescript: runTypeScript,
  java: runJava,
  cpp: runCpp,
  go: runGo,
};

/** Languages with a working adapter, for the editor's switcher. */
export function supportedLanguages(): RunnableLanguage[] {
  return (Object.keys(RUNTIMES) as RunnableLanguage[]).filter((l) => RUNTIMES[l]);
}

export interface RunSpecOptions {
  spec: TestSpec;
  source: string;
  language: RunnableLanguage;
  trace?: boolean;
  timeoutMs?: number;
  /** Off by default: measurement costs an extra sandboxed run. */
  measure?: boolean;
  /**
   * Sibling files, for a tier-3 build challenge (AD-7).
   *
   * The spec runner does not know or care that a challenge step is a workspace
   * rather than a function — it still calls one entry with arguments and
   * compares the result. Composing the files is the adapters' job, which is
   * what keeps tier 3 from needing a runner of its own.
   */
  modules?: ReadonlyArray<{ name: string; source: string }>;
  entryModule?: string;
}

export async function runTestSpec(opts: RunSpecOptions): Promise<SpecResult> {
  const {
    spec,
    source,
    language,
    trace = false,
    timeoutMs,
    measure = false,
    modules,
    entryModule,
  } = opts;

  const multiFile = (modules?.length ?? 0) > 0;

  const run = RUNTIMES[language];
  if (!run) {
    throw new Error(`No runtime adapter registered for language: ${language}`);
  }

  const entry = entryFor(spec, language);
  const cases: CaseResult[] = [];
  let timedOut = false;
  let traceEvents: RunResult['events'] = [];
  let traceDegraded = false;
  let indexedBy: RunResult['indexedBy'];

  for (const [i, testCase] of spec.cases.entries()) {
    const result = await run({
      source,
      modules,
      entryModule,
      entry,
      args: testCase.args,
      // Only the first case is traced: a trace is for watching one execution,
      // and tracing every case would multiply payload for no added insight.
      trace: trace && i === 0,
      timeoutMs,
    });

    if (i === 0 && trace) {
      traceEvents = result.events;
      traceDegraded = result.traceDegraded;
      indexedBy = result.indexedBy;
    }

    if (result.timedOut) {
      timedOut = true;
      cases.push({
        name: describeCase(i, testCase.args, testCase.name),
        passed: false,
        args: testCase.args,
        expected: testCase.expected,
        error: 'Timed out — check for an infinite loop.',
        hidden: testCase.hidden,
      });
      // A timeout will repeat for every remaining case; stop rather than making
      // the learner wait out the whole suite.
      break;
    }

    cases.push({
      name: describeCase(i, testCase.args, testCase.name),
      passed: result.ok && equal(result.value, testCase.expected),
      args: testCase.args,
      expected: testCase.expected,
      actual: result.value,
      error: result.error,
      hidden: testCase.hidden,
    });
  }

  const passed = cases.length === spec.cases.length && cases.every((c) => c.passed);

  /**
   * Measured on the largest input, since cost is what a learner cares about as
   * input grows — and only when everything passed, because measuring broken
   * code reports the cost of the wrong algorithm.
   */
  let metrics: RuntimeMetrics | null = null;
  // Measurement instruments JavaScript source specifically (measure.ts), so it
  // is skipped for other languages rather than reporting figures it cannot
  // actually produce.
  //
  // Skipped for a build challenge: `measureRun` instruments one source string
  // with acorn, and counting steps in only the entry file would report a figure
  // that looks like the whole build's cost and is not.
  if (measure && passed && !timedOut && language === 'javascript' && !multiFile) {
    const largest = [...spec.cases].sort(
      (a, b) => JSON.stringify(b.args).length - JSON.stringify(a.args).length,
    )[0];
    metrics = await measureRun({
      source,
      entry,
      args: largest.args,
      timeoutMs,
    });
  }

  return {
    passed,
    cases,
    timedOut,
    trace: trace ? toProtocol(traceEvents, { degraded: traceDegraded, indexedBy }) : null,
    traceDegraded,
    metrics,
  };
}
