'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, X, XCircle } from 'lucide-react';
import type { CanvasEdge, CanvasNode, TopologyReport } from '@/lib/system-design/canvas-types';
import { analyzeTopology } from '@/lib/system-design/topology';

export interface TopologyAnalyzerProps {
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
  report?: TopologyReport;
  onSelectNodes?: (nodeIds: string[]) => void;
  onClose?: () => void;
}

export function TopologyAnalyzer({
  nodes = [],
  edges = [],
  report,
  onSelectNodes,
  onClose,
}: TopologyAnalyzerProps) {
  const computedReport = useMemo(
    () => report ?? analyzeTopology(nodes, edges),
    [report, nodes, edges],
  );

  const severityIcon = (level: 'error' | 'warning' | 'info' | 'success') => {
    switch (level) {
      case 'error':
        return <XCircle className="text-danger shrink-0" size={14} />;
      case 'warning':
        return <AlertTriangle className="text-warning shrink-0" size={14} />;
      case 'info':
        return <Info className="text-link shrink-0" size={14} />;
      case 'success':
        return <CheckCircle className="text-success shrink-0" size={14} />;
    }
  };

  const spofCount = computedReport.stats.singlePointsOfFailure;
  const isClean = computedReport.diagnostics.length === 0;

  return (
    <aside
      aria-label="Topology and reliability analysis"
      className="flex flex-col h-full bg-surface border-l border-border-strong w-72 shrink-0 select-none z-10"
    >
      {/* Top Header */}
      <div className="px-3 py-2.5 border-b border-border-strong flex items-center justify-between bg-surface-muted/40 shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <ShieldAlert size={14} className="text-link shrink-0" />
          <h3 className="text-xs font-semibold text-foreground truncate">Topology Check</h3>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${
              spofCount === 0
                ? 'bg-success-soft text-success border-success/30'
                : 'bg-danger-soft text-danger border-danger/30'
            }`}
          >
            {spofCount === 0 ? '✓ Resilient' : `${spofCount} SPOF`}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Hide Topology Analyzer"
              className="p-1 rounded-xs hover:bg-surface text-foreground-muted hover:text-foreground cursor-pointer transition-colors"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Main Diagnostics List (Scrollable Area) */}
      <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2">
        {isClean ? (
          <div className="p-2.5 rounded-xs border border-success/30 bg-success-soft/20 flex items-center gap-2 text-xs text-foreground">
            <CheckCircle size={14} className="text-success shrink-0" />
            <span className="font-semibold text-success">Resilient</span>
            <span className="text-foreground-muted">• No SPOF detected</span>
          </div>
        ) : (
          computedReport.diagnostics.map((diag, index) => (
            <button
              key={`${diag.title}-${index}`}
              type="button"
              onClick={() => {
                if (diag.nodeIds && onSelectNodes) {
                  onSelectNodes(diag.nodeIds);
                }
              }}
              className={`p-2.5 rounded-xs border text-left text-xs flex flex-col gap-1 transition-colors cursor-pointer ${
                diag.level === 'error'
                  ? 'border-danger/30 bg-danger-soft/20 hover:bg-danger-soft/40'
                  : diag.level === 'warning'
                    ? 'border-warning/30 bg-warning-soft/20 hover:bg-warning-soft/40'
                    : 'border-border-subtle bg-surface-muted/30 hover:bg-surface-muted/50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                {severityIcon(diag.level)}
                <span className="truncate">{diag.title}</span>
              </div>
              <p className="text-foreground-muted leading-relaxed text-2xs pl-5">
                {diag.message}
              </p>
              {diag.recommendation && (
                <div className="mt-0.5 pt-1 border-t border-border-subtle text-2xs text-foreground/90 pl-5">
                  <span className="font-semibold text-warning">Fix: </span>
                  {diag.recommendation}
                </div>
              )}
            </button>
          ))
        )}
      </div>

      {/* Bottom Metrics Strip (Pinned to the Bottom) */}
      <div className="grid grid-cols-2 gap-1.5 p-2 border-t border-border-strong bg-surface-muted/30 text-xs shrink-0">
        <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-surface border border-border-subtle shadow-xs">
          <span className="text-foreground-muted text-2xs uppercase tracking-wider font-medium">SPOF</span>
          <span
            className={`font-mono text-xs font-bold ${spofCount > 0 ? 'text-danger' : 'text-success'}`}
          >
            {spofCount}
          </span>
        </div>
        <div className="flex items-center justify-between px-2 py-1 rounded-xs bg-surface border border-border-subtle shadow-xs">
          <span className="text-foreground-muted text-2xs uppercase tracking-wider font-medium">P99 Latency</span>
          <span className="font-mono text-xs font-bold text-foreground">
            {computedReport.stats.estimatedP99LatencyMs}ms
          </span>
        </div>
      </div>
    </aside>
  );
}
