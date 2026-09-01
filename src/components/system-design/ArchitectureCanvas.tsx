'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Maximize2,
  Trash2,
  Download,
  Share2,
  Layers,
  Sparkles,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ChevronRight,
  ChevronLeft,
  ShieldAlert,
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
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragNodeId, setDragNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Fullscreen studio state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Sidebars extreme dock & visibility
  const [showPalette, setShowPalette] = useState(!compact);
  const [showTopology, setShowTopology] = useState(!compact);
  const [copiedLink, setCopiedLink] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<SVGSVGElement>(null);

  // Handle ESC key to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

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
    const newId = `node-${template.type}-${nodes.length + 1}`;
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

  // Connect two nodes
  const handleConnectNode = (targetId: string) => {
    if (!connectingSourceId || connectingSourceId === targetId) {
      setConnectingSourceId(null);
      return;
    }

    // Check if edge already exists
    const exists = edges.some(
      (e) =>
        (e.sourceId === connectingSourceId && e.targetId === targetId) ||
        (e.sourceId === targetId && e.targetId === connectingSourceId),
    );

    if (!exists) {
      const newEdge: CanvasEdge = {
        id: `edge-${connectingSourceId}-${targetId}-${edges.length + 1}`,
        sourceId: connectingSourceId,
        targetId: targetId,
        protocol: connectingProtocol,
      };
      setEdges((prev) => [...prev, newEdge]);
    }

    setConnectingSourceId(null);
  };

  // Node Drag Initiator
  const handlePointerDownNode = (e: React.PointerEvent, nodeId: string) => {
    e.stopPropagation();

    if (connectingSourceId) {
      handleConnectNode(nodeId);
      return;
    }

    setSelectedNodeId(nodeId);
    setSelectedEdgeId(null);
    setDragNodeId(nodeId);

    const node = nodes.find((n) => n.id === nodeId);
    if (node && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const clickX = (e.clientX - rect.left - pan.x) / zoom;
      const clickY = (e.clientY - rect.top - pan.y) / zoom;
      setDragOffset({
        x: clickX - node.x,
        y: clickY - node.y,
      });
      try {
        containerRef.current.setPointerCapture(e.pointerId);
      } catch {
        // Fallback
      }
    }
  };

  // Canvas Pan Initiator (background clicks)
  const handlePointerDownCanvas = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-node-item]') ||
      target.closest('button') ||
      target.closest('input') ||
      target.closest('select')
    ) {
      return;
    }

    setIsPanning(true);
    setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setConnectingSourceId(null);

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // Fallback
    }
  };

  const handlePointerMoveCanvas = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (dragNodeId && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      setNodes((prev) =>
        prev.map((n) =>
          n.id === dragNodeId
            ? {
              ...n,
              x: Math.round(mouseX - dragOffset.x),
              y: Math.round(mouseY - dragOffset.y),
            }
            : n,
        ),
      );
    }
  };

  const handlePointerUpCanvas = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isPanning || dragNodeId) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Safe release
      }
    }
    setIsPanning(false);
    setDragNodeId(null);
  };

  // Delete node or edge
  const handleDeleteSelected = useCallback(() => {
    if (selectedNodeId) {
      setNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
      setEdges((prev) =>
        prev.filter((e) => e.sourceId !== selectedNodeId && e.targetId !== selectedNodeId),
      );
      setSelectedNodeId(null);
    } else if (selectedEdgeId) {
      setEdges((prev) => prev.filter((e) => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  }, [selectedNodeId, selectedEdgeId]);

  // Export SVG
  const exportSvg = () => {
    if (!canvasRef.current) return;
    const svgData = new XMLSerializer().serializeToString(canvasRef.current);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const svgUrl = URL.createObjectURL(svgBlob);
    const downloadLink = document.createElement('a');
    downloadLink.href = svgUrl;
    downloadLink.download = 'architecture-diagram.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  // Copy shareable link (encoded state in hash)
  const handleShareLink = () => {
    const state = {
      nodes: nodes.map((n) => ({
        id: n.id,
        type: n.type,
        label: n.label,
        category: n.category,
        x: n.x,
        y: n.y,
        icon: n.icon,
        metrics: n.metrics,
      })),
      edges: edges.map((e) => ({
        id: e.id,
        sourceId: e.sourceId,
        targetId: e.targetId,
        protocol: e.protocol,
      })),
    };
    const hash = encodeURIComponent(JSON.stringify(state));
    const url = `${window.location.origin}${window.location.pathname}#arch=${hash}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = edges.find((e) => e.id === selectedEdgeId);

  return (
    <div
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 bg-background flex flex-col w-screen h-screen overflow-hidden'
          : `relative flex flex-col border border-border-strong rounded-node overflow-hidden bg-background h-160 shadow-node ${className}`
      }
    >
      {/* Studio Header (Tier 1: Title, Presets, Actions) */}
      <header className="px-4 py-2 bg-surface border-b border-border-subtle flex items-center justify-between gap-3 shrink-0 select-none z-20 flex-wrap">
        <div className="flex items-center gap-3 min-w-0 flex-wrap">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <Sparkles size={14} className="text-link" />
              <span>Architecture Studio</span>
            </span>
            {isFullscreen && (
              <span className="text-2xs bg-surface-muted text-foreground border border-border-subtle font-medium px-1.5 py-0.5 rounded-xs">
                Fullscreen
              </span>
            )}
          </div>

          {/* Preset Selector */}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-2xs text-foreground-muted hidden sm:inline shrink-0">Preset:</span>
            <select
              onChange={(e) => loadPreset(e.target.value)}
              defaultValue="url-shortener"
              aria-label="Select Architecture Preset"
              className="text-xs bg-surface border border-border-strong rounded-xs px-2 py-1 text-foreground focus:outline-none focus:border-link cursor-pointer"
            >
              <option value="url-shortener">URL Shortener (Scalable Web)</option>
              <option value="rate-limiter">Distributed Rate Limiter</option>
              <option value="video-streaming">Video Streaming Platform</option>
            </select>
          </div>

          {/* Quick counts */}
          <div className="flex items-center gap-2 text-2xs text-foreground-muted font-mono bg-surface-muted/40 px-2 py-0.5 rounded-xs border border-border-subtle">
            <span>{nodes.length} nodes</span>
            <span>•</span>
            <span>{edges.length} edges</span>
          </div>
        </div>

        {/* Studio Top Right Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={exportSvg}
            title="Export as SVG"
            className="px-2 py-1 text-xs rounded-xs border border-border-subtle hover:bg-surface-muted text-foreground-muted hover:text-foreground cursor-pointer flex items-center gap-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={handleShareLink}
            title="Copy Share Link"
            className="px-2 py-1 text-xs rounded-xs border border-border-subtle hover:bg-surface-muted text-foreground-muted hover:text-foreground flex items-center gap-1 cursor-pointer transition-colors"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-success" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>

          {/* Fullscreen Studio Toggle */}
          <button
            type="button"
            onClick={() => {
              setIsFullscreen((v) => !v);
              if (!isFullscreen) {
                setShowPalette(true);
                setShowTopology(true);
              }
            }}
            className="node-surface node-pressable bg-accent text-accent-foreground font-semibold px-2.5 py-1 text-xs rounded-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize size={13} />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize size={13} />
                <span>Fullscreen Studio</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Toolbar Ribbon (Tier 2: Palette on Left, Zoom in Center, Topology on Right) */}
      <div className="px-4 py-1.5 bg-surface-muted/50 border-b border-border-strong flex items-center justify-between gap-3 shrink-0 select-none z-20 flex-wrap text-xs">
        {/* Left: Palette Control & Selection Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowPalette((v) => !v)}
            className={`px-2 py-1 text-xs rounded-xs border transition-colors flex items-center gap-1.5 cursor-pointer ${showPalette
              ? 'bg-surface font-semibold text-foreground border-border-strong shadow-xs'
              : 'bg-surface text-foreground-muted border-border-subtle hover:text-foreground'
              }`}
          >
            {showPalette ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
            <span>Palette</span>
          </button>

          {/* Connect Mode button (when a node is selected) */}
          {selectedNodeId && (
            <button
              type="button"
              onClick={() =>
                setConnectingSourceId(connectingSourceId === selectedNodeId ? null : selectedNodeId)
              }
              className={`px-2 py-1 text-2xs rounded-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${connectingSourceId === selectedNodeId
                ? 'bg-link text-white animate-pulse'
                : 'bg-surface hover:bg-surface-muted text-foreground border border-border-strong'
                }`}
            >
              <span>{connectingSourceId === selectedNodeId ? 'Click target node...' : 'Connect to...'}</span>
            </button>
          )}

          {/* Delete Selection button */}
          {(selectedNodeId || selectedEdgeId) && (
            <button
              type="button"
              onClick={handleDeleteSelected}
              aria-label="Delete Selection"
              className="px-2 py-1 text-2xs bg-danger-soft text-danger border border-danger/30 hover:bg-danger-soft/80 rounded-xs cursor-pointer flex items-center gap-1 font-medium"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          )}
        </div>

        {/* Center: Zoom Controls */}
        <div className="flex items-center justify-center">
          <div className="flex items-center bg-surface rounded-xs border border-border-strong p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              aria-label="Zoom Out"
              className="p-1 rounded-xs hover:bg-surface-muted text-foreground-muted hover:text-foreground cursor-pointer"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-2xs font-mono text-foreground w-10 text-center select-none font-semibold">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2, z + 0.15))}
              aria-label="Zoom In"
              className="p-1 rounded-xs hover:bg-surface-muted text-foreground-muted hover:text-foreground cursor-pointer"
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
              title="Reset View"
              className="p-1 rounded-xs hover:bg-surface-muted text-foreground-muted hover:text-foreground cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Topology Control (without duplicate status badge) */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTopology((v) => !v)}
            className={`px-2 py-1 text-xs rounded-xs border transition-colors flex items-center gap-1.5 cursor-pointer ${showTopology
              ? 'bg-surface font-semibold text-foreground border-border-strong shadow-xs'
              : 'bg-surface text-foreground-muted border-border-subtle hover:text-foreground'
              }`}
          >
            {showTopology ? <PanelRightClose size={13} /> : <PanelRightOpen size={13} />}
            <span>Topology</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Layout — Extreme Docks with Central Canvas */}
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
        {/* Left Extreme Palette Dock */}
        {showPalette ? (
          <ComponentPalette
            onAddComponent={handleAddComponent}
            onClose={() => setShowPalette(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowPalette(true)}
            aria-label="Open Component Palette"
            className="absolute left-2 top-3 z-20 node-surface node-pressable bg-surface p-1.5 text-xs text-foreground flex items-center gap-1 rounded-xs shadow-node cursor-pointer"
          >
            <Layers size={14} />
            <ChevronRight size={14} />
          </button>
        )}

        {/* Center Canvas Area */}
        <div
          ref={containerRef}
          onPointerDown={handlePointerDownCanvas}
          onPointerMove={handlePointerMoveCanvas}
          onPointerUp={handlePointerUpCanvas}
          className={`flex-1 h-full relative overflow-hidden bg-background select-none touch-none ${isPanning || dragNodeId ? 'cursor-grabbing' : 'cursor-grab'
            }`}
        >
          {/* SVG Connectors & Nodes Unified Layer */}
          <svg
            ref={canvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none"
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

                const sx = src.x + 77;
                const sy = src.y + 31;
                const tx = tgt.x + 77;
                const ty = tgt.y + 31;

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
                    className="cursor-pointer pointer-events-auto"
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
                        y={(sy + ty) / 2 - 6}
                        textAnchor="middle"
                        fontSize={9}
                        className="font-mono fill-foreground-muted font-medium select-none"
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
                    width={154}
                    height={62}
                    data-node-item="true"
                    className="overflow-visible pointer-events-auto select-none"
                    onPointerDown={(e) => handlePointerDownNode(e, node.id)}
                  >
                    <div
                      className={`node-surface flex flex-col p-2 rounded-node bg-surface text-foreground border border-border-strong transition-shadow cursor-grab active:cursor-grabbing ${isSelected ? 'ring-2 ring-link ring-offset-2 shadow-node-lifted' : 'shadow-node'
                        } ${isConnectingSource ? 'border-link ring-2 ring-link animate-pulse' : ''}`}
                    >
                      <div className="flex items-center gap-1.5 justify-between min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="p-0.5 rounded-xs bg-surface-muted text-foreground-muted shrink-0">
                            {renderPaletteIcon(node.icon, 'w-3 h-3')}
                          </span>
                          <span className="text-xs font-semibold truncate leading-tight text-foreground">{node.label}</span>
                        </div>
                      </div>

                      {/* Concise metrics snippet */}
                      <div className="mt-1 flex items-center justify-between text-2xs font-mono text-foreground-muted border-t border-border-subtle/50 pt-0.5">
                        <span>{node.metrics.qps ? `${Math.round(node.metrics.qps / 1000)}k/s` : '—'}</span>
                        <span>{node.metrics.latencyMs ? `${node.metrics.latencyMs}ms` : ''}</span>
                        {node.metrics.replicationCount && <span>{node.metrics.replicationCount}x</span>}
                      </div>
                    </div>
                  </foreignObject>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Right Extreme Topology Analyzer Dock */}
        {showTopology ? (
          <TopologyAnalyzer
            report={topologyReport}
            onClose={() => setShowTopology(false)}
            onSelectNodes={(nodeIds: string[]) => {
              if (nodeIds[0]) setSelectedNodeId(nodeIds[0]);
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowTopology(true)}
            aria-label="Open Topology Analyzer"
            className="absolute right-2 top-3 z-20 node-surface node-pressable bg-surface p-1.5 text-xs text-foreground flex items-center gap-1 rounded-xs shadow-node cursor-pointer"
          >
            <ChevronLeft size={14} />
            <ShieldAlert size={14} className="text-link" />
          </button>
        )}
      </div>

      {/* Bottom Inspector Bar (when node or edge selected) */}
      {(selectedNode || selectedEdge) && (
        <footer className="p-2.5 bg-surface border-t border-border-strong flex items-center justify-between shrink-0 text-xs z-20">
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
                  className="px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs text-foreground"
                />
              </div>

              <div className="flex items-center gap-1.5 text-2xs text-foreground-muted">
                <span>QPS:</span>
                <input
                  type="number"
                  value={selectedNode.metrics.qps ?? ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || undefined;
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, metrics: { ...n.metrics, qps: val } }
                          : n,
                      ),
                    );
                  }}
                  className="w-16 px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs font-mono text-foreground"
                />
              </div>

              <div className="flex items-center gap-1.5 text-2xs text-foreground-muted">
                <span>Latency (ms):</span>
                <input
                  type="number"
                  value={selectedNode.metrics.latencyMs ?? ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || undefined;
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, metrics: { ...n.metrics, latencyMs: val } }
                          : n,
                      ),
                    );
                  }}
                  className="w-14 px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs font-mono text-foreground"
                />
              </div>

              <div className="flex items-center gap-1.5 text-2xs text-foreground-muted">
                <span>Replicas:</span>
                <input
                  type="number"
                  min={1}
                  value={selectedNode.metrics.replicationCount ?? ''}
                  onChange={(e) => {
                    const val = Number(e.target.value) || undefined;
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNode.id
                          ? { ...n, metrics: { ...n.metrics, replicationCount: val } }
                          : n,
                      ),
                    );
                  }}
                  className="w-12 px-1.5 py-0.5 bg-background border border-border-subtle rounded-xs text-xs font-mono text-foreground"
                />
              </div>
            </div>
          )}

          {selectedEdge && (
            <div className="flex items-center gap-3">
              <span className="font-semibold text-foreground">Connector Protocol:</span>
              <select
                value={selectedEdge.protocol ?? 'https'}
                onChange={(e) => {
                  const val = e.target.value as ProtocolType;
                  setEdges((prev) =>
                    prev.map((edge) => (edge.id === selectedEdge.id ? { ...edge, protocol: val } : edge)),
                  );
                }}
                className="text-xs bg-background border border-border-subtle rounded-xs px-2 py-0.5 cursor-pointer text-foreground"
              >
                <option value="https">HTTPS (REST/GraphQL)</option>
                <option value="grpc">gRPC / Protobuf</option>
                <option value="sql">SQL Connection Pool</option>
                <option value="pubsub">Pub/Sub Message Stream</option>
                <option value="websocket">WebSocket Persistent</option>
                <option value="tcp">Raw TCP</option>
              </select>

              <input
                type="text"
                placeholder="Edge label (optional)..."
                value={selectedEdge.label ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  setEdges((prev) =>
                    prev.map((edge) => (edge.id === selectedEdge.id ? { ...edge, label: val } : edge)),
                  );
                }}
                className="px-2 py-0.5 bg-background border border-border-subtle rounded-xs text-xs text-foreground"
              />
            </div>
          )}

          <button
            type="button"
            onClick={handleDeleteSelected}
            className="px-2 py-1 bg-danger-soft text-danger border border-danger/30 rounded-xs text-2xs hover:bg-danger-soft/80 transition-colors flex items-center gap-1 cursor-pointer font-medium"
          >
            <Trash2 size={12} />
            <span>Delete Selected</span>
          </button>
        </footer>
      )}
    </div>
  );
}
