'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Award,
  CheckCircle2,
  Flame,
  RotateCcw,
  ArrowRight,
} from 'lucide-react';
import { Node } from '@/components/ui/Node';
import {
  recordActivity,
  type SpacedReviewRecord,
  type UserPersonalizationData,
} from '@/lib/personalization/storage';
import { getDueProblems } from '@/lib/personalization/spaced-repetition';

export function PersonalizedDashboard() {
  const [data, setData] = useState<UserPersonalizationData | null>(null);
  const [dueItems, setDueItems] = useState<SpacedReviewRecord[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const updated = recordActivity(1);
      setData(updated);
      setDueItems(getDueProblems(updated));
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  if (!data) return null;

  // Generate last 28 days for heatmap grid
  const days: Array<{ dateStr: string; count: number }> = [];
  for (let i = 27; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0]!;
    days.push({
      dateStr,
      count: data.activityHistory[dateStr] ?? 0,
    });
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Streak & Consistency Card (F3) */}
        <Node tone="surface" className="flex flex-col justify-between gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
              <Flame size={13} className="text-amber-500" />
              Daily Consistency (F3)
            </span>
            <span className="text-2xs font-mono text-foreground-muted">
              Best: {data.streak.longest}d
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="font-sans text-3xl font-black text-foreground">
              {data.streak.current}
            </span>
            <span className="text-xs font-semibold text-foreground-muted">
              day streak
            </span>
          </div>

          {/* 28-day Activity Grid */}
          <div className="pt-2 border-t border-border-subtle flex flex-col gap-1.5">
            <span className="text-3xs text-foreground-muted">Last 4 Weeks:</span>
            <div className="grid grid-cols-14 gap-1">
              {days.map((day) => {
                const level =
                  day.count >= 3
                    ? 'bg-accent-strong border-border-strong'
                    : day.count > 0
                      ? 'bg-accent/70 border-border-subtle'
                      : 'bg-surface-muted border-border-subtle';
                return (
                  <div
                    key={day.dateStr}
                    title={`${day.dateStr}: ${day.count} activities`}
                    className={`h-2.5 w-full rounded-2xs border ${level}`}
                  />
                );
              })}
            </div>
          </div>
        </Node>

        {/* Spaced Repetition Review Queue (F2) */}
        <Node tone="surface" className="flex flex-col justify-between gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
              <RotateCcw size={13} className="text-link" />
              Spaced Repetition (F2)
            </span>
            <span className="text-2xs font-mono text-foreground-muted">
              {dueItems.length} due
            </span>
          </div>

          <div>
            {dueItems.length > 0 ? (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-foreground">Due for reinforcement:</span>
                <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                  {dueItems.slice(0, 3).map((item) => (
                    <Link
                      key={item.problemSlug}
                      href={`/problems/hashing/${item.problemSlug}`}
                      className="px-2 py-0.5 rounded-node text-xs font-mono font-semibold bg-surface border border-border-strong hover:bg-accent hover:text-accent-foreground transition-colors flex items-center gap-1"
                    >
                      <span>{item.problemSlug}</span>
                      <span className="text-3xs opacity-75">B{item.box}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <CheckCircle2 size={16} className="text-success shrink-0" />
                <span>Memory queue refreshed. All solved concepts reinforced!</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-border-subtle text-2xs text-foreground-muted">
            Review schedule: 1d → 3d → 7d → 14d → 30d intervals.
          </div>
        </Node>

        {/* Mock Interview Hub Card (E1, E2) */}
        <Node tone="surface" className="flex flex-col justify-between gap-3 p-4">
          <div className="flex items-center justify-between">
            <span className="text-2xs font-bold uppercase tracking-wider text-foreground-muted flex items-center gap-1">
              <Award size={13} className="text-accent" />
              Mock Simulation (E1, E2)
            </span>
            <span className="px-2 py-0.5 rounded-node text-3xs font-bold uppercase bg-accent text-accent-foreground border border-border-strong">
              Live
            </span>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-foreground">Timed Mock Rounds</h3>
            <p className="text-xs text-foreground-muted leading-relaxed">
              Test your pacing under stage time budgets with the Socratic AI Interviewer.
            </p>
          </div>

          <Link
            href="/interviews"
            className="w-full py-1.5 bg-accent text-accent-foreground border border-border-strong font-bold rounded-node hover:bg-accent-strong transition-all duration-(--duration-fast) active:scale-[0.98] flex items-center justify-center gap-1.5 text-xs shadow-2xs"
          >
            <span>Enter Mock Simulator</span>
            <ArrowRight size={13} />
          </Link>
        </Node>
      </div>
    </section>
  );
}
