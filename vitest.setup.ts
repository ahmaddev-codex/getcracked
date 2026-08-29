import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';

/**
 * Web Storage polyfill.
 *
 * This jsdom build defines `window` but not `localStorage`. Our storage-backed
 * features (hint reveals, the signed-out notice, the anonymous device id) all
 * guard access in try/catch, because a real browser can refuse storage in
 * private mode — which meant every one of those tests was silently exercising
 * the failure branch and asserting nothing.
 *
 * A spec-compliant in-memory Storage is what jsdom would otherwise provide, so
 * the tests exercise the path a real browser takes.
 */
class MemoryStorage implements Storage {
  private store = new Map<string, string>();

  get length() {
    return this.store.size;
  }
  key(index: number) {
    return [...this.store.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.store.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.store.set(key, String(value));
  }
  removeItem(key: string) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

for (const name of ['localStorage', 'sessionStorage'] as const) {
  // Check the value, not key presence: jsdom defines the property but leaves it
  // undefined, so an `in` check reports it as already available and the
  // polyfill never installs.
  const existing = (globalThis as Record<string, unknown>)[name];
  if (existing == null) {
    Object.defineProperty(globalThis, name, {
      value: new MemoryStorage(),
      configurable: true,
      writable: true,
    });
  }
}

beforeEach(() => {
  // Storage is global; without this, one test's writes leak into the next and
  // a passing suite can hide an ordering dependency.
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  cleanup();
});
