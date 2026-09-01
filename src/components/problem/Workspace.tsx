'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { Editor } from './Editor';
import { TestCases } from './TestCases';
import { Complexity } from './Complexity';
import { Visualizer } from '@/components/visualizer/Visualizer';
import { WatchPanel } from './WatchPanel';
import { RuntimeClient } from '@/lib/runtime/client';
import { humanizeError, TIMEOUT_MESSAGE } from '@/lib/runtime/errors';
import { clearDraft, readDraft, subscribeToDrafts, writeDraft } from '@/lib/drafts';
import { track } from '@/lib/analytics/track';
import { persistAttempt } from '@/lib/attempts';
import { supportedLanguages } from '@/content/test-runner';
import { useAssistant } from '@/components/assistant';
import { SolutionShareModal } from '@/components/community/SolutionShareModal';
import { CommunitySolutionGallery } from '@/components/community/CommunitySolutionGallery';
import { ProblemDiscussions } from '@/components/community/ProblemDiscussions';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import { Sparkles, Share2, MessageSquare } from 'lucide-react';
import { entryFor, type Language, type RunnableLanguage, type TestSpec, type Tier } from '@/content/schema';
import type { SpecResult } from '@/content/test-runner';

function defaultStarterFor(lang: RunnableLanguage, entry: string, jsStarter: string): string {
  if (lang === 'typescript') return jsStarter;
  if (lang === 'java') {
    return `class Solution {\n    public Object ${entry}() {\n        // Write your Java solution here\n        return 0;\n    }\n}`;
  }
  if (lang === 'cpp') {
    return `#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    auto ${entry}() {\n        // Write your C++ solution here\n        return 0;\n    }\n};`;
  }
  if (lang === 'go') {
    return `package main\n\nfunc ${entry}() any {\n    // Write your Go solution here\n    return 0\n}`;
  }
  return jsStarter;
}

/**
 * The solve surface: editor, run, results (A6, A7).
 *
 * Works signed out — execution is entirely client-side (AD-2), so an anonymous
 * learner costs nothing to run code for and there is no reason to gate it.
 */
export function Workspace({
  exerciseId,
  language: initialLanguage,
  starterCode,
  spec,
  complexity,
  tier = 'problem',
  compact = false,
  onSolved,
  starterByLanguage,
}: {
  exerciseId: string;
  language: RunnableLanguage;
  /** Starter code per language, so switching swaps the scaffold (A6). */
  starterByLanguage?: Partial<Record<RunnableLanguage, string>>;
  starterCode: string;
  spec: TestSpec;
  complexity?: { time: string; space: string; note?: string };
  tier?: Tier;
  /**
   * Trims the surface for a guided exercise embedded in a lesson (B11).
   *
   * Same runner, same persistence, same everything — only the framing changes.
   * A second execution path for lesson exercises is exactly the divergence AD-7
   * exists to prevent.
   */
  compact?: boolean;
  /** Fires when a run passes, so a lesson can advance its own state. */
  onSolved?: () => void;
}) {
  const available = supportedLanguages();

  const { data: session } = useSession();
  const [language, setLanguage] = useState<RunnableLanguage>(initialLanguage);
  const starter =
    starterByLanguage?.[language] ??
    defaultStarterFor(language, entryFor(spec, language), starterCode);

  const [result, setResult] = useState<SpecResult | null>(null);
  /**
   * The source that produced `result`.
   *
   * Captured at run time rather than read from the editor during render — the
   * visualizer must show the code the trace came from, and a learner who edits
   * after running would otherwise see a highlighted line pointing into code
   * that never executed.
   */
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  /** Bumped to remount the editor with fresh starter code. */
  const [resetCount, setResetCount] = useState(0);
  /** Trace from a watch-only run, which grades nothing. */
  const [watchTrace, setWatchTrace] = useState<SpecResult['trace']>(null);
  /** Line the visualizer is executing, highlighted in the learner's own editor. */
  const [tracedLine, setTracedLine] = useState<number | null>(null);
  /** True once a passing run was recorded, so the state is legible. */
  const [submitted, setSubmitted] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareCode, setShareCode] = useState('');
  const [bottomTab, setBottomTab] = useState<'tests' | 'solutions' | 'discussions'>('tests');

  /** The problem's own first visible case — what a learner is trying to satisfy. */
  const defaultWatchArgs = (spec.cases.find((c) => !c.hidden) ?? spec.cases[0])?.args ?? [];

  // Read through an external store rather than an effect, so restoring a draft
  // does not set state during render (see lib/drafts.ts).
  const savedDraft = useSyncExternalStore(
    subscribeToDrafts,
    () => readDraft(exerciseId, language),
    // The server has no storage, so it always renders the starter code.
    () => null,
  );

  const initialDoc = resetCount === 0 ? (savedDraft ?? starter) : starter;

  // The editor is uncontrolled and keeps this mirror current, so `run` reads the
  // real document without the tree re-rendering on every keystroke.
  const codeRef = useRef(starter);

  const { openAssistant, setContext } = useAssistant();

  useEffect(() => {
    setContext({
      exercise: {
        title: exerciseId,
        tier,
        language,
        code: codeRef.current,
        starterCode: starter,
        solved: result?.passed ?? false,
        testResults: result
          ? {
              passed: result.passed,
              totalCases: result.cases.length,
              passedCases: result.cases.filter((c) => c.passed).length,
              failedCase: result.cases.find((c) => !c.passed),
            }
          : undefined,
      },
    });
  }, [exerciseId, tier, language, starter, result, setContext]);

  const runtime = useRef<RuntimeClient | null>(null);
  const onSolvedRef = useRef(onSolved);
  useEffect(() => {
    onSolvedRef.current = onSolved;
  });

  useEffect(() => {
    track('exercise_started', { exerciseId, language });
  }, [exerciseId, language]);

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

  /**
   * Runs the tests.
   *
   * `record` is what separates Run from Submit. Running shows a learner where
   * they stand without committing anything, which is what lets them test freely
   * — the previous behaviour marked a problem attempted the first time someone
   * pressed Run to see what the cases even were, and passing by accident while
   * exploring silently counted as solving it.
   *
   * Guided lesson exercises keep recording on a plain run: they are
   * comprehension checks with no separate submit step, and gating them behind
   * one would add a button whose only job is to say "yes, really".
   */
  const runTests = useCallback(async (record: boolean) => {
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
        measure: !compact,
        // Tracing costs an extra instrumented run too; only for the full
        // surface, where there is somewhere to draw it.
        trace: !compact,
      });
      setResult(outcome);
      setWatchTrace(null);
      setSubmitted(record && outcome.passed);

      if (!record) return;

      if (outcome.passed) {
        track('exercise_solved', { exerciseId, language });
        onSolvedRef.current?.();
      }
      const dbLang: Language = language === 'python' ? 'python' : 'javascript';
      void persistAttempt({
        exerciseId,
        tier,
        language: dbLang,
        code: codeRef.current,
        passed: outcome.passed,
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // Thrown when the hard deadline killed the worker rather than it replying.
      setError(message === 'TIMEOUT' ? TIMEOUT_MESSAGE : message);
      setResult(null);
    } finally {
      setRunning(false);
    }
  }, [language, spec, running, exerciseId, tier, compact]);

  /** A problem is only recorded on an explicit submit; a lesson check is not. */
  const requiresSubmit = tier === 'problem' && !compact;
  const run = useCallback(() => runTests(!requiresSubmit), [runTests, requiresSubmit]);
  const submit = useCallback(() => runTests(true), [runTests]);

  /**
   * Runs the code purely to watch it, without grading.
   *
   * "Run tests" answers *whether* it works; this answers *what it does* — which
   * is the question a learner has while still writing, before there is anything
   * worth grading. It records no attempt and reports no pass or fail, so
   * experimenting mid-solution cannot mark a problem attempted.
   *
   * Traces the first failing case when there is one, because "why is this
   * failing" is the question the animation is best placed to answer; otherwise
   * the first visible case.
   */
  const watch = useCallback(async (args: unknown[]) => {
    if (running || !runtime.current) return;

    setRunning(true);
    setError(null);
    try {
      const outcome = await runtime.current.run({
        // Expected is null: nothing is being graded, so there is nothing to
        // compare against — the run exists to be watched.
        spec: { ...spec, cases: [{ args, expected: null, hidden: false }] },
        source: codeRef.current,
        language,
        trace: true,
      });
      /**
       * A run that threw has no trace, and "No trace to show for this run" is
       * a useless thing to tell someone whose code did not parse. Surface the
       * error instead — the whole point of watching is to find out why.
       */
      const failure = outcome.cases[0]?.error;
      if (failure) {
        setError(humanizeError(failure) ?? failure);
        setWatchTrace(null);
        return;
      }
      setWatchTrace(outcome.trace);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      setError(message === 'TIMEOUT' ? TIMEOUT_MESSAGE : message);
    } finally {
      setRunning(false);
    }
  }, [language, spec, running]);

  const reset = useCallback(() => {
    clearDraft(exerciseId, language);
    // Remounting the editor re-seeds the mirror; this keeps them in step even
    // if a run fires before the remount lands.
    codeRef.current = starter;
    setResetCount((n) => n + 1);
    setResult(null);
    setWatchTrace(null);
    setTracedLine(null);
    setError(null);
  }, [exerciseId, language, starter, setTracedLine]);

  return (
    <section className="flex flex-col gap-4">
      {!compact && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Your solution</h2>
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
                    setResetCount((n) => n + 1);
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
      )}

      {/* Remounting on reset restores the starter code and clears undo history,
          which is what "reset" should mean. */}
      <Editor
        key={`${language}-${resetCount}`}
        value={initialDoc}
        docRef={codeRef}
        onChange={handleChange}
        onRun={run}
        language={language}
        highlightedLine={tracedLine}
      />

      {/*
        Watch, then the animation, directly under the editor. The highlight it
        drives lands in that editor, so putting anything between them would mean
        watching a line move somewhere off screen.
      */}
      {!compact && (
        <WatchPanel
          defaultArgs={defaultWatchArgs}
          running={running}
          onWatch={watch}
        />
      )}

      {!compact && (watchTrace ?? result?.trace) && (
        <Visualizer
          trace={(watchTrace ?? result?.trace)!}
          language={language}
          onLineChange={setTracedLine}
        />
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={run} disabled={running}>
          {running ? 'Running…' : 'Run tests'}
        </Button>

        {requiresSubmit && (
          <Button tone="strong" onClick={submit} disabled={running}>
            Submit
          </Button>
        )}

        <Button tone="surface" onClick={reset} disabled={running}>
          Reset
        </Button>

        <Button
          tone="surface"
          onClick={() => {
            const isPassing = result?.passed ?? false;
            openAssistant({
              mode: isPassing ? 'code_review' : 'socratic',
              context: {
                exercise: {
                  title: exerciseId,
                  tier,
                  language,
                  code: codeRef.current,
                  starterCode: starter,
                  solved: isPassing,
                  testResults: result
                    ? {
                        passed: result.passed,
                        totalCases: result.cases.length,
                        passedCases: result.cases.filter((c) => c.passed).length,
                        failedCase: result.cases.find((c) => !c.passed),
                      }
                    : undefined,
                },
              },
              initialPrompt: isPassing
                ? 'Can you review my solution for Big-O complexity, edge cases, and clean idiomatic code?'
                : error
                  ? `My code threw an error: "${error}". Can you guide me on how to fix it without giving away the answer?`
                  : result && !result.passed
                    ? 'My code is failing some test cases. Can you give me a Socratic hint to help me debug?'
                    : 'Can you give me a conceptual hint on how to approach this problem?',
            });
          }}
          disabled={running}
          className="text-xs flex items-center gap-1.5"
        >
          <Sparkles size={13} className="text-accent-strong shrink-0" aria-hidden />
          <span>{result?.passed ? 'Review my code' : 'Ask Assistant'}</span>
        </Button>

        {result?.passed && (
          <Button
            tone="surface"
            onClick={() => {
              setShareCode(codeRef.current);
              setIsShareModalOpen(true);
            }}
            className="text-xs flex items-center gap-1"
          >
            <Share2 size={12} className="inline mr-1" />
            <span>Share Solution</span>
          </Button>
        )}

        <span className="text-xs text-foreground-muted">
          {running
            ? 'Executing in a sandbox…'
            : requiresSubmit
              ? 'Running is free — Submit is what records it. Or press ⌘↩'
              : 'Or press ⌘↩'}
        </span>
      </div>

      {requiresSubmit && submitted && (
        <Node tone="muted" className="flex flex-wrap items-center justify-between gap-3 p-3 text-sm">
          <span>Recorded in this browser. This problem now counts toward your progress.</span>
          {!session && (
            <Link
              href="/sign-up"
              className="text-xs font-semibold text-link underline underline-offset-2 shrink-0"
            >
              Sign up to save permanently across devices →
            </Link>
          )}
        </Node>
      )}

      {error && (
        <Node tone="surface" className="p-3 text-sm text-danger">
          {error}
        </Node>
      )}

      {/* Bottom section tabs: Test cases vs Community Solutions vs Discussions */}
      <div className="flex items-center gap-2 border-b border-border-subtle pt-2">
        <button
          type="button"
          onClick={() => setBottomTab('tests')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-node border-t border-x transition-all cursor-pointer ${
            bottomTab === 'tests'
              ? 'bg-surface text-foreground font-bold border-border-strong -mb-px'
              : 'text-foreground-muted hover:text-foreground border-transparent'
          }`}
        >
          Test Cases
        </button>
        <button
          type="button"
          onClick={() => setBottomTab('solutions')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-node border-t border-x transition-all cursor-pointer flex items-center gap-1.5 ${
            bottomTab === 'solutions'
              ? 'bg-surface text-foreground font-bold border-border-strong -mb-px'
              : 'text-foreground-muted hover:text-foreground border-transparent'
          }`}
        >
          <Sparkles size={12} className="text-accent" />
          <span>Community Solutions</span>
        </button>
        <button
          type="button"
          onClick={() => setBottomTab('discussions')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-t-node border-t border-x transition-all cursor-pointer flex items-center gap-1.5 ${
            bottomTab === 'discussions'
              ? 'bg-surface text-foreground font-bold border-border-strong -mb-px'
              : 'text-foreground-muted hover:text-foreground border-transparent'
          }`}
        >
          <MessageSquare size={12} className="text-accent" />
          <span>Discussions</span>
        </button>
      </div>

      {bottomTab === 'tests' ? (
        <>
          <TestCases spec={spec} result={result} />
          {!compact && (
            <Complexity
              target={complexity}
              metrics={result?.metrics ?? null}
              inputSize={largestInputSize(spec)}
            />
          )}
        </>
      ) : bottomTab === 'solutions' ? (
        <CommunitySolutionGallery
          exerciseId={exerciseId}
          isSolved={result?.passed ?? false}
          onOpenShareModal={() => {
            setShareCode(codeRef.current);
            setIsShareModalOpen(true);
          }}
        />
      ) : (
        <ProblemDiscussions exerciseId={exerciseId} />
      )}

      {isShareModalOpen && (
        <SolutionShareModal
          exerciseId={exerciseId}
          code={shareCode}
          language={language as 'python' | 'javascript' | 'typescript'}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          onPublished={() => setBottomTab('solutions')}
        />
      )}
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
