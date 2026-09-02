'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { track } from '@/lib/analytics/track';
import { SearchDialog } from './SearchDialog';

/**
 * The way into search, from every page (I6).
 *
 * In the header rather than on the surfaces that have something to search,
 * because the question search answers is "where does X live" and a learner
 * asking it does not yet know which surface to be on.
 *
 * ⌘K / ctrl-K as well as the button. It is the shortcut every tool with a
 * palette uses, and someone who reaches for it and finds nothing concludes the
 * product does not have search rather than that it has a button.
 */
export function SearchTrigger() {
  const [open, setOpen] = useState(false);

  const openSearch = useCallback(() => {
    setOpen(true);
    track('search_opened', {});
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        // Chrome binds ctrl-K to the address bar, so this has to be claimed.
        event.preventDefault();
        setOpen((wasOpen) => !wasOpen);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openSearch}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label="Search"
        className="flex items-center gap-2 rounded-full border border-header-foreground/20 bg-header-foreground/5 px-2.5 py-1 text-xs text-header-foreground/75 transition-all hover:border-header-foreground/35 hover:bg-header-foreground/10 hover:text-header-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      >
        <Search size={13} className="shrink-0 text-header-foreground/60" aria-hidden />
        <span className="hidden sm:inline font-sans text-xs">Search...</span>
        <kbd
          aria-hidden
          className="flex items-center justify-center rounded-sm bg-header-foreground/10 px-1.5 py-0.5 font-mono text-3xs font-semibold text-header-foreground/80"
        >
          ⌘K
        </kbd>
      </button>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
