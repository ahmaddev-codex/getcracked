'use client';

export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_KEY = 'gc.theme';

/**
 * Runs before first paint, inlined in the document head.
 *
 * Kept as a string rather than a module because it has to execute synchronously
 * ahead of hydration — a React effect runs after paint, which is one frame of
 * the wrong theme on every load. Deliberately tiny and failure-tolerant: if
 * storage is unavailable it falls through to the system setting.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  try {
    var stored = localStorage.getItem('${THEME_KEY}');
    var dark = stored === 'dark' ||
      (stored !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');
  } catch (e) {}
})();
`.trim();

export function readThemePreference(): ThemePreference {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === 'dark' || stored === 'light' ? stored : 'system';
  } catch {
    return 'system';
  }
}

/** Resolves a preference to what should actually be shown right now. */
export function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference !== 'system') return preference;
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function applyTheme(preference: ThemePreference): void {
  const root = document.documentElement;
  if (resolveTheme(preference) === 'dark') root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');

  try {
    if (preference === 'system') localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, preference);
  } catch {
    // Preference is not persisted, but the page still switches.
  }
}
