'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Layers,
  Radio,
  Server,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  X,
} from 'lucide-react';
import type { Concept, TenDimensions } from '@/content/concepts';
import { useFocusTrap } from '@/lib/use-focus-trap';

interface ComponentReferenceModalProps {
  concept: Concept;
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'progression' | 'tradeoffs' | 'production' | 'interview';

const TABS: Array<{ id: TabKey; label: string; icon: typeof Layers }> = [
  { id: 'progression', label: '1. The Progression (01-05)', icon: Layers },
  { id: 'tradeoffs', label: '2. Trade-Offs (06)', icon: CheckCircle2 },
  { id: 'production', label: '3. Production Reality (07 & 10)', icon: Server },
  { id: 'interview', label: '4. Interview Signals (08-09)', icon: Radio },
];

export function ComponentReferenceModal({
  concept,
  isOpen,
  onClose,
}: ComponentReferenceModalProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('progression');
  const bodyRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const dimensions = concept.dimensions;

  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="reference-modal-title"
      className="fixed inset-0 z-70 flex items-center justify-center p-2.5 sm:p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      {/* Click outside to close */}
      <div
        className="fixed inset-0 cursor-default"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={modalRef}
        className="relative w-full max-w-3xl max-h-full my-auto bg-surface border-2 border-border-strong rounded-node shadow-2xl flex flex-col overflow-hidden z-10 gc-modal-enter"
      >
        {/* Modal Header */}
        <header className="p-4 border-b border-border-subtle bg-surface-muted/50 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-node text-2xs font-bold uppercase tracking-wider bg-accent text-accent-foreground border border-border-strong shadow-2xs">
                <Sparkles size={11} className="shrink-0" />
                10D Architectural Reference
              </span>
            </div>
            <h2 id="reference-modal-title" className="text-xl font-bold font-sans text-foreground">
              {concept.term}
            </h2>
            <p className="text-xs text-foreground-muted max-w-xl leading-relaxed">
              {concept.definition}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 text-foreground-muted hover:text-foreground hover:bg-surface-muted rounded-xs border border-transparent hover:border-border-subtle transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </header>

        {/* Tab Navigation - Pill Segmented Control with clear contrast in Light & Dark mode */}
        {dimensions && (
          <nav className="flex items-center border-b border-border-subtle px-4 py-2 bg-surface-muted/30 gap-2 overflow-x-auto">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-node border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap active:scale-[0.98] ${
                    isActive
                      ? 'bg-accent text-accent-foreground border-border-strong shadow-xs'
                      : 'bg-surface text-foreground-muted hover:text-foreground hover:bg-surface border-border-subtle'
                  }`}
                >
                  <tab.icon size={13} className="shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Modal Body */}
        <div ref={bodyRef} className="p-5 overflow-y-auto flex-1 text-sm space-y-5">
          {!dimensions ? (
            <div className="p-6 text-center text-foreground-muted">
              <p>Standardized 10-dimension architectural spec is currently being curated for this component.</p>
              <p className="mt-2 text-xs text-foreground-muted/70">Why it matters: {concept.matters}</p>
            </div>
          ) : (
            <div key={activeTab} className="gc-tab-enter">
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
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <footer className="p-3.5 border-t border-border-subtle bg-surface-muted/30 flex items-center justify-between text-xs text-foreground-muted">
          <span>GetCracked Universal System Design Reference</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 bg-surface border border-border-strong text-foreground font-semibold rounded-node hover:bg-surface-muted transition-colors cursor-pointer shadow-2xs"
          >
            Close
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  );
}

function ProgressionTab({ dimensions }: { dimensions: TenDimensions }) {
  return (
    <div className="space-y-3.5">
      {/* 01 Problem */}
      <div className="p-4 rounded-node border border-border-subtle bg-surface-muted/30 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider text-foreground bg-surface border border-border-subtle px-2 py-0.5 rounded-xs">
            01 — Problem
          </span>
          <span className="text-foreground-muted text-2xs">What problem exists?</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.problem}</p>
      </div>

      {/* 02 Why it happens */}
      <div className="p-4 rounded-node border border-border-subtle bg-surface-muted/30 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider text-foreground bg-surface border border-border-subtle px-2 py-0.5 rounded-xs">
            02 — Why It Happens
          </span>
          <span className="text-foreground-muted text-2xs">Root cause / trigger</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.whyItHappens}</p>
      </div>

      {/* Flow arrow */}
      <div className="flex justify-center text-foreground-muted/40">
        <ArrowRight size={16} className="rotate-90" />
      </div>

      {/* 03 Primitive Solution */}
      <div className="p-4 rounded-node border border-border-subtle bg-surface-muted/30 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider text-foreground-muted bg-surface border border-border-subtle px-2 py-0.5 rounded-xs">
            03 — Primitive Solution
          </span>
          <span className="text-foreground-muted text-2xs">Naive first approach</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.primitiveSolution}</p>
      </div>

      {/* 04 Scale Limit */}
      <div className="p-4 rounded-node border border-danger/30 bg-danger-soft/20 flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider text-danger bg-danger-soft/50 border border-danger/30 px-2 py-0.5 rounded-xs flex items-center gap-1">
            <TrendingDown size={12} />
            04 — Scale Limit
          </span>
          <span className="text-foreground-muted text-2xs">Where the naive approach breaks</span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.scaleLimit}</p>
      </div>

      {/* Flow arrow */}
      <div className="flex justify-center text-foreground-muted/40">
        <ArrowRight size={16} className="rotate-90" />
      </div>

      {/* 05 Component */}
      <div className="p-4 rounded-node border-2 border-border-strong bg-accent/20 flex flex-col gap-1.5 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider bg-accent text-accent-foreground border border-border-strong px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-2xs">
            <Layers size={12} />
            05 — Architectural Component
          </span>
          <span className="text-foreground-muted text-2xs">The standard scalable solution</span>
        </div>
        <p className="text-sm font-semibold text-foreground leading-relaxed">{dimensions.component}</p>
      </div>
    </div>
  );
}

function TradeoffsTab({ tradeOffs }: { tradeOffs: TenDimensions['tradeOffs'] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-2xs font-mono font-bold uppercase tracking-wider text-foreground bg-surface border border-border-subtle px-2 py-0.5 rounded-xs">
          06 — Trade-Offs Matrix
        </span>
        <span className="text-foreground-muted text-2xs">What do we gain and what do we sacrifice?</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Gains */}
        <div className="p-4 rounded-node border border-success/40 bg-success-soft/30 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-success">
            <CheckCircle2 size={15} />
            <span>Architectural Gains</span>
          </div>
          <ul className="space-y-2 text-xs text-foreground">
            {tradeOffs.gains.map((gain, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-success font-bold">•</span>
                <span className="leading-relaxed">{gain}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Sacrifices */}
        <div className="p-4 rounded-node border border-danger/40 bg-danger-soft/30 flex flex-col gap-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-danger">
            <AlertTriangle size={15} />
            <span>Operational & Cost Sacrifices</span>
          </div>
          <ul className="space-y-2 text-xs text-foreground">
            {tradeOffs.sacrifices.map((sacrifice, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-danger font-bold">•</span>
                <span className="leading-relaxed">{sacrifice}</span>
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
    <div className="space-y-4">
      {/* 07 Failure Modes */}
      <div className="p-4 rounded-node border border-danger/30 bg-danger-soft/20 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider text-danger bg-danger-soft/50 border border-danger/30 px-2 py-0.5 rounded-xs flex items-center gap-1">
            <ShieldAlert size={13} />
            07 — Production Failure Modes
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.failureModes}</p>
      </div>

      {/* 10 Real Systems */}
      <div className="p-4 rounded-node border border-border-subtle bg-surface-muted/30 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider text-foreground bg-surface border border-border-subtle px-2 py-0.5 rounded-xs flex items-center gap-1">
            <Server size={13} />
            10 — Real-World Deployments
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.realSystem}</p>
      </div>
    </div>
  );
}

function InterviewTab({ dimensions }: { dimensions: TenDimensions }) {
  return (
    <div className="space-y-4">
      {/* 09 Interview Signals */}
      <div className="p-4 rounded-node border-2 border-border-strong bg-surface flex flex-col gap-2 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider bg-accent text-accent-foreground border border-border-strong px-2 py-0.5 rounded-xs flex items-center gap-1 shadow-2xs">
            <Radio size={13} />
            09 — Interview Signals & Calibration
          </span>
        </div>
        <p className="text-sm text-foreground leading-relaxed">{dimensions.interviewSignal}</p>
      </div>

      {/* 08 Alternatives */}
      <div className="p-4 rounded-node border border-border-subtle bg-surface-muted/30 flex flex-col gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-2xs font-mono font-bold uppercase tracking-wider text-foreground-muted bg-surface border border-border-subtle px-2 py-0.5 rounded-xs">
            08 — Competing Architectural Alternatives
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {dimensions.alternatives.map((alt, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-node text-xs bg-surface border border-border-strong text-foreground font-medium shadow-2xs"
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
