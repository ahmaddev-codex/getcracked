import { writeFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { runJavaScript } from '@/lib/runtime/javascript';
import { runPython, getPyodide } from '@/lib/runtime/python';

/**
 * Spike measurements (T0.2). Kept as a test rather than a throwaway script so
 * the numbers stay reproducible and a catastrophic regression fails CI.
 *
 * Bounds are deliberately loose — this guards against order-of-magnitude
 * regressions, not against normal machine-to-machine variance. The precise
 * figures live in docs/spikes/runtime-python-js.md.
 */

const TIMEOUT = 180_000;
const WARM_RUNS = 20;

const JS_SUM = `
function total(nums) {
  let s = 0;
  for (let i = 0; i < nums.length; i++) { s += nums[i]; }
  return s;
}
`;

const PY_SUM = `
def total(nums):
    s = 0
    for i in range(len(nums)):
        s += nums[i]
    return s
`;

const SMALL = Array.from({ length: 10 }, (_, i) => i);
/** PRD H5 caps visualized arrays at 500 elements. */
const AT_CAP = Array.from({ length: 500 }, (_, i) => i);

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

const report: string[] = [];

describe('runtime measurements', () => {
  it(
    'measures QuickJS first-load and warm per-run latency separately',
    async () => {
      const coldStart = performance.now();
      await runJavaScript({ source: JS_SUM, entry: 'total', args: [SMALL] });
      const cold = performance.now() - coldStart;

      const warm: number[] = [];
      for (let i = 0; i < WARM_RUNS; i++) {
        const t = performance.now();
        await runJavaScript({ source: JS_SUM, entry: 'total', args: [SMALL] });
        warm.push(performance.now() - t);
      }

      report.push(`QuickJS  cold=${cold.toFixed(0)}ms  warm(median)=${median(warm).toFixed(1)}ms`);
      expect(cold).toBeLessThan(10_000);
      expect(median(warm)).toBeLessThan(500);
    },
    TIMEOUT,
  );

  it(
    'measures Pyodide first-load and warm per-run latency separately',
    async () => {
      const coldStart = performance.now();
      await getPyodide();
      const cold = performance.now() - coldStart;

      const warm: number[] = [];
      for (let i = 0; i < WARM_RUNS; i++) {
        const t = performance.now();
        await runPython({ source: PY_SUM, entry: 'total', args: [SMALL] });
        warm.push(performance.now() - t);
      }

      report.push(`Pyodide  cold=${cold.toFixed(0)}ms  warm(median)=${median(warm).toFixed(1)}ms`);
      expect(cold).toBeLessThan(120_000);
      expect(median(warm)).toBeLessThan(2_000);
    },
    TIMEOUT,
  );

  it(
    'measures the trace payload for a 500-element array at the H5 cap',
    async () => {
      const js = await runJavaScript({
        source: JS_SUM,
        entry: 'total',
        args: [AT_CAP],
        trace: true,
        maxEvents: 100_000,
      });
      const py = await runPython({
        source: PY_SUM,
        entry: 'total',
        args: [AT_CAP],
        trace: true,
        maxEvents: 100_000,
      });

      const jsBytes = JSON.stringify(js.events).length;
      const pyBytes = JSON.stringify(py.events).length;

      report.push(
        `500-elem trace  JS: ${js.events.length} events / ${(jsBytes / 1024 / 1024).toFixed(1)}MB` +
          `   PY: ${py.events.length} events / ${(pyBytes / 1024 / 1024).toFixed(1)}MB`,
      );

      expect(js.events.length).toBeGreaterThan(0);
      expect(py.events.length).toBeGreaterThan(0);
    },
    TIMEOUT,
  );

  it(
    'measures the tracing overhead multiplier for both runtimes',
    async () => {
      const timeIt = async (fn: () => Promise<unknown>) => {
        const runs: number[] = [];
        for (let i = 0; i < 10; i++) {
          const t = performance.now();
          await fn();
          runs.push(performance.now() - t);
        }
        return median(runs);
      };

      const jsOff = await timeIt(() =>
        runJavaScript({ source: JS_SUM, entry: 'total', args: [SMALL] }),
      );
      const jsOn = await timeIt(() =>
        runJavaScript({ source: JS_SUM, entry: 'total', args: [SMALL], trace: true }),
      );
      const pyOff = await timeIt(() => runPython({ source: PY_SUM, entry: 'total', args: [SMALL] }));
      const pyOn = await timeIt(() =>
        runPython({ source: PY_SUM, entry: 'total', args: [SMALL], trace: true }),
      );

      report.push(
        `trace overhead  JS: ${jsOff.toFixed(1)}ms -> ${jsOn.toFixed(1)}ms (${(jsOn / jsOff).toFixed(1)}x)` +
          `   PY: ${pyOff.toFixed(1)}ms -> ${pyOn.toFixed(1)}ms (${(pyOn / pyOff).toFixed(1)}x)`,
      );

      expect(jsOn).toBeGreaterThan(0);
      expect(pyOn).toBeGreaterThan(0);

      // Written to a file rather than stdout so the figures can be lifted
      // verbatim into the spike writeup instead of retyped from a scrollback.
      const out = process.env.MEASURE_OUT;
      if (out) writeFileSync(out, report.join('\n') + '\n');
    },
    TIMEOUT,
  );
});
