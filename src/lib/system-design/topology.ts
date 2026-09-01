import type { CanvasEdge, CanvasNode, TopologyDiagnostic, TopologyReport } from './canvas-types';

/**
 * Evaluates an architecture topology for anti-patterns, single points of failure (SPOF),
 * caching efficiency, bottleneck risks, and estimated end-to-end latency budget (C1).
 */
export function analyzeTopology(nodes: CanvasNode[], edges: CanvasEdge[]): TopologyReport {
  const diagnostics: TopologyDiagnostic[] = [];

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const incomingEdges = new Map<string, CanvasEdge[]>();
  const outgoingEdges = new Map<string, CanvasEdge[]>();

  for (const node of nodes) {
    incomingEdges.set(node.id, []);
    outgoingEdges.set(node.id, []);
  }

  for (const edge of edges) {
    incomingEdges.get(edge.targetId)?.push(edge);
    outgoingEdges.get(edge.sourceId)?.push(edge);
  }

  const clients = nodes.filter((n) => n.category === 'client');
  const computeNodes = nodes.filter((n) => n.category === 'compute');
  const databases = nodes.filter((n) => n.category === 'database');
  const caches = nodes.filter((n) => n.category === 'cache');
  const queues = nodes.filter((n) => n.category === 'queue');
  const limiters = nodes.filter((n) => n.type === 'rate-limiter');

  let spofCount = 0;

  // 1. Check for missing ingress / load balancing
  for (const client of clients) {
    const targets = outgoingEdges.get(client.id)?.map((e) => nodeMap.get(e.targetId)) ?? [];
    const directCompute = targets.filter((t) => t && t.category === 'compute');
    if (directCompute.length > 0) {
      diagnostics.push({
        level: 'warning',
        title: 'Direct Client-to-Compute Connection',
        message: `Client "${client.label}" connects directly to compute node(s) without a Load Balancer or API Gateway.`,
        nodeIds: [client.id, ...directCompute.map((d) => d!.id)],
        recommendation: 'Place a Load Balancer (ALB) or API Gateway in front of compute servers to handle TLS termination, routing, and horizontal scaling.',
      });
      spofCount++;
    }
  }

  // 2. Check for Single Point of Failure in Databases
  for (const db of databases) {
    if (db.type === 'postgres-primary') {
      const hasReplica = nodes.some(
        (n) => n.type === 'postgres-replica' || (n.metrics.replicationCount ?? 1) > 1,
      );
      if (!hasReplica) {
        diagnostics.push({
          level: 'error',
          title: 'Single Point of Failure (Primary Database)',
          message: `Database "${db.label}" has no read replicas or standby failover node configured.`,
          nodeIds: [db.id],
          recommendation: 'Add read replicas or a standby failover instance to ensure high availability and prevent total downtime on node crash.',
        });
        spofCount++;
      }
    }
  }

  // 3. Check for Caching Layer on Read-Heavy Workloads
  if (databases.length > 0 && caches.length === 0) {
    const totalQps = nodes.reduce((sum, n) => sum + (n.metrics.qps ?? 0), 0);
    if (totalQps > 5000) {
      diagnostics.push({
        level: 'warning',
        title: 'Missing In-Memory Caching Layer',
        message: 'The architecture handles significant traffic but has no Redis or Memcached cache layer.',
        recommendation: 'Introduce an in-memory cache (Redis) in front of the database to absorb 80-90% of read traffic and reduce query latency.',
      });
    }
  }

  // 4. Check for Rate Limiting / Abuse Protection
  if (clients.length > 0 && limiters.length === 0) {
    diagnostics.push({
      level: 'info',
      title: 'No Rate Limiting Layer Detected',
      message: 'No rate limiter or token bucket is configured to defend against traffic spikes, scraping, or DoS.',
      recommendation: 'Add a Rate Limiter at the API Gateway or Edge layer to protect downstream resources.',
    });
  }

  // 5. Check for Asynchronous Decoupling on Heavy Workers
  const heavyWorkers = computeNodes.filter((n) => (n.metrics.latencyMs ?? 0) > 100);
  for (const worker of heavyWorkers) {
    const inEdges = incomingEdges.get(worker.id) ?? [];
    const directHttp = inEdges.some((e) => e.protocol === 'https' || e.protocol === 'grpc');
    const hasQueue = inEdges.some((e) => {
      const src = nodeMap.get(e.sourceId);
      return src && src.category === 'queue';
    });

    if (directHttp && !hasQueue) {
      diagnostics.push({
        level: 'warning',
        title: 'Synchronous Long-Running Workload',
        message: `Worker "${worker.label}" has high execution latency (${worker.metrics.latencyMs}ms) but is triggered synchronously.`,
        nodeIds: [worker.id],
        recommendation: 'Decouple long-running or CPU-intensive tasks using an asynchronous message queue (e.g. SQS, RabbitMQ).',
      });
    }
  }

  // 6. Check for Orphaned Nodes (no connections)
  for (const node of nodes) {
    const ins = incomingEdges.get(node.id)?.length ?? 0;
    const outs = outgoingEdges.get(node.id)?.length ?? 0;
    if (ins === 0 && outs === 0 && nodes.length > 1) {
      diagnostics.push({
        level: 'info',
        title: `Disconnected Node: ${node.label}`,
        message: `Node "${node.label}" has no incoming or outgoing connections.`,
        nodeIds: [node.id],
        recommendation: 'Connect this component to the data flow or remove it from the canvas.',
      });
    }
  }

  // 7. Calculate estimated critical path latency
  let estimatedP99LatencyMs = 0;
  if (nodes.length > 0) {
    // Simple longest path estimate across connected components
    const visited = new Set<string>();
    const findMaxLatency = (nodeId: string, depth = 0): number => {
      if (depth > 10) return 0;
      const node = nodeMap.get(nodeId);
      const baseLat = node?.metrics.latencyMs ?? 5;
      const nextEdges = outgoingEdges.get(nodeId) ?? [];
      if (nextEdges.length === 0) return baseLat;

      let maxChild = 0;
      for (const edge of nextEdges) {
        if (!visited.has(edge.targetId)) {
          visited.add(edge.targetId);
          maxChild = Math.max(maxChild, findMaxLatency(edge.targetId, depth + 1));
          visited.delete(edge.targetId);
        }
      }
      return baseLat + maxChild;
    };

    for (const client of clients) {
      visited.add(client.id);
      estimatedP99LatencyMs = Math.max(estimatedP99LatencyMs, findMaxLatency(client.id));
      visited.delete(client.id);
    }

    if (estimatedP99LatencyMs === 0) {
      estimatedP99LatencyMs = nodes.reduce((sum, n) => sum + (n.metrics.latencyMs ?? 5), 0);
    }
  }

  if (diagnostics.length === 0 && nodes.length >= 3) {
    diagnostics.push({
      level: 'success',
      title: 'Resilient Architecture Design',
      message: 'All core tiers are well decoupled with proper caching, replication, and ingress balancing.',
    });
  }

  return {
    diagnostics,
    stats: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      singlePointsOfFailure: spofCount,
      estimatedP99LatencyMs: Math.round(estimatedP99LatencyMs),
      hasCaches: caches.length > 0,
      hasQueues: queues.length > 0,
      hasReplicas: databases.some((d) => (d.metrics.replicationCount ?? 1) > 1 || d.type === 'postgres-replica'),
    },
  };
}
