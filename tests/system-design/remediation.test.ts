import { describe, expect, it } from 'vitest';
import { generateScorecardRemediations } from '@/lib/system-design/remediation';
import { findConcept } from '@/content/concepts';
import { ARCHITECTURE_PRESETS } from '@/lib/system-design/canvas-presets';
import { simulateArchitecture } from '@/lib/system-design/simulation';
import type { ScenarioLab } from '@/content/schema';
import type { Scorecard as ScorecardData } from '@/lib/system-design/rubric';

describe('Track 5: Scorecard-to-Remediation Feedback Loop', () => {
  function makeScorecard(
    weakest: ScorecardData['weakest'],
    dimensions: ScorecardData['dimensions'],
    met = 0,
    total = dimensions.length,
  ): ScorecardData {
    return {
      steps: [],
      dimensions,
      met,
      total,
      answered: total,
      weakest,
    };
  }

  const dummyLab: ScenarioLab = {
    slug: 'url-shortener',
    title: 'Design a URL Shortener',
    summary: 'High-throughput URL redirection service.',
    difficulty: 'medium',
    topics: ['caching', 'databases', 'scaling'],
    timeBudgetMinutes: 30,
    brief: 'Design a scalable URL shortener.',
    takeaway: 'Scale reads with caching and partitioning.',
    steps: [
      {
        slug: 'scale-step',
        kind: 'select',
        multiple: false,
        dimension: 'scaling',
        prompt: 'How to scale read traffic?',
        concepts: ['caching', 'cache-aside'],
        options: [{ label: 'Cache-aside with Redis', correct: true, reason: 'Fast read path.' }],
      },
    ],
  };

  it('generates targeted remediation recommendations for weak dimensions', () => {
    const score = makeScorecard(['scaling', 'bottleneck'], [
      { dimension: 'scaling', met: 0, total: 1 },
      { dimension: 'bottleneck', met: 0, total: 1 },
      { dimension: 'requirements', met: 1, total: 1 },
    ], 1, 3);

    const remediations = generateScorecardRemediations(dummyLab, score);
    expect(remediations.length).toBe(2);

    const scalingRem = remediations.find((r) => r.dimension === 'scaling');
    expect(scalingRem).toBeDefined();
    expect(scalingRem!.diagnostic.length).toBeGreaterThanOrEqual(20);
    expect(scalingRem!.rootCause.length).toBeGreaterThanOrEqual(20);
    expect(scalingRem!.actionAdvice.length).toBeGreaterThanOrEqual(20);
    expect(scalingRem!.conceptSlugs).toContain('cache-aside');
    expect(scalingRem!.suggestedSimConfig.globalQps).toBeGreaterThan(10000);

    const bottleneckRem = remediations.find((r) => r.dimension === 'bottleneck');
    expect(bottleneckRem).toBeDefined();
    expect(bottleneckRem!.conceptSlugs).toContain('message-queue');
  });

  it('links every recommendation to concepts with complete 10-dimension specs', () => {
    const dimensions = ['scaling', 'bottleneck', 'data-model', 'estimation', 'requirements'] as const;

    for (const dim of dimensions) {
      const score = makeScorecard([dim], [{ dimension: dim, met: 0, total: 1 }]);

      const remediations = generateScorecardRemediations(dummyLab, score);
      expect(remediations.length).toBeGreaterThan(0);

      for (const rem of remediations) {
        expect(rem.conceptSlugs.length).toBeGreaterThan(0);
        for (const slug of rem.conceptSlugs) {
          const concept = findConcept(slug);
          expect(concept, `Remediation concept ${slug} must exist`).toBeDefined();
          expect(
            concept?.dimensions,
            `Remediation concept ${slug} must have 10-dimension architectural reference`,
          ).toBeDefined();
        }
      }
    }
  });

  it('provides executable simulation configs that run cleanly against the architecture canvas', () => {
    const score = makeScorecard(['scaling'], [{ dimension: 'scaling', met: 0, total: 1 }]);

    const remediations = generateScorecardRemediations(dummyLab, score);
    const arch = ARCHITECTURE_PRESETS['url-shortener'];
    expect(arch).toBeDefined();

    for (const rem of remediations) {
      const simReport = simulateArchitecture(arch, rem.suggestedSimConfig);
      expect(simReport).toBeDefined();
      expect(simReport.effectiveQps).toBeGreaterThan(0);
      expect(Object.keys(simReport.nodeMetrics).length).toBeGreaterThan(0);
    }
  });

  it('provides default stretch remediation when candidate gets a perfect score', () => {
    const perfectScore = makeScorecard([], [
      { dimension: 'requirements', met: 1, total: 1 },
      { dimension: 'scaling', met: 2, total: 2 },
      { dimension: 'bottleneck', met: 2, total: 2 },
    ], 5, 5);

    const remediations = generateScorecardRemediations(dummyLab, perfectScore);
    expect(remediations.length).toBeGreaterThan(0);
  });
});
