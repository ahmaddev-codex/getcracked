'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { Editor } from '@/components/problem/Editor';
import { Complexity } from '@/components/problem/Complexity';
import { Visualizer } from '@/components/visualizer/Visualizer';
import { RuntimeClient } from '@/lib/runtime/client';
import { humanizeError, TIMEOUT_MESSAGE } from '@/lib/runtime/errors';
import { entryPoints, resolveEntry } from '@/lib/runtime/entry-points';
import { clearDraft, readDraft, subscribeToDrafts, writeDraft } from '@/lib/drafts';
import { track } from '@/lib/analytics/track';
import { supportedLanguages } from '@/content/test-runner';
import { DEFAULT_PRESET, SANDBOX_PRESETS } from '@/lib/sandbox-presets';
import type { Language } from '@/content/schema';
import type { SpecResult } from '@/content/test-runner';

/**
 * Free-play sandbox (B7).
 *
 * Everything else on the platform runs code *against something* — a test spec
 * that decides whether it was right. This runs code against nothing. There is no
 * pass, no fail, and nothing is recorded: the only output is what the code
 * returned and the animation of it getting there.
 *
 * **Why that is worth a page of its own.** The visualizer is the platform's
 * actual differentiator, and until now it could only be pointed at authored
 * content — a lesson's walkthrough or a problem someone was solving. Anyone
 * arriving with "what does *my* code do" had to find a problem whose signature
 * happened to match. This is the same engine with the curriculum taken off.
 *
 * Nothing here is account-scoped, so it works signed out like every other
 * learning surface (§2.6).
 */

/** The sandbox is one scratchpad per language, not one per anything else. */
const DRAFT_ID = 'sandbox';

export function Sandbox() {
  const available = supportedLanguages();

  const [language, setLanguage] = useState<Language>('javascript');
  const [presetId, setPresetId] = useState(DEFAULT_PRESET.id);
  const preset = SANDBOX_PRESETS.find((p) => p.id === presetId) ?? DEFAULT_PRESET;

  const [argsText, setArgsText] = useState(() => JSON.stringify(DEFAULT_PRESET.args));
  const [chosenEntry, setChosenEntry] = useState<string | null>(null);
  const [result, setResult] = useState<SpecResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  /** Bumped to remount the editor when a preset is loaded or the code is reset. */
  const [resetCount, setResetCount] = useState(0);
  const [tracedLine, setTracedLine] = useState<number | null>(null);

  // Read through an external store rather than an effect, so restoring a draft
  // does not set state during render (see lib/drafts.ts).
  const savedDraft = useSyncExternalStore(
    subscribeToDrafts,
    () => readDraft(DRAFT_ID, language),
    // The server has no storage, so it always renders the preset.
    () => null,
  );

  const starter = preset.source[language];
  const initialDoc = resetCount === 0 ? (savedDraft ?? starter) : starter;

  /**
   * The document, in state rather than mirrored into a ref.
   *
   * The problem workspace keeps its document in a ref precisely to avoid a
   * re-render per keystroke, and that is right there — nothing on screen depends
   * on the text as it is typed. Here the entry picker does: the list of
   * functions has to follow what has been written. Holding both a ref and state
   * would be two sources of truth for one string, so this keeps the one that is
   * actually needed.
   */
  const [source, setSource] = useState(initialDoc);

  const runtime = useRef<RuntimeClient | null>(null);
  useEffect(() => {
    const client = new RuntimeClient();
    // Pay WASM startup while the learner reads, not on their click.
    client.warm();
    runtime.current = client;
    return () => {
      client.dispose();
      runtime.current = null;
    };
  }, []);

  useEffect(() => {
    track('sandbox_opened', { language });
  }, [language]);

  const found = useMemo(() => entryPoints(source, language), [source, language]);
  const entry = resolveEntry(found, chosenEntry);

  const handleChange = useCallback(
    (next: string) => {
      setSource(next);
      writeDraft(DRAFT_ID, language, next);
    },
    [language],
  );

  /**
   * Replaces the scratchpad wholesale — a preset is a fresh start, not a merge.
   *
   * Not memoised: it is an event handler for a `<select>`, so a stable identity
   * buys nothing, and wrapping it made the React Compiler bail out of
   * optimising the whole component.
   */
  function loadPreset(id: string) {
    const next = SANDBOX_PRESETS.find((p) => p.id === id) ?? DEFAULT_PRESET;
    clearDraft(DRAFT_ID, language);
    setSource(next.source[language]);
    setPresetId(id);
    setArgsText(JSON.stringify(next.args));
    setChosenEntry(next.entry);
    setResult(null);
    setError(null);
    setTracedLine(null);
    setResetCount((n) => n + 1);
  }

  const run = useCallback(async () => {
    if (running || !runtime.current) return;

    if (!entry) {
      setError(
        language === 'python'
          ? 'No function to run. Define one at the left margin, e.g. `def solve(nums):`.'
          : 'No function to run. Define one, e.g. `function solve(nums) { … }`.',
      );
      return;
    }

    let args: unknown;
    try {
      args = JSON.parse(argsText);
    } catch {
      setError('The input is not valid JSON.');
      return;
    }
    if (!Array.isArray(args)) {
      // The arguments are a list, always — a bare value would call the function
      // with the wrong arity and fail confusingly.
      setError('Input must be a JSON array of arguments, e.g. [[3, 1, 4], 2].');
      return;
    }

    setRunning(true);
    setError(null);
    track('sandbox_run', { language });

    try {
      const outcome = await runtime.current.run({
        /**
         * `expected: null` because nothing is being compared. The spec runner
         * still reports whether the case "passed", and here that comparison is
         * meaningless — so the result below reads the returned value and
         * ignores the verdict entirely.
         */
        spec: { entry, cases: [{ args, expected: null, hidden: false }] },
        source,
        language,
        trace: true,
        measure: true,
      });

      const failure = outcome.cases[0]?.error;
      if (failure) {
        // "No trace to show" is a useless thing to tell someone whose code threw.
        setError(humanizeError(failure) ?? failure);
        setResult(null);
        return;
      }
      setResult(outcome);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message === 'TIMEOUT' ? TIMEOUT_MESSAGE : message);
      setResult(null);
    } finally {
      setRunning(false);
    }
  }, [running, entry, argsText, language, source]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs">
          <span className="text-foreground-muted">start from</span>
          <select
            value={presetId}
            onChange={(e) => loadPreset(e.target.value)}
            className="node-surface bg-surface px-2 py-1 text-xs text-foreground"
          >
            {SANDBOX_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>

        {available.length > 1 && (
          <div className="ml-auto flex gap-2">
            {available.map((l) => (
              <Button
                key={l}
                tone={l === language ? 'strong' : 'surface'}
                aria-pressed={l === language}
                onClick={() => {
                  // Each language gets its own scratchpad, so switching back
                  // finds what was left there rather than a translation of the
                  // other one.
                  setLanguage(l);
                  setSource(readDraft(DRAFT_ID, l) ?? preset.source[l]);
                  setResult(null);
                  setError(null);
                  setTracedLine(null);
                  setResetCount((n) => n + 1);
                }}
              >
                {l}
              </Button>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-foreground-muted">{preset.note}</p>

      <Editor
        // Remounting re-seeds the document and clears undo history, which is
        // what loading a preset and switching language should both mean.
        key={`${language}-${resetCount}`}
        value={initialDoc}
        onChange={handleChange}
        onRun={run}
        language={language}
        highlightedLine={tracedLine}
      />

      <Node tone="muted" className="flex flex-col gap-2 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={running}
            onClick={run}
            className="inline-flex items-center gap-1.5"
          >
            <Play size={14} aria-hidden />
            {running ? 'Running…' : 'Run it'}
          </Button>

          <label className="flex items-center gap-2 text-xs">
            <span className="shrink-0 text-foreground-muted">call</span>
            {found.length > 0 ? (
              <select
                value={entry ?? ''}
                onChange={(e) => setChosenEntry(e.target.value)}
                aria-label="Function to run"
                className="node-surface bg-surface px-2 py-1 font-mono text-xs text-foreground"
              >
                {found.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            ) : (
              <span className="font-mono text-xs text-foreground-muted">
                no function found
              </span>
            )}
          </label>

          <label className="flex min-w-40 flex-1 items-center gap-2 text-xs">
            <span className="shrink-0 text-foreground-muted">with</span>
            <input
              value={argsText}
              onChange={(e) => setArgsText(e.target.value)}
              spellCheck={false}
              aria-label="Arguments, as a JSON array"
              className="node-surface w-full bg-surface px-2 py-1 font-mono text-xs text-foreground"
            />
          </label>
        </div>

        <p className="text-xs text-foreground-muted">
          Nothing is graded and nothing is recorded — there is no right answer here.
          Arguments are read as JSON, not evaluated.
        </p>
      </Node>

      {error && (
        <Node tone="surface" className="p-3 text-sm text-danger">
          {error}
        </Node>
      )}

      {result && (
        <Node tone="strong" className="p-3">
          <p className="text-xs font-semibold">returned</p>
          <pre className="mt-1 overflow-x-auto font-mono text-sm">
            {JSON.stringify(result.cases[0]?.actual ?? null)}
          </pre>
        </Node>
      )}

      {result?.trace && (
        <Visualizer trace={result.trace} language={language} onLineChange={setTracedLine} />
      )}

      {result && <Complexity metrics={result.metrics} />}
    </div>
  );
}
