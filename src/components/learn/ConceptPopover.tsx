'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles } from 'lucide-react';
import type { Concept } from '@/content/concepts';
import { ComponentReferenceModal } from '@/components/system-design/ComponentReferenceModal';

/**
 * A reference definition, shown next to the term it defines.
 *
 * **Why not the side panel it replaces.** A concept is a term, one or two
 * sentences of definition, and one or two of why it matters — around 300
 * characters. That was being given a full-height modal drawer with a scrim, a
 * focus trap, two bordered sections and uppercase section headings, which is
 * roughly the chrome a settings screen gets. The container was announcing far
 * more than the content had to say, and it covered the map the learner was
 * reading in order to show them four lines.
 *
 * A popover next to the word is also the more useful shape: the point of the
 * mind map is the relationship *between* terms, and a definition you can read
 * without losing sight of its neighbours keeps that on screen.
 *
 * **Positioned in document coordinates, not viewport ones.** The popover is
 * absolutely positioned inside a body portal at the anchor's page position, so
 * it scrolls with the page for free — no scroll listener, and no chance of it
 * drifting away from the term it belongs to.
 */

/** Below this the viewport is too narrow to place anything beside anything. */
const ANCHORED_MIN_WIDTH = 640;
/** Keeps the card off the very edge when it has been clamped. */
const VIEWPORT_MARGIN = 16;
/** Roughly the card's height, for deciding whether it fits below the term. */
const ESTIMATED_HEIGHT = 220;
const ANCHOR_GAP = 8;

interface Position {
  top: number;
  left: number;
}

/**
 * How the card is placed. The coordinates are *not* here.
 *
 * `pending` is a real state, not an absence: the card has to be rendered to be
 * measured, so there is a frame where it exists and its place is unknown. It is
 * laid out but not painted during that frame, so the reader never sees it in
 * the wrong position first.
 *
 * The computed top and left are written straight to the node rather than held
 * in state and rendered as an inline `style`. Two reasons, and the second is the
 * real one: inline styles are banned in components because they bypass the token
 * layer (eslint.config.mjs), and this is a *measured geometry* rather than a
 * design value — it belongs in the DOM, not in the design system.
 */
type Placement = 'pending' | 'anchored' | 'sheet';

/**
 * Where the card goes, given the term's position on the page.
 *
 * Exported for tests: the placement rules are the part with the bugs in it, and
 * they are pure arithmetic that should not need a browser to check.
 */
export function placeCard(
  anchor: { top: number; bottom: number; left: number; width: number },
  viewport: { width: number; height: number; scrollX: number; scrollY: number },
  card: { width: number; height: number },
): Position {
  // Centred on the term, then clamped so a term near either edge does not push
  // the card off screen.
  const idealLeft = anchor.left + anchor.width / 2 - card.width / 2;
  const maxLeft = viewport.width - card.width - VIEWPORT_MARGIN;
  const left = Math.max(VIEWPORT_MARGIN, Math.min(idealLeft, maxLeft));

  // Below by default, flipped above when there is not room — a card that runs
  // off the bottom is the one failure mode people actually hit, because terms
  // near the end of a long map are exactly what you scroll to.
  const roomBelow = viewport.height - anchor.bottom;
  const top =
    roomBelow >= card.height + ANCHOR_GAP || anchor.top < card.height + ANCHOR_GAP
      ? anchor.bottom + ANCHOR_GAP
      : anchor.top - card.height - ANCHOR_GAP;

  // Document coordinates, so the card scrolls with the page.
  return { top: top + viewport.scrollY, left: left + viewport.scrollX };
}

export function ConceptPopover({
  concept,
  onClose,
}: {
  concept: Concept;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  /**
   * Starts as `sheet` where nothing can be measured, so the effect below never
   * has to set state in its own body — the one place React asks callers not to.
   */
  const [placement, setPlacement] = useState<Placement>(() =>
    typeof ResizeObserver === 'undefined' ? 'sheet' : 'pending',
  );
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || typeof ResizeObserver === 'undefined') return;

    const place = () => {
      const anchor = // The term's own node carries the slug as its id, which is
        // also what the deep links (A14) address, so it is already addressable.
        window.innerWidth < ANCHORED_MIN_WIDTH ? null : document.getElementById(concept.slug);

      if (!anchor) {
        // Nowhere to place anything beside anything, or no term to place it
        // beside. The card goes above the thumb instead — same content, in a
        // position that can be reached.
        card.style.top = '';
        card.style.left = '';
        setPlacement('sheet');
        return;
      }

      const rect = anchor.getBoundingClientRect();
      const { top, left } = placeCard(
        { top: rect.top, bottom: rect.bottom, left: rect.left, width: rect.width },
        {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY,
        },
        { width: card.offsetWidth, height: card.offsetHeight || ESTIMATED_HEIGHT },
      );

      card.style.top = `${top}px`;
      card.style.left = `${left}px`;
      setPlacement('anchored');
    };

    /**
     * Measured from a ResizeObserver rather than from the effect body.
     *
     * It fires once on `observe` — the initial measurement, taken after layout
     * when the card's real height is known — and again if the card changes size.
     * Calling `place()` in the effect body would set state synchronously during
     * an effect, which is the cascading-render shape React asks callers to avoid.
     */
    const observer = new ResizeObserver(place);
    observer.observe(card);
    window.addEventListener('resize', place);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', place);
    };
  }, [concept.slug]);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    cardRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      // Focus returns to the term, so a keyboard user carries on down the map
      // rather than being dropped at the top of the document.
      opener?.focus?.();
    };
  }, [onClose]);

  if (showModal) {
    return (
      <ComponentReferenceModal
        concept={concept}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          onClose();
        }}
      />
    );
  }

  return createPortal(
    <>
      {/*
        A transparent catcher rather than a scrim.

        Dimming the page is what a modal does, and this is not one — the whole
        point is that the map stays readable behind it. Clicking anywhere still
        dismisses, which is what people expect from a popover.
      */}
      <button
        type="button"
        aria-label="Close definition"
        onClick={onClose}
        className="fixed inset-0 z-60 cursor-default"
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-label={concept.term}
        tabIndex={-1}
        className={[
          'gc-popover node-surface z-60 flex flex-col gap-2 bg-surface p-4 text-foreground outline-none',
          placement === 'sheet'
            ? // Narrow screens: a card above the thumb, full width less a gutter.
              'fixed inset-x-4 bottom-4 mx-auto'
            : 'absolute',
          // Laid out but not painted while it is being measured, so the card has
          // a real height to measure and the reader never sees it in the wrong
          // place first.
          placement === 'pending' ? 'invisible' : '',
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-sans text-base font-bold tracking-tight">{concept.term}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-m-1 rounded-xs p-1 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            <X size={14} aria-hidden />
          </button>
        </div>

        {/*
          No section headings.

          "What it is" and "Why it matters" over one sentence each was more
          label than content. The second paragraph is set muted instead, which
          carries the same distinction — this is the elaboration — in none of
          the space.
        */}
        <p className="text-sm leading-6">{concept.definition}</p>
        <p className="text-sm leading-6 text-foreground-muted">{concept.matters}</p>

        {concept.dimensions && (
          <div className="pt-2.5 mt-1 border-t border-border-subtle flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-node text-2xs font-bold uppercase bg-accent text-accent-foreground border border-border-strong shadow-2xs">
              <Sparkles size={11} className="shrink-0" />
              10D Spec
            </span>
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="text-xs text-link hover:underline font-semibold flex items-center gap-1 cursor-pointer"
            >
              Open Full Breakdown →
            </button>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
