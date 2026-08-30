import { describe, expect, it } from 'vitest';
import { runTestSpec } from '@/content/test-runner';
import { SANDBOX_PRESETS } from '@/lib/sandbox-presets';
import type { Language } from '@/content/schema';

/**
 * The sandbox presets, executed (B7).
 *
 * A preset is the page's first impression, and the failure mode is silent: it
 * loads, it runs, and it animates nothing — which reads as the visualizer being
 * broken rather than as the example being badly chosen. So each one is run the
 * way the page runs it, in both languages, and is required to produce something
 * drawable.
 *
 * The same check the lesson walkthroughs get in `scripts/check-content.ts`, for
 * the same reason. These are not authored content and do not go through that
 * gate, but they are shown to a learner and so they earn the same bar.
 */

const LANGUAGES: Language[] = ['javascript', 'python'];

describe.each(SANDBOX_PRESETS.map((p) => [p.id, p] as const))('%s', (_id, preset) => {
  describe.each(LANGUAGES)('%s', (language) => {
    it('runs the way the sandbox runs it', async () => {
      const result = await runTestSpec({
        // Exactly what Sandbox.tsx builds: one case, nothing expected, because
        // nothing is being graded.
        spec: { entry: preset.entry, cases: [{ args: preset.args, expected: null, hidden: false }] },
        source: preset.source[language],
        language,
        trace: true,
      });

      expect(result.timedOut).toBe(false);
      expect(result.cases[0]?.error).toBeUndefined();
    });

    it('produces a trace with something to draw', async () => {
      const result = await runTestSpec({
        spec: { entry: preset.entry, cases: [{ args: preset.args, expected: null, hidden: false }] },
        source: preset.source[language],
        language,
        trace: true,
      });

      expect(result.traceDegraded).toBe(false);
      expect(result.trace?.events.length ?? 0).toBeGreaterThan(8);
      // A collection a renderer can actually draw. Without one the page shows
      // playback controls over an empty frame.
      expect(
        result.trace?.collections.some((c) => ['array', 'grid', 'map'].includes(c.kind)),
      ).toBe(true);
    });
  });

  it('computes the same thing in both languages', async () => {
    // The switcher re-runs rather than relabels, so two implementations
    // disagreeing would mean one preset wearing two behaviours.
    const results = await Promise.all(
      LANGUAGES.map(async (language) => {
        const run = await runTestSpec({
          spec: {
            entry: preset.entry,
            cases: [{ args: preset.args, expected: null, hidden: false }],
          },
          source: preset.source[language],
          language,
        });
        return JSON.stringify(run.cases[0]?.actual ?? null);
      }),
    );

    expect(new Set(results).size, `got ${results.join(' vs ')}`).toBe(1);
  });
});
