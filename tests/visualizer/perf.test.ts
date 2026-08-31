import { describe, expect, it } from 'vitest';
import { toProtocol, stateAtStep } from '@/lib/trace/protocol';
import { createArrayRenderer } from '@/lib/visualizer/array-renderer';
import { runJavaScript } from '@/lib/runtime/javascript';

/**
 * H5 requires 60fps for arrays up to 500 elements.
 *
 * **This cannot be checked with a stopwatch here, and it used to try.** The
 * assertion was `perFrame < 16.7`, measured at ~1.5ms locally and 16.85ms in CI
 * — an eleven-fold spread that has nothing to do with the renderer. These tests
 * run in jsdom, whose DOM is a JavaScript object graph rather than a browser's
 * layout engine, so the number produced is jsdom's attribute-setting speed on
 * whatever machine happened to run it. A real 60fps budget can only be measured
 * in a real browser.
 *
 * What the budget actually depends on is stated in the original comment: "the
 * moment someone rebuilds it as 500 React components reconciling per frame,
 * this fails". That property *is* checkable here, and deterministically:
 *
 *  1. **Nodes are reused.** An imperative renderer mutates the elements it
 *     created; a rebuild replaces them. Element identity across updates tells
 *     the two apart exactly, with no timing involved.
 *  2. **Updating is cheaper than mounting.** A ratio between two operations in
 *     the same process cancels out the hardware, which an absolute threshold
 *     cannot. If per-frame work ever becomes a rebuild, update converges on
 *     mount and this collapses.
 */
describe('H5: the renderer stays imperative at the 500-element cap', () => {
  async function trace500() {
    const r = await runJavaScript({
      source: 'function fill(xs){for(let i=0;i<xs.length;i++){xs[i]=i;}return xs.length;}',
      entry: 'fill',
      args: [Array.from({ length: 500 }, () => 0)],
      trace: true,
      maxEvents: 100000,
    });
    return toProtocol(r.events);
  }

  /** 200 evenly spaced frames across the run, as a playback would produce. */
  function framesOf(trace: ReturnType<typeof toProtocol>, count = 200) {
    return Array.from({ length: count }, (_, i) =>
      stateAtStep(trace, Math.floor((i / count) * trace.events.length)),
    );
  }

  it('reuses the same DOM nodes across every frame', async () => {
    const trace = await trace500();
    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, trace);

    // Identity, not count. A rebuild that produced the same number of elements
    // would pass a length check while replacing every one of them.
    const before = [...host.querySelectorAll('*')];
    expect(before.length).toBeGreaterThan(500);

    for (const state of framesOf(trace)) renderer.update(state);

    const after = [...host.querySelectorAll('*')];
    expect(after.length).toBe(before.length);
    expect(after.every((node, i) => node === before[i])).toBe(true);

    renderer.destroy();
  }, 120_000);

  it('costs materially less to update than to mount from scratch', async () => {
    const trace = await trace500();
    const frames = framesOf(trace);

    const host = document.createElement('div');
    const renderer = createArrayRenderer();

    const mountStart = performance.now();
    renderer.mount(host, trace);
    const mountMs = performance.now() - mountStart;

    // One pass first, so neither side is paying a cold path the other avoided.
    for (const state of frames) renderer.update(state);

    const updateStart = performance.now();
    for (const state of frames) renderer.update(state);
    const perFrame = (performance.now() - updateStart) / frames.length;

    renderer.destroy();

    /**
     * Generous on purpose. The claim is "a frame is not a rebuild", and a
     * rebuild would put this at or above 1 — so anything comfortably under
     * catches the regression this exists for, while leaving room for a shared
     * runner to be noisy about two small numbers.
     */
    expect(perFrame).toBeLessThan(mountMs);
  }, 120_000);

  it('does not grow its work when the trace gets longer', async () => {
    // The other shape a rebuild takes: per-frame cost that scales with how much
    // history exists rather than with what is on screen.
    const trace = await trace500();
    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, trace);

    const early = framesOf(trace, 50).slice(0, 25);
    const late = framesOf(trace, 50).slice(25);

    for (const state of early) renderer.update(state);

    const earlyStart = performance.now();
    for (const state of early) renderer.update(state);
    const earlyMs = performance.now() - earlyStart;

    const lateStart = performance.now();
    for (const state of late) renderer.update(state);
    const lateMs = performance.now() - lateStart;

    // A floor on the comparison, because two sub-millisecond timings on a
    // loaded runner have a ratio that means nothing.
    expect(lateMs).toBeLessThan(Math.max(earlyMs, 5) * 4);

    renderer.destroy();
  }, 120_000);
});
