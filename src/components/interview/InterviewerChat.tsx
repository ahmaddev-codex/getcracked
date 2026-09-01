'use client';

import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User } from 'lucide-react';
import type { InterviewerMessage } from '@/lib/interviews/types';

interface InterviewerChatProps {
  messages: InterviewerMessage[];
  onSendMessage: (text: string) => void;
}

export function InterviewerChat({
  messages,
  onSendMessage,
}: InterviewerChatProps) {
  const [inputText, setInputText] = useState('');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const latestMessage = messages[messages.length - 1];
  const quickReplies = latestMessage?.sender === 'interviewer' ? latestMessage.quickReplies : undefined;

  return (
    <div className="flex flex-col h-full bg-surface border border-border-strong rounded-node shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-surface-muted/50 border-b border-border-subtle flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-xs bg-accent text-accent-foreground border border-border-strong shadow-2xs">
            <Bot size={14} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Socratic AI Interviewer</h3>
            <p className="text-3xs text-foreground-muted">Probing approach, complexity & edge cases</p>
          </div>
        </div>
      </div>

      {/* Message List */}
      <div
        ref={scrollContainerRef}
        className="flex-1 p-3 overflow-y-auto space-y-3 text-xs"
      >
        {messages.map((msg) => {
          const isInterviewer = msg.sender === 'interviewer';
          return (
            <div
              key={msg.id}
              className={`flex gap-2.5 items-start ${
                isInterviewer ? 'justify-start' : 'justify-end'
              } gc-tab-enter`}
            >
              {isInterviewer && (
                <div className="p-1 rounded-xs bg-accent text-accent-foreground border border-border-strong shrink-0 mt-0.5 shadow-2xs">
                  <Bot size={12} />
                </div>
              )}

              <div
                className={`p-2.5 rounded-node max-w-prose border leading-relaxed ${
                  isInterviewer
                    ? 'bg-surface border-border-subtle text-foreground'
                    : 'bg-accent/20 border-border-strong text-foreground font-medium'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>
              </div>

              {!isInterviewer && (
                <div className="p-1 rounded-xs bg-surface border border-border-strong text-foreground shrink-0 mt-0.5 shadow-2xs">
                  <User size={12} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Replies */}
      {quickReplies && quickReplies.length > 0 && (
        <div className="p-2 border-t border-border-subtle bg-surface-muted/30 flex flex-wrap gap-1.5">
          {quickReplies.map((reply, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendMessage(reply)}
              className="px-2.5 py-1 text-3xs font-medium rounded-node border border-border-subtle bg-surface hover:bg-accent/20 hover:border-border-strong text-foreground transition-all duration-(--duration-fast) active:scale-[0.97] cursor-pointer shadow-2xs"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Text Input */}
      <div className="p-2.5 border-t border-border-subtle bg-surface flex items-center gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Respond to interviewer or ask for guidance..."
          className="flex-1 px-3 py-1.5 text-xs bg-surface-muted/40 border border-border-subtle rounded-node text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-strong"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!inputText.trim()}
          className="p-1.5 bg-accent text-accent-foreground border border-border-strong rounded-node hover:bg-accent-strong transition-all duration-(--duration-fast) active:scale-[0.95] disabled:opacity-40 cursor-pointer shadow-2xs"
          aria-label="Send message"
        >
          <Send size={13} />
        </button>
      </div>
    </div>
  );
}
