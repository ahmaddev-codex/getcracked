import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { PYODIDE_VERSION } from '@/lib/runtime/python';

describe('Pyodide asset version', () => {
  it('matches the installed package so the browser cannot load a mismatched build', () => {
    const installed = JSON.parse(
      readFileSync('node_modules/pyodide/package.json', 'utf8'),
    ) as { version: string };

    // In Node, Pyodide resolves assets from node_modules; in the browser it
    // fetches them by version from a URL. If these drift, Node tests keep
    // passing while every browser run loads a mismatched interpreter.
    expect(PYODIDE_VERSION).toBe(installed.version);
  });
});
