'use client';

import { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Accessible modal focus trap hook.
 *
 * Automatically traps focus within the active dialog, cycles Tab and Shift+Tab,
 * focuses the initial element on mount, and restores focus to the previously
 * focused element upon modal dismissal.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isOpen: boolean,
): void {
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Capture the element that had focus before opening the dialog
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // Initial focus on mount
    const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
    const firstFocusable = focusables[0];
    if (firstFocusable) {
      firstFocusable.focus();
    } else {
      container.focus();
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const currentFocusables = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((el) => el.offsetParent !== null); // only visible elements

      if (currentFocusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = currentFocusables[0]!;
      const lastEl = currentFocusables[currentFocusables.length - 1]!;

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
      // Restore focus to the opener
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus();
      }
    };
  }, [isOpen, containerRef]);
}
