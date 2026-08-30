import { Node } from '@/components/ui/Node';

/**
 * One number, with what it is out of.
 *
 * A bare count says nothing — "12 solved" is either impressive or barely
 * started depending on the catalogue size, and a learner cannot tell which. The
 * denominator is what makes the number mean something.
 */
export function StatCard({
  label,
  value,
  of,
  hint,
}: {
  label: string;
  value: number;
  of?: number;
  hint?: string;
}) {
  const pct = of && of > 0 ? Math.round((value / of) * 100) : null;

  return (
    <Node tone="surface" className="flex flex-col gap-1.5 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        {label}
      </p>
      <p className="font-mono text-2xl font-bold">
        {value}
        {of !== undefined && (
          <span className="text-base font-normal text-foreground-muted"> / {of}</span>
        )}
      </p>

      {pct !== null && (
        // SVG rather than a div with a percentage width: the project bans inline
        // styles so that colour and spacing cannot bypass the token layer (K1),
        // and an SVG width is a presentation attribute rather than a style.
        //
        // Percentage widths rather than a stretched viewBox — scaling a
        // fixed-unit viewBox to the real width scales `rx` with it, which turns
        // the rounded ends into elongated ovals.
        <svg
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${pct}%`}
          className="h-1.5 w-full"
        >
          <rect x="0" y="0" width="100%" height="6" rx="3" fill="var(--surface-muted)" />
          <rect x="0" y="0" width={`${pct}%`} height="6" rx="3" fill="var(--accent-strong)" />
        </svg>
      )}

      {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
    </Node>
  );
}
