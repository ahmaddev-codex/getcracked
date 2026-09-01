'use client';

import {
  Activity,
  AlertTriangle,
  Flame,
  Gauge,
  RotateCcw,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import type {
  ChaosEvent,
  SimulationConfig,
  SimulationReport,
  TrafficProfile,
} from '@/lib/system-design/simulation';

interface SimulationPanelProps {
  config: SimulationConfig;
  report: SimulationReport;
  onConfigChange: (newConfig: SimulationConfig) => void;
  onReset: () => void;
  onOpenRemediation?: () => void;
}

const TRAFFIC_PRESETS = [
  { label: '1k', value: 1_000 },
  { label: '10k', value: 10_000 },
  { label: '50k', value: 50_000 },
  { label: '100k', value: 100_000 },
  { label: '250k', value: 250_000 },
  { label: '500k', value: 500_000 },
];

const PROFILES: Array<{ id: TrafficProfile; label: string; desc: string }> = [
  { id: 'steady', label: 'Steady', desc: 'Even, consistent load' },
  { id: 'spiky', label: 'Spiky (Surge)', desc: '2.5x traffic burst' },
  { id: 'read-heavy', label: 'Read-Heavy', desc: '99:1 read/write ratio' },
  { id: 'write-heavy', label: 'Write-Heavy', desc: 'High write throughput' },
];

const CHAOS_TOGGLES: Array<{
  id: ChaosEvent;
  label: string;
  desc: string;
  iconColor: string;
}> = [
  {
    id: 'primary-db-crash',
    label: 'Kill Primary DB',
    desc: 'Simulates hardware crash / OOM kill',
    iconColor: 'text-danger',
  },
  {
    id: 'cache-stampede',
    label: 'Cache Stampede',
    desc: 'Wipes cache; 100% reads hit database',
    iconColor: 'text-warning',
  },
  {
    id: 'slow-consumer-lag',
    label: 'Throttle Workers',
    desc: 'Worker fleet stalls; queues fill up',
    iconColor: 'text-link',
  },
  {
    id: 'network-partition',
    label: 'Network Partition',
    desc: 'Cross-AZ network timeout failure',
    iconColor: 'text-accent-foreground',
  },
];

export function SimulationPanel({
  config,
  report,
  onConfigChange,
  onReset,
  onOpenRemediation,
}: SimulationPanelProps) {
  const toggleChaos = (chaos: ChaosEvent) => {
    const isPresent = config.activeChaos.includes(chaos);
    const updated = isPresent
      ? config.activeChaos.filter((c) => c !== chaos)
      : [...config.activeChaos, chaos];
    onConfigChange({ ...config, activeChaos: updated });
  };

  const getHealthBadge = () => {
    switch (report.overallHealth) {
      case 'healthy':
        return {
          bg: 'bg-success/15 text-success border-success/30',
          label: 'System Healthy',
          icon: CheckCircle2,
        };
      case 'warning':
        return {
          bg: 'bg-warning/15 text-warning border-warning/30',
          label: 'Degraded (Near Cap)',
          icon: AlertTriangle,
        };
      case 'critical':
        return {
          bg: 'bg-danger/15 text-danger border-danger/30',
          label: 'Critical Saturation',
          icon: Flame,
        };
      case 'crashed':
        return {
          bg: 'bg-danger text-white border-danger font-bold animate-pulse',
          label: 'Outage / Crash',
          icon: Flame,
        };
    }
  };

  const healthBadge = getHealthBadge();
  const HealthIcon = healthBadge.icon;

  return (
    <div className="flex flex-col gap-4 p-3 bg-surface border border-border-strong rounded-node shadow-node select-none">
      {/* Header & Overall Health HUD */}
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle pb-2.5">
        <div className="flex items-center gap-1.5">
          <Activity size={16} className="text-link" />
          <span className="text-xs font-bold uppercase tracking-wider text-foreground">
            Live Simulation Engine
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-2xs font-semibold ${healthBadge.bg}`}
          >
            <HealthIcon size={12} />
            <span>{healthBadge.label}</span>
          </span>

          <button
            type="button"
            onClick={onReset}
            title="Reset Simulation"
            className="p-1 rounded border border-border-subtle hover:bg-surface-muted text-foreground-muted hover:text-foreground cursor-pointer transition-colors"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* System Vitals Indicators */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-2 rounded-xs border border-border-subtle bg-surface-muted/30 flex flex-col">
          <span className="text-3xs uppercase tracking-wider text-foreground-muted font-medium">
            P99 Latency
          </span>
          <span
            className={`text-sm font-mono font-bold ${
              report.p99LatencyMs > 200
                ? 'text-danger'
                : report.p99LatencyMs > 100
                  ? 'text-warning'
                  : 'text-success'
            }`}
          >
            {report.p99LatencyMs} ms
          </span>
          <span className="text-3xs text-foreground-muted">Target: &lt;200ms</span>
        </div>

        <div className="p-2 rounded-xs border border-border-subtle bg-surface-muted/30 flex flex-col">
          <span className="text-3xs uppercase tracking-wider text-foreground-muted font-medium">
            Availability
          </span>
          <span
            className={`text-sm font-mono font-bold ${
              report.availabilityPct < 99.9 ? 'text-danger' : 'text-success'
            }`}
          >
            {report.availabilityPct}%
          </span>
          <span className="text-3xs text-foreground-muted">SLO: 99.99%</span>
        </div>

        <div className="p-2 rounded-xs border border-border-subtle bg-surface-muted/30 flex flex-col">
          <span className="text-3xs uppercase tracking-wider text-foreground-muted font-medium">
            Effective Load
          </span>
          <span className="text-sm font-mono font-bold text-foreground">
            {report.effectiveQps.toLocaleString()}
          </span>
          <span className="text-3xs text-foreground-muted font-mono">QPS Ingress</span>
        </div>
      </div>

      {/* Traffic Dial / QPS Slider */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground flex items-center gap-1">
            <Gauge size={13} className="text-link" />
            <span>Ingress Traffic Rate:</span>
          </span>
          <span className="font-mono font-bold text-link">
            {config.globalQps.toLocaleString()} QPS
          </span>
        </div>

        <input
          type="range"
          min="1000"
          max="500000"
          step="5000"
          value={config.globalQps}
          onChange={(e) =>
            onConfigChange({ ...config, globalQps: parseInt(e.target.value, 10) })
          }
          className="w-full accent-link cursor-pointer h-1.5 bg-surface-muted rounded-lg"
        />

        <div className="flex items-center justify-between gap-1">
          {TRAFFIC_PRESETS.map((preset) => (
            <button
              key={preset.value}
              type="button"
              onClick={() => onConfigChange({ ...config, globalQps: preset.value })}
              className={`px-1.5 py-0.5 rounded text-3xs font-mono font-semibold border transition-all duration-(--duration-fast) active:scale-[0.96] cursor-pointer ${
                config.globalQps === preset.value
                  ? 'border-link bg-link text-white shadow-xs'
                  : 'border-border-subtle bg-surface hover:bg-surface-muted text-foreground-muted'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Traffic Profile Selector */}
      <div className="flex flex-col gap-1.5">
        <span className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted">
          Traffic Pattern Profile
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          {PROFILES.map((prof) => (
            <button
              key={prof.id}
              type="button"
              onClick={() => onConfigChange({ ...config, profile: prof.id })}
              className={`p-1.5 rounded-xs border text-left cursor-pointer transition-all duration-(--duration-fast) active:scale-[0.98] ${
                config.profile === prof.id
                  ? 'border-link bg-link/10 text-foreground font-semibold ring-1 ring-link'
                  : 'border-border-subtle bg-surface hover:bg-surface-muted text-foreground-muted'
              }`}
            >
              <div className="text-2xs font-medium">{prof.label}</div>
              <div className="text-3xs opacity-80 line-clamp-1">{prof.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Chaos Injection Panel */}
      <div className="flex flex-col gap-1.5">
        <span className="text-2xs font-semibold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
          <Zap size={12} className="text-warning" />
          <span>Live Chaos Injection (&ldquo;What Breaks Next?&rdquo;)</span>
        </span>

        <div className="grid grid-cols-2 gap-1.5">
          {CHAOS_TOGGLES.map((chaos) => {
            const isActive = config.activeChaos.includes(chaos.id);
            return (
              <button
                key={chaos.id}
                type="button"
                onClick={() => toggleChaos(chaos.id)}
                className={`p-1.5 rounded-xs border text-left cursor-pointer transition-all duration-(--duration-fast) active:scale-[0.98] flex flex-col justify-between ${
                  isActive
                    ? 'border-danger bg-danger/10 text-danger font-bold ring-1 ring-danger shadow-xs'
                    : 'border-border-subtle bg-surface hover:bg-surface-muted text-foreground-muted'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-2xs">{chaos.label}</span>
                  {isActive && <span className="text-3xs uppercase font-mono">ACTIVE</span>}
                </div>
                <span className="text-3xs opacity-75 line-clamp-1">{chaos.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottlenecks / Remediation Prompt Trigger */}
      {report.remediationPrompts.length > 0 && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-2.5 rounded-node border border-danger/40 bg-danger/10 flex flex-col gap-2 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-1.5 text-danger font-bold text-xs">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Bottleneck Detected ({report.remediationPrompts.length})</span>
          </div>
          <p className="text-2xs text-foreground-muted line-clamp-2">
            {report.remediationPrompts[0]?.triggerReason}
          </p>
          {onOpenRemediation && (
            <button
              type="button"
              onClick={onOpenRemediation}
              className="px-2.5 py-1 rounded-xs bg-danger text-white text-xs font-semibold hover:bg-danger/90 cursor-pointer transition-all duration-(--duration-fast) active:scale-[0.98] shadow-xs flex items-center justify-center gap-1.5"
            >
              <Flame size={12} className="shrink-0" />
              <span>Fix with Socratic Guidance</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
