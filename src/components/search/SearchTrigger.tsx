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
        className="flex items-center gap-1.5 rounded-xs text-header-foreground/80 transition-colors hover:text-accent-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-strong"
      >
        <Search size={16} aria-hidden />
        <span className="sr-only">Search</span>
        {/*
          The shortcut is shown rather than only bound, which is most of what
          makes anyone learn it — and hidden on small screens, where there is no
          keyboard to press it with and the header has no room to say so.
        */}
        <kbd
          aria-hidden
          className="hidden text-xs text-header-foreground/60 lg:inline"
        >
          ⌘K
        </kbd>
      </button>

      <SearchDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}
