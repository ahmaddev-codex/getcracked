import { describe, expect, it } from 'vitest';
import {
  simulateArchitecture,
  type SimulationConfig,
} from '@/lib/system-design/simulation';
import type {
  CanvasArchitecture,
  CanvasNode,
  CanvasEdge,
} from '@/lib/system-design/canvas-types';

/**
 * Helper: build a minimal architecture for testing.
 */
function buildTestArchitecture(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
): CanvasArchitecture {
  return { nodes, edges, title: 'Test Architecture' };
}

function makeNode(
  id: string,
  type: string,
  opts: Partial<CanvasNode> = {},
): CanvasNode {
  return {
    id,
    type,
    label: opts.label ?? id,
    category: opts.category ?? 'compute',
    x: opts.x ?? 0,
    y: opts.y ?? 0,
    icon: opts.icon ?? 'server',
    metrics: opts.metrics ?? {},
  };
}

function makeEdge(
  id: string,
  sourceId: string,
  targetId: string,
): CanvasEdge {
  return { id, sourceId, targetId, protocol: 'https' };
}

// ---------------------------------------------------------------------------
// Test Suite
// ---------------------------------------------------------------------------

describe('System Design Dynamic Simulation Engine', () => {
  const baseConfig: SimulationConfig = {
    globalQps: 10_000,
    profile: 'steady',
    activeChaos: [],
  };

  // -- Healthy baseline architecture ----------------------------------------

  describe('baseline healthy simulation', () => {
    const arch = buildTestArchitecture(
      [
        makeNode('client-1', 'client'),
        makeNode('lb-1', 'load-balancer'),
        makeNode('app-1', 'app-server'),
        makeNode('db-1', 'database-primary'),
      ],
      [
        makeEdge('e1', 'client-1', 'lb-1'),
        makeEdge('e2', 'lb-1', 'app-1'),
        makeEdge('e3', 'app-1', 'db-1'),
      ],
    );

    it('returns a valid SimulationReport with expected shape', () => {
      const report = simulateArchitecture(arch, baseConfig);

      expect(report).toBeDefined();
      expect(report.globalQps).toBe(10_000);
      expect(report.effectiveQps).toBeGreaterThan(0);
      expect(['healthy', 'warning', 'critical', 'crashed']).toContain(
        report.overallHealth,
      );
      expect(report.p99LatencyMs).toBeGreaterThanOrEqual(0);
      expect(report.availabilityPct).toBeGreaterThanOrEqual(0);
      expect(report.availabilityPct).toBeLessThanOrEqual(100);
      expect(typeof report.sloViolated).toBe('boolean');
    });

    it('produces per-node metrics for every node', () => {
      const report = simulateArchitecture(arch, baseConfig);

      for (const node of arch.nodes) {
        const m = report.nodeMetrics[node.id];
        expect(m).toBeDefined();
        expect(m!.health).toBeDefined();
        expect(m!.qps).toBeGreaterThanOrEqual(0);
        expect(m!.cpuPct).toBeGreaterThanOrEqual(0);
      }
    });

    it('produces per-edge metrics for every edge', () => {
      const report = simulateArchitecture(arch, baseConfig);

      for (const edge of arch.edges) {
        const m = report.edgeMetrics[edge.id];
        expect(m).toBeDefined();
        expect(m!.qps).toBeGreaterThanOrEqual(0);
      }
    });

    it('is healthy at low QPS', () => {
      const lowConfig: SimulationConfig = {
        globalQps: 1_000,
        profile: 'steady',
        activeChaos: [],
      };
      const report = simulateArchitecture(arch, lowConfig);

      expect(report.overallHealth).toBe('healthy');
      expect(report.bottlenecks).toHaveLength(0);
      expect(report.remediationPrompts).toHaveLength(0);
    });
  });

  // -- Traffic profiles -----------------------------------------------------

  describe('traffic profiles', () => {
    const arch = buildTestArchitecture(
      [
        makeNode('client-1', 'client'),
        makeNode('app-1', 'app-server'),
      ],
      [makeEdge('e1', 'client-1', 'app-1')],
    );

    it('spiky profile increases effective ingress QPS', () => {
      const steadyReport = simulateArchitecture(arch, {
        ...baseConfig,
        profile: 'steady',
      });
      const spikyReport = simulateArchitecture(arch, {
        ...baseConfig,
        profile: 'spiky',
      });

      expect(spikyReport.effectiveQps).toBeGreaterThanOrEqual(
        steadyReport.effectiveQps,
      );
    });

    it.each(['read-heavy', 'write-heavy'] as const)(
      '%s profile produces a valid report',
      (profile) => {
        const report = simulateArchitecture(arch, {
          ...baseConfig,
          profile,
        });
        expect(report).toBeDefined();
        expect(report.effectiveQps).toBeGreaterThan(0);
      },
    );
  });

  // -- High load saturation -------------------------------------------------

  describe('high load saturation and bottleneck detection', () => {
    const arch = buildTestArchitecture(
      [
        makeNode('client-1', 'client'),
        makeNode('app-1', 'app-server'), // 10k capacity
      ],
      [makeEdge('e1', 'client-1', 'app-1')],
    );

    it('degrades health when QPS significantly exceeds capacity', () => {
      const report = simulateArchitecture(arch, {
        ...baseConfig,
        globalQps: 100_000, // app-server only handles ~10k
      });

      expect(['warning', 'critical', 'crashed']).toContain(
        report.overallHealth,
      );
    });

    it('detects bottlenecks when nodes are over capacity', () => {
      const report = simulateArchitecture(arch, {
        ...baseConfig,
        globalQps: 100_000,
      });

      expect(report.bottlenecks.length).toBeGreaterThan(0);
    });

    it('generates remediation prompts for saturated nodes', () => {
      const report = simulateArchitecture(arch, {
        ...baseConfig,
        globalQps: 100_000,
      });

      expect(report.remediationPrompts.length).toBeGreaterThan(0);
      const prompt = report.remediationPrompts[0]!;
      expect(prompt.question).toBeTruthy();
      expect(prompt.options.length).toBeGreaterThan(0);

      // Each option has a callable action
      for (const option of prompt.options) {
        expect(typeof option.action).toBe('function');
        expect(option.label).toBeTruthy();
        expect(option.description).toBeTruthy();
        expect(option.impactSummary).toBeTruthy();
      }
    });

    it('remediation actions produce a valid architecture', () => {
      const report = simulateArchitecture(arch, {
        ...baseConfig,
        globalQps: 100_000,
      });

      if (report.remediationPrompts.length > 0) {
        const option = report.remediationPrompts[0]!.options[0]!;
        const updatedArch = option.action(arch);

        expect(updatedArch).toBeDefined();
        expect(updatedArch.nodes).toBeDefined();
        expect(updatedArch.edges).toBeDefined();
        expect(updatedArch.nodes.length).toBeGreaterThanOrEqual(
          arch.nodes.length,
        );
      }
    });
  });

  // -- Chaos injection events -----------------------------------------------

  describe('chaos injection events', () => {
    const arch = buildTestArchitecture(
      [
        makeNode('client-1', 'client', { category: 'edge' }),
        makeNode('lb-1', 'load-balancer', { category: 'edge' }),
        makeNode('cache-1', 'cache-cluster', { category: 'cache' }),
        makeNode('app-1', 'app-server', { category: 'compute' }),
        makeNode('db-1', 'database-primary', { category: 'database' }),
        makeNode('queue-1', 'message-queue', { category: 'queue' }),
        makeNode('worker-1', 'worker-fleet', { category: 'compute' }),
      ],
      [
        makeEdge('e1', 'client-1', 'lb-1'),
        makeEdge('e2', 'lb-1', 'app-1'),
        makeEdge('e3', 'app-1', 'cache-1'),
        makeEdge('e4', 'app-1', 'db-1'),
        makeEdge('e5', 'app-1', 'queue-1'),
        makeEdge('e6', 'queue-1', 'worker-1'),
      ],
    );

    it('primary-db-crash crashes database primary nodes', () => {
      const report = simulateArchitecture(arch, {
        ...baseConfig,
        activeChaos: ['primary-db-crash'],
      });

      const dbMetrics = report.nodeMetrics['db-1'];
      expect(dbMetrics).toBeDefined();
      expect(dbMetrics!.health).toBe('crashed');
    });

    it('cache-stampede degrades cache and increases db load', () => {
      const normalReport = simulateArchitecture(arch, baseConfig);
      const stampedeReport = simulateArchitecture(arch, {
        ...baseConfig,
        activeChaos: ['cache-stampede'],
      });

      // DB should see higher load during stampede
      const normalDbQps = normalReport.nodeMetrics['db-1']?.qps ?? 0;
      const stampedeDbQps = stampedeReport.nodeMetrics['db-1']?.qps ?? 0;
      expect(stampedeDbQps).toBeGreaterThanOrEqual(normalDbQps);
    });

    it('slow-consumer-lag degrades queue node health', () => {
      const report = simulateArchitecture(arch, {
        ...baseConfig,
        activeChaos: ['slow-consumer-lag'],
      });

      const queueMetrics = report.nodeMetrics['queue-1'];
      expect(queueMetrics).toBeDefined();
      expect(['warning', 'critical', 'crashed']).toContain(
        queueMetrics!.health,
      );
      expect(queueMetrics!.queueLag).toBeGreaterThan(0);
    });

    it('network-partition produces degraded overall health', () => {
      const report = simulateArchitecture(arch, {
        ...baseConfig,
        activeChaos: ['network-partition'],
      });

      expect(['warning', 'critical', 'crashed']).toContain(
        report.overallHealth,
      );
    });

    it('multiple simultaneous chaos events compound degradation', () => {
      const singleChaosReport = simulateArchitecture(arch, {
        ...baseConfig,
        activeChaos: ['cache-stampede'],
      });
      const multiChaosReport = simulateArchitecture(arch, {
        ...baseConfig,
        activeChaos: ['primary-db-crash', 'cache-stampede', 'slow-consumer-lag'],
      });

      // More chaos → worse or equal health
      const healthOrder = { healthy: 0, warning: 1, critical: 2, crashed: 3 };
      expect(healthOrder[multiChaosReport.overallHealth]).toBeGreaterThanOrEqual(
        healthOrder[singleChaosReport.overallHealth],
      );
    });
  });

  // -- SLO violation detection -----------------------------------------------

  describe('SLO violation detection', () => {
    const arch = buildTestArchitecture(
      [
        makeNode('client-1', 'client'),
        makeNode('app-1', 'app-server'),
      ],
      [makeEdge('e1', 'client-1', 'app-1')],
    );

    it('does not flag SLO violation at low load', () => {
      const report = simulateArchitecture(arch, {
        globalQps: 1_000,
        profile: 'steady',
        activeChaos: [],
        sloTargetP99Ms: 200,
        sloTargetAvailabilityPct: 99.9,
      });

      expect(report.sloViolated).toBe(false);
    });

    it('flags SLO violation when latency exceeds target', () => {
      const report = simulateArchitecture(arch, {
        globalQps: 200_000, // Way beyond 10k capacity
        profile: 'spiky',
        activeChaos: ['cache-stampede'],
        sloTargetP99Ms: 50,
        sloTargetAvailabilityPct: 99.99,
      });

      expect(report.sloViolated).toBe(true);
    });
  });

  // -- Edge cases and empty architecture ------------------------------------

  describe('edge cases', () => {
    it('handles empty architecture without error', () => {
      const emptyArch = buildTestArchitecture([], []);
      const report = simulateArchitecture(emptyArch, baseConfig);

      expect(report).toBeDefined();
      expect(report.overallHealth).toBe('healthy');
      expect(Object.keys(report.nodeMetrics)).toHaveLength(0);
    });

    it('handles single node with no edges', () => {
      const singleArch = buildTestArchitecture(
        [makeNode('solo-1', 'app-server')],
        [],
      );
      const report = simulateArchitecture(singleArch, baseConfig);

      expect(report).toBeDefined();
      expect(report.nodeMetrics['solo-1']).toBeDefined();
    });

    it('handles edges with missing node references gracefully', () => {
      const brokenArch = buildTestArchitecture(
        [makeNode('node-1', 'app-server')],
        [makeEdge('e1', 'node-1', 'nonexistent-node')],
      );
      // Should not throw
      expect(() =>
        simulateArchitecture(brokenArch, baseConfig),
      ).not.toThrow();
    });
  });
});
