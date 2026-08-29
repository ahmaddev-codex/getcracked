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

  it.each(CONTRAST_PAIRS)('$name meets WCAG AA', ({ fg, bg, large }) => {
    const f = palette[fg];
    const b = palette[bg];
    expect(f, `token --${fg} missing in ${theme}`).toBeDefined();
    expect(b, `token --${bg} missing in ${theme}`).toBeDefined();

    const ratio = contrast(f, b);
    const required = large ? 3 : 4.5;

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
