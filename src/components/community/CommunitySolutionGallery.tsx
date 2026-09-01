'use client';

import { useState } from 'react';
import {
  ThumbsUp,
  Clock,
  HardDrive,
  Copy,
  Check,
  Lock,
  Eye,
  Share2,
  Award,
} from 'lucide-react';
import {
  getCommunitySolutions,
  toggleSolutionUpvote,
  hasUserUpvoted,
  type CommunitySolution,
} from '@/lib/community/solutions';

interface CommunitySolutionGalleryProps {
  exerciseId: string;
  isSolved: boolean;
  onOpenShareModal?: () => void;
}

export function CommunitySolutionGallery({
  exerciseId,
  isSolved,
  onOpenShareModal,
}: CommunitySolutionGalleryProps) {
  const [spoilerRevealed, setSpoilerRevealed] = useState(false);
  const [langFilter, setLangFilter] = useState<'all' | 'python' | 'javascript' | 'typescript'>('all');
  const [sortBy, setSortBy] = useState<'upvotes' | 'recent'>('upvotes');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [, setVoteTrigger] = useState(0);

  const solutions = getCommunitySolutions(exerciseId);

  const filteredSolutions = solutions
    .filter((s) => (langFilter === 'all' ? true : s.language === langFilter))
    .sort((a, b) => {
      if (sortBy === 'upvotes') {
        return b.upvotes - a.upvotes;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleVote = (id: string) => {
    const { countDelta } = toggleSolutionUpvote(id);
    const target = solutions.find((s) => s.id === id);
    if (target) {
      target.upvotes += countDelta;
    }
    setVoteTrigger((v) => v + 1);
  };

  // Spoiler Gate: if the learner hasn't solved the exercise yet and hasn't unlocked the spoiler
  if (!isSolved && !spoilerRevealed) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface border border-border-strong rounded-node text-center gap-4 gc-tab-enter my-auto">
        <div className="p-3 rounded-full bg-accent/20 text-accent-foreground border border-border-strong">
          <Lock size={28} />
        </div>
        <div className="max-w-md space-y-1">
          <h3 className="text-sm font-bold text-foreground">Community Solutions are Locked</h3>
          <p className="text-xs text-foreground-muted leading-relaxed">
            Attempt solving this exercise first to preserve your practice signal. Or unlock the gallery to view alternative candidate approaches.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setSpoilerRevealed(true)}
          className="px-4 py-2 text-xs font-bold rounded-node bg-surface hover:bg-surface-muted border border-border-strong text-foreground cursor-pointer transition-all duration-(--duration-fast) flex items-center gap-2 active:scale-[0.98] shadow-2xs"
        >
          <Eye size={14} />
          <span>Reveal Community Solutions (Spoiler)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Top Filter and Action Bar */}
      <header className="p-3 border-b border-border-subtle bg-surface-muted/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Language filter pills */}
          {(['all', 'python', 'javascript'] as const).map((lang) => {
            const isActive = langFilter === lang;
            return (
              <button
                key={lang}
                type="button"
                onClick={() => setLangFilter(lang)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-node border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-accent text-accent-foreground border-border-strong shadow-2xs font-bold'
                    : 'bg-surface text-foreground-muted hover:text-foreground border-border-subtle'
                }`}
              >
                {lang === 'all' ? 'All Languages' : lang.charAt(0).toUpperCase() + lang.slice(1)}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Selector */}
          <select
            value={sortBy}
            aria-label="Sort solutions by"
            onChange={(e) => setSortBy(e.target.value as 'upvotes' | 'recent')}
            className="px-2.5 py-1 text-xs font-semibold bg-surface border border-border-subtle rounded-node text-foreground cursor-pointer focus:outline-none"
          >
            <option value="upvotes">Top Upvoted</option>
            <option value="recent">Most Recent</option>
          </select>

          {/* Share solution button */}
          {onOpenShareModal && (
            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-3 py-1 text-xs font-bold rounded-node bg-accent text-accent-foreground border border-border-strong hover:bg-accent-strong transition-all duration-(--duration-fast) active:scale-[0.98] shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 size={12} />
              <span>Share Mine</span>
            </button>
          )}
        </div>
      </header>

      {/* Solutions List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredSolutions.length === 0 ? (
          <div className="p-8 text-center text-foreground-muted text-xs">
            No community solutions published yet for this filter. Be the first to share your approach!
          </div>
        ) : (
          filteredSolutions.map((sol: CommunitySolution) => {
            const hasVoted = hasUserUpvoted(sol.id);
            return (
              <article
                key={sol.id}
                className="p-4 bg-background border border-border-strong rounded-node shadow-xs space-y-3 gc-tab-enter"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{sol.title}</h4>
                    <div className="flex items-center gap-2 mt-1 text-2xs text-foreground-muted">
                      <span className="font-semibold text-foreground">{sol.author}</span>
                      {sol.authorBadge && (
                        <span className="px-1.5 py-0.5 rounded-xs bg-accent/20 text-accent-foreground font-semibold border border-border-subtle flex items-center gap-1">
                          <Award size={10} />
                          {sol.authorBadge}
                        </span>
                      )}
                      <span>·</span>
                      <span className="uppercase font-mono font-bold text-foreground-muted">
                        {sol.language}
                      </span>
                    </div>
                  </div>

                  {/* Upvote button */}
                  <button
                    type="button"
                    onClick={() => handleVote(sol.id)}
                    className={`px-2.5 py-1 rounded-node text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.95] ${
                      hasVoted
                        ? 'bg-accent text-accent-foreground border-border-strong shadow-2xs font-bold'
                        : 'bg-surface text-foreground-muted hover:text-foreground border-border-subtle'
                    }`}
                  >
                    <ThumbsUp size={12} className={hasVoted ? 'fill-accent-foreground' : ''} />
                    <span>{sol.upvotes}</span>
                  </button>
                </div>

                {/* Complexity Pills */}
                <div className="flex items-center gap-2 text-2xs font-mono">
                  <span className="px-2 py-0.5 rounded-xs bg-surface border border-border-subtle text-foreground-muted flex items-center gap-1">
                    <Clock size={11} />
                    Time: {sol.timeComplexity}
                  </span>
                  <span className="px-2 py-0.5 rounded-xs bg-surface border border-border-subtle text-foreground-muted flex items-center gap-1">
                    <HardDrive size={11} />
                    Space: {sol.spaceComplexity}
                  </span>
                </div>

                {/* Intuition / Explanation */}
                <p className="text-xs text-foreground leading-relaxed">
                  {sol.explanation}
                </p>

                {/* Code Block */}
                <div className="relative group">
                  <pre className="p-3 bg-surface border border-border-subtle rounded-xs text-2xs font-mono text-foreground overflow-x-auto leading-relaxed">
                    <code>{sol.code}</code>
                  </pre>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(sol.id, sol.code)}
                    aria-label="Copy solution code"
                    className="absolute top-2 right-2 p-1.5 rounded-xs bg-surface/90 border border-border-subtle text-foreground-muted hover:text-foreground opacity-80 group-hover:opacity-100 transition-all cursor-pointer shadow-2xs"
                  >
                    {copiedId === sol.id ? (
                      <Check size={13} className="text-success" />
                    ) : (
                      <Copy size={13} />
                    )}
                  </button>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
