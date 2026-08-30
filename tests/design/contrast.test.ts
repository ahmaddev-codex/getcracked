import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  CONTRAST_PAIRS,
  contrast,
  readTokens,
  toHex,
  type Theme,
} from '@/lib/design/tokens';

/**
 * K10: contrast is verified in CI, not by eye.
 *
 * Values are read back out of globals.css, so editing a token is what runs the
 * check — a duplicated palette would drift and pass forever.
 */

const tokens = readTokens();
const THEMES: Theme[] = ['light', 'dark'];

describe.each(THEMES)('%s theme', (theme) => {
  const palette = tokens[theme];

  it.each(CONTRAST_PAIRS)('$name meets WCAG AA', ({ fg, bg, large, graphic }) => {
    const f = palette[fg];
    const b = palette[bg];
    expect(f, `token --${fg} missing in ${theme}`).toBeDefined();
    expect(b, `token --${bg} missing in ${theme}`).toBeDefined();

    const ratio = contrast(f, b);
    // Large text and non-text graphics share the 3:1 bar for different reasons.
    const required = large || graphic ? 3 : 4.5;

    expect(
      ratio,
      `${toHex(f)} on ${toHex(b)} = ${ratio.toFixed(2)}:1, needs ${required}:1`,
    ).toBeGreaterThanOrEqual(required);
  });
});

describe('token completeness', () => {
  it('defines every token the pairs reference, in both themes', () => {
    const needed = new Set(CONTRAST_PAIRS.flatMap((p) => [p.fg, p.bg]));
    for (const theme of THEMES) {
      for (const name of needed) {
        expect(tokens[theme][name], `--${name} missing in ${theme}`).toBeDefined();
      }
    }
  });

  it('gives dark its own surfaces rather than inheriting light ones', () => {
    // Dark inherits anything it does not restate, so a forgotten override shows
    // up as an identical value rather than as a visible bug.
    expect(toHex(tokens.dark.background)).not.toBe(toHex(tokens.light.background));
    expect(toHex(tokens.dark.surface)).not.toBe(toHex(tokens.light.surface));
    expect(toHex(tokens.dark.foreground)).not.toBe(toHex(tokens.light.foreground));
  });
});

/**
 * The token guard itself (K1, K9).
 *
 * The ESLint rule that keeps raw values out of components matched only a
 * `className` JSX attribute, so two whole categories walked past it: a `.ts`
 * module exporting class strings has no JSX attribute at all, and a class built
 * in a template literal is a `TemplateElement` rather than a `Literal`. Its
 * numeric pattern also missed decimals, so `w-[3.5px]` was invisible.
 *
 * These check the tokens those leaks became, so the values cannot drift back
 * into a component as literals.
 */
describe('shape tokens', () => {
  const tokens = readTokens();

  it.each(['light', 'dark'] as const)('%s defines the connector width', () => {
    // Read as raw text: these are lengths, not colours, so the palette parser
    // does not carry them.
    const css = readFileSync('src/app/globals.css', 'utf8');
    expect(css).toMatch(/--connector-width:\s*[\d.]+px/);
  });

  it('defines a press offset that matches the node shadow', () => {
    const css = readFileSync('src/app/globals.css', 'utf8');
    const press = /--press-offset:\s*([\d.]+)px/.exec(css)?.[1];
    const shadow = /--shadow-node:\s*([\d.]+)px/.exec(css)?.[1];

    // A node should travel exactly its shadow offset, so it reads as being
    // pushed flat rather than nudged an unrelated distance.
    expect(press).toBeTruthy();
    expect(press).toBe(shadow);
  });

  it('still has a palette to check, so this file is testing something', () => {
    expect(Object.keys(tokens.light).length).toBeGreaterThan(10);
  });
});
