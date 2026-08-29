import type { Language, TestSpec } from '@/content/schema';
import type { SpecResult } from '@/content/test-runner';

/**
 * Message contract between the page and the execution worker.
 *
 * Typed in one place so both sides fail to compile rather than failing at
 * runtime with a silently ignored message.
 */

export interface RunRequest {
  id: string;
  spec: TestSpec;
  source: string;
  language: Language;
  trace?: boolean;
  timeoutMs?: number;
  measure?: boolean;
}

export type RunResponse =
  | { id: string; ok: true; result: SpecResult }
  | { id: string; ok: false; error: string };
