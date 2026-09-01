'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Bot, ChevronRight, FileText, CheckCircle2, Award } from 'lucide-react';
import type { MockTrack } from '@/lib/interviews/types';
import type { Problem } from '@/content/schema';
import { exerciseId } from '@/content/schema';
import { StageTimer } from './StageTimer';
import { InterviewerChat } from './InterviewerChat';
import { MockScorecardModal } from './MockScorecardModal';
import { Workspace } from '@/components/problem/Workspace';
import { Markdown } from '@/components/Markdown';
import {
  generateCandidateScorecard,
  getInitialGreeting,
  getInterviewerResponse,
  getStageTransitionMessage,
} from '@/lib/interviews/interviewer-agent';
import { saveMockScorecard } from '@/lib/personalization/storage';

interface DsaMockWorkspaceProps {
  track: MockTrack;
  problems: Problem[];
}

export function DsaMockWorkspace({ track, problems }: DsaMockWorkspaceProps) {
  const [activeProblemIdx, setActiveProblemIdx] = useState(0);
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [leftTab, setLeftTab] = useState<'problem' | 'interviewer'>('problem');
  const [messages, setMessages] = useState(() => [getInitialGreeting(track)]);
  const [hintsCount, setHintsCount] = useState(0);
  const [solvedMap, setSolvedMap] = useState<Record<string, boolean>>({});
  const [scorecard, setScorecard] = useState<ReturnType<typeof generateCandidateScorecard> | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const activeProblem = problems[activeProblemIdx] ?? problems[0];

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
    const allSolved =
      problems.length > 0 && problems.every((p) => solvedMap[p.slug] === true);
    const card = generateCandidateScorecard(
      track,
      Math.max(60, elapsedSeconds),
      allSolved,
      hintsCount,
    );
    setScorecard(card);
    saveMockScorecard(card);
  };

  const handleSolved = (slug: string) => {
    setSolvedMap((prev) => ({ ...prev, [slug]: true }));
    handleSendMessage(`I've passed the test runner for ${activeProblem?.title}!`);
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

        {/* Problem selector if track has multiple problems */}
        {problems.length > 1 && (
          <div className="flex items-center gap-1 bg-surface-muted/60 p-0.5 rounded-node border border-border-subtle">
            {problems.map((prob, idx) => {
              const isSolved = solvedMap[prob.slug];
              const isActive = idx === activeProblemIdx;
              return (
                <button
                  key={prob.slug}
                  type="button"
                  onClick={() => setActiveProblemIdx(idx)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-surface text-foreground font-bold border border-border-subtle shadow-xs'
                      : 'text-foreground-muted hover:text-foreground'
                  }`}
                >
                  {isSolved && <CheckCircle2 size={12} className="text-success" />}
                  <span>Problem {idx + 1}: {prob.title}</span>
                </button>
              );
            })}
          </div>
        )}

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
        {/* Left Column: Problem Prompt or Socratic Interviewer */}
        <div className="lg:col-span-5 border-r border-border-strong flex flex-col h-full bg-surface overflow-hidden">
          {/* Sub-tab navigation */}
          <div className="flex items-center border-b border-border-subtle bg-surface-muted/30 px-3 py-1.5 gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLeftTab('problem')}
              className={`px-3 py-1 text-xs font-semibold rounded-node border transition-all flex items-center gap-1.5 cursor-pointer ${
                leftTab === 'problem'
                  ? 'bg-accent text-accent-foreground border-border-strong shadow-2xs font-bold'
                  : 'bg-surface text-foreground-muted hover:text-foreground border-border-subtle'
              }`}
            >
              <FileText size={12} />
              <span>Problem Brief</span>
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
            {leftTab === 'problem' && activeProblem ? (
              <div className="space-y-4 gc-tab-enter text-xs">
                <div>
                  <h2 className="text-base font-bold text-foreground">{activeProblem.title}</h2>
                  <p className="text-foreground-muted text-2xs mt-0.5">
                    Difficulty: {activeProblem.difficulty} · Topic: {activeProblem.topic}
                  </p>
                </div>

                <div className="leading-relaxed text-foreground space-y-3">
                  <Markdown>{activeProblem.brief}</Markdown>
                </div>
              </div>
            ) : (
              <div className="h-full gc-tab-enter">
                <InterviewerChat messages={messages} onSendMessage={handleSendMessage} />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Code Editor Workspace */}
        <div className="lg:col-span-7 flex flex-col h-full bg-background overflow-hidden">
          {activeProblem && (
            <Workspace
              key={activeProblem.slug}
              exerciseId={exerciseId({ tier: 'problem', slug: activeProblem.slug })}
              language="python"
              starterCode={activeProblem.starterCode.python ?? ''}
              spec={activeProblem.testSpec}
              complexity={activeProblem.complexity}
              tier="problem"
              compact
              starterByLanguage={activeProblem.starterCode}
              onSolved={() => handleSolved(activeProblem.slug)}
            />
          )}
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
            setSolvedMap({});
            setMessages([getInitialGreeting(track)]);
          }}
        />
      )}
    </div>
  );
}
