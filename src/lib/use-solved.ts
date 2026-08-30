'use client';

import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { LOCAL_PROGRESS_KEY, readLocalProgress } from '@/lib/progress-local';

/**
 * The set of exercises this learner has completed.
 *
 * Merges both tiers deliberately. Someone who solved five problems signed out
 * and then created an account should not watch their ticks disappear while the
 * migration (A15) catches up, and someone working across two devices should see
 * the union rather than whichever source answered first.
 *
 * Absence reads as "not done yet", which is the safe direction: claiming
 * something is solved when it is not is the error a learner would act on.
 */

const EMPTY: string[] = [];

/**
 * Local progress read through `useSyncExternalStore` rather than an effect.
 *
 * React 19 rejects a synchronous `setState` inside an effect body, and
 * localStorage does not exist during the server render — so this is the shape
 * that satisfies both: a server snapshot of nothing, and a client snapshot
 * cached against its own raw string so the reference stays stable between
 * renders.
 */
/** `undefined` means "not read yet", which `null` (an empty store) does not. */
let cachedRaw: string | null | undefined;
let cachedIds: string[] = EMPTY;

function localSolved(): string[] {
  let raw: string | null = null;
  try {
    raw = globalThis.localStorage?.getItem(LOCAL_PROGRESS_KEY) ?? null;
  } catch {
    return cachedIds;
  }
  if (raw === cachedRaw) return cachedIds;

  cachedRaw = raw;
  cachedIds = readLocalProgress()
    .filter((entry) => entry.state === 'complete')
    .map((entry) => entry.exerciseId);
  return cachedIds;
}

/** Nothing changes it while a listing is on screen, so there is no subscription. */
const subscribe = () => () => {};

export function useSolved(): ReadonlySet<string> {
  const local = useSyncExternalStore(subscribe, localSolved, () => EMPTY);
  const [remote, setRemote] = useState<string[]>(EMPTY);

  useEffect(() => {
    let cancelled = false;

    void fetch('/api/progress/solved')
      .then((res) => (res.ok ? res.json() : { solved: [] }))
      .then((data: { solved?: string[] }) => {
        // In a callback rather than the effect body, which is what React 19
        // asks for — this is a subscription to an external system answering.
        if (!cancelled) setRemote(data.solved ?? EMPTY);
      })
      .catch(() => {
        // Offline, or the endpoint is down. Local progress still stands, and a
        // missing tick is a far smaller failure than a broken page.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return useMemo(() => new Set([...local, ...remote]), [local, remote]);
}
