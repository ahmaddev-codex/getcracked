'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { ConnectorFan, FAN_ORIGIN, FAN_TARGET } from './ConnectorFan';
import type { Concept, ConceptCategory } from '@/content/concepts';
import { ConceptPopover } from './ConceptPopover';

/**
 * The concept reference as a mind map (A14, I2).
 *
 * It was an accordion: twelve collapsed categories, and finding a term meant
 * guessing which one held it and opening them until it appeared. A reference
 * whose contents are hidden by default is a reference people stop using.
 *
 * Drawn in the same language as the roadmap above it — a spine of categories
 * with their terms fanning off — so the two read as one page rather than a
 * diagram followed by a list. Every term is visible without interaction, which
 * is the whole point: you can find something by looking.
 *
 * ## Deep links still work, and that constraint shaped this
 *
 * Module C's labs (C9) and roadmap nodes (I3) link *into* individual terms, so
 * arriving at `#quorum` must land on that term with its definition open. Each
 * concept node keeps its slug as an `id`, and the hash both opens the panel and
 * scrolls to the node — a link that lands on something invisible has failed.
 */

interface Row {
  category: ConceptCategory;
  concepts: Concept[];
}

/**
 * Whether a concept matches a search.
 *
 * Searches the definition and the "why it matters" text as well as the term,
 * because the reference is most useful when you *cannot* name the thing —
 * "the one where reads plus writes exceed replicas" should find Quorum.
 */
export function matchesQuery(concept: Concept, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    concept.term.toLowerCase().includes(q) ||
    concept.definition.toLowerCase().includes(q) ||
    concept.matters.toLowerCase().includes(q)
  );
}

function CategoryRow({
  row,
  branchRight,
  onOpen,
  query,
}: {
  row: Row;
  branchRight: boolean;
  onOpen: (concept: Concept) => void;
  query: string;
}) {
  const rowRef = useRef<HTMLLIElement>(null);

  return (
    <li ref={rowRef} className="relative">
      {row.concepts.length > 0 && (
        <ConnectorFan
          containerRef={rowRef}
          side={branchRight ? 'right' : 'left'}
          // Re-measures when the filter changes the visible terms.
          signature={`${query}:${row.concepts.map((c) => c.slug).join(',')}`}
        />
      )}

      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
        <div className="relative mx-auto md:col-start-2 md:row-start-1">
          <span
            {...{ [FAN_ORIGIN]: '' }}
            id={row.category.slug}
            className="node-surface relative z-10 block w-full max-w-xs scroll-mt-24 bg-accent-strong px-4 py-2 text-center text-sm font-bold text-accent-foreground md:w-56"
          >
            {row.category.title}
          </span>
        </div>

        {row.concepts.length > 0 && (
          <div
            className={`md:row-start-1 ${
              branchRight
                ? 'md:col-start-3 md:justify-self-start md:pl-16'
                : 'md:col-start-1 md:justify-self-end md:pr-16'
            }`}
          >
            <ul className="flex w-full flex-col gap-2 md:w-72">
              {row.concepts.map((concept) => (
                <li key={concept.slug}>
                  <button
                    type="button"
                    {...{ [FAN_TARGET]: concept.slug }}
                    id={concept.slug}
                    onClick={() => onOpen(concept)}
                    className="node-surface node-interactive block w-full scroll-mt-24 truncate bg-accent px-3 py-2 text-center text-sm text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                  >
                    {concept.term}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </li>
  );
}

export function ConceptMindMap({ categories }: { categories: readonly ConceptCategory[] }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<Concept | null>(null);

  const rows = useMemo<Row[]>(() => {
    const trimmed = query.trim();
    return categories
      .map((category) => ({
        category,
        concepts: trimmed
          ? category.concepts.filter((c) => matchesQuery(c, trimmed))
          : [...category.concepts],
      }))
      // A category with nothing left to show is noise, not context.
      .filter((row) => row.concepts.length > 0);
  }, [categories, query]);

  const total = useMemo(
    () => rows.reduce((sum, row) => sum + row.concepts.length, 0),
    [rows],
  );

  useEffect(() => {
    /**
     * Opens the term a deep link points at.
     *
     * Runs on mount and on hashchange, because a link from another page arrives
     * as a fresh load while one within the page does not.
     */
    const openFromHash = () => {
      const slug = decodeURIComponent(window.location.hash.slice(1));
      if (!slug) return;

      for (const category of categories) {
        const concept = category.concepts.find((c) => c.slug === slug);
        if (concept) {
          // Clear any filter first, or the target may not be on screen.
          setQuery('');
          setOpen(concept);
          requestAnimationFrame(() => {
            document.getElementById(slug)?.scrollIntoView({ block: 'center' });
          });
          return;
        }
      }
      document.getElementById(slug)?.scrollIntoView({ block: 'center' });
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [categories]);

  return (
    <div className="relative flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <label className="node-surface flex flex-1 items-center gap-2 bg-surface px-3 py-2 md:max-w-sm">
          <Search size={15} className="text-foreground-muted" aria-hidden />
          <span className="sr-only">Search concepts</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search concepts…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-foreground-muted"
          />
        </label>
        <p className="text-xs text-foreground-muted" aria-live="polite">
          {total} {total === 1 ? 'concept' : 'concepts'}
          {query.trim() && ' matching'}
        </p>
      </div>

      {rows.length === 0 ? (
        <p className="text-sm text-foreground-muted">
          Nothing matches “{query.trim()}”. Try a broader term.
        </p>
      ) : (
        <div className="relative">
          <span
            aria-hidden
            className="absolute left-1/2 top-0 hidden spine-line h-full -translate-x-1/2 bg-connector md:block"
          />
          <ol className="relative flex flex-col gap-8">
            {rows.map((row, index) => (
              <CategoryRow
                key={row.category.slug}
                row={row}
                branchRight={index % 2 === 0}
                onOpen={setOpen}
                query={query}
              />
            ))}
          </ol>
        </div>
      )}

      {open && <ConceptPopover concept={open} onClose={() => setOpen(null)} />}
    </div>
  );
}
