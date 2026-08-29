'use client';

/**
 * Topics whose guidance a learner has dismissed (B16).
 *
 * Remembering this is the difference between guidance and nagging: someone who
 * has said "I know this" should not be told again on every problem in the set.
 */

const KEY = 'gc.dismissed';
const listeners = new Set<() => void>();

export function subscribeToDismissals(onChange: () => void): () => void {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function readDismissals(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function dismissTopic(slug: string): void {
  try {
    const all = new Set(readDismissals());
    all.add(slug);
    localStorage.setItem(KEY, JSON.stringify([...all]));
  } catch {
    // Storage refused; the banner simply returns next visit.
  }
  listeners.forEach((l) => l());
}
