import { describe, expect, it } from 'vitest';
import { analyzeTopology } from '@/lib/system-design/topology';
import { ARCHITECTURE_PRESETS, COMPONENT_TEMPLATES } from '@/lib/system-design/canvas-presets';
import type { CanvasEdge, CanvasNode } from '@/lib/system-design/canvas-types';

describe('Architecture Canvas Presets (C1)', () => {
  it('defines all required reference architecture presets', () => {
    expect(ARCHITECTURE_PRESETS['url-shortener']).toBeDefined();
    expect(ARCHITECTURE_PRESETS['rate-limiter']).toBeDefined();
    expect(ARCHITECTURE_PRESETS['video-streaming']).toBeDefined();
  });

  it('has valid node and edge connections in presets', () => {
    for (const [key, preset] of Object.entries(ARCHITECTURE_PRESETS)) {
      expect(preset.nodes.length, key).toBeGreaterThanOrEqual(3);
      expect(preset.edges.length, key).toBeGreaterThanOrEqual(2);

      const nodeIds = new Set(preset.nodes.map((n) => n.id));
      for (const edge of preset.edges) {
        expect(nodeIds.has(edge.sourceId), `${key}: edge source ${edge.sourceId}`).toBe(true);
        expect(nodeIds.has(edge.targetId), `${key}: edge target ${edge.targetId}`).toBe(true);
      }
    }
  });

  it('supplies templates with valid categories and icons', () => {
    expect(COMPONENT_TEMPLATES.length).toBeGreaterThanOrEqual(15);
    for (const t of COMPONENT_TEMPLATES) {
      expect(t.type.length).toBeGreaterThan(1);
      expect(t.label.length).toBeGreaterThan(1);
      expect(t.description.length).toBeGreaterThan(5);
    }
  });
});

describe('Topology Analyzer Diagnostics', () => {
  it('flags Single Point of Failure (SPOF) on an un-replicated primary database', () => {
    const nodes: CanvasNode[] = [
      {
        id: 'client-1',
        type: 'web-client',
        label: 'Client',
        category: 'client',
        x: 0,
        y: 0,
        icon: 'globe',
        metrics: { qps: 100 },
      },
      {
        id: 'lb-1',
        type: 'load-balancer',
        label: 'LB',
        category: 'edge',
        x: 100,
        y: 0,
        icon: 'split',
        metrics: {},
      },
      {
        id: 'app-1',
        type: 'app-server',
        label: 'App',
        category: 'compute',
        x: 200,
        y: 0,
        icon: 'server',
        metrics: { latencyMs: 10 },
      },
      {
        id: 'db-1',
        type: 'postgres-primary',
        label: 'Primary DB',
        category: 'database',
        x: 300,
        y: 0,
        icon: 'database',
        metrics: { replicationCount: 1 },
      },
    ];

    const edges: CanvasEdge[] = [
      { id: 'e1', sourceId: 'client-1', targetId: 'lb-1' },
      { id: 'e2', sourceId: 'lb-1', targetId: 'app-1' },
      { id: 'e3', sourceId: 'app-1', targetId: 'db-1' },
    ];

    const report = analyzeTopology(nodes, edges);
    expect(report.stats.singlePointsOfFailure).toBeGreaterThan(0);
    expect(report.diagnostics.some((d) => d.title.includes('Single Point of Failure'))).toBe(true);
  });

  it('detects missing in-memory cache on read-heavy database architectures', () => {
    const nodes: CanvasNode[] = [
      { id: 'c1', type: 'web-client', label: 'Client', category: 'client', x: 0, y: 0, icon: 'globe', metrics: { qps: 20000 } },
      { id: 'lb', type: 'load-balancer', label: 'LB', category: 'edge', x: 100, y: 0, icon: 'split', metrics: {} },
      { id: 'app', type: 'app-server', label: 'App', category: 'compute', x: 200, y: 0, icon: 'server', metrics: {} },
      { id: 'db', type: 'postgres-primary', label: 'DB', category: 'database', x: 300, y: 0, icon: 'database', metrics: { replicationCount: 2 } },
    ];
    const edges: CanvasEdge[] = [
      { id: 'e1', sourceId: 'c1', targetId: 'lb' },
      { id: 'e2', sourceId: 'lb', targetId: 'app' },
      { id: 'e3', sourceId: 'app', targetId: 'db' },
    ];

    const report = analyzeTopology(nodes, edges);
    expect(report.stats.hasCaches).toBe(false);
    expect(report.diagnostics.some((d) => d.title.includes('Missing In-Memory Caching'))).toBe(true);
  });

  it('evaluates resilient architectures with success state', () => {
    const preset = ARCHITECTURE_PRESETS['url-shortener'];
    const report = analyzeTopology(preset.nodes, preset.edges);

    expect(report.stats.hasCaches).toBe(true);
    expect(report.stats.hasReplicas).toBe(true);
    expect(report.stats.estimatedP99LatencyMs).toBeGreaterThan(0);
  });

  it('warns when high-latency worker is triggered synchronously without queue', () => {
    const nodes: CanvasNode[] = [
      { id: 'c', type: 'web-client', label: 'Client', category: 'client', x: 0, y: 0, icon: 'globe', metrics: {} },
      { id: 'lb', type: 'load-balancer', label: 'LB', category: 'edge', x: 100, y: 0, icon: 'split', metrics: {} },
      { id: 'w', type: 'async-worker', label: 'Transcoder', category: 'compute', x: 200, y: 0, icon: 'cog', metrics: { latencyMs: 5000 } },
    ];
    const edges: CanvasEdge[] = [
      { id: 'e1', sourceId: 'c', targetId: 'lb', protocol: 'https' },
      { id: 'e2', sourceId: 'lb', targetId: 'w', protocol: 'https' },
    ];

    const report = analyzeTopology(nodes, edges);
    expect(report.diagnostics.some((d) => d.title.includes('Synchronous Long-Running Workload'))).toBe(true);
  });
});
