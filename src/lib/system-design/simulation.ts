import type { CanvasArchitecture, CanvasEdge, CanvasNode } from './canvas-types';

/**
 * System Design Dynamic Simulation Engine ("What Breaks Next?").
 *
 * Implements a discrete-event traffic propagation model, queuing theory
 * latency degradation (M/M/1), live chaos injections, and Socratic
 * remediation decision trees.
 */

export type TrafficProfile = 'steady' | 'spiky' | 'read-heavy' | 'write-heavy';

export type ChaosEvent =
  | 'primary-db-crash'
  | 'cache-stampede'
  | 'slow-consumer-lag'
  | 'network-partition'
  | 'ddos-flood';

export type NodeHealth = 'healthy' | 'warning' | 'critical' | 'crashed';

export interface NodeSimulationMetrics {
  health: NodeHealth;
  qps: number;
  capacityQps: number;
  p99LatencyMs: number;
  baseLatencyMs: number;
  cpuPct: number;
  memoryPct: number;
  errorRatePct: number;
  queueLag: number;
  failureReason?: string;
}

export interface EdgeSimulationMetrics {
  qps: number;
  latencyMs: number;
  errorRatePct: number;
  saturated: boolean;
}

export interface RemediationOption {
  id: string;
  label: string;
  description: string;
  impactSummary: string;
  action: (arch: CanvasArchitecture) => CanvasArchitecture;
}

export interface RemediationPrompt {
  id: string;
  nodeId: string;
  nodeLabel: string;
  triggerReason: string;
  question: string;
  options: RemediationOption[];
}

export interface SimulationConfig {
  globalQps: number;
  profile: TrafficProfile;
  activeChaos: ChaosEvent[];
  sloTargetP99Ms?: number;
  sloTargetAvailabilityPct?: number;
}

export interface SimulationReport {
  globalQps: number;
  effectiveQps: number;
  overallHealth: NodeHealth;
  p99LatencyMs: number;
  availabilityPct: number;
  sloViolated: boolean;
  activeChaos: ChaosEvent[];
  nodeMetrics: Record<string, NodeSimulationMetrics>;
  edgeMetrics: Record<string, EdgeSimulationMetrics>;
  bottlenecks: Array<{ nodeId: string; label: string; reason: string; severity: NodeHealth }>;
  remediationPrompts: RemediationPrompt[];
}

/**
 * Standard default capacity benchmarks per component type (in QPS per node instance).
 */
const DEFAULT_CAPACITIES: Record<string, { qps: number; baseLatencyMs: number }> = {
  client: { qps: 1_000_000, baseLatencyMs: 1 },
  mobile: { qps: 1_000_000, baseLatencyMs: 1 },
  'dns-cdn': { qps: 200_000, baseLatencyMs: 5 },
  'api-gateway': { qps: 50_000, baseLatencyMs: 8 },
  'load-balancer': { qps: 100_000, baseLatencyMs: 4 },
  'app-server': { qps: 10_000, baseLatencyMs: 25 },
  microservice: { qps: 15_000, baseLatencyMs: 20 },
  'cache-cluster': { qps: 80_000, baseLatencyMs: 2 },
  'database-primary': { qps: 5_000, baseLatencyMs: 35 },
  'database-replica': { qps: 8_000, baseLatencyMs: 15 },
  'nosql-cluster': { qps: 25_000, baseLatencyMs: 12 },
  'object-storage': { qps: 30_000, baseLatencyMs: 40 },
  'message-queue': { qps: 40_000, baseLatencyMs: 5 },
  'worker-fleet': { qps: 8_000, baseLatencyMs: 80 },
  'circuit-breaker': { qps: 100_000, baseLatencyMs: 1 },
  'rate-limiter': { qps: 75_000, baseLatencyMs: 2 },
};

/**
 * Simulates real-time system performance, load propagation, and failure modes.
 */
export function simulateArchitecture(
  arch: CanvasArchitecture,
  config: SimulationConfig,
): SimulationReport {
  const {
    globalQps,
    profile,
    activeChaos,
    sloTargetP99Ms = 200,
    sloTargetAvailabilityPct = 99.9,
  } = config;

  const nodeMetrics: Record<string, NodeSimulationMetrics> = {};
  const edgeMetrics: Record<string, EdgeSimulationMetrics> = {};
  const bottlenecks: SimulationReport['bottlenecks'] = [];
  const remediationPrompts: RemediationPrompt[] = [];

  // 1. Calculate profile multiplier (e.g. spiky bursts)
  let trafficMultiplier = 1.0;
  if (profile === 'spiky') {
    trafficMultiplier = 2.5; // Flash sale / surge
  } else if (profile === 'write-heavy') {
    trafficMultiplier = 1.2;
  }
  const effectiveGlobalQps = Math.round(globalQps * trafficMultiplier);

  // 2. Initialize default metrics for every node
  for (const node of arch.nodes) {
    const spec = DEFAULT_CAPACITIES[node.type] ?? { qps: 10_000, baseLatencyMs: 20 };
    const replicaCount = Math.max(1, node.metrics.replicationCount ?? 1);
    const totalCapacity = spec.qps * replicaCount;

    nodeMetrics[node.id] = {
      health: 'healthy',
      qps: 0,
      capacityQps: totalCapacity,
      p99LatencyMs: node.metrics.latencyMs ?? spec.baseLatencyMs,
      baseLatencyMs: node.metrics.latencyMs ?? spec.baseLatencyMs,
      cpuPct: 5,
      memoryPct: 15,
      errorRatePct: 0,
      queueLag: 0,
    };
  }

  // 3. Find Ingress Nodes (Clients, Gateways, Load Balancers without incoming edges)
  const incomingEdges: Record<string, CanvasEdge[]> = {};
  const outgoingEdges: Record<string, CanvasEdge[]> = {};

  for (const edge of arch.edges) {
    if (!incomingEdges[edge.targetId]) incomingEdges[edge.targetId] = [];
    incomingEdges[edge.targetId].push(edge);

    if (!outgoingEdges[edge.sourceId]) outgoingEdges[edge.sourceId] = [];
    outgoingEdges[edge.sourceId].push(edge);
  }

  // Assign initial ingress load to client nodes
  const clientNodes = arch.nodes.filter(
    (n) => n.category === 'client' || (incomingEdges[n.id]?.length ?? 0) === 0,
  );
  const qpsPerClient =
    clientNodes.length > 0
      ? Math.round(effectiveGlobalQps / clientNodes.length)
      : effectiveGlobalQps;

  for (const client of clientNodes) {
    if (nodeMetrics[client.id]) {
      nodeMetrics[client.id].qps = qpsPerClient;
    }
  }

  // 4. Flow Propagation (Topological / BFS queue traversal)
  const visited = new Set<string>();
  const queue = [...clientNodes.map((n) => n.id)];

  while (queue.length > 0) {
    const currId = queue.shift()!;
    if (visited.has(currId)) continue;
    visited.add(currId);

    const currNode = arch.nodes.find((n) => n.id === currId);
    const currMetric = nodeMetrics[currId];
    if (!currNode || !currMetric) continue;

    const outEdges = outgoingEdges[currId] ?? [];
    if (outEdges.length === 0) continue;

    // Distribute current node's QPS to downstream targets
    let outQps = currMetric.qps;

    // Cache hit rate reduction (if current node is a cache)
    if (currNode.category === 'cache') {
      const isStampede = activeChaos.includes('cache-stampede');
      const hitRate = isStampede ? 0 : (currNode.metrics.hitRatePercent ?? 85) / 100;
      outQps = Math.round(currMetric.qps * (1 - hitRate)); // Only misses pass to DB
    }

    const qpsPerTarget = Math.round(outQps / outEdges.length);

    for (const edge of outEdges) {
      const targetMetric = nodeMetrics[edge.targetId];
      if (targetMetric) {
        targetMetric.qps += qpsPerTarget;
      }
      edgeMetrics[edge.id] = {
        qps: qpsPerTarget,
        latencyMs: currMetric.p99LatencyMs,
        errorRatePct: currMetric.errorRatePct,
        saturated: false,
      };

      if (!visited.has(edge.targetId)) {
        queue.push(edge.targetId);
      }
    }
  }

  // 5. Apply Chaos Events & Evaluate Component Utilization & Queuing Degradation
  for (const node of arch.nodes) {
    const metric = nodeMetrics[node.id];
    if (!metric) continue;

    // A. Direct Chaos Events
    if (activeChaos.includes('primary-db-crash') && node.type === 'database-primary') {
      metric.health = 'crashed';
      metric.cpuPct = 0;
      metric.errorRatePct = 100;
      metric.p99LatencyMs = 5000;
      metric.failureReason = 'Primary DB Instance Crashed (Out of Memory / Hardware Failure)';
    }

    if (activeChaos.includes('network-partition') && node.category === 'database') {
      metric.health = 'crashed';
      metric.errorRatePct = 100;
      metric.p99LatencyMs = 10000;
      metric.failureReason = 'Network Partition: Cross-region connection timed out';
    }

    if (activeChaos.includes('slow-consumer-lag') && node.category === 'queue') {
      metric.queueLag = Math.round(metric.qps * 35); // 35s queue backlog
      metric.health = 'critical';
      metric.failureReason = 'High Consumer Lag: Downstream workers unable to drain partition buffer';
    }

    if (activeChaos.includes('ddos-flood') && (node.category === 'edge' || node.category === 'compute')) {
      metric.qps *= 5; // 5x traffic surge
    }

    // Skip further degradation math if already crashed or critically degraded by chaos
    if (metric.health === 'crashed' || metric.health === 'critical') continue;

    // B. Calculate CPU & Resource Utilization
    const utilization = Math.min(metric.qps / Math.max(1, metric.capacityQps), 3.0);
    metric.cpuPct = Math.round(Math.min(utilization * 100, 100));
    metric.memoryPct = Math.round(Math.min(20 + utilization * 70, 98));

    // C. M/M/1 Queuing Theory Latency Escalation: L = L0 / (1 - rho)
    if (utilization < 0.7) {
      metric.p99LatencyMs = Math.round(metric.baseLatencyMs * (1 + utilization * 0.5));
      metric.health = 'healthy';
      metric.errorRatePct = 0;
    } else if (utilization < 0.9) {
      metric.p99LatencyMs = Math.round(metric.baseLatencyMs * (1.5 / (1 - utilization)));
      metric.health = 'warning';
      metric.errorRatePct = 0.5;
    } else if (utilization <= 1.1) {
      metric.p99LatencyMs = Math.round(metric.baseLatencyMs * (2.0 / (1 - 0.92)));
      metric.health = 'critical';
      metric.errorRatePct = Math.round((utilization - 0.9) * 25);
      metric.failureReason = `High CPU Saturation (${metric.cpuPct}%): Node capacity exceeded (${metric.qps.toLocaleString()} / ${metric.capacityQps.toLocaleString()} QPS)`;
    } else {
      // Over-capacity crash / severe throttling
      metric.p99LatencyMs = Math.round(metric.baseLatencyMs * 25);
      metric.health = 'crashed';
      metric.errorRatePct = Math.round(Math.min(75 + (utilization - 1.1) * 30, 100));
      metric.failureReason = `Component Out of Capacity: ${metric.qps.toLocaleString()} QPS against ${metric.capacityQps.toLocaleString()} QPS max capacity`;
    }

    // Record Bottlenecks
    if (metric.health === 'warning' || metric.health === 'critical' || metric.health === 'crashed') {
      bottlenecks.push({
        nodeId: node.id,
        label: node.label,
        reason: metric.failureReason ?? `Utilization reaching ${metric.cpuPct}% at ${metric.qps.toLocaleString()} QPS`,
        severity: metric.health,
      });
    }

    // D. Generate Socratic Remediation Prompts for Saturated Components
    if (metric.health === 'critical' || metric.health === 'crashed') {
      if (node.type === 'database-primary') {
        remediationPrompts.push({
          id: `remedy-${node.id}`,
          nodeId: node.id,
          nodeLabel: node.label,
          triggerReason: `Primary database CPU at ${metric.cpuPct}% with ${metric.qps.toLocaleString()} QPS`,
          question: `Your primary database is overwhelmed by incoming query traffic. How do you resolve this bottleneck?`,
          options: [
            {
              id: 'add-read-replicas',
              label: 'Add 3 Read Replicas with Connection Pooler',
              description: 'Offload read queries to asynchronous replicas and manage connection limits via PgBouncer.',
              impactSummary: 'Increases read capacity by 3x, reducing primary DB CPU below 40%.',
              action: (currentArch) => ({
                ...currentArch,
                nodes: currentArch.nodes.map((n) =>
                  n.id === node.id
                    ? {
                        ...n,
                        metrics: {
                          ...n.metrics,
                          replicationCount: (n.metrics.replicationCount ?? 1) + 3,
                        },
                      }
                    : n,
                ),
              }),
            },
            {
              id: 'add-redis-cache',
              label: 'Introduce In-Memory Cache (Redis) with Cache-Aside',
              description: 'Absorb high-frequency read keys in memory before they hit the database tier.',
              impactSummary: 'Achieves 85% cache hit rate, deflecting 85% of queries from the database.',
              action: (currentArch) => {
                const cacheNodeId = `cache-${Date.now()}`;
                const newCacheNode: CanvasNode = {
                  id: cacheNodeId,
                  type: 'cache-cluster',
                  label: 'Redis Cache Tier',
                  category: 'cache',
                  x: node.x - 120,
                  y: node.y - 80,
                  icon: 'layers',
                  metrics: { qps: 80000, latencyMs: 2, hitRatePercent: 85 },
                };
                const newEdge: CanvasEdge = {
                  id: `edge-${Date.now()}`,
                  sourceId: cacheNodeId,
                  targetId: node.id,
                  protocol: 'tcp',
                  label: 'Cache Misses',
                };
                return {
                  ...currentArch,
                  nodes: [...currentArch.nodes, newCacheNode],
                  edges: [...currentArch.edges, newEdge],
                };
              },
            },
          ],
        });
      } else if (node.type === 'app-server' || node.category === 'compute') {
        remediationPrompts.push({
          id: `remedy-${node.id}`,
          nodeId: node.id,
          nodeLabel: node.label,
          triggerReason: `Compute server fleet CPU at ${metric.cpuPct}% under ${metric.qps.toLocaleString()} QPS`,
          question: `Application server instances are dropping requests due to CPU saturation. What is your scaling strategy?`,
          options: [
            {
              id: 'horizontal-autoscale',
              label: 'Enable Horizontal Auto-Scaling (3x Instances)',
              description: 'Scale out stateless server nodes behind a round-robin load balancer.',
              impactSummary: 'Triples compute throughput and drops server latency back to baseline.',
              action: (currentArch) => ({
                ...currentArch,
                nodes: currentArch.nodes.map((n) =>
                  n.id === node.id
                    ? {
                        ...n,
                        metrics: {
                          ...n.metrics,
                          replicationCount: (n.metrics.replicationCount ?? 1) * 3,
                        },
                      }
                    : n,
                ),
              }),
            },
            {
              id: 'add-rate-limiter',
              label: 'Deploy Token Bucket Rate Limiter at Ingress',
              description: 'Protect application workers by throttling abusive traffic with 429 Too Many Requests.',
              impactSummary: 'Caps max incoming QPS to healthy threshold, protecting downstream workers.',
              action: (currentArch) => {
                const limiterId = `limiter-${Date.now()}`;
                const newLimiterNode: CanvasNode = {
                  id: limiterId,
                  type: 'rate-limiter',
                  label: 'Ingress Rate Limiter',
                  category: 'reliability',
                  x: node.x - 140,
                  y: node.y,
                  icon: 'shield-alert',
                  metrics: { qps: 50000, latencyMs: 2 },
                };
                return {
                  ...currentArch,
                  nodes: [...currentArch.nodes, newLimiterNode],
                };
              },
            },
          ],
        });
      }
    }
  }

  // 6. Aggregate System-Wide Vitals & SLO Compliance
  const metricsList = Object.values(nodeMetrics);
  const maxLatency = metricsList.reduce((max, m) => Math.max(max, m.p99LatencyMs), 1);
  const totalErrors = metricsList.reduce((acc, m) => acc + m.errorRatePct, 0);
  const avgErrorRate = metricsList.length > 0 ? totalErrors / metricsList.length : 0;
  const availabilityPct = Number(Math.max(0, 100 - avgErrorRate).toFixed(2));

  let overallHealth: NodeHealth = 'healthy';
  if (metricsList.some((m) => m.health === 'crashed')) {
    overallHealth = 'crashed';
  } else if (metricsList.some((m) => m.health === 'critical')) {
    overallHealth = 'critical';
  } else if (metricsList.some((m) => m.health === 'warning')) {
    overallHealth = 'warning';
  }

  const sloViolated = maxLatency > sloTargetP99Ms || availabilityPct < sloTargetAvailabilityPct;

  return {
    globalQps,
    effectiveQps: effectiveGlobalQps,
    overallHealth,
    p99LatencyMs: maxLatency,
    availabilityPct,
    sloViolated,
    activeChaos,
    nodeMetrics,
    edgeMetrics,
    bottlenecks,
    remediationPrompts,
  };
}
