'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Award, Bot, ChevronRight, FileText } from 'lucide-react';
import type { MockTrack } from '@/lib/interviews/types';
import type { ScenarioLab } from '@/content/schema';
import { StageTimer } from './StageTimer';
import { InterviewerChat } from './InterviewerChat';
import { MockScorecardModal } from './MockScorecardModal';
import { ArchitectureCanvas } from '@/components/system-design/ArchitectureCanvas';
import { ARCHITECTURE_PRESETS } from '@/lib/system-design/canvas-presets';
import { Markdown } from '@/components/Markdown';
import {
  generateCandidateScorecard,
  getInitialGreeting,
  getInterviewerResponse,
  getStageTransitionMessage,
} from '@/lib/interviews/interviewer-agent';
import { saveMockScorecard } from '@/lib/personalization/storage';

interface SystemDesignMockWorkspaceProps {
  track: MockTrack;
  lab: ScenarioLab;
}

export function SystemDesignMockWorkspace({ track, lab }: SystemDesignMockWorkspaceProps) {
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [leftTab, setLeftTab] = useState<'brief' | 'interviewer'>('brief');
  const [messages, setMessages] = useState(() => [getInitialGreeting(track)]);
  const [hintsCount, setHintsCount] = useState(0);
  const [scorecard, setScorecard] = useState<ReturnType<typeof generateCandidateScorecard> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const initialArch = ARCHITECTURE_PRESETS[lab.slug] ?? ARCHITECTURE_PRESETS['url-shortener'];

  const handleSendMessage = useCallback(
    (text: string) => {
      const userMsg = {
        id: `user-${Date.now()}`,
        sender: 'candidate' as const,
        text,
        timestamp: Date.now(),
      };

      if (text.toLowerCase().includes('hint')) {
        setHintsCount((c) => c + 1);
      }

      const botReply = getInterviewerResponse(text, track, currentStageIdx);
      setMessages((prev) => [...prev, userMsg, botReply]);
    },
    [track, currentStageIdx],
  );

  const handleAdvanceStage = () => {
    if (currentStageIdx < track.stages.length - 1) {
      const nextIdx = currentStageIdx + 1;
      setCurrentStageIdx(nextIdx);
      const nextStage = track.stages[nextIdx];
      if (nextStage) {
        const transitionMsg = getStageTransitionMessage(nextStage);
        setMessages((prev) => [...prev, transitionMsg]);
      }
    } else {
      handleConclude();
    }
  };

  const handleConclude = () => {
    const card = generateCandidateScorecard(
      track,
      Math.max(60, elapsedSeconds),
      true, // Completed architectural review
      hintsCount,
    );
    setScorecard(card);
    saveMockScorecard(card);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background select-none overflow-hidden">
      {/* Top Header */}
      <header className="p-3 bg-surface border-b border-border-strong flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/interviews"
            className="text-xs font-semibold text-foreground-muted hover:text-foreground underline underline-offset-2"
          >
            ← Mock Hub
          </Link>
          <span className="text-border-subtle">|</span>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-bold text-foreground">{track.title}</h1>
            <span className="px-2 py-0.5 rounded-node text-3xs font-bold uppercase bg-accent text-accent-foreground border border-border-strong">
              {track.targetLevel}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {currentStageIdx < track.stages.length - 1 ? (
            <button
              type="button"
              onClick={handleAdvanceStage}
              className="px-3 py-1.5 bg-surface border border-border-strong text-foreground text-xs font-semibold rounded-node hover:bg-surface-muted transition-all duration-(--duration-fast) active:scale-[0.98] flex items-center gap-1 cursor-pointer shadow-2xs"
            >
              <span>Next Stage</span>
              <ChevronRight size={13} />
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleConclude}
            className="px-3 py-1.5 bg-accent text-accent-foreground border border-border-strong text-xs font-bold rounded-node hover:bg-accent-strong transition-all duration-(--duration-fast) active:scale-[0.98] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Award size={13} />
            <span>Conclude & Score</span>
          </button>
        </div>
      </header>

      {/* Stage Timer Bar */}
      <div className="px-4 py-2 bg-surface-muted/40 border-b border-border-subtle">
        <StageTimer
          stages={track.stages}
          currentStageIndex={currentStageIdx}
          totalDurationMinutes={track.durationMinutes}
          onTimeExpired={() => setElapsedSeconds((s) => s + 1)}
        />
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: Requirements Brief or Socratic Interviewer */}
        <div className="lg:col-span-4 border-r border-border-strong flex flex-col h-full bg-surface overflow-hidden">
          {/* Sub-tab navigation */}
          <div className="flex items-center border-b border-border-subtle bg-surface-muted/30 px-3 py-1.5 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLeftTab('brief')}
              className={`px-3 py-1 text-xs font-semibold rounded-node border transition-all flex items-center gap-1.5 cursor-pointer ${
                leftTab === 'brief'
                  ? 'bg-accent text-accent-foreground border-border-strong shadow-2xs font-bold'
                  : 'bg-surface text-foreground-muted hover:text-foreground border-border-subtle'
              }`}
            >
              <FileText size={12} />
              <span>Scenario Brief</span>
            </button>

            <button
              type="button"
              onClick={() => setLeftTab('interviewer')}
              className={`px-3 py-1 text-xs font-semibold rounded-node border transition-all flex items-center gap-1.5 cursor-pointer ${
                leftTab === 'interviewer'
                  ? 'bg-accent text-accent-foreground border-border-strong shadow-2xs font-bold'
                  : 'bg-surface text-foreground-muted hover:text-foreground border-border-subtle'
              }`}
            >
              <Bot size={12} />
              <span>Interviewer Dialogue ({messages.length})</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {leftTab === 'brief' ? (
              <div className="space-y-4 gc-tab-enter text-xs">
                <div>
                  <h2 className="text-base font-bold text-foreground">{lab.title}</h2>
                  <p className="text-foreground-muted text-2xs mt-0.5">
                    Topics: {lab.topics.join(', ')} · Budget: {lab.timeBudgetMinutes}m
                  </p>
                </div>

                <div className="leading-relaxed text-foreground space-y-3">
                  <Markdown>{lab.brief}</Markdown>
                </div>
              </div>
            ) : (
              <div className="h-full gc-tab-enter">
                <InterviewerChat messages={messages} onSendMessage={handleSendMessage} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Architecture Canvas & Live Simulation HUD */}
        <div className="lg:col-span-8 flex flex-col h-full bg-background overflow-hidden p-2">
          <ArchitectureCanvas
            initialArchitecture={initialArch}
            initialMode="simulate"
            compact
          />
        </div>
      </div>

      {scorecard && (
        <MockScorecardModal
          scorecard={scorecard}
          isOpen={Boolean(scorecard)}
          onClose={() => setScorecard(null)}
          onRetry={() => {
            setScorecard(null);
            setCurrentStageIdx(0);
            setMessages([getInitialGreeting(track)]);
          }}
        />
      )}
    </div>
  );
}
