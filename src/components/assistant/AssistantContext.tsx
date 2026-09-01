'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { AssistantContextPayload, AssistantMode } from '@/lib/assistant/prompts';
import type { ChatMessage } from '@/lib/assistant/client';

export interface QuotaState {
  signedIn: boolean;
  configured: boolean;
  limit: number;
  remaining: number;
  reset: number;
  loading: boolean;
}

interface AssistantContextType {
  isOpen: boolean;
  openAssistant: (opts?: {
    context?: Partial<AssistantContextPayload>;
    initialPrompt?: string;
    mode?: AssistantMode;
  }) => void;
  closeAssistant: () => void;
  setContext: (ctx: Partial<AssistantContextPayload>) => void;
  messages: ChatMessage[];
  streamingContent: string;
  isStreaming: boolean;
  error: string | null;
  quota: QuotaState;
  sendMessage: (text: string, customMode?: AssistantMode) => Promise<void>;
  clearMessages: () => void;
  refreshQuota: () => Promise<void>;
}

const AssistantContext = createContext<AssistantContextType | null>(null);

export function AssistantProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContextState] = useState<AssistantContextPayload>({
    mode: 'socratic',
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [quota, setQuota] = useState<QuotaState>({
    signedIn: false,
    configured: true,
    limit: 10,
    remaining: 10,
    reset: 0,
    loading: true,
  });

  const refreshQuota = useCallback(async () => {
    try {
      const res = await fetch('/api/assistant/quota');
      if (!res.ok) return;
      const data = (await res.json()) as {
        signedIn: boolean;
        configured: boolean;
        limit: number;
        remaining: number;
        reset: number;
      };
      setQuota({
        signedIn: data.signedIn,
        configured: data.configured,
        limit: data.limit ?? 10,
        remaining: data.remaining ?? 0,
        reset: data.reset ?? 0,
        loading: false,
      });
    } catch {
      // Ignore quota fetch error in background
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch('/api/assistant/quota')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        setQuota({
          signedIn: data.signedIn,
          configured: data.configured,
          limit: data.limit ?? 10,
          remaining: data.remaining ?? 0,
          reset: data.reset ?? 0,
          loading: false,
        });
      })
      .catch(() => { });

    return () => {
      active = false;
    };
  }, []);

  const setContext = useCallback((ctx: Partial<AssistantContextPayload>) => {
    setActiveContextState((prev) => ({
      ...prev,
      ...ctx,
      mode: ctx.mode ?? prev.mode ?? 'socratic',
      exercise: ctx.exercise ?? prev.exercise,
      traceStep: ctx.traceStep ?? prev.traceStep,
      concept: ctx.concept ?? prev.concept,
      studyPlan: ctx.studyPlan ?? prev.studyPlan,
    }));
  }, []);

  const sendMessage = useCallback(
    async (text: string, customMode?: AssistantMode) => {
      if (!text.trim() || isStreaming) return;

      const userMsg: ChatMessage = { role: 'user', content: text.trim() };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsStreaming(true);
      setStreamingContent('');
      setError(null);

      const modeToSend = customMode ?? activeContext.mode;

      try {
        const res = await fetch('/api/assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode: modeToSend,
            messages: newMessages,
            context: {
              ...activeContext,
              mode: modeToSend,
            },
          }),
        });

        const remainingHdr = res.headers.get('X-RateLimit-Remaining');
        if (remainingHdr) {
          setQuota((q) => ({ ...q, remaining: parseInt(remainingHdr, 10) }));
        }

        if (!res.ok) {
          const errData = (await res.json().catch(() => ({}))) as { error?: string };
          if (res.status === 401) {
            setError('Please sign in to use the AI assistant.');
            setQuota((q) => ({ ...q, signedIn: false }));
          } else if (res.status === 429) {
            setError(errData.error ?? 'Daily limit of 10 requests reached. Resets in 24h.');
            setQuota((q) => ({ ...q, remaining: 0 }));
          } else {
            setError(errData.error ?? 'Unable to connect to assistant.');
          }
          setIsStreaming(false);
          return;
        }

        if (!res.body) {
          setError('Empty response received from assistant.');
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setStreamingContent(accumulated);
        }

        setMessages((prev) => [...prev, { role: 'assistant', content: accumulated }]);
        setStreamingContent('');
        void refreshQuota();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Network error communicating with assistant.');
      } finally {
        setIsStreaming(false);
      }
    },
    [messages, isStreaming, activeContext, refreshQuota],
  );

  const openAssistant = useCallback(
    (opts?: {
      context?: Partial<AssistantContextPayload>;
      initialPrompt?: string;
      mode?: AssistantMode;
    }) => {
      if (opts?.context) {
        setActiveContextState((prev) => ({
          ...prev,
          ...opts.context,
          mode: opts.mode ?? opts.context?.mode ?? prev.mode,
        }));
      } else if (opts?.mode) {
        setActiveContextState((prev) => ({ ...prev, mode: opts.mode! }));
      }

      setIsOpen(true);
      void refreshQuota();

      if (opts?.initialPrompt) {
        setTimeout(() => {
          void sendMessage(opts.initialPrompt!, opts.mode);
        }, 50);
      }
    },
    [refreshQuota, sendMessage],
  );

  const closeAssistant = useCallback(() => {
    setIsOpen(false);
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent('');
    setError(null);
  }, []);

  return (
    <AssistantContext.Provider
      value={{
        isOpen,
        openAssistant,
        closeAssistant,
        setContext,
        messages,
        streamingContent,
        isStreaming,
        error,
        quota,
        sendMessage,
        clearMessages,
        refreshQuota,
      }}
    >
      {children}
    </AssistantContext.Provider>
  );
}

export function useAssistant() {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error('useAssistant must be used within an AssistantProvider');
  }
  return ctx;
}
