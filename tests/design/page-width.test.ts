import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

/**
 * Page rails (Module K).
 *
 * The width a page gets is decided by its **type**, and this is what holds that
 * rule up. Before it, five different widths were in use across fourteen routes:
 * a build's overview and its own first step disagreed, a problem set and the
 * problems in it disagreed, one page used a width nothing else used, and one
 * used different horizontal padding from every other page on the site.
 *
 * None of that is catchable by eye once there are twenty routes, and none of it
 * is catchable by the lint rule either — `max-w-4xl` is a perfectly ordinary
 * class, and the same utility is legitimately used *inside* pages to constrain a
 * paragraph or a card. What makes a page rail different is where it sits, so the
 * check is here rather than in ESLint.
 *
 * The assignment is written out rather than inferred. Choosing a page's width is
 * a design decision, and a test that derived the answer from the code could only
 * ever confirm that the code equals itself.
 */

type PageWidth = 'canvas' | 'catalog' | 'reading';

/**
 * Every route, and the rail it gets.
 *
 * - `canvas` — draws a graph, or holds a second column. Matches the header rail.
 * - `catalog` — a list, an index, or a tool.
 * - `reading` — one document, read top to bottom.
 */
const EXPECTED: Record<string, PageWidth> = {
  // Was exempt while it was a centred hero with two lines in it. It is a real
  // page now, so it aligns with everything else it links to.
  'src/app/page.tsx': 'catalog',

  'src/app/dashboard/page.tsx': 'catalog',
  'src/app/account/page.tsx': 'catalog',

  'src/app/learn/dsa/page.tsx': 'canvas',
  'src/app/learn/dsa/[topic]/page.tsx': 'reading',
  'src/app/learn/system-design/page.tsx': 'canvas',
  'src/app/learn/system-design/[topic]/page.tsx': 'reading',
  'src/app/learn/system-design/capacity/page.tsx': 'catalog',
  'src/app/learn/system-design/labs/page.tsx': 'canvas',
  // Reading, not catalog: a lab is one scenario worked top to bottom, and the
  // options are prose that has to stay readable — the same call the problem and
  // lesson pages make.
  'src/app/learn/system-design/labs/[slug]/page.tsx': 'reading',
  'src/app/learn/design-patterns/page.tsx': 'canvas',

  'src/app/problems/page.tsx': 'catalog',
  'src/app/problems/[topic]/page.tsx': 'catalog',
  'src/app/problems/[topic]/[slug]/page.tsx': 'reading',

  'src/app/companies/page.tsx': 'catalog',
  'src/app/companies/[slug]/page.tsx': 'catalog',

  'src/app/challenges/page.tsx': 'catalog',
  'src/app/challenges/[slug]/page.tsx': 'catalog',
  // Canvas for the same reason the roadmaps are: a second column beside the
  // content. It is the one page that composes the rail rather than rendering
  // `<Page>`, because the sidebar sits beside its content rather than under it.
  'src/app/challenges/[slug]/[step]/page.tsx': 'canvas',

  // One column of editor, controls and animation — no second column, no graph.
  'src/app/sandbox/page.tsx': 'reading',

  'src/app/(dev)/components/page.tsx': 'catalog',
};

/**
 * Routes with no rail, each for a stated reason rather than by omission.
 *
 * An exemption list that nobody has to justify is how the inconsistency comes
 * back, so each entry says why the page is not a rail — and every one of these
 * is a full-viewport centred layout, which is a different thing from a page
 * whose content flows down a column.
 */
const NO_RAIL: Record<string, string> = {
  'src/app/(auth)/sign-in/page.tsx': 'Centred form card; the width is the form’s, not the page’s.',
  'src/app/(auth)/sign-up/page.tsx': 'Centred form card; the width is the form’s, not the page’s.',
  'src/app/(spike)/runtime/page.tsx':
    'Throwaway prototype that predates the design system — exempted in eslint.config.mjs for the same reason.',
};

/** Every route file, found rather than listed — an unlisted page must fail. */
const PAGES = readdirSync('src/app', { recursive: true, encoding: 'utf8' })
  .map((entry) => `src/app/${entry.replace(/\\/g, '/')}`)
  .filter((path) => path.endsWith('/page.tsx'))
  .sort();

const read = (path: string) => readFileSync(path, 'utf8');

describe('the width tokens', () => {
  const css = read('src/app/globals.css');

  it.each([
    ['canvas', '72rem'],
    ['catalog', '56rem'],
    ['reading', '48rem'],
  ])('defines --container-%s', (name, value) => {
    expect(css).toContain(`--container-${name}: ${value};`);
  });

  it('gives reading a shorter measure than catalog, and catalog than canvas', () => {
    const width = (name: string) =>
      Number(new RegExp(`--container-${name}: ([\\d.]+)rem`).exec(css)![1]);

    // The ordering is the point of having three: prose narrower than a list,
    // a list narrower than a graph. Equal values would mean two of them are one.
    expect(width('reading')).toBeLessThan(width('catalog'));
    expect(width('catalog')).toBeLessThan(width('canvas'));
  });
});

describe('every route is accounted for', () => {
  it('has an expected width or a stated reason for having none', () => {
    // A new page must land in one list or the other, which is the point: the
    // failure mode being guarded against is a page that quietly picks its own.
    const known = new Set([...Object.keys(EXPECTED), ...Object.keys(NO_RAIL)]);
    const unlisted = PAGES.filter((p) => !known.has(p));

    expect(
      unlisted,
      `Unlisted route(s). Add the width to EXPECTED, or to NO_RAIL with a reason.`,
    ).toEqual([]);
  });

  it('does not list a route that no longer exists', () => {
    const existing = new Set(PAGES);
    for (const path of [...Object.keys(EXPECTED), ...Object.keys(NO_RAIL)]) {
      expect(existing, `${path} is listed but has no file`).toContain(path);
    }
  });

  it('gives every exemption a reason worth reading', () => {
    for (const [path, reason] of Object.entries(NO_RAIL)) {
      expect(reason.length, `${path}: exemption needs a real reason`).toBeGreaterThan(30);
    }
  });
});

describe.each(Object.entries(EXPECTED))('%s', (path, width) => {
  const source = read(path);

  it(`uses the ${width} rail`, () => {
    const declared =
      new RegExp(`<Page\\s+width="${width}"`).test(source) ||
      new RegExp(`pageClasses\\('${width}'`).test(source);

    expect(declared, `expected width="${width}" via <Page> or pageClasses`).toBe(true);
  });

  it('does not hand-roll a rail', () => {
    // The whole class of bug: `mx-auto ... max-w-4xl ... px-4 py-8` restated per
    // page, which drifts on width *and* on padding — one page was on `p-8`, so
    // its mobile gutter was double every other page's.
    expect(source).not.toMatch(/<main className="mx-auto[^"]*max-w-/);
  });
});

describe('the header rail', () => {
  const header = read('src/components/SiteHeader.tsx');

  it('is the canvas width, so a canvas page lines up with the wordmark', () => {
    expect(header).toContain('max-w-canvas');
  });

  it('uses the same horizontal padding the rail does', () => {
    // Matching widths but not gutters would still misalign the two by 8px at
    // the breakpoint, which reads as a rendering bug rather than a choice.
    expect(header).toContain('px-4');
    expect(header).toContain('sm:px-6');
  });
});
