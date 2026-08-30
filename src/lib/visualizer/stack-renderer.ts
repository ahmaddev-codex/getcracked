import type { Trace } from '@/lib/trace/protocol';
import type { RenderState, Renderer } from './registry';
import {
  formatValue,
  setAttr,
  setText,
  statusAt,
  svgEl,
  fillFor,
  strokeFor,
  textFor,
} from './svg';

/**
 * Stack and queue renderers (B2).
 *
 * Same data, different picture, because the two differ only in *where* you are
 * allowed to touch them — and that is exactly what the drawing should show.
 *
 * A stack grows upward with the top marked, because "top" is the only position a
 * stack operation can reach. A queue is drawn along a row with `front` and
 * `back` labelled at opposite ends, because the whole point is that things leave
 * from the end they did not enter. Drawing both as a plain row, as the array
 * renderer would, loses the one property the lesson is about.
 *
 * Cells beyond the live region are dimmed rather than removed: an array-backed
 * stack does not shrink when it pops, and showing the stale slot is both honest
 * and the thing that explains why `pop` is O(1).
 */

const CELL_W = 64;
const CELL_H = 30;
const GAP = 4;
const LABEL_W = 54;

interface Slot {
  box: SVGRectElement;
  value: SVGTextElement;
  marker: SVGTextElement;
}

type Orientation = 'stack' | 'queue';

function build(orientation: Orientation): Renderer {
  let svg: SVGSVGElement | null = null;
  let slots: Slot[] = [];
  let name = '';
  let indexedBy: readonly string[] | undefined;

  return {
    mount(container: HTMLElement, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'array');
      if (!collection) return;
      name = collection.name;
      indexedBy = collection.indexedBy;

      const count = Math.max(1, collection.initial.length);
      const vertical = orientation === 'stack';

      svg = svgEl('svg', {
        role: 'img',
        'aria-label':
          orientation === 'stack'
            ? `Stack ${name}, drawn bottom to top with the top marked.`
            : `Queue ${name}, drawn front to back.`,
        width: vertical ? LABEL_W + CELL_W : count * (CELL_W + GAP) + LABEL_W,
        height: vertical ? count * (CELL_H + GAP) : CELL_H + 22,
      });

      collection.initial.forEach((value, index) => {
        // A stack is drawn bottom-up, so index 0 sits at the bottom.
        const position = vertical ? count - 1 - index : index;
        const x = vertical ? LABEL_W : position * (CELL_W + GAP);
        const y = vertical ? position * (CELL_H + GAP) : 0;

        const box = svgEl('rect', {
          class: 'gc-cell',
          x,
          y,
          width: CELL_W,
          height: CELL_H,
          rx: 3,
          fill: 'var(--surface-muted)',
          stroke: 'var(--border)',
        });

        const text = svgEl('text', {
          x: x + CELL_W / 2,
          y: y + CELL_H / 2 + 4,
          'text-anchor': 'middle',
          'font-size': 12,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground)',
        });
        text.textContent = formatValue(value);

        // "top" / "front" / "back", written beside the slot it refers to.
        const marker = svgEl('text', {
          x: vertical ? LABEL_W - 6 : x + CELL_W / 2,
          y: vertical ? y + CELL_H / 2 + 4 : CELL_H + 14,
          'text-anchor': vertical ? 'end' : 'middle',
          'font-size': 9,
          'font-family': 'var(--font-mono)',
          fill: 'var(--link)',
        });

        svg!.append(box, text, marker);
        slots.push({ box, value: text, marker });
      });

      container.append(svg);
    },

    update(state: RenderState) {
      const values = state.arrays.get(name);
      if (!values) return;

      // The live region: an array-backed stack keeps its capacity, so "how much
      // is in it" comes from a length-like variable when the code tracks one.
      let live = values.length;
      for (const [variable, value] of state.variables) {
        if (/^(top|size|length|count|depth|deepest|n)$/i.test(variable) && typeof value === 'number') {
          live = Math.max(0, Math.min(values.length, value));
          break;
        }
      }

      slots.forEach((slot, index) => {
        const status = statusAt(state, name, index, indexedBy);
        const inside = index < live;

        setAttr(slot.box, 'fill', fillFor(status));
        setAttr(slot.box, 'stroke', strokeFor(status));
        setAttr(slot.box, 'opacity', inside ? '1' : '0.35');
        setText(slot.value, formatValue(values[index]));
        setAttr(slot.value, 'fill', textFor(status));
        setAttr(slot.value, 'opacity', inside ? '1' : '0.35');

        // Structural label and pointer names are shown together, not one
        // instead of the other: "front" is what makes this a queue, and `i` is
        // where the code currently is. Losing either loses half the picture.
        const structural =
          orientation === 'stack'
            ? inside && index === live - 1
              ? 'top →'
              : ''
            : index === 0
              ? 'front'
              : inside && index === live - 1
                ? 'back'
                : '';

        setText(slot.marker, [structural, ...status.pointers].filter(Boolean).join(' '));
      });
    },

    destroy() {
      svg?.remove();
      svg = null;
      slots = [];
    },
  };
}

export const createStackRenderer = (): Renderer => build('stack');
export const createQueueRenderer = (): Renderer => build('queue');
