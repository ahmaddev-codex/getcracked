'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  X,
  Star,
} from 'lucide-react';
import type { CandidateScorecard } from '@/lib/interviews/types';
import { findConcept, type Concept } from '@/content/concepts';
import { ComponentReferenceModal } from '@/components/system-design/ComponentReferenceModal';
import { useFocusTrap } from '@/lib/use-focus-trap';

interface MockScorecardModalProps {
  scorecard: CandidateScorecard;
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
}

export function MockScorecardModal({
  scorecard,
  isOpen,
  onClose,
  onRetry,
}: MockScorecardModalProps) {
  const [activeModalConcept, setActiveModalConcept] = useState<Concept | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, isOpen);

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

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((val) => (
          <Star
            key={val}
            size={13}
            className={
              val <= rating
                ? 'text-amber-500 fill-amber-500'
                : 'text-border-subtle fill-transparent'
            }
          />
        ))}
      </div>
    );
  };

  const minutesTaken = (scorecard.durationSeconds / 60).toFixed(1);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scorecard-title"
      className="fixed inset-0 z-70 flex items-center justify-center p-2.5 sm:p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="fixed inset-0 cursor-default" onClick={onClose} aria-hidden="true" />

      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-full my-auto bg-surface border-2 border-border-strong rounded-node shadow-2xl flex flex-col overflow-hidden z-10 gc-modal-enter"
      >
        {/* Header */}
        <header className="p-5 border-b border-border-subtle bg-surface-muted/50 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-node text-2xs font-bold uppercase tracking-wider bg-accent text-accent-foreground border border-border-strong shadow-2xs">
                <Award size={12} className="shrink-0" />
                Interview Evaluation Scorecard
              </span>
              <span className="text-2xs font-mono text-foreground-muted">
                {minutesTaken}m / {scorecard.targetMinutes}m target
              </span>
            </div>
            <h2 id="scorecard-title" className="text-xl font-bold font-sans text-foreground">
              {scorecard.trackTitle}
            </h2>
            <p className="text-xs font-medium text-foreground leading-relaxed">
              {scorecard.overallFeedback}
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

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs">
          {/* Rubric Ratings Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3 rounded-node bg-surface-muted/30 border border-border-subtle">
            <div className="flex items-center justify-between p-2 bg-surface rounded-xs border border-border-subtle">
              <span className="font-semibold text-foreground">Problem Solving</span>
              {renderStars(scorecard.ratings.problemSolving)}
            </div>

            <div className="flex items-center justify-between p-2 bg-surface rounded-xs border border-border-subtle">
              <span className="font-semibold text-foreground">
                {scorecard.kind === 'dsa' ? 'Code Quality' : 'Architecture'}
              </span>
              {renderStars(scorecard.ratings.architectureOrCode)}
            </div>

            <div className="flex items-center justify-between p-2 bg-surface rounded-xs border border-border-subtle">
              <span className="font-semibold text-foreground">Communication</span>
              {renderStars(scorecard.ratings.communication)}
            </div>

            <div className="flex items-center justify-between p-2 bg-surface rounded-xs border border-border-subtle">
              <span className="font-semibold text-foreground">Verification</span>
              {renderStars(scorecard.ratings.verification)}
            </div>
          </div>

          {/* Strengths & Growth Areas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-node bg-success-soft/20 border border-success/30 flex flex-col gap-2">
              <span className="font-bold text-success flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <CheckCircle2 size={14} className="shrink-0" />
                Demonstrated Strengths
              </span>
              <ul className="space-y-1.5 text-foreground leading-relaxed">
                {scorecard.strengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-success font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 rounded-node bg-danger-soft/20 border border-danger/30 flex flex-col gap-2">
              <span className="font-bold text-danger flex items-center gap-1.5 text-xs uppercase tracking-wider">
                <AlertTriangle size={14} className="shrink-0" />
                Areas for Calibration
              </span>
              <ul className="space-y-1.5 text-foreground leading-relaxed">
                {scorecard.growthAreas.map((ga, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-danger font-bold">•</span>
                    <span>{ga}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Targeted 10D Spec Recommendations */}
          {scorecard.recommended10DSpecs.length > 0 && (
            <div className="p-3 rounded-node border border-border-subtle bg-surface flex flex-col gap-2">
              <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                <Sparkles size={13} className="text-accent-foreground" />
                Targeted 10-Dimension Architectural Specs
              </span>
              <p className="text-foreground-muted text-2xs leading-relaxed">
                Study the exact failure modes, trade-offs, and interview signals for components touched in this round:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {scorecard.recommended10DSpecs.map((slug) => {
                  const concept = findConcept(slug);
                  if (!concept) return null;
                  return (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => setActiveModalConcept(concept)}
                      className="px-2.5 py-1 rounded-node text-xs font-semibold bg-surface border border-border-strong text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-(--duration-fast) active:scale-[0.98] flex items-center gap-1 cursor-pointer shadow-2xs"
                    >
                      <Sparkles size={11} className="shrink-0" />
                      <span>{concept.term}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="p-3.5 border-t border-border-subtle bg-surface-muted/30 flex items-center justify-between gap-3">
          <Link
            href="/interviews"
            className="text-xs font-semibold text-foreground-muted hover:text-foreground underline underline-offset-2"
          >
            ← Back to Interview Hub
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRetry}
              className="px-3 py-1.5 bg-surface border border-border-strong text-foreground font-semibold rounded-node hover:bg-surface-muted transition-all duration-(--duration-fast) active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shadow-2xs text-xs"
            >
              <RotateCcw size={13} />
              <span>Retry Track</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 bg-accent text-accent-foreground border border-border-strong font-bold rounded-node hover:bg-accent-strong transition-all duration-(--duration-fast) active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shadow-xs text-xs"
            >
              <span>Done</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </footer>
      </div>

      {activeModalConcept && (
        <ComponentReferenceModal
          concept={activeModalConcept}
          isOpen={Boolean(activeModalConcept)}
          onClose={() => setActiveModalConcept(null)}
        />
      )}
    </div>,
    document.body,
  );
}
