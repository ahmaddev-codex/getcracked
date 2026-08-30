'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';

/**
 * Controls for a watch-only run (B3).
 *
 * Two things separate this from "Run tests". It grades nothing — so a learner
 * can watch their half-written solution move without marking the problem
 * attempted — and the input is theirs to change.
 *
 * **The editable input is the point.** The problem's own case is the default,
 * because that is what they are trying to satisfy, but understanding usually
 * comes from asking "what does it do on an empty array?" — a question the fixed
 * test cases cannot answer and a debugger normally would.
 *
 * Parsed as JSON rather than evaluated. `eval` would accept nicer syntax and
 * would also run whatever was pasted into it; JSON covers every argument shape
 * the test spec can express, since that is what the spec is serialised as.
 */
export function WatchPanel({
  defaultArgs,
  running,
  onWatch,
}: {
  defaultArgs: unknown[];
  running: boolean;
  onWatch: (args: unknown[]) => void;
}) {
  const [text, setText] = useState(() => JSON.stringify(defaultArgs));
  const [invalid, setInvalid] = useState<string | null>(null);

  return (
    <Node tone="muted" className="flex flex-col gap-2 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          tone="surface"
          disabled={running}
          onClick={() => {
            let parsed: unknown;
            try {
              parsed = JSON.parse(text);
            } catch {
              setInvalid('That is not valid JSON.');
              return;
            }
            if (!Array.isArray(parsed)) {
              // The arguments are a list, always — a bare value here would call
              // the function with the wrong arity and fail confusingly.
              setInvalid('Arguments must be a JSON array, e.g. [[3, 1, 4], 2].');
              return;
            }
            setInvalid(null);
            onWatch(parsed);
          }}
          className="inline-flex items-center gap-1.5"
        >
          <Play size={14} aria-hidden />
          {running ? 'Running…' : 'Watch it run'}
        </Button>

        <label className="flex flex-1 items-center gap-2 text-xs">
          <span className="shrink-0 text-foreground-muted">input</span>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            aria-label="Arguments to watch, as a JSON array"
            aria-invalid={invalid !== null}
            className="node-surface w-full bg-surface px-2 py-1 font-mono text-xs text-foreground"
          />
        </label>

        <Button
          tone="surface"
          disabled={running}
          onClick={() => {
            setText(JSON.stringify(defaultArgs));
            setInvalid(null);
          }}
          className="px-2 py-1 text-xs"
        >
          Reset input
        </Button>
      </div>

      {invalid ? (
        <p className="text-xs text-danger">{invalid}</p>
      ) : (
        <p className="text-xs text-foreground-muted">
          Runs your code and animates it without grading anything. Change the input to see what
          it does on a case the tests do not cover.
        </p>
      )}
    </Node>
  );
}
