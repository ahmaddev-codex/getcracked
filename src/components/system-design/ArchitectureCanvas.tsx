'use client';

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Trash2,
  Download,
  Share2,
  Info,
  Layers,
  Sparkles,
  Check,
} from 'lucide-react';
import { ComponentPalette, renderPaletteIcon } from './ComponentPalette';
import { TopologyAnalyzer } from './TopologyAnalyzer';
import { ARCHITECTURE_PRESETS } from '@/lib/system-design/canvas-presets';
import { analyzeTopology } from '@/lib/system-design/topology';
import type {
  CanvasArchitecture,
  CanvasEdge,
  CanvasNode,
  ComponentTemplate,
  ProtocolType,
} from '@/lib/system-design/canvas-types';

interface ArchitectureCanvasProps {
  initialArchitecture?: CanvasArchitecture;
  compact?: boolean;
  className?: string;
}

export function ArchitectureCanvas({
  initialArchitecture,
  compact = false,
  className = '',
}: ArchitectureCanvasProps) {
  const [nodes, setNodes] = useState<CanvasNode[]>(
    initialArchitecture?.nodes ?? ARCHITECTURE_PRESETS['url-shortener'].nodes,
  );
  const [edges, setEdges] = useState<CanvasEdge[]>(
    initialArchitecture?.edges ?? ARCHITECTURE_PRESETS['url-shortener'].edges,
  );

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const connectingProtocol: ProtocolType = 'https';

  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [showTopology, setShowTopology] = useState(!compact);
  const [copiedLink, setCopiedLink] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Analyze topology whenever nodes or edges update
  const topologyReport = useMemo(() => analyzeTopology(nodes, edges), [nodes, edges]);

  // Load a preset
  const loadPreset = (presetKey: string) => {
    const preset = ARCHITECTURE_PRESETS[presetKey];
    if (!preset) return;
    setNodes(preset.nodes);
    setEdges(preset.edges);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setConnectingSourceId(null);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Add a component from palette
  const handleAddComponent = (template: ComponentTemplate) => {
    const newId = `node-${template.type}-${nodes.length + 1}-${Math.floor(Math.random() * 1000)}`;
    const x = Math.round((-pan.x + 300) / zoom);
    const y = Math.round((-pan.y + 200) / zoom);

    const newNode: CanvasNode = {
      id: newId,
      type: template.type,
      label: template.label,
      category: template.category,
      x: Math.max(20, x),
      y: Math.max(20, y),
      icon: template.icon,
      conceptSlug: template.conceptSlug,
      metrics: { ...template.defaultMetrics },
    };

    setNodes((prev) => [...prev, newNode]);
    setSelectedNodeId(newId);
  };

  // Delete selected node or edge
  const handleDeleteSelected = () => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) => prev.filter((e) => e.sourceId !== selectedNodeId && e.targetId !== selectedNodeId));
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  };

  // Dragging logic
  const handleMouseDownNode = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation();
    if (connectingSourceId) {
      // Connect to target node
      if (connectingSourceId !== nodeId) {
        const edgeId = `edge-${connectingSourceId}-${nodeId}-${edges.length + 1}`;
        const newEdge: CanvasEdge = {
          id: edgeId,
          sourceId: connectingSourceId,
          targetId: nodeId,
          protocol: connectingProtocol,
          label: connectingProtocol.toUpperCase(),
        };
        setEdges((prev) => [...prev, newEdge]);
      }
      setConnectingSourceId(null);
      return;
    }

    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return;

    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setDragNodeId(nodeId);
    setDragOffset({
      x: e.clientX / zoom - node.x,
      y: e.clientY / zoom - node.y,
    });
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (dragNodeId) {
      const newX = Math.max(10, Math.round(e.clientX / zoom - dragOffset.x));
      const newY = Math.max(10, Math.round(e.clientY / zoom - dragOffset.y));

      setNodes((prev) =>
        prev.map((n) => (n.id === dragNodeId ? { ...n, x: newX, y: newY } : n)),
      );
    } else if (isPanning) {
      setPan((prev) => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY,
      }));
    }
  };

  const handleMouseUpCanvas = () => {
    setDragNodeId(null);
    setIsPanning(false);
  };

  const handleStartPan = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      setIsPanning(true);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  // Export as SVG
  const exportSvg = () => {
    if (!canvasRef.current) return;
    const svgData = new XMLSerializer().serializeToString(canvasRef.current);
    const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'system-architecture.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Share Link fragment
  const handleShareLink = () => {
    try {
      const payload = btoa(JSON.stringify({ nodes, edges }));
      const url = `${window.location.origin}${window.location.pathname}#arch=${payload}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      // fallback
    }
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  return (
    <div
      className={`flex flex-col border border-border-subtle rounded-node overflow-hidden bg-background ${
        compact ? 'h-130' : 'h-180'
      } ${className}`}
    >
      {/* Top Toolbar */}
      <header className="flex items-center justify-between px-3 py-2 bg-surface border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-accent-strong" /> Architecture Whiteboard
          </span>

          <div className="h-4 w-px bg-border-subtle mx-1" />

          <span className="text-2xs text-foreground-muted">Preset:</span>
          <select
            aria-label="Select preset architecture"
            onChange={(e) => loadPreset(e.target.value)}
            defaultValue="url-shortener"
            className="text-xs px-2 py-1 bg-background border border-border-subtle rounded-xs text-foreground focus:outline-none"
          >
            <option value="url-shortener">URL Shortener (100M URLs)</option>
            <option value="rate-limiter">Distributed Rate Limiter (500k QPS)</option>
            <option value="video-streaming">Video Streaming Platform</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom controls */}
          <button
            type="button"
            onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
            aria-label="Zoom Out"
            className="p-1 rounded-xs hover:bg-surface-muted text-foreground-muted hover:text-foreground"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-2xs font-mono text-foreground-muted w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
            aria-label="Zoom In"
            className="p-1 rounded-xs hover:bg-surface-muted text-foreground-muted hover:text-foreground"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
            }}
            aria-label="Reset View"
            className="p-1 rounded-xs hover:bg-surface-muted text-foreground-muted hover:text-foreground"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-border-subtle mx-1" />

          {/* Connect Mode */}
          {selectedNodeId && (
            <button
              type="button"
              onClick={() =>
                setConnectingSourceId(connectingSourceId === selectedNodeId ? null : selectedNodeId)
              }
              className={`px-2 py-1 text-2xs rounded-xs font-medium transition-colors flex items-center gap-1 ${
                connectingSourceId === selectedNodeId
                  ? 'bg-link text-white animate-pulse'
                  : 'bg-surface-muted hover:bg-surface text-foreground border border-border-subtle'
              }`}
            >
              <span>{connectingSourceId === selectedNodeId ? 'Click target node...' : 'Connect to...'}</span>
            </button>
          )}

          {/* Delete action */}
          {(selectedNodeId || selectedEdgeId) && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              aria-label="Delete Selection"
              className="p-1 text-danger hover:bg-danger-soft/30 rounded-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="h-4 w-px bg-border-subtle mx-1" />

          {/* Toggle Topology panel */}
          <button
            type="button"
            onClick={() => setShowTopology((v) => !v)}
            className={`px-2 py-1 text-2xs rounded-xs border transition-colors flex items-center gap-1 ${
              showTopology
                ? 'bg-accent font-semibold text-accent-foreground border-border-strong'
                : 'bg-surface text-foreground-muted border-border-subtle hover:text-foreground'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Analyzer</span>
          </button>

          {/* Export & Share */}
          <button
            type="button"
            onClick={exportSvg}
            title="Export as SVG"
            className="p-1 rounded-xs hover:bg-surface-muted text-foreground-muted hover:text-foreground"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleShareLink}
            title="Copy Share Link"
            className="p-1 rounded-xs hover:bg-surface-muted text-foreground-muted hover:text-foreground flex items-center gap-1"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Palette */}
        <ComponentPalette onAddComponent={handleAddComponent} />

        {/* Center Canvas Area */}
        <div
          ref={containerRef}
          onMouseDown={handleStartPan}
          onMouseMove={handleMouseMoveCanvas}
          onMouseUp={handleMouseUpCanvas}
          className="flex-1 h-full relative overflow-hidden bg-background cursor-crosshair select-none"
        >
          {/* SVG Connectors & Nodes Unified Layer */}
          <svg
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          >
            <defs>
              <pattern
                id="canvas-grid-pattern"
                width={24 * zoom}
                height={24 * zoom}
                patternUnits="userSpaceOnUse"
                x={pan.x}
                y={pan.y}
              >
                <circle cx={2} cy={2} r={1} fill="var(--color-border-strong)" opacity={0.3} />
              </pattern>

              <marker
                id="arrow"
                viewBox="0 0 10 10"
                refX="10"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--color-connector)" />
              </marker>
            </defs>

            {/* Grid background */}
            <rect width="100%" height="100%" fill="url(#canvas-grid-pattern)" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Connector Edges */}
              {edges.map((edge) => {
                const src = nodes.find((n) => n.id === edge.sourceId);
                const tgt = nodes.find((n) => n.id === edge.targetId);
                if (!src || !tgt) return null;

                const sx = src.x + 85;
                const sy = src.y + 35;
                const tx = tgt.x + 85;
                const ty = tgt.y + 35;

                const dx = tx - sx;
                const cx1 = sx + dx * 0.5;
                const cy1 = sy;
                const cx2 = sx + dx * 0.5;
                const cy2 = ty;

                const pathD = `M ${sx} ${sy} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${tx} ${ty}`;
                const isSelected = selectedEdgeId === edge.id;

                return (
                  <g
                    key={edge.id}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEdgeId(edge.id);
                      setSelectedNodeId(null);
                    }}
                  >
                    {/* Hover hitbox */}
                    <path d={pathD} stroke="transparent" strokeWidth="16" fill="none" />
                    {/* Visual line */}
                    <path
                      d={pathD}
                      stroke="var(--color-connector)"
                      strokeWidth={isSelected ? '3.5' : '2'}
                      strokeDasharray={edge.protocol === 'sql' ? '4 3' : undefined}
                      fill="none"
                      markerEnd="url(#arrow)"
                      className={edge.animated ? 'animate-pulse' : ''}
                    />
                    {edge.label && (
                      <text
                        x={(sx + tx) / 2}
                        y={(sy + ty) / 2 - 8}
                        textAnchor="middle"
                        className="text-2xs font-mono fill-foreground-muted font-medium select-none"
                      >
                        {edge.label}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Node ForeignObjects */}
              {nodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                const isConnectingSource = connectingSourceId === node.id;

                return (
                  <foreignObject
                    key={node.id}
                    x={node.x}
                    y={node.y}
                    width={170}
                    height={80}
                    className="overflow-visible cursor-move select-none"
                    onMouseDown={(e) => handleMouseDownNode(e, node.id)}
                  >
                    <div
                      className={`node-surface flex flex-col p-2.5 rounded-node bg-surface text-foreground border border-border-strong transition-shadow ${
                        isSelected ? 'ring-2 ring-link ring-offset-2 shadow-node-lifted' : 'shadow-node'
                      } ${isConnectingSource ? 'border-link ring-2 ring-link animate-pulse' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 justify-between">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="p-1 rounded-xs bg-surface-muted text-foreground-muted shrink-0">
                            {renderPaletteIcon(node.icon, 'w-3 h-3')}
                          </span>
                          <span className="text-xs font-semibold truncate leading-tight">{node.label}</span>
                        </div>
                      </div>

                      {/* Metrics snippet */}
                      <div className="mt-2 flex items-center justify-between text-2xs font-mono text-foreground-muted border-t border-border-subtle/50 pt-1">
                        <span>{node.metrics.qps ? `${(node.metrics.qps / 1000).toFixed(0)}k QPS` : '—'}</span>
                        <span>{node.metrics.latencyMs ? `${node.metrics.latencyMs}ms` : ''}</span>
                        {node.metrics.replicationCount && <span>{node.metrics.replicationCount}x repl</span>}
                      </div>
                    </div>
                  </foreignObject>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right Topology Analyzer Sidebar */}
        {showTopology && (
          <TopologyAnalyzer
            report={topologyReport}
            onSelectNodes={(nodeIds: string[]) => {
              if (nodeIds[0]) setSelectedNodeId(nodeIds[0]);
            }}
          />
        )}
      </div>

      {/* Bottom Inspector Bar (when node or edge selected) */}
      {(selectedNode || selectedEdge) && (
        <footer className="p-2.5 bg-surface border-t border-border-subtle flex items-center justify-between shrink-0 text-xs">
          {selectedNode && (
            <div className="flex items-center gap-4 flex-wrap">
              <span className="font-semibold text-foreground">{selectedNode.label}</span>
              <div className="flex items-center gap-1.5 text-2xs text-foreground-muted">
                <span>Label:</span>
                <input
                  type="text"
                  value={selectedNode.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNodes((prev) =>
                      prev.map((n) => (n.id === selectedNode.id ? { ...n, label: val } : n)),
                    );
                  }}
                  className="px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 text-2xs text-foreground-muted">
                <span>QPS:</span>
                <input
                  type="number"
                  value={selectedNode.metrics.qps ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, metrics: { ...n.metrics, qps: val } }
                          : n,
                      ),
                    );
                  }}
                  className="w-20 px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5 text-2xs text-foreground-muted">
                <span>Latency (ms):</span>
                <input
                  type="number"
                  value={selectedNode.metrics.latencyMs ?? 0}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, metrics: { ...n.metrics, latencyMs: val } }
                          : n,
                      ),
                    );
                  }}
                  className="w-16 px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs font-mono"
                />
              </div>

              {selectedNode.conceptSlug && (
                <Link
                  href={`/learn/system-design#${selectedNode.conceptSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-link hover:underline text-2xs"
                >
                  <Info className="w-3 h-3" />
                  <span>Read Concept</span>
                </Link>
              )}
            </div>
          )}

          {selectedEdge && (
            <div className="flex items-center gap-4">
              <span className="font-semibold text-foreground">Connector ({selectedEdge.protocol})</span>
              <div className="flex items-center gap-1.5 text-2xs text-foreground-muted">
                <span>Label:</span>
                <input
                  type="text"
                  value={selectedEdge.label ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEdges((prev) =>
                      prev.map((ed) => (ed.id === selectedEdge.id ? { ...ed, label: val } : ed)),
                    );
                  }}
                  className="px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs"
                />
              </div>

              <div className="flex items-center gap-1.5 text-2xs text-foreground-muted">
                <span>Protocol:</span>
                <select
                  value={selectedEdge.protocol ?? 'https'}
                  onChange={(e) => {
                    const p = e.target.value as ProtocolType;
                    setEdges((prev) =>
                      prev.map((ed) => (ed.id === selectedEdge.id ? { ...ed, protocol: p } : ed)),
                    );
                  }}
                  className="px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs"
                >
                  <option value="https">HTTPS</option>
                  <option value="grpc">gRPC</option>
                  <option value="sql">SQL Query</option>
                  <option value="pubsub">Pub/Sub</option>
                  <option value="websocket">WebSocket</option>
                  <option value="tcp">Raw TCP</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleDeleteSelected}
            className="px-2 py-1 text-2xs text-danger hover:bg-danger-soft/30 rounded-xs border border-danger/30"
          >
            Delete Component
          </button>
        </footer>
      )}
    </div>
  );
}
