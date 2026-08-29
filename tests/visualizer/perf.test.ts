import { describe, expect, it } from 'vitest';
import { toProtocol, stateAtStep } from '@/lib/trace/protocol';
import { createArrayRenderer } from '@/lib/visualizer/array-renderer';
import { runJavaScript } from '@/lib/runtime/javascript';

/**
 * H5 requires 60fps for arrays up to 500 elements.
 *
 * This is the assertion that keeps the renderer imperative: the moment someone
 * rebuilds it as 500 React components reconciling per frame, this fails.
 */
describe('H5: 60fps at the 500-element cap', () => {
  it('updates well inside a 16.7ms frame budget', async () => {
    const r = await runJavaScript({
      source: 'function fill(xs){for(let i=0;i<xs.length;i++){xs[i]=i;}return xs.length;}',
      entry: 'fill',
      args: [Array.from({ length: 500 }, () => 0)],
      trace: true,
      maxEvents: 100000,
    });
    const trace = toProtocol(r.events);

    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, trace);

    const states = Array.from({ length: 200 }, (_, i) =>
      stateAtStep(trace, Math.floor((i / 200) * trace.events.length)),
    );

    const t0 = performance.now();
    for (const s of states) renderer.update(s);
    const perFrame = (performance.now() - t0) / states.length;
    renderer.destroy();

    // H5's budget is 16.7ms for 60fps. Measured at ~1.5ms on this machine; the
    // assertion guards the order of magnitude rather than the exact figure,
    // since CI hardware differs.
    expect(perFrame).toBeLessThan(16.7);
  }, 120000);
});
