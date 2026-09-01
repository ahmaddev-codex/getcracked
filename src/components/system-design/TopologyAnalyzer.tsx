'use client';

import { useMemo } from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, XCircle, Zap } from 'lucide-react';
import type { CanvasEdge, CanvasNode, TopologyReport } from '@/lib/system-design/canvas-types';
import { analyzeTopology } from '@/lib/system-design/topology';

export interface TopologyAnalyzerProps {
  nodes?: CanvasNode[];
  edges?: CanvasEdge[];
  report?: TopologyReport;
  onSelectNodes?: (nodeIds: string[]) => void;
}

export function TopologyAnalyzer({ nodes = [], edges = [], report, onSelectNodes }: TopologyAnalyzerProps) {
  const computedReport = useMemo(
    () => report ?? analyzeTopology(nodes, edges),
    [report, nodes, edges],
  );

  const severityIcon = (level: 'error' | 'warning' | 'info' | 'success') => {
    switch (level) {
      case 'error':
        return <XCircle className="text-danger shrink-0" size={16} />;
      case 'warning':
        return <AlertTriangle className="text-accent-strong shrink-0" size={16} />;
      case 'info':
        return <Info className="text-link shrink-0" size={16} />;
      case 'success':
        return <CheckCircle className="text-success shrink-0" size={16} />;
    }
  };

  const spofCount = computedReport.stats.singlePointsOfFailure;

  return (
    <aside
      aria-label="Topology and reliability analysis"
      className="node-surface flex flex-col h-full bg-surface"
    >
      <div className="flex items-center justify-between p-3 border-b border-border-strong bg-surface-muted/50">
        <div className="flex items-center gap-2">
          <ShieldAlert size={16} />
          <h3 className="text-xs font-semibold uppercase tracking-wider">Topology Analyzer</h3>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            spofCount === 0 ? 'bg-success text-success-foreground' : 'bg-danger text-danger-foreground'
          }`}
        >
          {spofCount === 0 ? 'Resilient' : `${spofCount} SPOF`}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 border-b border-border-strong text-xs">
        <div className="flex flex-col gap-0.5 p-2 rounded-xs bg-surface-muted/40 border border-border-strong/40">
          <span className="text-2xs uppercase tracking-wider text-foreground-muted">SPOF</span>
          <span
            className={`font-mono text-sm font-bold ${spofCount > 0 ? 'text-danger' : 'text-success'}`}
          >
            {spofCount} found
          </span>
        </div>
        <div className="flex flex-col gap-0.5 p-2 rounded-xs bg-surface-muted/40 border border-border-strong/40">
          <span className="text-2xs uppercase tracking-wider text-foreground-muted">P99 Latency</span>
          <span className="font-mono text-sm font-bold flex items-center gap-1">
            <Zap size={12} className="text-accent-strong" />
            {computedReport.stats.estimatedP99LatencyMs}ms
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2.5">
        {computedReport.diagnostics.length === 0 ? (
          <div className="p-4 rounded-xs border border-success/40 bg-success/10 flex items-center gap-2 text-xs text-foreground">
            <CheckCircle size={16} className="text-success shrink-0" />
            <span>Architecture is resilient! No critical SPOF or coupling bottlenecks found.</span>
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
              className={`p-2.5 rounded-xs border text-left text-xs flex flex-col gap-1 transition-colors ${
                diag.level === 'error'
                  ? 'border-danger/40 bg-danger/5 hover:bg-danger/10'
                  : diag.level === 'warning'
                    ? 'border-accent-strong/40 bg-accent-strong/5 hover:bg-accent-strong/10'
                    : 'border-border-strong/40 bg-surface-muted/30 hover:bg-surface-muted/50'
              }`}
            >
              <div className="flex items-center gap-1.5 font-semibold text-xs">
                {severityIcon(diag.level)}
                <span>{diag.title}</span>
              </div>
              <p className="text-foreground-muted leading-relaxed text-2xs pl-5">
                {diag.message}
              </p>
              {diag.recommendation && (
                <div className="mt-1 pt-1 border-t border-border-strong/30 text-2xs text-foreground/80 pl-5">
                  <span className="font-semibold text-accent-strong">Recommendation: </span>
                  {diag.recommendation}
                </div>
              )}
            </button>
          ))
        )}
      </div>
    </aside>
  );
}
