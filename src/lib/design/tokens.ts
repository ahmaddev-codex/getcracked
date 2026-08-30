import { readFileSync } from 'node:fs';

/**
 * Reads design tokens back out of `globals.css`.
 *
 * Deliberately parses rather than restates. A TypeScript copy of the palette
 * would drift from the CSS the moment someone edited one and not the other, and
 * the contrast suite would then be verifying a fiction. Here, editing a token is
 * what runs the check.
 *
 * Node-only (uses `fs`): this exists for tests and tooling, never for rendering.
 */

export type Rgb = [number, number, number];

const CSS_PATH = 'src/app/globals.css';

function srgbFromHex(hex: string): Rgb {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255) as Rgb;
}

function srgbFromOklch(L: number, C: number, hDeg: number): Rgb {
  const h = (hDeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((x) => {
    const c = Math.min(1, Math.max(0, x));
    return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  }) as Rgb;
}

function parseColor(value: string): Rgb | null {
  const hex = /^#[0-9a-f]{3,8}$/i.exec(value.trim());
  if (hex) return srgbFromHex(hex[0]);

  const oklch = /^oklch\(\s*([\d.]+)(%?)\s+([\d.]+)\s+([\d.]+)\s*\)$/i.exec(value.trim());
  if (oklch) {
    const L = oklch[2] === '%' ? Number(oklch[1]) / 100 : Number(oklch[1]);
    return srgbFromOklch(L, Number(oklch[3]), Number(oklch[4]));
  }
  return null;
}

export type Theme = 'light' | 'dark';

/**
 * Token values per theme.
 *
 * `:root` carries light; `:root[data-theme='dark']` overrides a subset, so dark
 * inherits anything it does not restate — exactly how the browser resolves them.
 */
export function readTokens(): Record<Theme, Record<string, Rgb>> {
  const css = readFileSync(CSS_PATH, 'utf8');

  const darkBlock = /:root\[data-theme='dark'\] \{([\s\S]*?)\n\}/.exec(css);
  const rootBlock = /:root \{([\s\S]*?)\n\}/.exec(css);
  if (!rootBlock) throw new Error('No :root block found in globals.css');

  const collect = (body: string) => {
    const out: Record<string, Rgb> = {};
    for (const [, name, value] of body.matchAll(/--([\w-]+):\s*([^;]+);/g)) {
      const rgb = parseColor(value);
      if (rgb) out[name] = rgb;
    }
    return out;
  };

  const light = collect(rootBlock[1]);
  return { light, dark: { ...light, ...(darkBlock ? collect(darkBlock[1]) : {}) } };
}

function relativeLuminance([r, g, b]: Rgb): number {
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function contrast(a: Rgb, b: Rgb): number {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function toHex(rgb: Rgb): string {
  return `#${rgb.map((c) => Math.round(c * 255).toString(16).padStart(2, '0')).join('')}`;
}

/**
 * Every foreground/background pairing the UI actually renders.
 *
 * Declared explicitly rather than derived by cross-producting all tokens: most
 * combinations are never drawn, and asserting on them would either fail for no
 * reason or force the palette to be blander than it needs to be. Adding a pair
 * here is how a new combination becomes legal.
 */
export const CONTRAST_PAIRS: ReadonlyArray<{
  name: string;
  fg: string;
  bg: string;
  /** Large text (>=18.66px bold or >=24px) may use the 3:1 bar. */
  large?: boolean;
  /**
   * A non-text graphic — a border, a rule, a connector.
   *
   * Also the 3:1 bar, but for a different reason than `large`, and worth
   * distinguishing: reading `large: true` on a 2px border says the border is
   * big text, which is how the connector ended up darkened to clear a text
   * threshold that never applied to it.
   */
  graphic?: boolean;
}> = [
  { name: 'body text on page', fg: 'foreground', bg: 'background' },
  { name: 'body text on surface', fg: 'foreground', bg: 'surface' },
  { name: 'body text on muted surface', fg: 'foreground', bg: 'surface-muted' },
  { name: 'secondary text on page', fg: 'foreground-muted', bg: 'background' },
  { name: 'secondary text on surface', fg: 'foreground-muted', bg: 'surface' },
  { name: 'link on page', fg: 'link', bg: 'background' },
  { name: 'link on surface', fg: 'link', bg: 'surface' },
  { name: 'error text on page', fg: 'danger', bg: 'background' },
  { name: 'error text on surface', fg: 'danger', bg: 'surface' },
  // Code is the surface a learner stares at longest.
  { name: 'keyword in editor', fg: 'syntax-keyword', bg: 'surface' },
  { name: 'string in editor', fg: 'syntax-string', bg: 'surface' },
  { name: 'number in editor', fg: 'syntax-number', bg: 'surface' },
  { name: 'comment in editor', fg: 'syntax-comment', bg: 'surface' },
  { name: 'function name in editor', fg: 'syntax-function', bg: 'surface' },
  { name: 'text on accent node', fg: 'accent-foreground', bg: 'accent' },
  { name: 'text on strong accent', fg: 'accent-foreground', bg: 'accent-strong' },
  { name: 'text on alt node', fg: 'alt-foreground', bg: 'alt' },
  { name: 'notice text on notice bar', fg: 'notice-foreground', bg: 'notice-background' },
  // The node outline is a 2px border carrying meaning, so it is held to the
  // 3:1 non-text bar rather than being exempt.
  { name: 'node outline on page', fg: 'border-strong', bg: 'background', graphic: true },
  { name: 'node outline on surface', fg: 'border-strong', bg: 'surface', graphic: true },
  // The roadmap's spine and its dotted fans, at 3.5px. Held to the graphic bar
  // rather than the text one, which is the whole reason it can be the
  // reference's actual blue instead of a darkened approximation of it.
  { name: 'connector on page', fg: 'connector', bg: 'background', graphic: true },
  { name: 'connector on surface', fg: 'connector', bg: 'surface', graphic: true },
];
