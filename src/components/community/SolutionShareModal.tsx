'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Share2, Sparkles, X, CheckCircle2, Code2, Clock, HardDrive } from 'lucide-react';
import { useFocusTrap } from '@/lib/use-focus-trap';
import { publishCommunitySolution, type CommunitySolution } from '@/lib/community/solutions';

interface SolutionShareModalProps {
  exerciseId: string;
  code: string;
  language: 'python' | 'javascript' | 'typescript';
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (solution: CommunitySolution) => void;
}

export function SolutionShareModal({
  exerciseId,
  code,
  language,
  isOpen,
  onClose,
  onPublished,
}: SolutionShareModalProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [explanation, setExplanation] = useState('');
  const [timeComplexity, setTimeComplexity] = useState('O(n)');
  const [spaceComplexity, setSpaceComplexity] = useState('O(1)');
  const [isSuccess, setIsSuccess] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !explanation.trim()) return;

    const published = publishCommunitySolution({
      exerciseId,
      title: title.trim(),
      author: author.trim() || 'Anonymous Engineer',
      language,
      code,
      explanation: explanation.trim(),
      timeComplexity: timeComplexity.trim() || 'O(n)',
      spaceComplexity: spaceComplexity.trim() || 'O(1)',
      tags: [language.toUpperCase()],
    });

    setIsSuccess(true);
    setTimeout(() => {
      onPublished?.(published);
      onClose();
      setIsSuccess(false);
    }, 1200);
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
      className="fixed inset-0 z-70 flex items-center justify-center p-2.5 sm:p-4 bg-background/80 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div className="fixed inset-0 cursor-default" onClick={onClose} aria-hidden="true" />

      <div
        ref={modalRef}
        className="relative w-full max-w-xl max-h-full my-auto bg-surface border-2 border-border-strong rounded-node shadow-2xl flex flex-col overflow-hidden z-10 gc-modal-enter"
      >
        {/* Header */}
        <header className="p-4 border-b border-border-subtle bg-surface-muted/50 flex items-start justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-accent/20 text-accent-foreground border border-border-strong">
              <Share2 size={18} />
            </div>
            <div>
              <h3 id="share-modal-title" className="text-sm font-bold text-foreground">
                Share Solution with Community
              </h3>
              <p className="text-2xs text-foreground-muted">
                Publish your passing approach to help other engineers compare paradigms.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1 rounded-sm text-foreground-muted hover:text-foreground hover:bg-surface cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-center gc-tab-enter">
            <div className="p-3 rounded-full bg-success/20 text-success border border-success/40">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="text-sm font-bold text-foreground">Solution Published!</h4>
            <p className="text-xs text-foreground-muted">
              Your solution is now available in the community gallery for this exercise.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="solution-title" className="block text-2xs font-bold uppercase tracking-wider text-foreground-muted mb-1">
                Approach Title *
              </label>
              <input
                id="solution-title"
                type="text"
                required
                placeholder="e.g. Single-Pass Hash Map with O(1) Lookup"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-background border border-border-strong rounded-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            {/* Author Pseudonym */}
            <div>
              <label htmlFor="solution-author" className="block text-2xs font-bold uppercase tracking-wider text-foreground-muted mb-1">
                Author Handle (Optional)
              </label>
              <input
                id="solution-author"
                type="text"
                placeholder="e.g. StaffCandidate or anonymous"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="w-full px-3 py-1.5 text-xs bg-background border border-border-strong rounded-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            {/* Complexity Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="solution-time" className="block text-2xs font-bold uppercase tracking-wider text-foreground-muted mb-1 flex items-center gap-1">
                  <Clock size={11} />
                  <span>Time Complexity</span>
                </label>
                <input
                  id="solution-time"
                  type="text"
                  placeholder="e.g. O(n)"
                  value={timeComplexity}
                  onChange={(e) => setTimeComplexity(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-background border border-border-strong rounded-xs text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label htmlFor="solution-space" className="block text-2xs font-bold uppercase tracking-wider text-foreground-muted mb-1 flex items-center gap-1">
                  <HardDrive size={11} />
                  <span>Space Complexity</span>
                </label>
                <input
                  id="solution-space"
                  type="text"
                  placeholder="e.g. O(1)"
                  value={spaceComplexity}
                  onChange={(e) => setSpaceComplexity(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-background border border-border-strong rounded-xs text-foreground font-mono focus:outline-none focus:border-accent"
                />
              </div>
            </div>

            {/* Intuition / Explanation */}
            <div>
              <label htmlFor="solution-explanation" className="block text-2xs font-bold uppercase tracking-wider text-foreground-muted mb-1">
                Intuition & Trade-Offs *
              </label>
              <textarea
                id="solution-explanation"
                required
                rows={3}
                placeholder="Explain the mental model, key invariants, and why this trade-off was chosen..."
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-background border border-border-strong rounded-xs text-foreground focus:outline-none focus:border-accent"
              />
            </div>

            {/* Code Preview */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-2xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
                  <Code2 size={11} />
                  <span>Passing Code ({language})</span>
                </span>
                <span className="text-2xs text-success font-semibold flex items-center gap-1">
                  <CheckCircle2 size={11} />
                  Verified Passing
                </span>
              </div>
              <pre className="p-3 bg-background border border-border-subtle rounded-xs text-2xs font-mono text-foreground max-h-36 overflow-y-auto leading-relaxed">
                <code>{code}</code>
              </pre>
            </div>

            {/* Footer buttons */}
            <div className="pt-2 border-t border-border-subtle flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-semibold rounded-node border border-border-strong text-foreground-muted hover:text-foreground hover:bg-surface-muted cursor-pointer transition-all duration-(--duration-fast)"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-bold rounded-node bg-accent text-accent-foreground border border-border-strong hover:bg-accent-strong cursor-pointer transition-all duration-(--duration-fast) active:scale-[0.98] shadow-xs flex items-center gap-1.5"
              >
                <Sparkles size={13} />
                <span>Publish to Gallery</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
