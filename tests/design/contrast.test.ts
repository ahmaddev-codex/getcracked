import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Contrast is checked in CI, not by eye (Module K, K10).
 *
 * Values are parsed out of globals.css rather than duplicated here, so editing
 * a token is what runs the check — a copy would drift and pass forever.
 *
 * T0.7 generalises this over the full token set; today it guards the one pair
 * that exists.
 */

function oklchToSrgb(L: number, C: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  const lin = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];

  return lin.map((x) => {
    const c = Math.min(1, Math.max(0, x));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  }) as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrast(a: [number, number, number], b: [number, number, number]): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const css = readFileSync('src/app/globals.css', 'utf8');

function readToken(name: string): [number, number, number] {
  const m = new RegExp(`--${name}:\\s*oklch\\(([\\d.]+)%?\\s+([\\d.]+)\\s+([\\d.]+)\\)`).exec(css);
  if (!m) throw new Error(`Token --${name} not found or not in oklch() form`);
  const L = Number(m[1]) > 1 ? Number(m[1]) / 100 : Number(m[1]);
  return oklchToSrgb(L, Number(m[2]), Number(m[3]));
}

describe('notice bar contrast (K10)', () => {
  it('meets WCAG AA for normal text', () => {
    const ratio = contrast(readToken('notice-foreground'), readToken('notice-background'));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it('meets AAA too, since the bar carries small text', () => {
    const ratio = contrast(readToken('notice-foreground'), readToken('notice-background'));
    // Rendered at text-xs, so the stricter bar is the honest one to hold.
    expect(ratio).toBeGreaterThanOrEqual(7);
  });
});
