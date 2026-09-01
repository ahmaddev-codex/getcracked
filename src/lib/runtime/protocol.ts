import type { RunnableLanguage, TestSpec } from '@/content/schema';
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
  language: RunnableLanguage;
  trace?: boolean;
  timeoutMs?: number;
  measure?: boolean;
  /** Sibling files for a tier-3 build challenge; absent for the other tiers. */
  modules?: ReadonlyArray<{ name: string; source: string }>;
  entryModule?: string;
}

export type RunResponse =
  | { id: string; ok: true; result: SpecResult }
  /**
   * The worker cannot run this language, but the main thread can.
   *
   * Distinct from `ok: false` because it is not a failure of the learner's code
   * and not a broken worker: JavaScript still runs here perfectly well. The
   * client retries on the main thread instead of surfacing an error or
   * discarding a worker that is doing its job.
   */
  | { id: string; ok: false; unsupported: true; error: string }
  | { id: string; ok: false; error: string };
