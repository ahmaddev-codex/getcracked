/**
 * Which model the assistant uses (L1, L2, AD-10).
 *
 * **No call site names a model.** Every one asks here, so changing it is a
 * config change rather than a search-and-replace across prompts — which is what
 * AD-10 requires and what makes a provider line-up turning over survivable.
 *
 * ## The choice, and when it was made
 *
 * Verified against Groq's live catalogue on 2026-08-30 with `pnpm groq:models`,
 * rather than recalled: provider line-ups turn over fast enough that a model
 * named in a plan is usually wrong by the time it ships. Of the 14 active
 * models, four are general-purpose chat models with a 131k context —
 * `openai/gpt-oss-120b`, `openai/gpt-oss-20b`, and two Qwen 27b variants. The
 * rest are narrow: Whisper is speech, the Llama Prompt Guard pair are 512-token
 * classifiers, Orpheus is text-to-speech.
 *
 * `openai/gpt-oss-120b` is the default: the largest general model on the list,
 * with the same 131k context and 65k output ceiling as its 20b sibling. Groq's
 * compound models carry a 8k output cap, which is short for the code review L6
 * asks for.
 *
 * Re-run the script before trusting this comment — it is a snapshot of a
 * catalogue that changes.
 */

/** Overridable per deployment, so a rate limit or a deprecation is a config fix. */
export const ASSISTANT_MODEL = process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b';

/**
 * A smaller model for high-volume, low-stakes calls.
 *
 * Separate from the main one because L9's cost ceiling is easier to hold when
 * cheap work is not paying for the large model's capability. Same family, so a
 * prompt written for one behaves predictably on the other.
 */
export const ASSISTANT_MODEL_FAST = process.env.GROQ_MODEL_FAST ?? 'openai/gpt-oss-20b';

/** Whether the assistant can run at all — a missing key disables it cleanly. */
export function assistantConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.GROQ_API_KEY?.trim());
}
