'use client';

import { useState } from 'react';
import {
  Trophy,
  Flame,
  Award,
  ChevronUp,
  Hammer,
  Send,
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from '@/lib/auth-client';
import {
  getLeaderboard,
  type LeaderboardEntry,
  type LeaderboardSort,
} from '@/lib/community/leaderboard';

const SORT_OPTIONS: Array<{ key: LeaderboardSort; label: string; icon: typeof Trophy }> = [
  { key: 'problems_solved', label: 'Problems Solved', icon: Trophy },
  { key: 'streak', label: 'Longest Streak', icon: Flame },
  { key: 'challenges', label: 'Challenges Built', icon: Hammer },
  { key: 'submissions', label: 'Total Submissions', icon: Send },
];

function rankMedal(index: number): string | null {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return null;
}

function primaryMetric(entry: LeaderboardEntry, sortBy: LeaderboardSort): string {
  switch (sortBy) {
    case 'problems_solved':
      return `${entry.problemsSolved} solved`;
    case 'streak':
      return `${entry.currentStreak}d streak`;
    case 'challenges':
      return `${entry.challengesCompleted} built`;
    case 'submissions':
      return `${entry.totalSubmissions} runs`;
  }
}

export function Leaderboard() {
  const { data: session } = useSession();
  const [sortBy, setSortBy] = useState<LeaderboardSort>('problems_solved');

  const entries = getLeaderboard(sortBy);

  return (
    <div className="flex flex-col gap-4">
      {!session && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-node bg-surface border border-border-subtle shadow-2xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-foreground">
              Want to claim your rank on the leaderboard?
            </span>
            <span className="text-xs text-foreground-muted">
              You can explore and solve as a guest, but an account is needed to sync your scores and rank.
            </span>
          </div>
          <Link
            href="/sign-up"
            className="px-3.5 py-1.5 text-xs font-bold rounded-node bg-accent-strong text-accent-foreground hover:opacity-90 transition-opacity node-interactive shrink-0"
          >
            Create free account
          </Link>
        </div>
      )}

      {/* Sort Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        {SORT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSortBy(opt.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-node border transition-all cursor-pointer flex items-center gap-1.5 ${
                sortBy === opt.key
                  ? 'bg-accent text-accent-foreground border-border-strong shadow-2xs font-bold'
                  : 'bg-surface text-foreground-muted hover:text-foreground border-border-subtle'
              }`}
            >
              <Icon size={12} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* Leaderboard Table */}
      <div className="node-surface bg-surface border border-border-strong rounded-node overflow-hidden shadow-xs">
        {/* Top 3 Podium */}
        <div className="grid grid-cols-3 gap-px bg-border-subtle">
          {entries.slice(0, 3).map((entry, i) => {
            const medal = rankMedal(i);
            return (
              <div
                key={entry.id}
                className={`flex flex-col items-center gap-2 p-4 text-center ${
                  i === 0
                    ? 'bg-accent/10 border-b-2 border-accent'
                    : 'bg-surface'
                }`}
              >
                <span className="text-2xl">{medal}</span>
                <span className="text-sm font-bold text-foreground truncate max-w-full">
                  {entry.username}
                </span>
                {entry.badge && (
                  <span className="px-1.5 py-0.5 rounded-xs bg-accent/20 text-accent-foreground text-3xs font-semibold border border-border-subtle flex items-center gap-1">
                    <Award size={9} />
                    {entry.badge}
                  </span>
                )}
                <span className="text-lg font-bold text-foreground">
                  {primaryMetric(entry, sortBy)}
                </span>
                <div className="flex items-center gap-2 text-3xs text-foreground-muted">
                  <span className="flex items-center gap-0.5">
                    <Flame size={9} className="text-danger" />
                    {entry.currentStreak}d
                  </span>
                  <span>·</span>
                  <span>{entry.languages.join(', ')}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Rest of Rankings */}
        <div className="divide-y divide-border-subtle">
          {entries.slice(3).map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-4 py-2.5 bg-surface hover:bg-surface-muted/30 transition-colors"
            >
              {/* Rank */}
              <span className="w-8 text-center text-xs font-bold text-foreground-muted shrink-0">
                #{i + 4}
              </span>

              {/* Username & Badge */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="text-xs font-bold text-foreground truncate">
                  {entry.username}
                </span>
                {entry.badge && (
                  <span className="px-1 py-0.5 rounded-xs bg-accent/15 text-accent-foreground text-3xs font-semibold border border-border-subtle shrink-0">
                    {entry.badge}
                  </span>
                )}
              </div>

              {/* Primary metric */}
              <span className="text-xs font-bold text-foreground shrink-0">
                {primaryMetric(entry, sortBy)}
              </span>

              {/* Streak */}
              <span className="flex items-center gap-0.5 text-3xs text-foreground-muted shrink-0">
                <Flame size={9} className={entry.currentStreak > 7 ? 'text-danger' : ''} />
                {entry.currentStreak}d
              </span>

              {/* Languages */}
              <div className="flex items-center gap-1 shrink-0">
                {entry.languages.map((lang) => (
                  <span
                    key={lang}
                    className="px-1 py-0.5 rounded-xs bg-surface-muted text-foreground-muted text-3xs font-semibold border border-border-subtle"
                  >
                    {lang}
                  </span>
                ))}
              </div>

              {/* Trend indicator */}
              <ChevronUp size={12} className="text-success shrink-0 opacity-40" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
