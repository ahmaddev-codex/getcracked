import { Check } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import type { DifficultyTally } from '@/lib/account';

/**
 * Solved, as a ring with the split beside it — the LeetCode arrangement.
 *
 * "13 solved" says nothing about *which* thirteen, and that is the first thing
 * anyone wants to know: thirteen easy problems and thirteen hard ones are
 * different achievements. The ring gives the total at a glance and the arcs
 * give the composition without needing a second chart.
 *
 * Drawn with `stroke-dasharray` on three concentric circles rather than arc
 * paths. Dash offsets are exact at any proportion, where hand-built `A` path
 * commands need a large-arc flag that flips past half the circle — a bug that
 * only appears once someone has solved more than half the catalogue, which is
 * the worst possible time to find it.
 */

const SIZE = 132;
const STROKE = 11;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/**
 * Gap between difficulty bands.
 *
 * Without it the three bands butt together and read as one continuous ring, so
 * the composition — the thing the split exists to show — is only legible where
 * two adjacent colours happen to contrast. Taken off the end of each band so
 * the bands still start where they should.
 */
const BAND_GAP = 5;

/**
 * Each difficulty gets a solid colour for what is done and a faded one for what
 * remains. The faded value is the same hue mixed toward the track, so the two
 * read as one band rather than as two unrelated segments.
 */
const TONE: Record<string, { text: string; stroke: string; muted: string }> = {
  easy: {
    text: 'text-success',
    stroke: 'var(--success)',
    muted: 'color-mix(in srgb, var(--success) 22%, var(--surface-muted))',
  },
  medium: {
    text: 'text-warning',
    stroke: 'var(--warning)',
    muted: 'color-mix(in srgb, var(--warning) 22%, var(--surface-muted))',
  },
  hard: {
    text: 'text-danger',
    stroke: 'var(--danger)',
    muted: 'color-mix(in srgb, var(--danger) 22%, var(--surface-muted))',
  },
};

export function DifficultyBreakdown({ tallies }: { tallies: readonly DifficultyTally[] }) {
  const solved = tallies.reduce((sum, t) => sum + t.solved, 0);
  const total = tallies.reduce((sum, t) => sum + t.total, 0);

  /**
   * The ring covers the whole catalogue, not just what is solved.
   *
   * Each difficulty owns a band proportional to how many problems it has, and
   * within that band the solved portion is drawn in full colour over a faded
   * one. A ring showing only solved work is always complete-looking — it says
   * nothing about how much is left, which is the more useful half of the
   * picture.
   *
   * Offsets are a prefix sum computed up front rather than an accumulator
   * mutated inside `map`: React's immutability rule rejects reassigning during
   * render, and rightly — a value that depends on how far through a render it
   * is read breaks the moment the list is reordered.
   */
  const bands = tallies.map((t) => (total > 0 ? t.total / total : 0) * CIRCUMFERENCE);
  const arcs = tallies.map((tally, index) => {
    const tone = TONE[tally.difficulty] ?? TONE.medium;
    return {
      key: tally.difficulty,
      stroke: tone.stroke,
      muted: tone.muted,
      // Shortened by the gap, never below zero — a band narrower than the gap
      // would otherwise render as a negative dash and disappear.
      band: Math.max(0, bands[index] - BAND_GAP),
      // Against the whole catalogue, so this arc sits inside its own band.
      // Clamped to the visible band so a fully-solved difficulty does not
      // paint over the gap into its neighbour.
      done: Math.min(
        Math.max(0, bands[index] - BAND_GAP),
        (total > 0 ? tally.solved / total : 0) * CIRCUMFERENCE,
      ),
      offset: bands.slice(0, index).reduce((sum, n) => sum + n, 0),
    };
  });

  return (
    <Node tone="surface" className="flex flex-wrap items-center gap-8 p-5">
      <div className="relative shrink-0">
        <svg
          width={SIZE}
          height={SIZE}
          role="img"
          aria-label={`${solved} of ${total} problems solved`}
        >
          {/* Rotated so the first arc starts at twelve o'clock rather than at
              three, which is where a bare SVG circle begins. */}
          <g transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke="var(--surface-muted)"
              strokeWidth={STROKE}
            />

            {/* Each band's full extent, faded — what exists but is not done. */}
            {arcs.map((arc) => (
              <circle
                key={`${arc.key}-band`}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={RADIUS}
                fill="none"
                stroke={arc.muted}
                strokeWidth={STROKE}
                strokeDasharray={`${arc.band} ${CIRCUMFERENCE - arc.band}`}
                strokeDashoffset={-arc.offset}
              />
            ))}

            {/* The solved portion, in full colour, over its own band.
                Zero-length arcs are dropped: a round cap still paints a dot,
                which would imply progress that does not exist. */}
            {arcs
              .filter((arc) => arc.done > 0)
              .map((arc) => (
                <circle
                  key={arc.key}
                  cx={SIZE / 2}
                  cy={SIZE / 2}
                  r={RADIUS}
                  fill="none"
                  stroke={arc.stroke}
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  strokeDasharray={`${arc.done} ${CIRCUMFERENCE - arc.done}`}
                  strokeDashoffset={-arc.offset}
                />
              ))}
          </g>
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <p className="font-mono text-2xl font-bold leading-none">
            {solved}
            <span className="text-sm font-normal text-foreground-muted">/{total}</span>
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-foreground-muted">
            <Check size={11} className="text-success" aria-hidden />
            Solved
          </p>
        </div>
      </div>

      <dl className="flex min-w-40 flex-1 flex-col gap-2">
        {tallies.map((tally) => (
          <div
            key={tally.difficulty}
            className="flex items-center justify-between gap-4 rounded-md border border-border-subtle bg-surface-muted px-3 py-1.5"
          >
            <dt
              className={`text-xs font-semibold capitalize ${TONE[tally.difficulty]?.text ?? ''}`}
            >
              {tally.difficulty}
            </dt>
            <dd className="font-mono text-sm">
              {tally.solved}
              <span className="text-foreground-muted">/{tally.total}</span>
            </dd>
          </div>
        ))}
      </dl>
    </Node>
  );
}
