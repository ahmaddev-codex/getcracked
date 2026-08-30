import type { ReactNode } from 'react';

/**
 * The page rail (Module K).
 *
 * Every route's `<main>` composes this rather than restating
 * `mx-auto flex w-full max-w-… flex-col gap-8 px-4 py-8 sm:px-6`. Restating it
 * is what produced five different widths across fourteen routes, a page whose
 * horizontal padding differed from every other, and two pages that link
 * straight to one another disagreeing about where the content starts.
 *
 * **Width is chosen by page type, never per page.** That is the rule the
 * consistency actually rests on — not "every page is the same width", which is
 * unavailable (a roadmap graph does not fit a reading column, and prose at the
 * catalog width runs past a comfortable line length). Two pages of the same type
 * always match; a list and a document differ, and differ the same way every
 * time.
 */
export type PageWidth =
  /** Draws a graph, or holds a second column. Matches the header rail. */
  | 'canvas'
  /** A list, an index, or a tool. */
  | 'catalog'
  /** One document, read top to bottom. */
  | 'reading';

const WIDTHS: Record<PageWidth, string> = {
  canvas: 'max-w-canvas',
  catalog: 'max-w-catalog',
  reading: 'max-w-reading',
};

/**
 * Exported separately from the component so a page needing its own layout — the
 * challenge step page puts a sidebar beside its content — can add to the rail
 * without opting out of it.
 */
export function pageClasses(width: PageWidth, className = ''): string {
  return `mx-auto flex w-full ${WIDTHS[width]} flex-col gap-8 px-4 py-8 sm:px-6 ${className}`.trim();
}

export function Page({
  width,
  className = '',
  children,
}: {
  width: PageWidth;
  className?: string;
  children: ReactNode;
}) {
  return <main className={pageClasses(width, className)}>{children}</main>;
}
