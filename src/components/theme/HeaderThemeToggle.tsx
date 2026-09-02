'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';
import { applyTheme, readThemePreference, type ThemePreference } from '@/lib/theme';
import { useHydrated } from '@/lib/use-hydrated';

const CYCLE: Record<ThemePreference, ThemePreference> = {
  light: 'dark',
  dark: 'system',
  system: 'light',
};

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function HeaderThemeToggle() {
  const hydrated = useHydrated();
  const preference = useSyncExternalStore(
    subscribe,
    readThemePreference,
    () => 'system' as ThemePreference,
  );

  useEffect(() => {
    if (preference !== 'system') return;
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const sync = () => applyTheme('system');
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [preference]);

  if (!hydrated) {
    return <div className="h-7 w-7 rounded-full" aria-hidden />;
  }

  const nextPref = CYCLE[preference];
  const label = `Theme: ${preference} (switch to ${nextPref})`;

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(nextPref);
        listeners.forEach((l) => l());
      }}
      title={label}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-full text-header-foreground/75 transition-all hover:bg-header-foreground/10 hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
    >
      {preference === 'light' && <Sun size={15} aria-hidden />}
      {preference === 'dark' && <Moon size={15} aria-hidden />}
      {preference === 'system' && <Laptop size={15} aria-hidden />}
    </button>
  );
}
