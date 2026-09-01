'use client';

import { useEffect, useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Layers,
  Sparkles,
  Server,
  ArrowRight,
  ShieldAlert,
  Radio,
  ExternalLink,
} from 'lucide-react';
import type { Concept, TenDimensions } from '@/content/concepts';

interface ComponentReferenceModalProps {
  concept: Concept;
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'progression' | 'tradeoffs' | 'production' | 'interview';

export function ComponentReferenceModal({
  concept,
  isOpen,
  onClose,
}: ComponentReferenceModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('progression');
  const dimensions = concept.dimensions;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reference-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl max-h-full bg-surface border border-border-strong rounded-node shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Modal Header */}
        <header className="p-5 border-b border-border-subtle bg-surface-muted/40 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold uppercase tracking-wider bg-accent/20 text-accent border border-accent/30">
                <Sparkles size={11} className="text-accent" />
                10-Dimension Architectural Reference
              </span>
            </div>
            <h2 id="reference-modal-title" className="text-xl font-bold font-sans text-foreground">
              {concept.term}
            </h2>
            <p className="text-xs text-foreground-muted max-w-xl">
              {concept.definition}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-muted rounded-md transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Tab Navigation */}
        {dimensions && (
          <nav className="flex items-center border-b border-border-subtle px-5 bg-surface gap-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveTab('progression')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'progression'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              <Layers size={14} />
              1. The Progression (01-05)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tradeoffs')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'tradeoffs'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              <CheckCircle2 size={14} />
              2. Trade-Offs (06)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('production')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'production'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              <Server size={14} />
              3. Production Reality (07 & 10)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('interview')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                activeTab === 'interview'
                  ? 'border-accent text-accent'
                  : 'border-transparent text-foreground-muted hover:text-foreground'
              }`}
            >
              <Radio size={14} />
              4. Interview Signals (08-09)
            </button>
          </nav>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-sm space-y-6">
          {!dimensions ? (
            <div className="p-6 text-center text-foreground-muted">
              <p>Standardized 10-dimension architectural spec is currently being curated for this component.</p>
              <p className="mt-2 text-xs text-foreground-muted/70">Why it matters: {concept.matters}</p>
            </div>
          ) : (
            <>
              {activeTab === 'progression' && (
                <ProgressionTab dimensions={dimensions} />
              )}
              {activeTab === 'tradeoffs' && (
                <TradeoffsTab tradeOffs={dimensions.tradeOffs} />
              )}
              {activeTab === 'production' && (
                <ProductionTab dimensions={dimensions} />
              )}
              {activeTab === 'interview' && (
                <InterviewTab dimensions={dimensions} />
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="p-4 border-t border-border-subtle bg-surface-muted/30 flex items-center justify-between text-xs text-foreground-muted">
          <span>GetCracked Universal System Design Reference</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-surface border border-border-strong text-foreground font-semibold rounded-md hover:bg-surface-muted transition-colors cursor-pointer"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

function ProgressionTab({ dimensions }: { dimensions: TenDimensions }) {
  return (
    <div className="space-y-4">
      {/* 01 Problem */}
      <div className="p-4 rounded-md border border-border-subtle bg-surface-muted/20 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-accent">
          <span>01 — Problem</span>
          <span className="text-foreground-muted font-sans font-normal text-2xs">What problem exists?</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.problem}</p>
      </div>

      {/* 02 Why it happens */}
      <div className="p-4 rounded-md border border-border-subtle bg-surface-muted/20 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-accent">
          <span>02 — Why It Happens</span>
          <span className="text-foreground-muted font-sans font-normal text-2xs">Root cause / trigger</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.whyItHappens}</p>
      </div>

      {/* Flow arrow */}
      <div className="flex justify-center text-foreground-muted/40">
        <ArrowRight size={18} className="rotate-90" />
      </div>

      {/* 03 Primitive Solution */}
      <div className="p-4 rounded-md border border-border-subtle bg-surface-muted/20 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-foreground-muted">
          <span>03 — Primitive Solution</span>
          <span className="text-foreground-muted font-sans font-normal text-2xs">Naive first approach</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.primitiveSolution}</p>
      </div>

      {/* 04 Scale Limit */}
      <div className="p-4 rounded-md border border-amber-500/20 bg-amber-500/5 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-amber-500">
          <TrendingDown size={14} />
          <span>04 — Scale Limit</span>
          <span className="text-foreground-muted font-sans font-normal text-2xs">Where the naive approach breaks</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.scaleLimit}</p>
      </div>

      {/* Flow arrow */}
      <div className="flex justify-center text-foreground-muted/40">
        <ArrowRight size={18} className="rotate-90" />
      </div>

      {/* 05 Component */}
      <div className="p-4 rounded-md border border-accent/40 bg-accent/10 flex flex-col gap-1.5">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-accent">
          <Layers size={14} />
          <span>05 — Architectural Component</span>
          <span className="text-foreground-muted font-sans font-normal text-2xs">The standard scalable solution</span>
        </div>
        <p className="text-sm font-semibold text-foreground leading-relaxed">{dimensions.component}</p>
      </div>
    </div>
  );
}

function TradeoffsTab({ tradeOffs }: { tradeOffs: TenDimensions['tradeOffs'] }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-accent">
        <span>06 — Trade-Offs Matrix</span>
        <span className="text-foreground-muted font-sans font-normal text-2xs">What do we gain and what do we sacrifice?</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gains */}
        <div className="p-4 rounded-md border border-emerald-500/30 bg-emerald-500/5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 size={15} />
            <span>Architectural Gains</span>
          </div>
          <ul className="space-y-2 text-xs text-foreground/90">
            {tradeOffs.gains.map((gain, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">•</span>
                <span>{gain}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sacrifices */}
        <div className="p-4 rounded-md border border-rose-500/30 bg-rose-500/5 flex flex-col gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle size={15} />
            <span>Operational & Cost Sacrifices</span>
          </div>
          <ul className="space-y-2 text-xs text-foreground/90">
            {tradeOffs.sacrifices.map((sacrifice, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-rose-500 font-bold">•</span>
                <span>{sacrifice}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ProductionTab({ dimensions }: { dimensions: TenDimensions }) {
  return (
    <div className="space-y-6">
      {/* 07 Failure Modes */}
      <div className="p-4 rounded-md border border-rose-500/20 bg-rose-500/5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-rose-500">
          <ShieldAlert size={15} />
          <span>07 — Production Failure Modes</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.failureModes}</p>
      </div>

      {/* 10 Real Systems */}
      <div className="p-4 rounded-md border border-border-subtle bg-surface-muted/20 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-accent">
          <Server size={15} />
          <span>10 — Real-World Deployments</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.realSystem}</p>
      </div>
    </div>
  );
}

function InterviewTab({ dimensions }: { dimensions: TenDimensions }) {
  return (
    <div className="space-y-6">
      {/* 09 Interview Signals */}
      <div className="p-4 rounded-md border border-accent/30 bg-accent/5 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-accent">
          <Radio size={15} />
          <span>09 — Interview Signals & Calibration</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.interviewSignal}</p>
      </div>

      {/* 08 Alternatives */}
      <div className="p-4 rounded-md border border-border-subtle bg-surface-muted/20 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-mono font-semibold uppercase text-foreground-muted">
          <span>08 — Competing Architectural Alternatives</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dimensions.alternatives.map((alt, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs bg-surface border border-border-strong text-foreground font-medium"
            >
              <ExternalLink size={11} className="text-foreground-muted" />
              {alt}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
