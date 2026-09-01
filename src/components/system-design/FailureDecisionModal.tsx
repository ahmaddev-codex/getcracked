'use client';

import { useState } from 'react';
import { AlertCircle, ChevronRight, HelpCircle, ShieldCheck, Sparkles, X } from 'lucide-react';
import type { RemediationOption, RemediationPrompt } from '@/lib/system-design/simulation';

interface FailureDecisionModalProps {
  prompt: RemediationPrompt;
  onApplyOption: (option: RemediationOption) => void;
  onClose: () => void;
}

export function FailureDecisionModal({
  prompt,
  onApplyOption,
  onClose,
}: FailureDecisionModalProps) {
  const [selectedOptionId, setSelectedOptionId] = useState<string>(
    prompt.options[0]?.id ?? '',
  );

  const selectedOption = prompt.options.find((o) => o.id === selectedOptionId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs select-none">
      <div className="w-full max-w-xl bg-surface border-2 border-border-strong rounded-node shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-border-subtle bg-surface-muted/50">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded bg-danger/15 text-danger">
              <AlertCircle size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                Incident Response: What Breaks Next?
              </h3>
              <p className="text-2xs text-danger font-medium">{prompt.triggerReason}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-foreground-muted hover:text-foreground hover:bg-surface cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Socratic Question */}
        <div className="p-4 flex flex-col gap-3">
          <div className="p-3 rounded-node border border-link/30 bg-link/10 flex items-start gap-2.5">
            <HelpCircle size={16} className="text-link shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-foreground leading-relaxed">
              {prompt.question}
            </p>
          </div>

          {/* Remediation Choices */}
          <div className="flex flex-col gap-2">
            <span className="text-2xs font-bold uppercase tracking-wider text-foreground-muted">
              Select Architectural Fix:
            </span>

            {prompt.options.map((option) => {
              const isSelected = option.id === selectedOptionId;
              return (
                <div
                  key={option.id}
                  onClick={() => setSelectedOptionId(option.id)}
                  className={`p-3 rounded-node border transition-all cursor-pointer flex flex-col gap-1.5 ${
                    isSelected
                      ? 'border-link bg-surface ring-2 ring-link/30 shadow-node'
                      : 'border-border-subtle bg-surface hover:border-border-strong hover:bg-surface-muted/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-link bg-link text-white' : 'border-border-strong'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-xs font-semibold text-foreground">
                        {option.label}
                      </span>
                    </div>
                  </div>

                  <p className="text-2xs text-foreground-muted pl-5.5 leading-relaxed">
                    {option.description}
                  </p>

                  <div className="pl-5.5 pt-1 text-3xs text-success font-medium flex items-center gap-1">
                    <ShieldCheck size={12} className="shrink-0" />
                    <span>{option.impactSummary}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3.5 border-t border-border-subtle bg-surface-muted/30 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-xs border border-border-subtle text-xs text-foreground-muted hover:text-foreground hover:bg-surface cursor-pointer"
          >
            Cancel
          </button>

          {selectedOption && (
            <button
              type="button"
              onClick={() => {
                onApplyOption(selectedOption);
                onClose();
              }}
              className="px-4 py-1.5 rounded-xs bg-link text-white text-xs font-semibold hover:bg-link/90 cursor-pointer transition-colors shadow-node flex items-center gap-1.5"
            >
              <Sparkles size={13} />
              <span>Apply Fix to Architecture</span>
              <ChevronRight size={13} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
