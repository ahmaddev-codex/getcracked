'use client';

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/**
 * The curved dotted fan from a roadmap node to its branches (K2).
 *
 * The reference does not use elbows. Every branch leaves the node from the
 * *same* point on its edge, bunched together, and splays out to arrive
 * horizontally at its own card. That single shared origin is what makes the
 * group read as "these all come from here" rather than as separate wires, and
 * elbows cannot express it — six right angles stacked in a column look like a
 * bus, not a fan.
 *
 * ## Why this measures instead of computing
 *
 * The obvious implementation derives each endpoint from known row heights and
 * gaps. That breaks the moment a card wraps to two lines, a font loads and
 * changes metrics, or the viewport narrows — and it breaks silently, leaving
 * curves pointing at empty space. Reading the real geometry costs one layout
 * pass per resize and cannot drift from what is on screen.
 */

function buildPath(
  origin: { x: number; y: number },
  target: { x: number; y: number },
): string {
  const dx = target.x - origin.x;
  // Control points pulled along the horizontal, which is what makes every curve
  // leave the shared origin bunched and arrive at its card level rather than
  // diagonally. Half the span is the value that matches the reference's
  // curvature at these distances.
  const bend = dx * 0.5;
  return `M ${origin.x} ${origin.y} C ${origin.x + bend} ${origin.y}, ${target.x - bend} ${target.y}, ${target.x} ${target.y}`;
}

/** Marks the node a fan leaves from. */
export const FAN_ORIGIN = 'data-fan-origin';
/** Marks each card a fan terminates at. */
export const FAN_TARGET = 'data-fan-target';

export function ConnectorFan({
  containerRef,
  side,
  /** Changing this re-measures — pass whatever determines the target set. */
  signature,
}: {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Which edge of the node the fan leaves from. */
  side: 'left' | 'right';
  signature: string;
}) {
  const [paths, setPaths] = useState<Array<{ key: string; d: string }>>([]);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  /**
   * Endpoints are found in the DOM rather than passed in as refs.
   *
   * Handing refs down means writing them during the parent's render, which
   * React 19 rejects outright — and it made the fan's correctness depend on the
   * parent remembering to rebuild an array in the right order. Querying the
   * container for the marker attributes is both legal and self-maintaining: a
   * card that renders gets a curve, and one that does not, does not.
   */
  const measure = useCallback(() => {
    const container = containerRef.current;
    const origin = container?.querySelector<HTMLElement>(`[${FAN_ORIGIN}]`);
    if (!container || !origin) return;

    const box = container.getBoundingClientRect();
    const node = origin.getBoundingClientRect();

    const start = {
      x: (side === 'right' ? node.right : node.left) - box.left,
      y: node.top + node.height / 2 - box.top,
    };

    const next: Array<{ key: string; d: string }> = [];
    for (const element of container.querySelectorAll<HTMLElement>(`[${FAN_TARGET}]`)) {
      const card = element.getBoundingClientRect();
      next.push({
        key: element.getAttribute(FAN_TARGET) ?? '',
        d: buildPath(start, {
          x: (side === 'right' ? card.left : card.right) - box.left,
          y: card.top + card.height / 2 - box.top,
        }),
      });
    }

    setSize({ width: box.width, height: box.height });
    setPaths(next);
  }, [containerRef, side]);

  useLayoutEffect(() => {
    measure();

    const container = containerRef.current;
    if (!container) return;

    // Catches viewport changes, a card wrapping, and the row growing.
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    for (const element of container.querySelectorAll(`[${FAN_TARGET}]`)) {
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [measure, containerRef, signature]);

  useEffect(() => {
    // A web font landing after first paint changes every card's height, and
    // nothing else would tell us. Ignored where the API is unavailable.
    void document.fonts?.ready.then(measure).catch(() => {});
  }, [measure]);

  if (!size || paths.length === 0) return null;

  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
      width={size.width}
      height={size.height}
      viewBox={`0 0 ${size.width} ${size.height}`}
      fill="none"
    >
      {paths.map(({ key, d }) => (
        <path
          key={key}
          d={d}
          stroke="var(--link)"
          strokeOpacity="0.75"
          strokeWidth="2"
          strokeLinecap="round"
          // Round dots rather than dashes, which is what the reference draws.
          strokeDasharray="0.1 6"
        />
      ))}
    </svg>
  );
}
