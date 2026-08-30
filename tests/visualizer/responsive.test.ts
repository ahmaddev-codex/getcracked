import { describe, expect, it } from 'vitest';
import { toProtocol } from '@/lib/trace/protocol';
import { createArrayRenderer } from '@/lib/visualizer/array-renderer';

/**
 * Drawing to the width that is actually available (B8).
 *
 * The renderer sizes its cells to the container once, at mount — re-measuring
 * per frame is exactly the layout read the 60fps budget forbids. So the sizing
 * has to be right from that one measurement, at every width a phone or a window
 * can present, and it has to degrade rather than overflow.
 *
 * jsdom reports `clientWidth` as 0 for everything, which is itself one of the
 * cases worth pinning: a renderer that produced a zero-width picture on an
 * unmeasured container would look broken on a first paint.
 */

function traceOf(count: number) {
  return toProtocol([
    { kind: 'line', line: 1, vars: { xs: Array.from({ length: count }, (_, i) => i) } },
    { kind: 'array_read', array: 'xs', index: 0, value: 0 },
  ]);
}

/** jsdom lays nothing out, so the available width is supplied directly. */
function hostOfWidth(width: number): HTMLElement {
  const host = document.createElement('div');
  Object.defineProperty(host, 'clientWidth', { value: width, configurable: true });
  document.body.appendChild(host);
  return host;
}

function drawnWidth(host: HTMLElement): number {
  return Number(host.querySelector('svg')?.getAttribute('width') ?? 0);
}

describe('sizing to the container', () => {
  it.each([
    ['a phone', 320],
    ['a small tablet', 600],
    ['a desktop column', 900],
  ])('fits a short array inside %s', (_case, available) => {
    const host = hostOfWidth(available);
    const renderer = createArrayRenderer();
    renderer.mount(host, traceOf(8));

    const width = drawnWidth(host);
    expect(width).toBeGreaterThan(0);
    // The whole point: no sideways scroll when the array could have fitted.
    expect(width).toBeLessThanOrEqual(available);

    renderer.destroy();
  });

  it('draws a narrower picture on a narrower screen', () => {
    // Same data, two viewports. If these matched, the renderer would be
    // ignoring the container and the phone would be scrolling for no reason.
    const phone = hostOfWidth(320);
    const desktop = hostOfWidth(900);
    const a = createArrayRenderer();
    const b = createArrayRenderer();

    a.mount(phone, traceOf(10));
    b.mount(desktop, traceOf(10));

    expect(drawnWidth(phone)).toBeLessThan(drawnWidth(desktop));

    a.destroy();
    b.destroy();
  });

  it('overflows rather than shrinking past legibility', () => {
    // 200 cells cannot fit a phone at any readable size, so the honest outcome
    // is a picture wider than the panel — which scrolls inside its own
    // container — not 1px slivers that show nothing.
    const host = hostOfWidth(320);
    const renderer = createArrayRenderer();
    renderer.mount(host, traceOf(200));

    expect(drawnWidth(host)).toBeGreaterThan(320);
    expect(host.querySelectorAll('rect').length).toBeGreaterThanOrEqual(200);

    renderer.destroy();
  });

  it('still draws something when the container has not been laid out', () => {
    // clientWidth is 0 before layout, and on a first paint that is a real
    // state. A zero-width SVG would read as the visualizer being broken.
    const host = hostOfWidth(0);
    const renderer = createArrayRenderer();
    renderer.mount(host, traceOf(6));

    expect(drawnWidth(host)).toBeGreaterThan(0);

    renderer.destroy();
  });
});

describe('labels', () => {
  it('are dropped once a cell is too narrow to read one', () => {
    // Noise at 6px wide. Dropping them is what keeps a large array legible as a
    // shape when it cannot be legible as numbers.
    const roomy = hostOfWidth(900);
    const cramped = hostOfWidth(320);
    const a = createArrayRenderer();
    const b = createArrayRenderer();

    a.mount(roomy, traceOf(8));
    b.mount(cramped, traceOf(120));

    expect(roomy.querySelectorAll('text').length).toBeGreaterThan(0);
    expect(cramped.querySelectorAll('text').length).toBe(0);

    a.destroy();
    b.destroy();
  });
});
