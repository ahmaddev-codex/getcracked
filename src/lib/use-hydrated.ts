'use client';

import { useSyncExternalStore } from 'react';

/** Never changes after mount, so nothing needs to subscribe. */
const noop = () => () => {};

/**
 * False during server render and the hydration pass, true afterwards.
 *
 * `useSyncExternalStore` is the hydration-safe way to express this: React uses
 * `getServerSnapshot` for both the server render and the hydration render, then
 * re-renders with `getSnapshot`. A `useState` + `useEffect` flag would set state
 * during an effect — which this codebase's lint rules reject — and a bare
 * `typeof window` check would produce exactly the mismatch this exists to avoid.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );
}
