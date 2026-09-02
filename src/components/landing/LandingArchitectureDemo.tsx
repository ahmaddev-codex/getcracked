'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  Server,
  Cpu,
  Database,
  Layers,
  ArrowRight,
  Activity,
  Play,
  Pause,
  RotateCcw,
} from 'lucide-react';
import { getSmartConnector } from '@/lib/canvas/smartConnector';

interface ArchNode {
  id: string;
  label: string;
  role: string;
  icon: typeof Globe;
  x: number;
  y: number;
  qps: string;
  latency: string;
  cpu: number;
  health: 'healthy' | 'warning';
}

interface ArchEdge {
  id: string;
  sourceId: string;
  targetId: string;
  protocol: string;
}

const NODES: ArchNode[] = [
  {
    id: 'edge',
    label: 'Cloudflare Edge CDN',
    role: 'Global Anycast · TLS 1.3 · DDoS Shield',
    icon: Globe,
    x: 30,
    y: 110,
    qps: '85.2k/s',
    latency: '8ms',
    cpu: 22,
    health: 'healthy',
  },
  {
    id: 'gateway',
    label: 'Envoy API Gateway',
    role: 'Token Bucket Rate Limiter + JWT Auth',
    icon: Server,
    x: 270,
    y: 110,
    qps: '48.0k/s',
    latency: '14ms',
    cpu: 45,
    health: 'healthy',
  },
  {
    id: 'services',
    label: 'Go Core Microservices',
    role: 'Stateless Auto-scaling Cluster (3 AZs)',
    icon: Cpu,
    x: 520,
    y: 110,
    qps: '48.0k/s',
    latency: '32ms',
    cpu: 68,
    health: 'healthy',
  },
  {
    id: 'cache',
    label: 'Redis Primary Cluster',
    role: 'In-Memory Sub-Millisecond Cache-Aside',
    icon: Layers,
    x: 770,
    y: 35,
    qps: '41.2k/s',
    latency: '1.2ms',
    cpu: 38,
    health: 'healthy',
  },
  {
    id: 'db',
    label: 'PostgreSQL Distributed',
    role: 'Multi-AZ Sharded Cluster + Read Replicas',
    icon: Database,
    x: 770,
    y: 185,
    qps: '6.8k/s',
    latency: '18ms',
    cpu: 54,
    health: 'healthy',
  },
];

const EDGES: ArchEdge[] = [
  { id: 'e1', sourceId: 'edge', targetId: 'gateway', protocol: 'HTTPS' },
  { id: 'e2', sourceId: 'gateway', targetId: 'services', protocol: 'gRPC' },
  { id: 'e3', sourceId: 'services', targetId: 'cache', protocol: 'TCP' },
  { id: 'e4', sourceId: 'services', targetId: 'db', protocol: 'SQL' },
];

export function LandingArchitectureDemo() {
  const [selectedNodeId, setSelectedNodeId] = useState<string>('services');
  const [isSimulating, setIsSimulating] = useState(true);

  const selectedNode = NODES.find((n) => n.id === selectedNodeId) ?? NODES[2];

  return (
    <div className="flex flex-col gap-4">
      {/* Studio Whiteboard Canvas Frame */}
      <div className="relative overflow-hidden rounded-xl border border-border-strong bg-background shadow-node">
        {/* Whiteboard Header Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-success ring-4 ring-success/20" />
            <span className="font-mono text-xs font-bold text-foreground">
              Architecture Whiteboard: Scalable Distributed Web
            </span>
            <span className="rounded bg-surface-muted px-2 py-0.5 font-mono text-3xs font-semibold text-foreground-muted">
              5 Nodes · 4 Smart Connectors
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsSimulating((v) => !v)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-mono text-xs font-bold transition-all active:scale-95 ${
                isSimulating
                  ? 'bg-accent-strong text-accent-foreground shadow-xs'
                  : 'bg-surface border border-border text-foreground hover:bg-surface-muted'
              }`}
            >
              {isSimulating ? <Pause size={12} fill="currentColor" /> : <Play size={12} fill="currentColor" />}
              <span>{isSimulating ? 'Pause Traffic' : 'Simulate Traffic'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedNodeId('services')}
              title="Reset Selection"
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-surface text-foreground-muted transition-all hover:text-foreground active:scale-95"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>

        {/* The Live Interactive SVG Canvas */}
        <div className="relative h-80 w-full overflow-x-auto overflow-y-hidden bg-background">
          <div className="relative h-full min-w-230">
            {/* Background Grid Pattern */}
            <svg className="absolute inset-0 h-full w-full pointer-events-none" aria-hidden>
              <defs>
                <pattern id="landing-grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="var(--color-border-strong)" opacity="0.4" />
                </pattern>

                <marker
                  id="landing-arch-arrow"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="var(--color-connector)" />
                </marker>
              </defs>

              <rect width="100%" height="100%" fill="url(#landing-grid)" />

              {/* Render All Smart Edge-to-Edge Connectors */}
              {EDGES.map((edge) => {
                const src = NODES.find((n) => n.id === edge.sourceId);
                const tgt = NODES.find((n) => n.id === edge.targetId);
                if (!src || !tgt) return null;

                const connector = getSmartConnector(
                  { x: src.x, y: src.y, width: 170, height: 60 },
                  { x: tgt.x, y: tgt.y, width: 170, height: 60 }
                );

                return (
                  <g key={edge.id} className="pointer-events-none">
                    {/* Source Terminal Pin */}
                    <circle
                      cx={connector.startPoint.x}
                      cy={connector.startPoint.y}
                      r="2.5"
                      fill="var(--color-connector)"
                    />

                    {/* Base Solid Connector Line */}
                    <path
                      d={connector.pathD}
                      stroke="var(--color-connector)"
                      strokeWidth="2"
                      fill="none"
                      markerEnd="url(#landing-arch-arrow)"
                    />

                    {/* Animated Pulsing Traffic Packets */}
                    {isSimulating && (
                      <path
                        d={connector.pathD}
                        stroke="var(--color-link)"
                        strokeWidth="2.5"
                        strokeDasharray="6 6"
                        fill="none"
                        className="animate-pulse"
                      />
                    )}

                    {/* Centered Floating Protocol Badge */}
                    {(() => {
                      const badgeWidth = Math.max(34, edge.protocol.length * 6.5 + 14);
                      const badgeHeight = 16;
                      return (
                        <g transform={`translate(${connector.midPoint.x}, ${connector.midPoint.y})`}>
                          <rect
                            x={-badgeWidth / 2}
                            y={-badgeHeight / 2}
                            width={badgeWidth}
                            height={badgeHeight}
                            rx={badgeHeight / 2}
                            fill="var(--color-surface)"
                            stroke="none"
                            className="shadow-xs"
                          />
                          <text
                            x="0"
                            y="3"
                            textAnchor="middle"
                            fontSize="8"
                            fontWeight="700"
                            fontFamily="ui-monospace, monospace"
                            fill="var(--color-foreground)"
                          >
                            {edge.protocol}
                          </text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}

              {/* Render Interactive Node Cards via foreignObject */}
              {NODES.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const Icon = node.icon;

                return (
                  <foreignObject
                    key={node.id}
                    x={node.x}
                    y={node.y}
                    width={170}
                    height={62}
                    className="overflow-visible pointer-events-auto"
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`flex w-full flex-col rounded-lg border-2 p-2.5 text-left transition-all ${
                        isSelected
                          ? 'border-link bg-surface shadow-lg ring-2 ring-link/30 scale-105 z-20'
                          : 'border-border-strong bg-surface/90 hover:border-border hover:bg-surface shadow-sm z-10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-surface-muted text-link">
                          <Icon size={14} />
                        </span>
                        <span className="truncate text-xs font-bold text-foreground">
                          {node.label}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between border-t border-border-subtle pt-1 font-mono text-3xs text-foreground-muted">
                        <span>{node.qps}</span>
                        <span className="text-success font-semibold">{node.latency}</span>
                      </div>
                    </button>
                  </foreignObject>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Selected Component Inspector Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-border bg-surface p-3 px-4 text-xs">
          <div className="flex items-center gap-3">
            <span className="rounded bg-link/10 p-1.5 text-link">
              <Activity size={16} />
            </span>
            <div>
              <div className="font-bold text-foreground flex items-center gap-2">
                <span>{selectedNode.label}</span>
                <span className="rounded bg-success/15 px-1.5 py-0.2 font-mono text-3xs font-bold text-success">
                  Operational
                </span>
              </div>
              <div className="text-foreground-muted">{selectedNode.role}</div>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-2xs">
            <div>
              <span className="text-foreground-muted">Throughput: </span>
              <strong className="text-foreground">{selectedNode.qps}</strong>
            </div>
            <div>
              <span className="text-foreground-muted">P99 Latency: </span>
              <strong className="text-foreground">{selectedNode.latency}</strong>
            </div>
            <div>
              <span className="text-foreground-muted">CPU Load: </span>
              <strong className="text-foreground">{selectedNode.cpu}%</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Enticing Link to Full Tool */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-subtle bg-surface-muted/40 p-3 px-4 text-xs">
        <span className="text-foreground-muted">
          Design your own topologies, calculate QPS/bandwidth math, and pass scored architecture labs.
        </span>
        <div className="flex items-center gap-2">
          <Link
            href="/learn/system-design/labs"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-1.5 bg-surface px-3 py-1.5 text-xs font-semibold"
          >
            Scored Labs
          </Link>
          <Link
            href="/learn/system-design/canvas"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-1.5 bg-accent-strong px-3 py-1.5 text-xs font-bold text-accent-foreground"
          >
            <span>Open Architecture Studio</span>
            <ArrowRight size={13} aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
