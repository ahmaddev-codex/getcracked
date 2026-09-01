/**
 * System Design Diagramming / Whiteboard Canvas Type Definitions (C1).
 *
 * Designed to represent architectural components, connections, metrics,
 * and topology analysis with strict typing.
 */

export type ComponentCategory =
  | 'client'
  | 'edge'
  | 'compute'
  | 'cache'
  | 'database'
  | 'queue'
  | 'reliability';

export type ProtocolType = 'https' | 'grpc' | 'sql' | 'pubsub' | 'websocket' | 'tcp';

export interface ComponentTemplate {
  type: string;
  label: string;
  category: ComponentCategory;
  description: string;
  icon: string;
  conceptSlug?: string;
  defaultMetrics?: {
    qps?: number;
    latencyMs?: number;
    storageGb?: number;
    replicationCount?: number;
    hitRatePercent?: number;
  };
}

export interface CanvasNode {
  id: string;
  type: string;
  label: string;
  category: ComponentCategory;
  x: number;
  y: number;
  width?: number;
  height?: number;
  icon: string;
  conceptSlug?: string;
  notes?: string;
  metrics: {
    qps?: number;
    latencyMs?: number;
    storageGb?: number;
    replicationCount?: number;
    hitRatePercent?: number;
  };
}

export interface CanvasEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  protocol?: ProtocolType;
  animated?: boolean;
}

export interface CanvasArchitecture {
  id?: string;
  title: string;
  description?: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface TopologyDiagnostic {
  level: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  nodeIds?: string[];
  recommendation?: string;
}

export interface TopologyReport {
  diagnostics: TopologyDiagnostic[];
  stats: {
    totalNodes: number;
    totalEdges: number;
    singlePointsOfFailure: number;
    estimatedP99LatencyMs: number;
    hasCaches: boolean;
    hasQueues: boolean;
    hasReplicas: boolean;
  };
}
