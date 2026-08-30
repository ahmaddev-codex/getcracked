import { describe, expect, it } from 'vitest';
import { placeCard } from '@/components/learn/ConceptPopover';

/**
 * Where a reference definition lands (A14).
 *
 * Placement is the part with the bugs in it, and it is pure arithmetic — so it
 * is tested as arithmetic rather than by rendering a browser that jsdom cannot
 * lay out anyway. The cases below are the ones a learner actually reaches: a
 * term at the bottom of a long map, and a term at either edge of the graph.
 */

const CARD = { width: 352, height: 200 };
const VIEWPORT = { width: 1280, height: 800, scrollX: 0, scrollY: 0 };

/** A term of the map's usual node width, at a given position. */
const term = (top: number, left: number, width = 288) => ({
  top,
  bottom: top + 40,
  left,
  width,
});

describe('vertical placement', () => {
  it('sits below the term when there is room', () => {
    const { top } = placeCard(term(100, 400), VIEWPORT, CARD);
    // 40px tall term at y=100, plus the gap.
    expect(top).toBe(148);
  });

  it('flips above when the term is near the bottom', () => {
    // The failure people actually hit: terms near the end of a long map are
    // exactly the ones you scroll to, and a card that runs off the bottom
    // cannot be read at all.
    const { top } = placeCard(term(700, 400), VIEWPORT, CARD);
    expect(top).toBe(700 - CARD.height - 8);
    expect(top).toBeGreaterThan(0);
  });

  it('stays below when there is room neither above nor below', () => {
    // A viewport shorter than the card. Below is the better of two bad answers:
    // the top of the card carries the term and the definition, so clipping the
    // bottom loses less than clipping the top would.
    const short = { ...VIEWPORT, height: 300 };
    const { top } = placeCard(term(120, 400), short, CARD);
    expect(top).toBe(168);
  });
});

describe('horizontal placement', () => {
  it('centres on the term', () => {
    const { left } = placeCard(term(100, 400), VIEWPORT, CARD);
    // Term spans 400–688, centre 544; card is 352 wide.
    expect(left).toBe(544 - CARD.width / 2);
  });

  it('clamps rather than running off the left edge', () => {
    const { left } = placeCard(term(100, 0), VIEWPORT, CARD);
    expect(left).toBe(16);
  });

  it('clamps rather than running off the right edge', () => {
    const { left } = placeCard(term(100, VIEWPORT.width - 288), VIEWPORT, CARD);
    expect(left).toBe(VIEWPORT.width - CARD.width - 16);
    expect(left + CARD.width).toBeLessThanOrEqual(VIEWPORT.width);
  });

  it('keeps the card on screen at every position across the map', () => {
    // The property, rather than three examples of it.
    for (let left = 0; left <= VIEWPORT.width - 100; left += 37) {
      const placed = placeCard(term(200, left), VIEWPORT, CARD);
      expect(placed.left).toBeGreaterThanOrEqual(16);
      expect(placed.left + CARD.width).toBeLessThanOrEqual(VIEWPORT.width - 16);
    }
  });
});

describe('scroll position', () => {
  it('returns document coordinates, so the card scrolls with the page', () => {
    // The reason there is no scroll listener: an absolutely positioned card at
    // a document coordinate moves with the term for free, and cannot drift away
    // from the word it defines.
    const scrolled = { ...VIEWPORT, scrollY: 1200, scrollX: 30 };
    const flat = placeCard(term(100, 400), VIEWPORT, CARD);
    const deep = placeCard(term(100, 400), scrolled, CARD);

    expect(deep.top - flat.top).toBe(1200);
    expect(deep.left - flat.left).toBe(30);
  });
});
