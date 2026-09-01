'use client';

import type { RunnableLanguage } from '@/content/schema';

/**
 * Draft code, kept per exercise and language.
 *
 * Exposed as an external store rather than loaded into React state inside an
 * effect. Reading storage in an effect and calling `setState` triggers a
 * cascading render, and React's own guidance is that browser storage is an
 * external store — so it is read through `useSyncExternalStore` instead.
 *
 * Server-side persistence across devices arrives in T1.4; this is the anonymous
 * tier (A15) and works signed out.
 */

const listeners = new Set<() => void>();

/**
 * In-memory mirror of every draft written this session.
 *
 * `localStorage` throws in a private window and can be blocked outright, and
 * until now that meant a learner there lost their work the moment anything
 * re-seeded the editor — switching a build challenge's file tab, say. Writes go
 * to both; reads prefer storage and fall back to this, so a blocked storage
 * degrades from "loses work on reload" (unavoidable) to exactly that, rather
 * than "loses work on the next click".
 */
const memory = new Map<string, string>();

/**
 * A draft's storage key.
 *
 * `file` addresses one file of a build challenge's workspace, and is omitted for
 * every other tier — a problem is one file and does not need naming.
 *
 * **What `exerciseId` is for a challenge matters.** It is the *challenge*, not
 * the step: `challenges/lru-cache`, never `challenges/lru-cache/undo`. A
 * workspace is carried across the steps, so keying by step would hand a learner
 * back the starter code at every step and quietly discard the build they had
 * been working on. Progress is keyed per step; drafts are keyed per challenge.
 */
export function draftKey(exerciseId: string, language: RunnableLanguage | string, file?: string): string {
  return file
    ? `gc.draft.${exerciseId}.${file}.${language}`
    : `gc.draft.${exerciseId}.${language}`;
}

export function subscribeToDrafts(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function readDraft(
  exerciseId: string,
  language: RunnableLanguage | string,
  file?: string,
): string | null {
  const key = draftKey(exerciseId, language, file);
  try {
    // `??` rather than a plain return: storage that refused the *write* answers
    // null here, and the session's own copy is then the newer one.
    return localStorage.getItem(key) ?? memory.get(key) ?? null;
  } catch {
    // Private mode or blocked site data.
    return memory.get(key) ?? null;
  }
}

export function writeDraft(
  exerciseId: string,
  language: RunnableLanguage | string,
  code: string,
  file?: string,
): void {
  const key = draftKey(exerciseId, language, file);
  memory.set(key, code);
  try {
    localStorage.setItem(key, code);
  } catch {
    // Private mode, quota exceeded, or cookies disabled. The write still
    // succeeded in `memory`, so the current session sees it.
  }
  listeners.forEach((l) => l());
}

export function clearDraft(exerciseId: string, language: RunnableLanguage | string, file?: string): void {
  const key = draftKey(exerciseId, language, file);
  memory.delete(key);
  try {
    localStorage.removeItem(key);
  } catch {
    // Nothing to do.
  }
  listeners.forEach((l) => l());
}

/**
 * Notifies every subscriber that drafts changed.
 *
 * Exported because a build challenge clears several files at once and each
 * `clearDraft` notifying separately would re-render the workspace once per file
 * — the reset of a three-file workspace should be one update, not three.
 */
export function notifyDraftListeners(): void {
  listeners.forEach((l) => l());
}
