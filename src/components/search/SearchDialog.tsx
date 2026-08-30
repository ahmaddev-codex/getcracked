'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  ClipboardCheck,
  Hammer,
  Search,
  Shapes,
  SquareCode,
  Terminal,
} from 'lucide-react';
import { track } from '@/lib/analytics/track';
import { countByKind, searchEntries } from '@/lib/search/rank';
import type { SearchEntry, SearchKind } from '@/lib/search';

/**
 * Search over everything, from anywhere (I6).
 *
 * A dialog rather than a page, because search here is *navigation*: the answer
 * is somewhere else, and a results page would put an extra stop between the
 * question and the destination. It is also why every result is a real
 * destination and there is no "see all results".
 *
 * **The index is fetched once, on first open.** Never on page load: most visits
 * never search, and making every one of them pay for the catalogue to sit unused
 * in memory would be a straight regression on the metric the whole product is
 * optimised for. A failed fetch says so rather than showing an empty list, which
 * would read as "nothing matches".
 *
 * **Rendered into `document.body`, not where it was opened from.** The trigger
 * lives in the header, and the header sets `text-header-foreground` on itself —
 * so as a DOM descendant this dialog inherited it. In light mode that token and
 * `--surface` are both `#ffffff`, which made every element that did not set its
 * own colour — the result titles, the filter chips, and the search input's own
 * text — white on white. Dark mode hid it, because there the header and body
 * foregrounds happen to be the same value.
 *
 * A portal removes the whole class rather than the one instance: an overlay's
 * appearance should not depend on which component opened it, and `position:
 * fixed` inside an ancestor that later gains a `transform` would break in a
 * second, less obvious way. The panel still declares its own foreground, as the
 * account menu does, so it is correct even outside a portal.
 */

const KIND_META: Record<SearchKind, { label: string; icon: typeof BookOpen }> = {
  lesson: { label: 'Lessons', icon: BookOpen },
  problem: { label: 'Problems', icon: SquareCode },
  challenge: { label: 'Builds', icon: Hammer },
  lab: { label: 'Labs', icon: ClipboardCheck },
  pattern: { label: 'Patterns', icon: Shapes },
  concept: { label: 'Reference', icon: Terminal },
};

const KINDS = Object.keys(KIND_META) as SearchKind[];

/**
 * No explicit `loading`.
 *
 * It would have to be set from inside the effect that starts the fetch, which
 * is the cascading-render shape React asks callers to avoid. `idle` while the
 * dialog is open *is* loading — the fetch begins the moment it opens — so the
 * state that would have to be written is one the component can already read.
 */
type IndexState =
  | { status: 'idle' }
  | { status: 'ready'; entries: SearchEntry[] }
  | { status: 'failed' };

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const listId = useId();

  const [index, setIndex] = useState<IndexState>({ status: 'idle' });
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<SearchKind | null>(null);
  const [active, setActive] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  /** Guards against a second fetch when the dialog is reopened. */
  const requested = useRef(false);

  /** Fetched the first time the dialog is opened, and kept for the session. */
  useEffect(() => {
    if (!open || requested.current) return;
    requested.current = true;

    let cancelled = false;

    void fetch('/api/search')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: { entries?: SearchEntry[] }) => {
        // In a callback rather than an effect body — this is an external system
        // answering, which is the shape React asks for.
        if (!cancelled) setIndex({ status: 'ready', entries: data.entries ?? [] });
      })
      .catch(() => {
        if (!cancelled) setIndex({ status: 'failed' });
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Memoised so the empty case is a stable reference: a fresh `[]` per render
  // would invalidate both memos below on every keystroke.
  const entries = useMemo(
    () => (index.status === 'ready' ? index.entries : []),
    [index],
  );

  const hits = useMemo(
    () => searchEntries(entries, query, { kind: kind ?? undefined }),
    [entries, query, kind],
  );

  const counts = useMemo(() => countByKind(entries, query), [entries, query]);

  // Clamped rather than reset: the highlight should survive a keystroke that
  // narrows the list, and land on the last row rather than vanishing.
  const activeIndex = Math.min(active, Math.max(0, hits.length - 1));

  const go = useCallback(
    (href: string) => {
      track('search_result_opened', { query: query.trim().slice(0, 64) });
      onClose();
      router.push(href);
    },
    [router, onClose, query],
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((i) => Math.min(i + 1, hits.length - 1));
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive((i) => Math.max(i - 1, 0));
        return;
      }
      if (event.key === 'Enter') {
        const hit = hits[activeIndex];
        if (hit) {
          event.preventDefault();
          go(hit.entry.href);
        }
      }
    },
    [hits, activeIndex, go, onClose],
  );

  if (!open) return null;

  return createPortal(
    <div
      // Clicking the backdrop closes, which is what a dialog over a page should
      // do. The panel below stops the click so a stray click inside does not.
      onMouseDown={onClose}
      className="gc-overlay fixed inset-0 z-50 flex items-start justify-center bg-foreground/40 p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="gc-overlay-panel node-surface flex w-full max-w-reading flex-col overflow-hidden bg-surface text-foreground"
      >
        <div className="flex items-center gap-2 border-b-2 border-border-strong px-4 py-3">
          <Search size={16} className="shrink-0 text-foreground-muted" aria-hidden />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            placeholder="Search lessons, problems, builds and reference terms…"
            aria-label="Search everything"
            aria-controls={listId}
            className="w-full bg-transparent text-sm outline-none placeholder:text-foreground-muted"
          />
          <kbd className="shrink-0 text-sm text-foreground-muted">esc</kbd>
        </div>

        {query.trim() && index.status === 'ready' && (
          <div className="flex flex-wrap gap-1.5 border-b border-border-subtle px-4 py-2">
            <FilterChip
              label="All"
              // Always the total across kinds, never the filtered count — a
              // chip that changed its own number when you selected another one
              // would be unreadable.
              count={Object.values(counts).reduce((a, b) => a + b, 0)}
              selected={kind === null}
              onSelect={() => {
                setKind(null);
                setActive(0);
              }}
            />
            {KINDS.filter((k) => counts[k] > 0).map((k) => (
              <FilterChip
                key={k}
                label={KIND_META[k].label}
                count={counts[k]}
                selected={kind === k}
                onSelect={() => {
                  setKind(k);
                  setActive(0);
                }}
              />
            ))}
          </div>
        )}

        <div id={listId} className="min-h-0 flex-1 overflow-y-auto">
          {index.status === 'idle' && (
            <p className="p-4 text-sm text-foreground-muted">Loading the catalogue…</p>
          )}

          {index.status === 'failed' && (
            // An empty list here would read as "nothing matches", which is a
            // different and wrong answer.
            <p className="p-4 text-sm text-danger">
              Search is unavailable — the catalogue could not be loaded. Everything is
              still reachable from the navigation above.
            </p>
          )}

          {index.status === 'ready' && !query.trim() && (
            <p className="p-4 text-sm text-foreground-muted">
              Type to search {entries.length} lessons, problems, builds and reference
              terms. Try <em>quorum</em>, <em>sliding window</em>, or <em>evict</em>.
            </p>
          )}

          {index.status === 'ready' && query.trim() && hits.length === 0 && (
            <p className="p-4 text-sm text-foreground-muted">
              Nothing matches “{query.trim()}”. Search matches whole words as they are
              written, so try a shorter or broader term.
            </p>
          )}

          <ul>
            {hits.map((hit, i) => {
              const Icon = KIND_META[hit.entry.kind].icon;
              const selected = i === activeIndex;
              return (
                <li key={hit.entry.id}>
                  <button
                    type="button"
                    // Pointer moves the highlight so mouse and keyboard agree
                    // about what Enter would open.
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(hit.entry.href)}
                    aria-current={selected ? 'true' : undefined}
                    className={`flex w-full items-start gap-3 px-4 py-2.5 text-left ${
                      selected ? 'bg-accent-strong text-accent-foreground' : ''
                    }`}
                  >
                    <Icon size={15} aria-hidden className="mt-0.5 shrink-0 opacity-70" />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-sm font-semibold">{hit.entry.title}</span>
                      <span
                        className={`truncate text-xs ${
                          selected ? 'opacity-80' : 'text-foreground-muted'
                        }`}
                      >
                        {hit.entry.detail}
                      </span>
                    </span>
                    <span
                      className={`ml-auto shrink-0 text-xs ${
                        selected ? 'opacity-80' : 'text-foreground-muted'
                      }`}
                    >
                      {KIND_META[hit.entry.kind].label.replace(/s$/, '')}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <p className="border-t border-border-subtle px-4 py-2 text-xs text-foreground-muted">
          ↑↓ to move · ↵ to open · esc to close
        </p>
      </div>
    </div>,
    document.body,
  );
}

function FilterChip({
  label,
  count,
  selected,
  onSelect,
}: {
  label: string;
  count: number;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`node-surface px-2 py-0.5 text-xs ${
        selected ? 'bg-accent-strong text-accent-foreground' : 'bg-surface-muted'
      }`}
    >
      {label} <span className="opacity-70">{count}</span>
    </button>
  );
}
