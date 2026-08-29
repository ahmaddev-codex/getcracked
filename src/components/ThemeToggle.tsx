'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Button } from '@/components/ui/Button';
import { applyTheme, readThemePreference, type ThemePreference } from '@/lib/theme';
import { useHydrated } from '@/lib/use-hydrated';

const OPTIONS: ThemePreference[] = ['light', 'system', 'dark'];

/**
 * The stored preference is browser state, so it is read as an external store
 * rather than pulled into React state inside an effect — which triggers a
 * cascading render and is rejected by this codebase's lint rules.
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Three-state theme control (K9).
 *
 * "System" is a real option rather than an implicit default, so a learner can
 * return to following their OS after having chosen — a two-state toggle makes
 * that impossible once touched.
 */
export function ThemeToggle() {
  const hydrated = useHydrated();
  const preference = useSyncExternalStore(
    subscribe,
    readThemePreference,
    () => 'system' as ThemePreference,
  );

  useEffect(() => {
    // While following the system, track changes to it live.
    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => applyTheme('system');
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [preference]);

  // Rendered only after hydration: the server cannot know the stored choice,
  // and guessing produces a mismatch.
  if (!hydrated) return null;

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Theme">
      {OPTIONS.map((option) => (
        <Button
          key={option}
          tone={preference === option ? 'strong' : 'surface'}
          aria-pressed={preference === option}
          onClick={() => {
            applyTheme(option);
            listeners.forEach((l) => l());
          }}
          className="px-2 py-1 text-xs"
        >
          {option}
        </Button>
      ))}
    </div>
  );
}
