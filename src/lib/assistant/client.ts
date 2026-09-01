import { ASSISTANT_MODEL, ASSISTANT_MODEL_FAST } from './model';
import { buildSystemPrompt, type AssistantContextPayload } from './prompts';

/**
 * Server-side Groq streaming client for the GetCracked Assistant (L1, L2, L9).
 *
 * Direct streaming via Fetch + Server-Sent Events avoids heavy SDK dependencies
 * and allows precise control over context trimming, model fallback, and streaming.
 */

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface StreamAssistantOptions {
  context: AssistantContextPayload;
  messages: ChatMessage[];
  useFastModel?: boolean;
  apiKey?: string;
}

const GROQ_COMPLETIONS_URL = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Trims message history to the most recent turns to conserve bandwidth & tokens (L9).
 * Preserves the system prompt at index 0.
 */
export function trimMessages(messages: ChatMessage[], maxHistory = 8): ChatMessage[] {
  if (messages.length <= maxHistory) return messages;
  return messages.slice(-maxHistory);
}

/**
 * Streams chat completions from Groq using fetch and standard Web ReadableStream.
 */
export async function streamAssistantResponse({
  context,
  messages,
  useFastModel = false,
  apiKey = process.env.GROQ_API_KEY,
}: StreamAssistantOptions): Promise<ReadableStream<Uint8Array>> {
  if (!apiKey || !apiKey.trim()) {
    throw new Error('GROQ_API_KEY_MISSING');
  }

  const model = useFastModel ? ASSISTANT_MODEL_FAST : ASSISTANT_MODEL;
  const systemPrompt = buildSystemPrompt(context);

  const trimmed = trimMessages(messages.filter((m) => m.role === 'user' || m.role === 'assistant'));
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    ...trimmed,
  ];

  const res = await fetch(GROQ_COMPLETIONS_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: fullMessages,
      temperature: context.mode === 'code_review' || context.mode === 'explain_state' ? 0.2 : 0.4,
      max_tokens: context.mode === 'code_review' ? 3000 : 1500,
      stream: true,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text().catch(() => '');
    if (res.status === 401) throw new Error('GROQ_AUTH_FAILED');
    if (res.status === 429) throw new Error('GROQ_UPSTREAM_RATE_LIMITED');
    throw new Error(`GROQ_ERROR_${res.status}: ${errorText}`);
  }

  if (!res.body) {
    throw new Error('GROQ_EMPTY_RESPONSE');
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  const reader = res.body.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data:')) continue;

            const payload = trimmedLine.slice(5).trim();
            if (payload === '[DONE]') {
              controller.close();
              return;
            }

            try {
              const parsed = JSON.parse(payload) as {
                choices?: Array<{
                  delta?: { content?: string };
                  finish_reason?: string | null;
                }>;
              };
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                controller.enqueue(encoder.encode(content));
              }
            } catch {
              // Ignore unparseable SSE line fragments
            }
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      } finally {
        reader.releaseLock();
      }
    },
  });
}
