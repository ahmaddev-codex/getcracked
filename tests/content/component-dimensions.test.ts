import { describe, expect, it } from 'vitest';
import { findConcept, getAllConcepts } from '@/content/concepts';
import { tenDimensionsSchema } from '@/content/concepts/schema';
import { COMPONENT_TEMPLATES } from '@/lib/system-design/canvas-presets';

describe('Track 4: 10-Dimension Component Reference Standardization', () => {
  const CORE_10D_COMPONENTS = [
    'load-balancer',
    'cdn',
    'api-gateway',
    'sql-vs-nosql',
    'sharding',
    'cache-aside',
    'message-queue',
    'pub-sub',
    'circuit-breaker',
    'dead-letter',
    'rate-limiting',
    'read-replicas',
  ] as const;

  it('authors complete 10-dimension profiles for all core components', () => {
    for (const slug of CORE_10D_COMPONENTS) {
      const concept = findConcept(slug);
      expect(concept, `Expected concept to exist for slug: ${slug}`).toBeDefined();
      expect(
        concept?.dimensions,
        `Expected concept ${slug} to have 10-dimension architectural reference`,
      ).toBeDefined();

      const parseResult = tenDimensionsSchema.safeParse(concept?.dimensions);
      expect(
        parseResult.success,
        `Concept ${slug} failed 10D schema validation: ${JSON.stringify(parseResult.error?.issues)}`,
      ).toBe(true);
    }
  });

  it('enforces rigorous content quality across all 10 dimensions', () => {
    const conceptsWith10D = getAllConcepts().filter((c) => c.dimensions !== undefined);
    expect(conceptsWith10D.length).toBeGreaterThanOrEqual(CORE_10D_COMPONENTS.length);

    for (const concept of conceptsWith10D) {
      const dims = concept.dimensions!;

      // 01 Problem
      expect(dims.problem.length, `${concept.slug} problem length`).toBeGreaterThanOrEqual(25);
      // 02 Why it happens
      expect(dims.whyItHappens.length, `${concept.slug} whyItHappens length`).toBeGreaterThanOrEqual(25);
      // 03 Primitive solution
      expect(dims.primitiveSolution.length, `${concept.slug} primitiveSolution length`).toBeGreaterThanOrEqual(20);
      // 04 Scale limit
      expect(dims.scaleLimit.length, `${concept.slug} scaleLimit length`).toBeGreaterThanOrEqual(25);
      // 05 Component
      expect(dims.component.length, `${concept.slug} component length`).toBeGreaterThanOrEqual(15);

      // 06 Trade-offs (Gains & Sacrifices)
      expect(dims.tradeOffs.gains.length, `${concept.slug} gains count`).toBeGreaterThanOrEqual(2);
      expect(dims.tradeOffs.sacrifices.length, `${concept.slug} sacrifices count`).toBeGreaterThanOrEqual(2);
      for (const gain of dims.tradeOffs.gains) {
        expect(gain.length).toBeGreaterThanOrEqual(10);
      }
      for (const sacrifice of dims.tradeOffs.sacrifices) {
        expect(sacrifice.length).toBeGreaterThanOrEqual(10);
      }

      // 07 Failure modes
      expect(dims.failureModes.length, `${concept.slug} failureModes length`).toBeGreaterThanOrEqual(30);

      // 08 Alternatives
      expect(dims.alternatives.length, `${concept.slug} alternatives count`).toBeGreaterThanOrEqual(2);

      // 09 Interview signals
      expect(dims.interviewSignal.length, `${concept.slug} interviewSignal length`).toBeGreaterThanOrEqual(30);

      // 10 Real systems
      expect(dims.realSystem.length, `${concept.slug} realSystem length`).toBeGreaterThanOrEqual(20);
    }
  });

  it('links canvas palette component templates to valid concepts', () => {
    for (const template of COMPONENT_TEMPLATES) {
      if (template.conceptSlug) {
        const concept = findConcept(template.conceptSlug);
        expect(
          concept,
          `Template "${template.label}" (${template.type}) points to invalid conceptSlug: ${template.conceptSlug}`,
        ).toBeDefined();
      }
    }
  });
});
