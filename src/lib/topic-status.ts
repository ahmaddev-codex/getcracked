'use client';

import { useSyncExternalStore } from 'react';

/**
 * Self-reported status for a roadmap topic (K4).
 *
 * **Deliberately separate from exercise progress.** `deriveLessonState` reports
 * what a learner has actually *done* — every guided exercise passing its tests.
 * This is what they *say* about a topic: "I already know this", "skip it". A
 * senior engineer walking the roadmap should be able to mark hash maps done
 * without solving three exercises to prove it, and a learner's real completion
 * record should not be forgeable by clicking a button.
 *
 * Merging the two would break both: the analytics funnel (F6) would count
 * self-marks as completions, and the recommendation engine (B16) would stop
 * suggesting practice to someone who clicked "done" out of optimism.
 *
 * Stored locally and per-device. It unlocks nothing (§6.6), so there is no
 * reason to make a learner sign in to use it — the same reasoning that makes
 * anonymous exercise progress acceptable (A15).
 */

export type TopicStatus = 'none' | 'learning' | 'done' | 'skipped';

const KEY = 'gc.topic-status.v1';

type Store = Record<string, TopicStatus>;

const listeners = new Set<() => void>();

/**
 * `useSyncExternalStore` calls `getSnapshot` on every render and loops forever
 * if it returns a fresh object each time, so the parsed value is cached — but
 * keyed on the raw string rather than held indefinitely.
 *
 * Caching the object outright means never noticing a write from anywhere else:
 * a second tab marking a topic, or storage being cleared. Comparing the raw
 * string is cheap, keeps the reference stable while nothing has changed, and
 * picks up outside writes on the next read.
 */
let cachedRaw: string | null = null;
let cached: Store = {};

function read(): Store {
  let raw: string | null = null;
  try {
    raw = globalThis.localStorage?.getItem(KEY) ?? null;
  } catch {
    // Private mode or storage disabled by policy.
    return cached;
  }

  if (raw === cachedRaw) return cached;

  cachedRaw = raw;
  try {
    cached = raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    // Corrupt JSON. A missing status is a valid status, so there is nothing to
    // recover and nothing worth surfacing to a learner.
    cached = {};
  }
  return cached;
}

export function setTopicStatus(slug: string, status: TopicStatus): void {
  const next: Store = { ...read() };
  if (status === 'none') delete next[slug];
  else next[slug] = status;

  const raw = JSON.stringify(next);
  cached = next;
  cachedRaw = raw;
  try {
    globalThis.localStorage?.setItem(KEY, raw);
  } catch {
    // Kept in memory for this session rather than failing the interaction.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * Read through `useSyncExternalStore` rather than `useState` + effect, so the
 * server render and the first client render agree: React 19 treats a `setState`
 * in an effect as a hydration hazard, and localStorage does not exist on the
 * server.
 */
export function useTopicStatuses(): Store {
  return useSyncExternalStore(
    subscribe,
    read,
    // The server has no storage, so every topic is unmarked there.
    () => EMPTY,
  );
}

const EMPTY: Store = {};
