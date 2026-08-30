'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { Editor } from '@/components/problem/Editor';
import { TestCases } from '@/components/problem/TestCases';
import { Complexity } from '@/components/problem/Complexity';
import { RuntimeClient } from '@/lib/runtime/client';
import { TIMEOUT_MESSAGE } from '@/lib/runtime/errors';
import {
  clearDraft,
  notifyDraftListeners,
  readDraft,
  subscribeToDrafts,
  writeDraft,
} from '@/lib/drafts';
import { track } from '@/lib/analytics/track';
import { recordAttemptLocally, syncAttempt } from '@/lib/attempts';
import { readLocalChallengeState } from '@/lib/progress-local';
import { supportedLanguages } from '@/content/test-runner';
import { composeProgram, type ResolvedFile } from '@/content/challenge';
import type { Language, TestSpec } from '@/content/schema';
import type { SpecResult } from '@/content/test-runner';

/**
 * The build surface: several files, one test run (tier 3).
 *
 * A separate component from `Workspace`, and the line between them is
 * deliberate. Everything about *executing and recording* is shared —
 * `RuntimeClient`, `runTestSpec`, `persistAttempt` — which is what AD-7 asks
 * for. What is not shared is the editing surface, because a workspace of files
 * with tabs, read-only scaffolding and a per-challenge draft scope is a
 * different thing from one function in one box, and folding it into `Workspace`
 * would mean every problem page carrying a file switcher it never shows.
 *
 * **Two scopes, and confusing them is the bug to avoid.** Drafts are keyed by
 * *challenge* (`challengeId`), because the workspace is carried across the
 * steps — keying them by step would hand a learner the starter code again at
 * every step and silently discard the build they had been working on. Progress
 * is keyed by *step* (`stepId`), because a step is the unit that gets finished.
 *
 * **No visualizer here, on purpose.** A trace event carries one line number,
 * which says nothing across several files, so a multi-file run records structure
 * events only and reports itself degraded (see runtime/javascript.ts). Drawing
 * an animation from it would be a picture of part of a run presented as the
 * whole one.
 */
export function ChallengeWorkspace({
  challengeId,
  stepId,
  filesByLanguage,
  initialLanguage,
  entryFile,
  focusFile,
  stepIds,
  challengeSlug,
  spec,
  complexity,
  onSolved,
}: {
  /** `challenges/{slug}` — the draft scope, shared by every step. */
  challengeId: string;
  /** `challenges/{slug}/{step}` — the progress scope, this step alone. */
  stepId: string;
  /** Every step of this build, so the last one can report the build finished. */
  stepIds: string[];
  challengeSlug: string;
  /**
   * This step's workspace, resolved on the server for every language it builds
   * in.
   *
   * Resolved server-side rather than here because resolution walks the whole
   * challenge (`resolveStepFiles`), and shipping every step of every language to
   * the client to re-derive one step's file set would be the entire challenge in
   * the bundle to answer a question already answered.
   */
  filesByLanguage: Partial<Record<Language, ResolvedFile[]>>;
  initialLanguage: Language;
  entryFile: string;
  focusFile: string;
  spec: TestSpec;
  complexity?: { time: string; space: string; note?: string };
  onSolved?: () => void;
}) {
  const available = (Object.keys(filesByLanguage) as Language[])
    .filter((l) => filesByLanguage[l]?.length)
    .filter((l) => supportedLanguages().includes(l));

  const [language, setLanguage] = useState<Language>(initialLanguage);
  // Memoised so the callbacks below do not get a new dependency on every render.
  const files = useMemo(() => filesByLanguage[language] ?? [], [filesByLanguage, language]);

  /**
   * The page mounts this with a key of the step, so a step change is a remount
   * and every piece of state below starts fresh. That is why `active` can be
   * initialised from `focusFile` rather than synchronised to it in an effect.
   */
  const [active, setActive] = useState(focusFile);
  const [result, setResult] = useState<SpecResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  /** Bumped to remount the editor with fresh starter code. */
  const [resetCount, setResetCount] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const activeFile = files.find((f) => f.name === active) ?? files[0];

  // Read through an external store rather than an effect, so restoring a draft
  // does not set state during render (see lib/drafts.ts). Switching tab
  // re-reads, which is what carries an edit from one tab to the next.
  const savedDraft = useSyncExternalStore(
    subscribeToDrafts,
    () =>
      activeFile?.editable ? readDraft(challengeId, language, activeFile.name) : null,
    // The server has no storage, so it always renders the starter code.
    () => null,
  );

  const initialDoc = savedDraft ?? activeFile?.starter ?? '';

  const runtime = useRef<RuntimeClient | null>(null);
  const onSolvedRef = useRef(onSolved);
  useEffect(() => {
    onSolvedRef.current = onSolved;
  });

  useEffect(() => {
    track('exercise_started', { exerciseId: stepId, language });
  }, [stepId, language]);

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
      // Not notified: a keystroke must not re-render the tree. The draft store
      // keeps its own in-memory copy, so the next tab switch reads this back
      // even where site data is blocked.
      writeDraft(challengeId, language, next, active);
    },
    [challengeId, language, active],
  );

  /**
   * The workspace as it stands, for every file at once.
   *
   * Read at run time rather than held in state: the editor is uncontrolled and
   * only one file is mounted at a time, so the other tabs' contents live in the
   * draft store. Read-only scaffolding always comes from the content, never from
   * a draft — otherwise a learner who wrote to that key by hand would be running
   * against their own harness.
   */
  const currentContents = useCallback((): Record<string, string> => {
    const contents: Record<string, string> = {};
    for (const file of files) {
      contents[file.name] = file.editable
        ? (readDraft(challengeId, language, file.name) ?? file.starter)
        : file.starter;
    }
    return contents;
  }, [files, challengeId, language]);

  /**
   * Runs the step's tests.
   *
   * `record` separates Run from Submit exactly as it does for a problem: running
   * shows a learner where they stand without committing anything, and only
   * Submit advances the step. On a build, where a learner runs constantly while
   * assembling several files, that distinction matters more rather than less.
   */
  const runTests = useCallback(
    async (record: boolean) => {
      if (running || !runtime.current) return;

      setRunning(true);
      setError(null);
      track('test_run', { exerciseId: stepId, language });

      const contents = currentContents();
      // Split by the same function the content gate composes with, so what a
      // learner runs and what was verified cannot come apart.
      const program = composeProgram(files, entryFile, contents);

      try {
        const outcome = await runtime.current.run({
          spec,
          source: program.source,
          entryModule: program.entryModule,
          modules: program.modules,
          language,
        });
        setResult(outcome);
        setSubmitted(record && outcome.passed);

        if (!record) return;

        const attempt = {
          exerciseId: stepId,
          tier: 'challenge' as const,
          language,
          /**
           * Submitted as the whole workspace, not the focused file.
           *
           * A step is passed by the files together, so storing one of them
           * would make the restored submission (A10) something that never ran.
           * Serialised as a labelled document because `submissions.code` is one
           * text column and widening the schema for a display concern would be
           * the wrong trade.
           */
          code: files
            .filter((f) => f.editable)
            .map((f) => `// ${f.fileName}\n${contents[f.name] ?? ''}`)
            .join('\n\n'),
          passed: outcome.passed,
        };

        // Written locally first and synchronously, so the completion check
        // below sees this step. The account sync is best-effort and must not
        // hold up the button.
        recordAttemptLocally(attempt);
        void syncAttempt(attempt);

        if (outcome.passed) {
          track('exercise_solved', { exerciseId: stepId, language });
          if (readLocalChallengeState(stepIds) === 'complete') {
            track('challenge_completed', { challengeSlug });
          }
          onSolvedRef.current?.();
        }
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        // Thrown when the hard deadline killed the worker rather than it replying.
        setError(message === 'TIMEOUT' ? TIMEOUT_MESSAGE : message);
        setResult(null);
      } finally {
        setRunning(false);
      }
    },
    [running, stepId, stepIds, challengeSlug, language, currentContents, entryFile, files, spec],
  );

  const run = useCallback(() => runTests(false), [runTests]);
  const submit = useCallback(() => runTests(true), [runTests]);

  /**
   * Resets **this step's** workspace, not the whole build.
   *
   * Only the files this step lists are cleared, so resetting step 3 does not
   * throw away a file that step 4 will still want. It does discard the carried
   * work in those files — which is what "reset" has to mean when the starting
   * point is the previous step's build — so the button says so.
   */
  const reset = useCallback(() => {
    for (const file of files) {
      if (!file.editable) continue;
      clearDraft(challengeId, language, file.name);
    }
    notifyDraftListeners();
    setResetCount((n) => n + 1);
    setResult(null);
    setError(null);
    setSubmitted(false);
  }, [files, challengeId, language]);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Your build</h2>
        {available.length > 1 ? (
          <div className="flex gap-2">
            {available.map((l) => (
              <Button
                key={l}
                tone={l === language ? 'strong' : 'surface'}
                aria-pressed={l === language}
                onClick={() => {
                  // Drafts are keyed per language, so switching preserves
                  // whatever was written in the language being left.
                  setLanguage(l);
                  setResult(null);
                  setError(null);
                  setSubmitted(false);
                }}
              >
                {l}
              </Button>
            ))}
          </div>
        ) : (
          <span className="text-xs text-foreground-muted">{language}</span>
        )}
      </div>

      {/*
        Tabs, not a stack of editors. A build challenge's files are a workspace
        rather than a document, and scrolling past a harness nobody edits to
        reach the file the step is about is exactly what a tab bar is for.
      */}
      <div role="tablist" aria-label="Workspace files" className="flex flex-wrap gap-2">
        {files.map((file) => {
          const selected = file.name === active;
          return (
            <button
              key={file.name}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(file.name)}
              className={`node-surface node-pressable flex items-center gap-1.5 px-3 py-1.5 font-mono text-xs transition-transform duration-(--duration-fast) ease-(--ease-out) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
                selected
                  ? 'bg-accent-strong text-accent-foreground'
                  : 'bg-surface-muted text-foreground'
              }`}
            >
              {!file.editable && <Lock size={11} aria-hidden />}
              {file.label}
            </button>
          );
        })}
      </div>

      {activeFile && !activeFile.editable && (
        <Node tone="muted" className="p-3 text-xs text-foreground-muted">
          Read-only. This file is scaffolding — the tests drive your code through it.
          Read it to see exactly what is called and with what.
        </Node>
      )}

      {activeFile && (
        <Editor
          // Remounting per file and per reset re-seeds the document and clears
          // undo history, which is what switching tabs and resetting should mean.
          key={`${language}-${activeFile.name}-${resetCount}`}
          value={initialDoc}
          onChange={activeFile.editable ? handleChange : () => {}}
          onRun={run}
          language={language}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={running}>
          {running ? 'Running…' : 'Run tests'}
        </Button>

        <Button tone="strong" onClick={submit} disabled={running}>
          Submit step
        </Button>

        <Button tone="surface" onClick={reset} disabled={running}>
          Reset step
        </Button>

        <span className="text-xs text-foreground-muted">
          {running
            ? 'Executing in a sandbox…'
            : 'Running is free — Submit is what records the step. Or press ⌘↩'}
        </span>
      </div>

      {submitted && (
        <Node tone="muted" className="p-3 text-sm">
          Step recorded. Your files carry forward to the next one.
        </Node>
      )}

      {error && (
        <Node tone="surface" className="p-3 text-sm text-danger">
          {error}
        </Node>
      )}

      <TestCases spec={spec} result={result} />

      <Complexity target={complexity} metrics={null} />
    </section>
  );
}
