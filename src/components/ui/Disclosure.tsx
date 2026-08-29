'use client';

import { useId, useState, type ReactNode } from 'react';

/**
 * An animated collapsible section.
 *
 * Animates with a `grid-template-rows: 0fr → 1fr` transition rather than a fixed
 * max-height. Max-height requires guessing a value taller than the content —
 * which either clips a long exercise or makes a short one animate at the wrong
 * speed. The grid technique animates to the content's real height, whatever it
 * is.
 *
 * A native `<details>` would give this for free but is not animatable in the
 * same way and is awkward to keep in step with external state, so the open
 * state is held here and the semantics are supplied by `aria-expanded` and
 * `aria-controls`.
 *
 * Respects `prefers-reduced-motion` — the transition is defined in CSS where the
 * media query can switch it off (see globals.css).
 */
export function Disclosure({
  summary,
  aside,
  defaultOpen = false,
  children,
}: {
  summary: ReactNode;
  /** Sits opposite the summary — a status badge, a count. */
  aside?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = useId();

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex flex-1 items-center justify-between gap-3 py-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          {summary}
          {/* Trailing, so the summary starts at the same left edge as the
              content below it rather than being indented by a marker. */}
          <span
            aria-hidden
            className={`inline-block shrink-0 text-xs transition-transform duration-(--duration-fast) ease-(--ease-out) ${
              open ? 'rotate-90' : 'rotate-0'
            }`}
          >
            ▶
          </span>
        </button>
        {aside}
      </div>

      <div
        id={panelId}
        className="gc-disclosure-panel grid"
        data-open={open ? 'true' : 'false'}
        // Hidden from assistive tech and from tab order while collapsed;
        // otherwise a keyboard user tabs into an editor they cannot see.
        inert={!open}
      >
        <div className="overflow-hidden">
          <div className="pt-3">{children}</div>
        </div>
      </div>
    </div>
  );
}
