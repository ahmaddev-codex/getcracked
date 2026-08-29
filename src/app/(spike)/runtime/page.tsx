'use client';

import { useState } from 'react';
import type { RunResult } from '@/lib/runtime/javascript';
import type { TraceEvent } from '@/lib/runtime/trace';

/**
 * T0.2 spike prototype — throwaway.
 *
 * Exists to confirm in a real browser what the Node tests already assert: both
 * runtimes execute, both emit the same trace shape, and an infinite loop is
 * killed without freezing the tab. Not production UI; T1.2/T1.3 build the real
 * exercise surface.
 */

const JS_TWO_SUM = `function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}`;

const PY_TWO_SUM = `def two_sum(nums, target):
    seen = {}
    for i in range(len(nums)):
        complement = target - nums[i]
        if complement in seen:
            return [seen[complement], i]
        seen[nums[i]] = i
    return []`;

const JS_SPIN = `function spin() {
  while (true) {}
}`;

const PY_SPIN = `def spin():
    while True:
        pass`;

type Lang = 'javascript' | 'python';

interface Outcome extends RunResult {
  lang: Lang;
  elapsedMs: number;
  label: string;
}

export default function RuntimeSpikePage() {
  const [source, setSource] = useState(JS_TWO_SUM);
  const [lang, setLang] = useState<Lang>('javascript');
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState<Outcome[]>([]);
  const [tick, setTick] = useState(0);

  async function run(label: string, opts: { trace: boolean; timeoutMs?: number }) {
    setBusy(true);
    const started = performance.now();
    try {
      const entry = lang === 'javascript' ? 'twoSum' : 'two_sum';
      const args = /spin/.test(source) ? [] : [[2, 7, 11, 15], 9];
      const spinning = /spin/.test(source);

      // Imported separately rather than through a union so each branch keeps
      // its own type, and so Pyodide's multi-MB bundle is only fetched when a
      // learner actually picks Python.
      const runner =
        lang === 'javascript'
          ? (await import('@/lib/runtime/javascript')).runJavaScript
          : (await import('@/lib/runtime/python')).runPython;

      const result = await runner({
        source,
        entry: spinning ? 'spin' : entry,
        args,
        trace: opts.trace,
        timeoutMs: opts.timeoutMs,
      });

      setOutcomes((prev) => [
        { ...result, lang, elapsedMs: performance.now() - started, label },
        ...prev,
      ]);
    } catch (e) {
      setOutcomes((prev) => [
        {
          lang,
          ok: false,
          timedOut: false,
          events: [],
          truncated: false,
          traceDegraded: false,
          error: e instanceof Error ? e.message : String(e),
          elapsedMs: performance.now() - started,
          label,
        },
        ...prev,
      ]);
    } finally {
      setBusy(false);
    }
  }

  function switchLang(next: Lang) {
    setLang(next);
    setSource(next === 'javascript' ? JS_TWO_SUM : PY_TWO_SUM);
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-sans text-2xl font-semibold tracking-tight">Runtime spike (T0.2)</h1>
        <p className="text-sm opacity-70">
          Throwaway prototype. Proves execution, trace capture, and timeout kill for both runtimes.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {(['javascript', 'python'] as const).map((l) => (
          <button
            key={l}
            onClick={() => switchLang(l)}
            className={`rounded border px-3 py-1.5 text-sm ${
              lang === l ? 'border-black bg-black text-white' : 'border-black/30'
            }`}
          >
            {l}
          </button>
        ))}
        <span className="ml-2 text-xs opacity-60">
          {lang === 'python' ? 'Pyodide (first run downloads several MB)' : 'QuickJS-WASM'}
        </span>
      </div>

      <textarea
        value={source}
        onChange={(e) => setSource(e.target.value)}
        spellCheck={false}
        rows={14}
        className="w-full rounded border border-black/20 p-3 font-mono text-xs"
      />

      <div className="flex flex-wrap gap-2">
        <button
          disabled={busy}
          onClick={() => run('run (no trace)', { trace: false })}
          className="rounded border border-black/30 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Run tests
        </button>
        <button
          disabled={busy}
          onClick={() => run('run + trace', { trace: true })}
          className="rounded border border-black/30 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Run with trace
        </button>
        <button
          disabled={busy}
          onClick={() => {
            setSource(lang === 'javascript' ? JS_SPIN : PY_SPIN);
          }}
          className="rounded border border-black/30 px-3 py-1.5 text-sm disabled:opacity-40"
        >
          Load infinite loop
        </button>
        <button
          disabled={busy}
          onClick={() => run('infinite loop, 1s timeout', { trace: false, timeoutMs: 1000 })}
          className="rounded border border-red-500 px-3 py-1.5 text-sm text-red-600 disabled:opacity-40"
        >
          Run with 1s timeout
        </button>
        <button
          onClick={() => setTick((t) => t + 1)}
          className="rounded border border-black/30 px-3 py-1.5 text-sm"
        >
          Tab responsive? clicked {tick}x
        </button>
      </div>

      {busy && <p className="text-sm">Running…</p>}

      <section className="flex flex-col gap-4">
        {outcomes.map((o, i) => (
          <article key={i} className="rounded border border-black/20 p-4 text-sm">
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <strong>{o.lang}</strong>
              <span className="opacity-70">{o.label}</span>
              <span>{o.elapsedMs.toFixed(0)}ms</span>
              <span>
                {o.timedOut ? '⏱ timed out' : o.ok ? '✓ ok' : '✗ error'}
              </span>
              <span>{o.events.length} events</span>
              {o.truncated && <span>truncated</span>}
            </div>
            {o.error && <pre className="mt-2 whitespace-pre-wrap text-red-600">{o.error}</pre>}
            {o.ok && (
              <pre className="mt-2 overflow-x-auto">returned {JSON.stringify(o.value)}</pre>
            )}
            {o.events.length > 0 && (
              <details className="mt-2">
                <summary className="cursor-pointer">trace ({o.events.length})</summary>
                <pre className="mt-2 max-h-80 overflow-auto text-xs">
                  {o.events.slice(0, 200).map(fmt).join('\n')}
                </pre>
              </details>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}

function fmt(e: TraceEvent): string {
  switch (e.kind) {
    case 'line':
      return `line ${e.line}  ${JSON.stringify(e.vars)}`;
    case 'array_read':
      return `read  ${e.array}[${e.index}] -> ${JSON.stringify(e.value)}`;
    case 'array_write':
      return `write ${e.array}[${e.index}] <- ${JSON.stringify(e.value)}`;
    case 'return':
      return `return ${JSON.stringify(e.value)}`;
    case 'truncated':
      return `… truncated, ${e.dropped} events dropped`;
  }
}
