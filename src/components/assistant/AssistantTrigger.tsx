'use client';

import React from 'react';
import Image from 'next/image';
import { useAssistant } from './AssistantContext';
import { Button } from '@/components/ui/Button';
import type { AssistantContextPayload, AssistantMode } from '@/lib/assistant/prompts';

interface AssistantTriggerProps {
  label?: string;
  context?: Partial<AssistantContextPayload>;
  initialPrompt?: string;
  mode?: AssistantMode;
  variant?: 'floating' | 'button' | 'compact';
  className?: string;
}

export function AssistantTrigger({
  label = 'AI Assistant',
  context,
  initialPrompt,
  mode,
  variant = 'button',
  className = '',
}: AssistantTriggerProps) {
  const { openAssistant, quota } = useAssistant();

  const handleClick = () => {
    openAssistant({ context, initialPrompt, mode });
  };

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label="Open AI Assistant"
        className={`fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border-2 border-border-strong bg-accent px-4 py-2.5 font-sans text-xs font-bold text-accent-foreground shadow-(--shadow-node) transition-transform duration-100 hover:scale-105 node-pressable ${className}`}
      >
        <Image src="/getcracked_assistant.svg" alt="Assistant" width={20} height={20} className="h-5 w-auto" />
        <span>{label}</span>
        {quota.signedIn && quota.remaining > 0 && (
          <span className="rounded-full bg-accent-foreground/20 px-1.5 py-0.5 text-xs font-mono">
            {quota.remaining}
          </span>
        )}
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex items-center gap-1.5 rounded-sm border-2 border-border-strong bg-surface px-2.5 py-1 text-xs font-medium text-foreground hover:bg-surface-muted node-pressable ${className}`}
      >
        <Image src="/getcracked_assistant.svg" alt="Assistant" width={16} height={16} className="h-4 w-auto" />
        <span>{label}</span>
      </button>
    );
  }

  return (
    <Button
      type="button"
      tone="surface"
      onClick={handleClick}
      className={`inline-flex items-center gap-2 text-xs ${className}`}
    >
      <Image src="/getcracked_assistant.svg" alt="Assistant" width={16} height={16} className="h-4 w-auto" />
      <span>{label}</span>
    </Button>
  );
}
