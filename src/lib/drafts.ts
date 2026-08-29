'use client';

import type { Language } from '@/content/schema';

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

export function draftKey(exerciseId: string, language: Language): string {
  return `gc.draft.${exerciseId}.${language}`;
}

export function subscribeToDrafts(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function readDraft(exerciseId: string, language: Language): string | null {
  try {
    return localStorage.getItem(draftKey(exerciseId, language));
  } catch {
    // Private mode or blocked site data: the starter code stands.
    return null;
  }
}

export function writeDraft(exerciseId: string, language: Language, code: string): void {
  try {
    localStorage.setItem(draftKey(exerciseId, language), code);
  } catch {
    // Draft persistence is a convenience, never a blocker.
  }
}

export function clearDraft(exerciseId: string, language: Language): void {
  try {
    localStorage.removeItem(draftKey(exerciseId, language));
  } catch {
    // Nothing to do.
  }
  listeners.forEach((l) => l());
}
