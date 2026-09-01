'use client';

import Link from 'next/link';
import { ArrowRight, ChevronRight, Layers } from 'lucide-react';
import { findJourneyForContent, type JourneyTier } from '@/lib/learning-journeys';

interface EngineeringStackBreadcrumbProps {
  tier: JourneyTier;
  slug: string;
  className?: string;
}

const TIER_BADGES: Record<JourneyTier, { label: string; bg: string }> = {
  lesson: { label: 'Lesson', bg: 'bg-surface-muted text-foreground-muted' },
  problem: { label: 'Practice', bg: 'bg-link/10 text-link' },
  challenge: { label: 'Build', bg: 'bg-accent text-accent-foreground font-semibold' },
  'system-design': { label: 'Architecture', bg: 'bg-warning-soft text-warning' },
  lab: { label: 'Scenario Lab', bg: 'bg-success-soft text-success' },
};

export function EngineeringStackBreadcrumb({
  tier,
  slug,
  className = '',
}: EngineeringStackBreadcrumbProps) {
  const match = findJourneyForContent(tier, slug);
  if (!match) return null;

  const { journey, activeIndex } = match;
  const activeNode = journey.nodes[activeIndex];
  const nextNode = activeIndex < journey.nodes.length - 1 ? journey.nodes[activeIndex + 1] : null;

  return (
    <nav
      aria-label="Engineering Learning Stack Journey"
      className={`p-3 rounded-node border border-border-strong bg-surface/80 backdrop-blur-xs select-none shadow-node ${className}`}
    >
      <div className="flex items-center justify-between gap-3 mb-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0">
          <Layers size={14} className="text-link shrink-0" />
          <span className="text-2xs uppercase tracking-wider text-foreground-muted font-semibold">
            Engineering Progression Stack
          </span>
          <span className="text-foreground-muted">•</span>
          <span className="text-xs font-semibold text-foreground truncate">{journey.title}</span>
        </div>

        {nextNode && (
          <Link
            href={nextNode.href}
            className="flex items-center gap-1 text-2xs text-link hover:underline font-medium ml-auto cursor-pointer"
          >
            <span>Next: {nextNode.label}</span>
            <ArrowRight size={11} />
          </Link>
        )}
      </div>

      {/* Horizontal Step Railway */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs scrollbar-none">
        {journey.nodes.map((node, i) => {
          const isActive = i === activeIndex;
          const isPassed = i < activeIndex;
          const tierInfo = TIER_BADGES[node.tier] ?? { label: node.tier, bg: 'bg-surface' };

          return (
            <div key={node.id} className="flex items-center gap-1.5 shrink-0">
              <Link
                href={node.href}
                title={node.summary}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-xs border transition-all cursor-pointer ${
                  isActive
                    ? 'border-link bg-surface ring-2 ring-link/30 shadow-node font-semibold text-foreground'
                    : isPassed
                      ? 'border-border-subtle bg-surface-muted/30 text-foreground-muted hover:text-foreground hover:bg-surface'
                      : 'border-border-subtle/60 bg-background/50 text-foreground-muted/70 hover:text-foreground'
                }`}
              >
                <span
                  className={`text-3xs uppercase tracking-wider px-1 py-0.2 rounded-full border border-border-subtle ${tierInfo.bg}`}
                >
                  {tierInfo.label}
                </span>
                <span className="text-2xs truncate max-w-32">{node.label}</span>
              </Link>

              {i < journey.nodes.length - 1 && (
                <ChevronRight size={12} className="text-foreground-muted/40 shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {activeNode && (
        <div className="mt-1.5 pt-1.5 border-t border-border-subtle/50 text-2xs text-foreground-muted flex items-center justify-between">
          <p className="line-clamp-1">{activeNode.summary}</p>
          <span className="text-3xs font-mono shrink-0 ml-2">
            Step {activeIndex + 1} of {journey.nodes.length}
          </span>
        </div>
      )}
    </nav>
  );
}
