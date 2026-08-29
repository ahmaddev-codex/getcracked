'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { Editor } from './Editor';
import { TestCases } from './TestCases';
import { Complexity } from './Complexity';
import { RuntimeClient } from '@/lib/runtime/client';
import { TIMEOUT_MESSAGE } from '@/lib/runtime/errors';
import { clearDraft, readDraft, subscribeToDrafts, writeDraft } from '@/lib/drafts';
import { track } from '@/lib/analytics/track';
import type { Language, TestSpec } from '@/content/schema';
import type { SpecResult } from '@/content/test-runner';

/**
 * The solve surface: editor, run, results (A6, A7).
 *
 * Works signed out — execution is entirely client-side (AD-2), so an anonymous
 * learner costs nothing to run code for and there is no reason to gate it.
 */
export function Workspace({
  exerciseId,
  language,
  starterCode,
  spec,
  complexity,
}: {
  exerciseId: string;
  language: Language;
  starterCode: string;
  spec: TestSpec;
  complexity?: { time: string; space: string; note?: string };
}) {
  const [result, setResult] = useState<SpecResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  /** Bumped to remount the editor with fresh starter code. */
  const [resetCount, setResetCount] = useState(0);

  // Read through an external store rather than an effect, so restoring a draft
  // does not set state during render (see lib/drafts.ts).
  const savedDraft = useSyncExternalStore(
    subscribeToDrafts,
    () => readDraft(exerciseId, language),
    // The server has no storage, so it always renders the starter code.
    () => null,
  );

  const initialDoc = resetCount === 0 ? (savedDraft ?? starterCode) : starterCode;

  // The editor is uncontrolled and keeps this mirror current, so `run` reads the
  // real document without the tree re-rendering on every keystroke.
  const codeRef = useRef(starterCode);

  const runtime = useRef<RuntimeClient | null>(null);

  useEffect(() => {
    const client = new RuntimeClient();
    // Pay WASM startup while the learner reads the brief, not on their click.
    client.warm();
    runtime.current = client;

    return () => {
      client.dispose();
      runtime.current = null;
    };
  }, []);

  const handleChange = useCallback(
    (next: string) => {
      codeRef.current = next;
      writeDraft(exerciseId, language, next);
    },
    [exerciseId, language],
  );

  const run = useCallback(async () => {
    if (running || !runtime.current) return;

    setRunning(true);
    setError(null);
    track('test_run', { exerciseId, language });

    try {
      const outcome = await runtime.current.run({
        spec,
        source: codeRef.current,
        language,
        // Costs an extra sandboxed run, so only measure when it will be shown.
        measure: true,
      });
      setResult(outcome);
      if (outcome.passed) track('exercise_solved', { exerciseId, language });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // Thrown when the hard deadline killed the worker rather than it replying.
      setError(message === 'TIMEOUT' ? TIMEOUT_MESSAGE : message);
      setResult(null);
    } finally {
      setRunning(false);
    }
  }, [language, spec, running, exerciseId]);

  const reset = useCallback(() => {
    clearDraft(exerciseId, language);
    // Remounting the editor re-seeds the mirror; this keeps them in step even
    // if a run fires before the remount lands.
    codeRef.current = starterCode;
    setResetCount((n) => n + 1);
    setResult(null);
    setError(null);
  }, [exerciseId, language, starterCode]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Your solution</h2>
        <span className="text-xs text-foreground-muted">{language}</span>
      </div>

      {/* Remounting on reset restores the starter code and clears undo history,
          which is what "reset" should mean. */}
      <Editor
        key={resetCount}
        value={initialDoc}
        docRef={codeRef}
        onChange={handleChange}
        onRun={run}
      />

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={running}>
          {running ? 'Running…' : 'Run tests'}
        </Button>
        <Button tone="surface" onClick={reset} disabled={running}>
          Reset
        </Button>
        <span className="text-xs text-foreground-muted">
          {running ? 'Executing in a sandbox…' : 'Or press ⌘↩'}
        </span>
      </div>

      {error && (
        <Node tone="surface" className="p-3 text-sm text-danger">
          {error}
        </Node>
      )}

      <TestCases spec={spec} result={result} />

      <Complexity
        target={complexity}
        metrics={result?.metrics ?? null}
        inputSize={largestInputSize(spec)}
      />
    </section>
  );
}

/** Elements in the largest test input, so measured counts can be read against it. */
function largestInputSize(spec: TestSpec): number | undefined {
  const sizes = spec.cases
    .flatMap((c) => c.args)
    .filter(Array.isArray)
    .map((a) => (a as unknown[]).length);
  return sizes.length ? Math.max(...sizes) : undefined;
}
