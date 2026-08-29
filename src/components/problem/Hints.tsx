'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { track } from '@/lib/analytics/track';

/**
 * Progressive hint disclosure (A8, §6.3).
 *
 * One at a time, in order, and never all at once: a learner who can see the
 * third hint has been handed the answer, and the point of hints is to keep them
 * moving without doing that.
 *
 * Reveals persist locally so a reload does not silently re-hide what someone
 * already read — losing that would make the page feel like it forgot them.
 * Server-side progress arrives in T1.4; local storage is the anonymous tier
 * (A15) and works for signed-out learners too.
 *
 * **Known limitation, accepted deliberately.** Hint text is serialised into the
 * page as props, so view-source reveals all of them. This is spoiler *friction*,
 * not a secret: hints are nudges, not solutions, and the reference solution and
 * test cases are genuinely never sent to the client. Fetching hint bodies on
 * demand would cost a round-trip and forfeit static rendering to raise a bar
 * that clicking the button already clears.
 */

const listeners = new Set<() => void>();

function keyFor(exerciseId: string) {
  return `gc.hints.${exerciseId}`;
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

function readRevealed(exerciseId: string): number {
  try {
    return Number(localStorage.getItem(keyFor(exerciseId)) ?? 0);
  } catch {
    return 0;
  }
}

export function Hints({ exerciseId, hints }: { exerciseId: string; hints: string[] }) {
  // Collapsing is presentational and per-visit: it hides what is on screen
  // without discarding the record of what was opened, which the analytics
  // funnel and the struggle nudge both read.
  const [collapsed, setCollapsed] = useState(false);
  const revealed = useSyncExternalStore(
    subscribe,
    () => readRevealed(exerciseId),
    // Server renders none revealed, so markup is stable before hydration.
    () => 0,
  );

  const reveal = useCallback(() => {
    const next = Math.min(revealed + 1, hints.length);
    try {
      localStorage.setItem(keyFor(exerciseId), String(next));
    } catch {
      // Storage refused; the hint still opens for this session.
    }
    listeners.forEach((l) => l());
    track('hint_revealed', { exerciseId, index: next });
  }, [revealed, hints.length, exerciseId]);

  const remaining = hints.length - revealed;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Hints</h2>
        {revealed > 0 && (
          <button
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            className="text-xs text-foreground-muted underline underline-offset-2"
          >
            {collapsed ? `Show ${revealed} opened` : 'Hide hints'}
          </button>
        )}
      </div>

      {revealed === 0 && (
        <p className="text-sm text-foreground-muted">
          Stuck? Hints open one at a time, each giving a little more away.
        </p>
      )}

      {!collapsed &&
        hints.slice(0, revealed).map((hint, i) => (
          <Node key={i} tone="muted" className="p-3">
            <p className="mb-1 text-xs font-semibold">Hint {i + 1}</p>
            <p className="text-sm">{hint}</p>
          </Node>
        ))}

      {collapsed ? null : remaining > 0 ? (
        <div>
          <Button tone="surface" onClick={reveal}>
            {revealed === 0 ? 'Show a hint' : `Show hint ${revealed + 1}`}
          </Button>
          <p className="mt-1 text-xs text-foreground-muted">
            {remaining} {remaining === 1 ? 'hint' : 'hints'} left
          </p>
        </div>
      ) : (
        <p className="text-xs text-foreground-muted">That&apos;s every hint.</p>
      )}
    </section>
  );
}
