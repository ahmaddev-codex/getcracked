/**
 * Smart Connector Path Calculation
 *
 * Computes edge-to-edge bezier connectors between bounding boxes so arrows
 * never intersect node cards, terminate flush at the destination border, and
 * smoothly orient based on the dominant axis.
 */

export interface Rect {
  x: number;
  y: number;
  width?: number;
  height?: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface SmartConnector {
  pathD: string;
  startPoint: Point;
  endPoint: Point;
  controlPoint1: Point;
  controlPoint2: Point;
  midPoint: Point;
  orientation: 'horizontal' | 'vertical';
}

export function getSmartConnector(
  source: Rect,
  target: Rect,
  defaultWidth = 158,
  defaultHeight = 62
): SmartConnector {
  const w1 = source.width ?? defaultWidth;
  const h1 = source.height ?? defaultHeight;
  const w2 = target.width ?? defaultWidth;
  const h2 = target.height ?? defaultHeight;

  const c1: Point = { x: source.x + w1 / 2, y: source.y + h1 / 2 };
  const c2: Point = { x: target.x + w2 / 2, y: target.y + h2 / 2 };

  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;

  let start: Point;
  let end: Point;
  let cp1: Point;
  let cp2: Point;
  let orientation: 'horizontal' | 'vertical';

  if (Math.abs(dx) >= Math.abs(dy)) {
    // Horizontal dominant
    orientation = 'horizontal';
    const offset = Math.max(36, Math.abs(dx) * 0.45);

    if (dx >= 0) {
      // Target is to the right
      start = { x: source.x + w1, y: c1.y };
      end = { x: target.x, y: c2.y };
      cp1 = { x: start.x + offset, y: start.y };
      cp2 = { x: end.x - offset, y: end.y };
    } else {
      // Target is to the left
      start = { x: source.x, y: c1.y };
      end = { x: target.x + w2, y: c2.y };
      cp1 = { x: start.x - offset, y: start.y };
      cp2 = { x: end.x + offset, y: end.y };
    }
  } else {
    // Vertical dominant
    orientation = 'vertical';
    const offset = Math.max(36, Math.abs(dy) * 0.45);

    if (dy >= 0) {
      // Target is below
      start = { x: c1.x, y: source.y + h1 };
      end = { x: c2.x, y: target.y };
      cp1 = { x: start.x, y: start.y + offset };
      cp2 = { x: end.x, y: end.y - offset };
    } else {
      // Target is above
      start = { x: c1.x, y: source.y };
      end = { x: c2.x, y: target.y + h2 };
      cp1 = { x: start.x, y: start.y - offset };
      cp2 = { x: end.x, y: end.y + offset };
    }
  }

  const pathD = `M ${start.x} ${start.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${end.x} ${end.y}`;

  // Cubic bezier midpoint calculation at t = 0.5
  // B(0.5) = 0.125 * P0 + 0.375 * P1 + 0.375 * P2 + 0.125 * P3
  const midPoint: Point = {
    x: 0.125 * start.x + 0.375 * cp1.x + 0.375 * cp2.x + 0.125 * end.x,
    y: 0.125 * start.y + 0.375 * cp1.y + 0.375 * cp2.y + 0.125 * end.y,
  };

  return {
    pathD,
    startPoint: start,
    endPoint: end,
    controlPoint1: cp1,
    controlPoint2: cp2,
    midPoint,
    orientation,
  };
}
