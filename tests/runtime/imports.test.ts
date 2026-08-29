import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Guards the import that broke every walkthrough.
 *
 * `pyodide.mjs` runs environment detection at *module evaluation* and throws
 * "Classic web workers are not supported" when it finds itself in a classic
 * worker — which Turbopack emits in development regardless of
 * `{ type: 'module' }`. Because the worker statically imported it through the
 * test-runner, the module threw while the worker script was being evaluated:
 * the worker died before receiving a message, and JavaScript runs that never
 * touch Python died with it.
 *
 * These tests exist because the failure is **invisible in Node** — every other
 * test passes, since jsdom is not a classic worker — and only appears in a real
 * browser. Nothing else in the suite would catch a regression here.
 */

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return /\.(ts|tsx)$/.test(entry) ? [full] : [];
  });
}

const files = sourceFiles('src');

describe('runtime imports', () => {
  it('never imports pyodide for its value at module scope', () => {
    // `import type { ... } from 'pyodide'` is erased at compile time and is fine.
    // A value import is what evaluates the module — and throws.
    const offenders = files.filter((file) => {
      const source = readFileSync(file, 'utf8');
      return /^\s*import\s+(?!type\s)[^;]*?from\s+['"]pyodide['"]/m.test(source);
    });

    expect(
      offenders,
      `Load pyodide with a dynamic import() inside getPyodide() instead — see ${offenders.join(', ')}`,
    ).toEqual([]);
  });

  it('loads pyodide through exactly one call site', () => {
    const callers = files.filter((file) => /loadPyodide\s*\(/.test(readFileSync(file, 'utf8')));
    // A second call site is a second chance to evaluate the module eagerly.
    expect(callers).toEqual(['src/lib/runtime/python.ts']);
  });

  it('never imports the quickjs-emscripten convenience wrapper', () => {
    // Separate problem, same shape: its index re-exports all four wasmfile
    // variants, which defeats the single-file loader chosen for the browser.
    const offenders = files.filter((file) =>
      /from\s+['"]quickjs-emscripten['"]/.test(readFileSync(file, 'utf8')),
    );
    expect(offenders).toEqual([]);
  });

  it('loads the QuickJS WASM module through one loader', () => {
    const callers = files.filter(
      (file) =>
        /newQuickJSWASMModuleFromVariant/.test(readFileSync(file, 'utf8')) &&
        !file.endsWith('quickjs.ts'),
    );
    expect(callers).toEqual([]);
  });
});
