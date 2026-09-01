'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { LanguageIcon } from '@/components/ui/LanguageIcon';
import { Visualizer } from '@/components/visualizer/Visualizer';
import { RuntimeClient } from '@/lib/runtime/client';
import { supportedLanguages } from '@/content/test-runner';
import { walkthroughSpec } from '@/content/walkthrough';
import type { Trace } from '@/lib/trace/protocol';
import type { RunnableLanguage } from '@/content/schema';
import type { VisualKind } from '@/lib/visualizer/registry';

/**
 * The animated walkthrough slot (B10b), filled by T2.8.
 *
 * Runs a reference implementation through the *same* runtime and the same trace
 * protocol a learner's own code uses, rather than replaying a recording.
 */
const LANGUAGE_LABELS: Record<string, string> = {
  javascript: 'JS',
  typescript: 'TS',
  python: 'Python',
  java: 'Java',
  cpp: 'C++',
  go: 'Go',
};

function callSignature(entry: string, args: unknown[]): string {
  return `${entry}(${args.map((a) => JSON.stringify(a)).join(', ')})`;
}

import { convertJsToTypeScript } from '@/lib/runtime/type-inference';

export function Walkthrough({
  entry,
  entryByLanguage,
  sourceByLanguage,
  args,
  caption,
  title,
  visual = 'array',
}: {
  entry: string;
  /**
   * Per-language entry name. Must be threaded into the spec, not just stored:
   * without it a Python run is asked for the JavaScript name and dies with a
   * `KeyError` after loading the whole interpreter.
   */
  entryByLanguage?: Partial<Record<RunnableLanguage, string>>;
  /** Reference implementation per language. Only these are offered. */
  sourceByLanguage: Partial<Record<RunnableLanguage, string>>;
  args: unknown[];
  caption?: string;
  /** What this walkthrough is solving, shown above the animation. */
  title?: string;
  /** The shape to draw. Declared by the lesson, since it cannot be inferred. */
  visual?: VisualKind;
}) {
  /**
   * Only languages this walkthrough actually has code for, intersected with the
   * ones the runtime can execute.
   */
  const availableSet = new Set<RunnableLanguage>(
    (Object.keys(sourceByLanguage) as RunnableLanguage[]).filter((l) => sourceByLanguage[l]),
  );
  if (availableSet.has('javascript')) {
    availableSet.add('typescript');
  }
  const available = supportedLanguages().filter((l) => availableSet.has(l));

  const [language, setLanguage] = useState<RunnableLanguage>(available[0] ?? 'javascript');
  const [trace, setTrace] = useState<Trace | null>(null);
  const [running, setRunning] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const runtime = useRef<RuntimeClient | null>(null);

  const source =
    sourceByLanguage[language] ??
    (language === 'typescript' && sourceByLanguage.javascript
      ? convertJsToTypeScript(
          sourceByLanguage.javascript,
          walkthroughSpec({ entry, entryByLanguage, args }),
        )
      : undefined);

  useEffect(() => {
    const client = new RuntimeClient();
    runtime.current = client;
    return () => {
      client.dispose();
      runtime.current = null;
    };
  }, []);

  const run = useCallback(
    async (target: RunnableLanguage) => {
      const code =
        sourceByLanguage[target] ??
        (target === 'typescript' && sourceByLanguage.javascript
          ? convertJsToTypeScript(
              sourceByLanguage.javascript,
              walkthroughSpec({ entry, entryByLanguage, args }),
            )
          : undefined);
      if (!runtime.current || !code) return;
      setRunning(true);
      setFailure(null);
      try {
        const result = await runtime.current.run({
          spec: walkthroughSpec({ entry, entryByLanguage, args }),
          source: code,
          language: target,
          trace: true,
        });
        const caseError = result.cases[0]?.error;
        if (caseError) {
          setFailure(caseError);
          return;
        }
        if (!result.trace || result.trace.events.length === 0) {
          setFailure('The run produced no trace events, so there is nothing to animate.');
          return;
        }
        setTrace(result.trace);
      } catch (e) {
        setFailure(e instanceof Error ? e.message : String(e));
      } finally {
        setRunning(false);
      }
    },
    [entry, entryByLanguage, sourceByLanguage, args],
  );

  /**
   * Switching language re-runs immediately when a trace is already on screen,
   * so the control behaves like a toggle rather than resetting the learner to
   * the start screen they already dismissed.
   */
  const switchTo = useCallback(
    (next: RunnableLanguage) => {
      if (next === language) return;
      setLanguage(next);
      if (trace || failure) {
        setTrace(null);
        void run(next);
      }
    },
    [language, trace, failure, run],
  );

  const switcher =
    available.length > 1 ? (
      <div className="flex gap-1">
        {available.map((l) => (
          <Button
            key={l}
            tone={l === language ? 'strong' : 'surface'}
            aria-pressed={l === language}
            onClick={() => switchTo(l)}
            disabled={running}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 text-xs"
          >
            <LanguageIcon language={l} size={13} />
            <span>{LANGUAGE_LABELS[l] ?? l}</span>
          </Button>
        ))}
      </div>
    ) : null;

  if (trace && source) {
    return (
      <Visualizer
        trace={trace}
        source={source}
        language={language}
        title={title}
        caption={caption}
        call={callSignature(entryByLanguage?.[language] ?? entry, args)}
        visual={visual}
        toolbar={switcher}
      />
    );
  }

  return (
    <Node tone="muted" className="flex flex-col gap-3 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-foreground-muted">
          {caption ?? 'Step through this pattern one operation at a time.'}
        </p>
        {switcher}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => run(language)}
          disabled={running || !source}
          className="inline-flex items-center gap-1.5"
        >
          <LanguageIcon language={language} size={13} />
          <span>{running ? 'Preparing…' : `Run ${LANGUAGE_LABELS[language] ?? language} walkthrough`}</span>
        </Button>
        {failure && (
          <span className="text-xs text-danger">{failure}</span>
        )}
        {running && language === 'python' && (
          <span className="text-xs text-foreground-muted">
            First Python run downloads the interpreter — a few seconds.
          </span>
        )}
      </div>
    </Node>
  );
}
