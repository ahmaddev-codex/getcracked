'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAssistant } from './AssistantContext';
import { Lightbulb, Bug, Clock, Code, Zap } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { Markdown } from '@/components/Markdown';

export function AssistantPanel() {
  const {
    isOpen,
    closeAssistant,
    messages,
    streamingContent,
    isStreaming,
    error,
    quota,
    sendMessage,
    clearMessages,
  } = useAssistant();

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);

  const requestClose = useCallback(() => {
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      closeAssistant();
      return;
    }
    setClosing(true);
  }, [closeAssistant]);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(() => {
      closeAssistant();
      setClosing(false);
    }, 180);
    return () => clearTimeout(timer);
  }, [closing, closeAssistant]);

  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    // Focus the panel for keyboard users, then the input.
    panelRef.current?.focus();
    inputRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', onKey);

    // Prevent page scroll while open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      opener?.focus?.();
    };
  }, [isOpen, requestClose]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);


  if (!isOpen) return null;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isStreaming) return;
    const text = input;
    setInput('');
    void sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey || !e.shiftKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const quickPrompts = [
    { label: 'Give me a hint', prompt: 'Can you give me a conceptual hint on how to approach this problem?', Icon: Lightbulb },
    { label: 'Debug test case', prompt: 'Why is my current code failing the test case? Please guide me without giving the answer.', Icon: Bug },
    { label: 'Time complexity', prompt: 'What is the expected time and space complexity for this problem and how do we achieve it?', Icon: Clock },
    { label: 'Review code', prompt: 'Can you review my solution for idiomatic style, time/space complexity, and clean code principles?', Icon: Code },
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-labelledby="assistant-title">
      <button
        type="button"
        aria-label="Close panel"
        onClick={requestClose}
        data-closing={closing}
        className="gc-scrim absolute inset-0 bg-black/45"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="assistant-title"
        tabIndex={-1}
        data-closing={closing}
        className="gc-panel relative flex h-full w-full flex-col border-l-2 border-border-strong bg-surface shadow-2xl sm:max-w-md md:max-w-lg outline-none"
      >
        {/* Header */}
        <header className="flex items-center justify-between border-b-2 border-border-strong bg-surface p-4">
          <div className="flex items-center gap-2">
            <Image src="/getcracked_assistant.svg" alt="Assistant" width={32} height={32} className="h-8 w-auto" />
            <div>
              <h2 id="assistant-title" className="text-sm font-bold tracking-tight">
                GetCracked Assistant
              </h2>
              <p className="text-xs text-foreground-muted">
                Socratic CS & System Design Tutor
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {quota.signedIn ? (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 font-mono text-xs border border-border-strong rounded-sm ${
                  quota.remaining > 3
                    ? 'bg-success/15 text-success'
                    : quota.remaining > 0
                      ? 'bg-warning/15 text-warning'
                      : 'bg-danger/15 text-danger font-bold'
                }`}
                title="Daily quota limit"
              >
                ● {quota.remaining}/{quota.limit} queries today
              </span>
            ) : (
              <Link href="/sign-in">
                <Button tone="surface" className="px-2 py-0.5 text-xs">
                  Sign in
                </Button>
              </Link>
            )}

            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearMessages}
                className="rounded-sm border border-border-strong p-1 text-xs text-foreground-muted hover:bg-surface-muted"
                title="Clear conversation"
                aria-label="Clear conversation"
              >
                Clear
              </button>
            )}

            <button
              type="button"
              onClick={requestClose}
              className="flex h-7 w-7 items-center justify-center rounded-sm border-2 border-border-strong bg-surface text-sm font-bold hover:bg-surface-muted"
              aria-label="Close assistant panel"
            >
              ✕
            </button>
          </div>
        </header>

        {/* AI Transparency Banner (L10) */}
        <div className="flex items-center justify-between border-b border-border-strong/40 bg-surface-muted px-4 py-1.5 text-xs text-foreground-muted">
          <span className="flex items-center gap-2">
            <Zap size={14} aria-hidden className="text-orange-500" />
            <span>Powered by Groq • AI guidance</span>
          </span>
          <span className="italic">Verify critical code</span>
        </div>

        {/* Signed-out Notice */}
        {!quota.signedIn && (
          <div className="m-4">
            <Node tone="accent" className="flex flex-col gap-2 p-3 text-xs">
              <p className="font-semibold">Sign in to use the AI Assistant</p>
              <p className="text-foreground-muted">
                Signed-in learners get 10 free queries every 24 hours for Socratic hints, trace explanations, and code reviews.
              </p>
              <Link href="/sign-in" className="mt-1">
                <Button tone="strong" className="w-full text-xs">
                  Sign in to get started
                </Button>
              </Link>
            </Node>
          </div>
        )}

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !streamingContent && (
            <div className="flex flex-col items-center justify-center py-10 text-center text-foreground-muted">
              <div className="mb-3">
                <Image src="/getcracked_assistant.svg" alt="Assistant" width={56} height={56} className="mx-auto" />
              </div>
              <p className="text-sm font-semibold text-foreground">How can I help you learn today?</p>
              <p className="mt-1 max-w-xs text-xs">
                Ask for conceptual hints, debugging guidance, complexity breakdowns, or solution reviews.
              </p>

              <div className="mt-6 flex flex-col gap-2 w-full max-w-sm">
                {quickPrompts.map((qp) => {
                  const Icon = qp.Icon;
                  return (
                    <button
                      key={qp.label}
                      type="button"
                      onClick={() => void sendMessage(qp.prompt)}
                      disabled={!quota.signedIn || isStreaming || quota.remaining === 0}
                      className="flex items-center justify-between rounded-sm border-2 border-border-strong bg-surface p-2.5 text-left text-xs font-medium transition hover:bg-surface-muted disabled:opacity-50"
                    >
                      <span className="flex items-center gap-2">
                        <Icon size={14} className="text-foreground-muted" aria-hidden />
                        <span>{qp.label}</span>
                      </span>
                      <span className="text-foreground-muted text-xs">Ask →</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div className="mb-1 text-xs font-mono uppercase text-foreground-muted">
                {msg.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div
                className={`max-w-xl rounded-md border-2 border-border-strong p-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-accent font-medium text-accent-foreground shadow-(--shadow-node)'
                    : 'bg-surface text-foreground shadow-(--shadow-node)'
                }`}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <Markdown>{msg.content}</Markdown>
                )}
              </div>
            </div>
          ))}

          {streamingContent && (
            <div className="flex flex-col items-start">
              <div className="mb-1 text-xs font-mono uppercase text-foreground-muted">
                Assistant (Generating…)
              </div>
              <div className="max-w-xl rounded-md border-2 border-border-strong bg-surface p-3 text-sm leading-relaxed shadow-(--shadow-node)">
                <Markdown>{streamingContent}</Markdown>
              </div>
            </div>
          )}

          {isStreaming && !streamingContent && (
            <div className="flex items-center gap-2 text-xs text-foreground-muted">
              <span className="inline-block h-2 w-2 animate-ping rounded-full bg-accent" />
              Thinking…
            </div>
          )}

          {error && (
            <Node tone="surface" className="p-3 text-xs text-danger border-danger">
              <p className="font-semibold">Error</p>
              <p className="mt-0.5">{error}</p>
            </Node>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills (when chat is active) */}
        {messages.length > 0 && quota.signedIn && quota.remaining > 0 && (
          <div className="flex gap-2 overflow-x-auto border-t border-border-strong/40 bg-surface-muted/50 px-4 py-2 text-xs">
            {quickPrompts.slice(0, 3).map((qp) => (
              <button
                key={qp.label}
                type="button"
                onClick={() => void sendMessage(qp.prompt)}
                disabled={isStreaming}
                className="shrink-0 rounded-full border border-border-strong bg-surface px-2.5 py-1 text-xs font-medium hover:bg-surface-muted disabled:opacity-50"
              >
                {qp.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Form */}
        <footer className="border-t-2 border-border-strong bg-surface p-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  !quota.signedIn
                    ? 'Sign in to chat with the assistant…'
                    : quota.remaining === 0
                      ? 'Daily limit reached (10/10).'
                      : 'Ask a question or request guidance… (⌘↩ to send)'
                }
                disabled={!quota.signedIn || isStreaming || quota.remaining === 0}
                rows={2}
                className="w-full resize-none rounded-sm border-2 border-border-strong bg-surface p-2.5 text-xs text-foreground placeholder:text-foreground-muted focus:outline-2 focus:outline-link disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-foreground-muted">
                {quota.signedIn ? `${quota.remaining} of ${quota.limit} queries left` : 'Sign in required'}
              </span>

              <Button
                type="submit"
                tone="strong"
                disabled={!input.trim() || isStreaming || !quota.signedIn || quota.remaining === 0}
                className="px-4 py-1 text-xs"
              >
                {isStreaming ? 'Sending…' : 'Send'}
              </Button>
            </div>
          </form>
        </footer>
      </div>
    </div>
  );
}
