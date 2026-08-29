'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { stateAtStep, type Trace } from '@/lib/trace/protocol';
import { createArrayRenderer } from '@/lib/visualizer/array-renderer';
import { describeStep } from '@/lib/visualizer/array-renderer';
import { registerRenderer, selectRenderer } from '@/lib/visualizer/registry';

registerRenderer('array', createArrayRenderer);

/**
 * Playback over a trace (B3).
 *
 * React owns the container, the controls, and the scrubber. The frame loop does
 * not: it runs on `requestAnimationFrame` and drives the renderer imperatively,
 * because H5 asks for 60fps at 500 elements and 500 React components
 * reconciling every frame will not deliver it (ADR 0001 §7).
 *
 * The step index is mirrored into a ref so the loop can read it without
 * re-subscribing, and into state so the controls can render it. That duplication
 * is deliberate — the alternative is either a laggy scrubber or a loop that
 * restarts on every frame.
 */

const SPEEDS = [0.5, 1, 2, 4] as const;
/** Steps per second at 1x. Slow enough to follow, fast enough not to bore. */
const BASE_STEPS_PER_SECOND = 8;

export function Visualizer({ trace }: { trace: Trace }) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ReturnType<typeof selectRenderer>>(null);
  const stepRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [description, setDescription] = useState('');

  const total = trace.events.length;
  const arrayName = trace.collections.find((c) => c.kind === 'array')?.name ?? '';

  /** Draws one step. Called from the loop and from every control. */
  const draw = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, total - 1));
      stepRef.current = clamped;
      setStep(clamped);

      const state = stateAtStep(trace, clamped);
      rendererRef.current?.renderer.update(state);
      setDescription(describeStep(state, arrayName));
    },
    [trace, total, arrayName],
  );

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const selected = selectRenderer(trace);
    rendererRef.current = selected;
    if (!selected) return;

    selected.renderer.mount(host, trace);
    selected.renderer.update(stateAtStep(trace, 0));

    return () => {
      selected.renderer.destroy();
      rendererRef.current = null;
    };
  }, [trace]);

  useEffect(() => {
    if (!playing) return;

    const interval = 1000 / (BASE_STEPS_PER_SECOND * speed);

    const tick = (now: number) => {
      // Time-based rather than frame-based, so playback runs at the same speed
      // on a 120Hz display as on a 60Hz one.
      if (now - lastTickRef.current >= interval) {
        lastTickRef.current = now;
        if (stepRef.current >= total - 1) {
          setPlaying(false);
          return;
        }
        draw(stepRef.current + 1);
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [playing, speed, total, draw]);

  /**
   * Seeks to the first step where the run went wrong (B3).
   *
   * Falls back to the last step when nothing failed, rather than doing nothing
   * — a control that silently no-ops reads as broken.
   */
  const jumpToDivergence = useCallback(() => {
    const index = trace.events.findIndex((e) => e.kind === 'truncated');
    draw(index === -1 ? total - 1 : index);
  }, [trace, total, draw]);

  if (total === 0) {
    return (
      <Node tone="muted" className="p-4 text-sm text-foreground-muted">
        No trace to show for this run.
      </Node>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Watch it run</h2>
        <span className="font-mono text-xs text-foreground-muted">
          step {step + 1} / {total}
        </span>
      </div>

      {trace.degraded && (
        <p className="text-xs text-foreground-muted">
          Line-by-line tracing was unavailable for this code, so only array access is shown.
        </p>
      )}

      <Node tone="surface" className="overflow-x-auto p-4">
        <div ref={hostRef} />
      </Node>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setPlaying((p) => !p)}>{playing ? 'Pause' : 'Play'}</Button>
        <Button tone="surface" onClick={() => draw(stepRef.current - 1)} disabled={step === 0}>
          ← Step
        </Button>
        <Button
          tone="surface"
          onClick={() => draw(stepRef.current + 1)}
          disabled={step >= total - 1}
        >
          Step →
        </Button>
        <Button tone="surface" onClick={jumpToDivergence}>
          Jump to end
        </Button>

        <div className="flex items-center gap-1">
          {SPEEDS.map((s) => (
            <Button
              key={s}
              tone={s === speed ? 'strong' : 'surface'}
              aria-pressed={s === speed}
              onClick={() => setSpeed(s)}
              className="px-2 py-1 text-xs"
            >
              {s}×
            </Button>
          ))}
        </div>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, total - 1)}
        value={step}
        onChange={(e) => {
          setPlaying(false);
          draw(Number(e.target.value));
        }}
        aria-label="Scrub through the trace"
        className="w-full"
      />

      {/* H4: the animation is not the only way to follow the trace. */}
      <p aria-live="polite" className="font-mono text-xs text-foreground-muted">
        {description}
      </p>
    </section>
  );
}
