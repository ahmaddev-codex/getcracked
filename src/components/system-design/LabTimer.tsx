'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

/**
 * The interview clock (C7).
 *
 * **Pressure, not enforcement.** When the budget runs out the lab keeps going
 * and the clock keeps counting. A tool that discarded someone's work at 35:00
 * would be simulating the one part of an interview nobody needs practice at,
 * and it would be used exactly once. What the timer is actually for is the two
 * things a real round gives you: a visible clock while you decide, and an honest
 * answer afterwards about whether you would have finished.
 *
 * So going over is recorded rather than punished — the scorecard says
 * "52:10, over by 17 minutes", which is the useful sentence.
 *
 * **Not persisted.** A lab is not stored at all (see ScenarioLab), so a reload
 * starts over. Anything else would mean a clock that kept running while the tab
 * was closed, which measures nothing.
 */
export function formatDuration(seconds: number): string {
  const abs = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(abs / 60);
  return `${minutes}:${String(abs % 60).padStart(2, '0')}`;
}

export function LabTimer({
  budgetMinutes,
  startedAt,
  onElapsed,
}: {
  budgetMinutes: number;
  /** Epoch ms. Null while the lab is untimed. */
  startedAt: number | null;
  /** Reports elapsed seconds up to the parent, for the scorecard. */
  onElapsed: (seconds: number) => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (startedAt === null) return;
    // One second is the coarsest tick that still reads as a clock. Anything
    // finer re-renders for a digit nobody can see change.
    const id = setInterval(() => setNow(Date.now()), 1_000);
    return () => clearInterval(id);
  }, [startedAt]);

  const elapsed = startedAt === null ? 0 : Math.floor((now - startedAt) / 1000);

  useEffect(() => {
    if (startedAt !== null) onElapsed(elapsed);
  }, [elapsed, startedAt, onElapsed]);

  if (startedAt === null) return null;

  const budget = budgetMinutes * 60;
  const remaining = budget - elapsed;
  const over = remaining < 0;
  /** The last five minutes, which is when a real round starts to bite. */
  const closing = !over && remaining <= 5 * 60;

  return (
    <span
      role="timer"
      /**
       * Silent to assistive technology while it ticks.
       *
       * A polite live region on a one-second counter announces sixty times a
       * minute, which makes the page unusable with a screen reader. The label
       * below carries the state at the two moments that actually matter, and
       * changing it is what gets announced.
       */
      aria-live="off"
      aria-label={
        over
          ? `Over the ${budgetMinutes} minute budget`
          : closing
            ? 'Under five minutes remaining'
            : `${budgetMinutes} minute budget running`
      }
      className={`node-surface inline-flex items-center gap-1.5 px-2 py-1 font-mono text-xs ${
        over ? 'bg-danger-soft text-danger' : closing ? 'bg-warning-soft text-warning' : 'bg-surface-muted'
      }`}
    >
      <Clock size={12} aria-hidden />
      {over ? `+${formatDuration(-remaining)}` : formatDuration(remaining)}
      <span className="sr-only">
        {over ? ' over the budget' : ' remaining'}
      </span>
    </span>
  );
}
