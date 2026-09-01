'use client';

import { useEffect, useState } from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import type { InterviewStage } from '@/lib/interviews/types';

interface StageTimerProps {
  stages: InterviewStage[];
  currentStageIndex: number;
  totalDurationMinutes: number;
  onTimeExpired?: () => void;
}

export function StageTimer({
  stages,
  currentStageIndex,
  totalDurationMinutes,
}: StageTimerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const totalBudgetSeconds = totalDurationMinutes * 60;
  const isOverTime = elapsedSeconds > totalBudgetSeconds;

  const currentStage = stages[currentStageIndex];

  // Stage budget in seconds
  let cumulativeStageBudgetSeconds = 0;
  for (let i = 0; i <= currentStageIndex; i++) {
    cumulativeStageBudgetSeconds += (stages[i]?.budgetMinutes ?? 0) * 60;
  }
  const isStageOverTime = elapsedSeconds > cumulativeStageBudgetSeconds;

  const formatTime = (secs: number) => {
    const m = Math.floor(Math.abs(secs) / 60);
    const s = Math.abs(secs) % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-2 p-3 bg-surface border border-border-strong rounded-node shadow-xs">
      <div className="flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Clock size={14} className={isOverTime ? 'text-danger animate-pulse' : 'text-foreground-muted'} />
          <span className="font-semibold text-foreground">
            Stage {currentStageIndex + 1} of {stages.length}: {currentStage?.name}
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <span className={isStageOverTime ? 'text-danger font-bold flex items-center gap-1' : 'text-foreground-muted'}>
            {isStageOverTime && <AlertCircle size={12} />}
            Stage: {formatTime(elapsedSeconds)} / {currentStage?.budgetMinutes}:00
          </span>
          <span className="text-border-subtle">|</span>
          <span className={`font-bold ${isOverTime ? 'text-danger' : 'text-foreground'}`}>
            Total: {formatTime(elapsedSeconds)} / {totalDurationMinutes}:00
          </span>
        </div>
      </div>

      {/* Stage progress segments */}
      <div className="flex gap-1 h-1.5 w-full">
        {stages.map((stage, idx) => {
          const isCompleted = idx < currentStageIndex;
          const isCurrent = idx === currentStageIndex;
          return (
            <div
              key={stage.id}
              className={`h-full rounded-xs transition-all ${
                isCompleted
                  ? 'bg-accent text-accent-foreground border border-border-strong flex-1'
                  : isCurrent
                    ? isStageOverTime
                      ? 'bg-danger flex-1 animate-pulse'
                      : 'bg-link flex-1'
                    : 'bg-surface-muted border border-border-subtle flex-1'
              }`}
              title={`${stage.name} (${stage.budgetMinutes}m)`}
            />
          );
        })}
      </div>
    </div>
  );
}
