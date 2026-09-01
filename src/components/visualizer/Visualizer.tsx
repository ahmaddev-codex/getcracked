'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { stateAtStep, type Scalar, type Trace } from '@/lib/trace/protocol';
import { describeStep } from '@/lib/visualizer/array-renderer';
import { selectRenderer, type VisualKind } from '@/lib/visualizer/registry';
import '@/lib/visualizer/renderers';
import { CodePanel } from './CodePanel';
import type { Language } from '@/content/schema';
import { useAssistant } from '@/components/assistant';

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
/**
 * How much the panel has to change width before the picture is rebuilt (B8).
 *
 * Renderers size their cells to the container once, at mount, because
 * re-measuring per frame is exactly the per-frame layout read H5 forbids. That
 * is right until the container changes — a phone rotating, a desktop window
 * dragged — after which the picture is drawn for a width that no longer exists:
 * too small and it wastes the screen, too large and the panel scrolls
 * sideways when it did not need to.
 *
 * A threshold rather than a straight remount, because a drag-resize fires
 * continuously and rebuilding the SVG on every pixel would be far worse than
 * the stale size it fixes.
 */
const REMEASURE_THRESHOLD_PX = 48;
/** Steps per second at 1x. Slow enough to follow, fast enough not to bore. */
const BASE_STEPS_PER_SECOND = 8;

/** Colour meanings, stated rather than left to be inferred. */
function Legend() {
  const items = [
    { swatch: 'bg-accent', label: 'read' },
    { swatch: 'bg-accent-strong', label: 'written' },
    { swatch: 'border-2 border-link bg-surface-muted', label: 'pointer here' },
  ];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-muted">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5">
          <span className={`inline-block h-3 w-3 rounded-xs ${item.swatch}`} aria-hidden />
          {item.label}
        </li>
      ))}
    </ul>
  );
}

/** How a value should read in a variables pane. */
function display(value: Scalar): { text: string; type: string } {
  if (value === null) return { text: 'null', type: 'null' };
  if (typeof value === 'string') return { text: `"${value}"`, type: 'string' };
  if (typeof value === 'boolean') return { text: String(value), type: 'boolean' };
  if (typeof value === 'number') {
    return { text: String(value), type: Number.isInteger(value) ? 'int' : 'float' };
  }
  return { text: String(value), type: typeof value };
}

/** A compact rendering of a collection's contents. */
function preview(values: readonly unknown[], limit = 12): string {
  const shown = values.slice(0, limit).map((v) => display(v as Scalar).text);
  return `[${shown.join(', ')}${values.length > limit ? `, …${values.length - limit} more` : ''}]`;
}

function mapPreview(entries: ReadonlyMap<string, Scalar>, limit = 8): string {
  const shown = [...entries]
    .slice(0, limit)
    .map(([k, v]) => `${k}: ${display(v).text}`);
  return `{${shown.join(', ')}${entries.size > limit ? `, …${entries.size - limit} more` : ''}}`;
}

/**
 * The variables pane — a debugger's, not a caption.
 *
 * This was a run of name-value pairs wrapped onto one line: "target 9 i 1
 * complement 2". Nothing separated a name from the value before it, the *type*
 * was invisible — `"9"` behaving unlike `9` is a real and common bug — and a
 * change only showed as a number that quietly differed from the frame before.
 *
 * Each variable now gets its own cell, laid out side by side so the pane stays
 * a strip rather than a column that pushes the animation off screen. A changed
 * value reads `before → after`, because the transition is the thing worth
 * watching.
 *
 * **Collections are listed too.** Only one structure is drawn as a picture, so
 * a `seen` map built alongside the array in two-sum was previously invisible —
 * the learner could watch the array being scanned with no sight of the thing
 * the algorithm was actually building. These show their contents inline, which
 * is what a debugger's watch pane does.
 */
function Inspector({
  variables,
  changed,
  previousValues,
  arrays,
  maps,
  drawn,
}: {
  variables: Map<string, Scalar>;
  changed: Set<string>;
  previousValues: Map<string, Scalar>;
  arrays: Map<string, unknown[]>;
  maps: Map<string, Map<string, Scalar>>;
  /** Name of the collection already drawn above, so it is not repeated. */
  drawn: string;
}) {
  const scalars = [...variables].filter(([, v]) => v !== null);
  const collections = [
    ...[...arrays].filter(([name]) => name !== drawn).map(([name, v]) => ({
      name,
      kind: 'array' as const,
      text: preview(v),
      size: v.length,
    })),
    ...[...maps].filter(([name]) => name !== drawn).map(([name, v]) => ({
      name,
      kind: 'map' as const,
      text: mapPreview(v),
      size: v.size,
    })),
  ];

  if (scalars.length === 0 && collections.length === 0) {
    return <p className="text-xs text-foreground-muted">No variables in scope at this step.</p>;
  }

  return (
    <Node tone="muted" className="flex flex-col gap-2 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Variables
      </p>

      {scalars.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {scalars.map(([name, value]) => {
            const justChanged = changed.has(name);
            const before = previousValues.get(name);
            const shows =
              justChanged && before !== undefined && before !== null && !Object.is(before, value);
            const now = display(value);

            return (
              <li
                key={name}
                className={`flex items-baseline gap-1.5 rounded-md border px-2 py-1 font-mono text-xs ${
                  justChanged
                    ? 'border-accent-strong bg-accent text-accent-foreground'
                    : 'border-border-subtle bg-surface'
                }`}
              >
                <span className="font-semibold">{name}</span>
                <span className="opacity-60">{now.type}</span>
                {shows && (
                  <>
                    <span className="opacity-60 line-through">{display(before).text}</span>
                    <span className="opacity-60" aria-label="changed to">→</span>
                  </>
                )}
                <span className="font-semibold">{now.text}</span>
              </li>
            );
          })}
        </ul>
      )}

      {collections.length > 0 && (
        <ul className="flex flex-col gap-1">
          {collections.map((collection) => (
            <li
              key={`${collection.kind}-${collection.name}`}
              className="flex flex-wrap items-baseline gap-1.5 rounded-md border border-border-subtle bg-surface px-2 py-1 font-mono text-xs"
            >
              <span className="font-semibold">{collection.name}</span>
              <span className="opacity-60">
                {collection.kind}[{collection.size}]
              </span>
              <span className="break-all">{collection.text}</span>
            </li>
          ))}
        </ul>
      )}
    </Node>
  );
}

export function Visualizer({
  trace,
  source,
  language = 'javascript',
  title,
  caption,
  call,
  visual = 'array',
  toolbar,
  onLineChange,
}: {
  trace: Trace;
  source?: string;
  language?: Language;
  /** What this run is solving, stated rather than left to be inferred. */
  title?: string;
  /** What to watch for, from the lesson author. Stays on screen while playing. */
  caption?: string;
  /** The exact call being animated, e.g. `running_sum([3, 1, 4, 1, 5])`. */
  call?: string;
  /** The shape to draw the structure in. Declared by content, not inferred. */
  visual?: VisualKind;
  /** Caller-supplied controls (e.g. a language switcher) shown in the header. */
  toolbar?: ReactNode;
  /**
   * Reports the executing line so a caller can highlight it somewhere else.
   *
   * The problem workspace uses this instead of passing `source`: the learner
   * already has their code on screen in a real editor, and rendering a
   * read-only copy underneath is the same text twice.
   */
  onLineChange?: (line: number | null) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<ReturnType<typeof selectRenderer>>(null);
  const stepRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [description, setDescription] = useState('');
  const [currentLine, setCurrentLine] = useState<number | null>(null);
  const [variables, setVariables] = useState<Map<string, Scalar>>(new Map());
  const [changed, setChanged] = useState<Set<string>>(new Set());
  const [previousValues, setPreviousValues] = useState<Map<string, Scalar>>(new Map());
  const [arrays, setArrays] = useState<Map<string, unknown[]>>(new Map());
  const [maps, setMaps] = useState<Map<string, Map<string, Scalar>>>(new Map());
  const [returned, setReturned] = useState<{ value: unknown } | null>(null);
  const [drawable, setDrawable] = useState(true);
  /** Bumped when the panel's width changes materially — see the threshold above. */
  const [measureKey, setMeasureKey] = useState(0);

  const total = trace.events.length;
  // The collection the chosen shape draws, so the narration and the picture
  // describe the same thing.
  const drawnKind = visual === 'map' ? 'map' : visual === 'grid' ? 'grid' : 'array';
  const arrayName = trace.collections.find((c) => c.kind === drawnKind)?.name ?? '';

  const { openAssistant } = useAssistant();

  const handleExplainState = useCallback(() => {
    openAssistant({
      mode: 'explain_state',
      context: {
        traceStep: {
          stepIndex: step,
          totalSteps: total,
          line: currentLine ?? undefined,
          changedVariables: Object.fromEntries(
            [...changed].map((name) => [name, variables.get(name)]),
          ),
          description,
        },
      },
      initialPrompt: `Can you explain what is happening at step ${step + 1} of ${total} in this execution trace?`,
    });
  }, [openAssistant, step, total, currentLine, changed, variables, description]);

  /** Draws one step. Called from the loop and from every control. */
  const draw = useCallback(
    (next: number) => {
      const clamped = Math.max(0, Math.min(next, total - 1));
      stepRef.current = clamped;
      setStep(clamped);

      const state = stateAtStep(trace, clamped);
      rendererRef.current?.renderer.update(state);
      setDescription(describeStep(state, arrayName));
      // React owns the code panel and the inspector; the renderer owns the
      // canvas. Only these two cheap values cross the boundary per step.
      setCurrentLine(state.line);
      onLineChange?.(state.line);
      setVariables(state.variables);
      setChanged(state.changed);
      setPreviousValues(state.previousValues);
      // Collections other than the drawn one are listed in the pane, so an
      // algorithm building a map alongside the array it scans is visible.
      setArrays(state.arrays);
      setMaps(state.maps);
      setReturned(state.finished ? { value: state.returned } : null);
    },
    [trace, total, arrayName, onLineChange],
  );

  /**
   * Rebuilds the picture when the panel changes width (B8).
   *
   * `setState` in a ResizeObserver callback rather than in an effect body: this
   * is a subscription to an external system reporting, which is the one shape
   * React asks for.
   */
  useEffect(() => {
    const host = hostRef.current;
    if (!host || typeof ResizeObserver === 'undefined') return;

    let measured = host.clientWidth;
    const observer = new ResizeObserver(() => {
      const width = host.clientWidth;
      if (width > 0 && Math.abs(width - measured) >= REMEASURE_THRESHOLD_PX) {
        measured = width;
        setMeasureKey((n) => n + 1);
      }
    });

    observer.observe(host);
    return () => observer.disconnect();
  }, []);

  /**
   * What the renderer was last built for.
   *
   * A rebuild has two causes and they want opposite things. A **new run** starts
   * at the beginning. A **re-measure** must keep the learner exactly where they
   * were — rebuilding at step 0 because someone rotated their phone would throw
   * away the position they were studying.
   */
  const mountedFor = useRef<{ trace: Trace; visual?: VisualKind } | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const selected = selectRenderer(trace, visual);
    rendererRef.current = selected;
    setDrawable(Boolean(selected));
    if (!selected) return;

    const sameRun =
      mountedFor.current?.trace === trace && mountedFor.current?.visual === visual;
    mountedFor.current = { trace, visual };

    selected.renderer.mount(host, trace);
    selected.renderer.update(stateAtStep(trace, sameRun ? stepRef.current : 0));

    return () => {
      selected.renderer.destroy();
      rendererRef.current = null;
    };
  }, [trace, visual, measureKey]);

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
        <h2 className="text-sm font-semibold">{title ?? 'Watch it run'}</h2>
        <div className="flex items-center gap-3">
          {toolbar}
          <span className="font-mono text-xs text-foreground-muted">
            step {step + 1} / {total}
          </span>
        </div>
      </div>

      {/*
        What is being solved, kept on screen for the whole run.
        Previously the caption appeared only on the pre-run card and vanished the
        moment the animation started — exactly when a learner needs to know what
        they are looking at.
      */}
      {(call || caption) && (
        <Node tone="muted" className="flex flex-col gap-1 p-3">
          {call && (
            <p className="font-mono text-xs">
              <span className="text-foreground-muted">running </span>
              <span className="font-semibold">{call}</span>
            </p>
          )}
          {caption && <p className="text-xs text-foreground-muted">{caption}</p>}
        </Node>
      )}

      {trace.degraded && (
        <p className="text-xs text-foreground-muted">
          Line-by-line tracing was unavailable for this code, so only array access is shown.
        </p>
      )}

      {/*
        Code above, animation below — not side by side.
        
        Side by side gave each half about 340px on a 768px column, which left
        the picture smaller than the code that produced it and forced the array
        into 44px cells. Stacking gives the animation the full measure, which is
        what it needs: the code is read line by line and is happy narrow, while
        the structure is scanned across and is not.
      */}
      <div className="flex flex-col gap-3">
        {source && <CodePanel source={source} line={currentLine} language={language} />}

        <Node tone="surface" className="flex flex-col gap-3 overflow-x-auto p-4">
          {/* Reserves height so the panel does not collapse before the first
              frame and jump when it arrives. */}
          <div ref={hostRef} className="flex min-h-40 items-center justify-center" />
          {!drawable && (
            // Saying so beats an empty box that reads as a bug. Only arrays have
            // a renderer today; the others arrive in Phase 4.
            <p className="text-sm text-foreground-muted">
              No picture for this structure yet — the code and variables below still step
              through the run.
            </p>
          )}
          {/*
            What just happened, next to the thing it happened to. This was a
            muted line below the scrubber, which is the last place anyone
            watching the animation looks.
          */}
          <p
            aria-live="polite"
            className="border-l-2 border-accent-strong pl-2 font-mono text-xs"
          >
            {description}
          </p>

          <Inspector
            variables={variables}
            changed={changed}
            previousValues={previousValues}
            arrays={arrays}
            maps={maps}
            drawn={arrayName}
          />
          {drawable && <Legend />}
        </Node>
      </div>

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
        <Button
          tone="surface"
          onClick={() => {
            setPlaying(false);
            draw(0);
          }}
          disabled={step === 0 && !playing}
        >
          ↺ Start over
        </Button>
        <Button tone="surface" onClick={jumpToDivergence}>
          Jump to end
        </Button>
        <Button tone="surface" onClick={handleExplainState} title="Ask AI assistant to explain this animation state">
          ✨ Explain state
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

      {returned && (
        <p className="font-mono text-xs">
          <span className="text-foreground-muted">returned </span>
          <span className="rounded-xs bg-accent px-1 text-accent-foreground">
            {JSON.stringify(returned.value)}
          </span>
        </p>
      )}
    </section>
  );
}
