import type { Trace, Scalar } from '@/lib/trace/protocol';
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
 * Array renderer (B2) — indexed boxes, the shape an array actually has.
 *
 * **Boxes, because that is what an array is.** A row of numbered slots is how
 * every textbook, every whiteboard and every debugger draws one, and matching
 * that is the point: a learner should recognise the picture before they read the
 * legend. Indices sit below each box because `a[3]` is the thing they will type.
 *
 * **A magnitude bar inside each box**, for numeric arrays only. Boxes alone show
 * *that* two values swapped but not whether the array is getting closer to
 * sorted; a proportional fill restores that at no cost to the shape. It is drawn
 * inside the box rather than replacing it, so the structure stays an array while
 * the ordering stays visible.
 *
 * **Colour carries meaning**, and only the meanings the trace can justify:
 *
 * | state | meaning |
 * |---|---|
 * | read | the element the code just looked at |
 * | write | the element it just changed |
 * | pointer | an index variable currently sitting here |
 *
 * Deliberately absent: a "sorted" colour. Knowing which elements are in final
 * position requires understanding the algorithm, and the trace does not. Showing
 * a green "done" box the code has not earned would be a guess presented as fact.
 *
 * Builds one box per element at mount and then only mutates attributes. Nothing
 * is created or destroyed per frame, which is what holds 500 elements at 60fps
 * (H5). Deliberately outside React (ADR 0001 §7).
 */

const MAX_CELL = 84;
const MIN_CELL = 6;
const GAP = 4;
const MAX_CELL_HEIGHT = 72;
const MIN_CELL_HEIGHT = 36;
const INDEX_BAND = 16;
/** Headroom for the "was N" annotation above a changed cell. */
const WAS_BAND = 14;
/** Used only when the container has not been laid out yet. */
const FALLBACK_WIDTH = 680;

interface Cell {
  group: SVGGElement;
  box: SVGRectElement;
  fill: SVGRectElement | null;
  value: SVGTextElement | null;
  index: SVGTextElement | null;
  was: SVGTextElement | null;
}

/**
 * Cell size, from the space actually available.
 *
 * Previously a fixed 680px budget capped at 44px, which meant a five-element
 * array drew 240px wide however much room it had — smaller than the code panel
 * beside it, and unreadable next to a lesson set in 16px. Measuring the
 * container lets a short array be large and a long one stay on screen, which is
 * the same rule at both ends rather than two different ones.
 */
function cellWidth(count: number, available: number): number {
  if (count <= 0) return MAX_CELL;
  const budget = available > 0 ? available : FALLBACK_WIDTH;
  return Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(budget / count) - GAP));
}

export function createArrayRenderer(): Renderer {
  let svg: SVGSVGElement | null = null;
  let cells: Cell[] = [];
  let name = '';
  let indexedBy: readonly string[] | undefined;
  let width = MAX_CELL;
  let cellHeight = MAX_CELL_HEIGHT;
  let showLabels = true;
  let scaleMin = 0;
  let scaleMax = 1;
  let numeric = false;

  /** Height of the magnitude fill for a value, or 0 when not numeric. */
  function fillHeight(value: unknown): number {
    if (!numeric || typeof value !== 'number' || !Number.isFinite(value)) return 0;
    const span = scaleMax - scaleMin || 1;
    return Math.max(0, ((value - scaleMin) / span) * cellHeight);
  }

  return {
    mount(container: HTMLElement, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'array');
      if (!collection) return;

      name = collection.name;

      indexedBy = collection.indexedBy;
      const values = collection.initial;

      const numbers = values.filter((v): v is number => typeof v === 'number');
      numeric = numbers.length === values.length && values.length > 0;
      scaleMin = numbers.length ? Math.min(0, ...numbers) : 0;
      scaleMax = numbers.length ? Math.max(...numbers) : 1;

      width = cellWidth(values.length, container.clientWidth);
      // Height follows width so cells stay roughly square rather than becoming
      // letterboxes when a short array gets a lot of room.
      cellHeight = Math.max(MIN_CELL_HEIGHT, Math.min(MAX_CELL_HEIGHT, width));
      // Below this the text is unreadable and the labels become noise.
      showLabels = width >= 18;

      svg = svgEl('svg', {
        role: 'img',
        'aria-label': `Array ${name}: ${values.length} indexed boxes. A text description of each step follows.`,
        width: values.length * (width + GAP),
        height: WAS_BAND + cellHeight + INDEX_BAND,
      });

      values.forEach((value, index) => {
        const group = svgEl('g', {
          transform: `translate(${index * (width + GAP)}, ${WAS_BAND})`,
        });

        const box = svgEl('rect', {
          class: 'gc-cell',
          width,
          height: cellHeight,
          rx: 3,
          fill: 'var(--surface-muted)',
          stroke: 'var(--border)',
        });
        group.append(box);

        // Magnitude, drawn inside the box so the shape stays an array.
        let fill: SVGRectElement | null = null;
        if (numeric) {
          const h = fillHeight(value);
          fill = svgEl('rect', {
            class: 'gc-cell-fill',
            x: 1,
            width: Math.max(0, width - 2),
            y: cellHeight - h,
            height: h,
            fill: 'var(--accent)',
            opacity: 0.35,
            'pointer-events': 'none',
          });
          group.append(fill);
        }

        let value_ = null as SVGTextElement | null;
        let index_ = null as SVGTextElement | null;
        let was = null as SVGTextElement | null;

        if (showLabels) {
          value_ = svgEl('text', {
            x: width / 2,
            y: cellHeight / 2 + 5,
            'text-anchor': 'middle',
            'font-size': Math.max(11, Math.min(18, Math.round(width / 3.4))),
            'font-family': 'var(--font-mono)',
            'font-weight': 600,
            fill: 'var(--foreground)',
          });
          value_.textContent = formatValue(value);

          index_ = svgEl('text', {
            x: width / 2,
            y: cellHeight + 12,
            'text-anchor': 'middle',
            'font-size': 9,
            'font-family': 'var(--font-mono)',
            fill: 'var(--foreground-muted)',
          });
          index_.textContent = String(index);

          was = svgEl('text', {
            x: width / 2,
            y: -4,
            'text-anchor': 'middle',
            'font-size': 9,
            'font-family': 'var(--font-mono)',
            fill: 'var(--foreground-muted)',
          });

          group.append(value_, index_, was);
        }

        svg!.append(group);
        cells.push({ group, box, fill, value: value_, index: index_, was });
      });

      container.append(svg);
    },

    update(state: RenderState) {
      const values = state.arrays.get(name);
      if (!values) return;

      const write = state.lastWrite?.array === name ? state.lastWrite : null;
      // A write storing the same value is not worth annotating — `a[i] = a[i]`
      // appears in plenty of correct code and reads as noise.
      const changed = write && !Object.is(write.previous, write.value);

      cells.forEach((cell, index) => {
        const status = statusAt(state, name, index, indexedBy);

        setAttr(cell.box, 'fill', fillFor(status));
        setAttr(cell.box, 'stroke', strokeFor(status));
        setAttr(cell.box, 'stroke-width', status.pointers.length > 0 ? '2' : '1');

        if (cell.fill) {
          const h = fillHeight(values[index]);
          setAttr(cell.fill, 'height', String(h));
          setAttr(cell.fill, 'y', String(cellHeight - h));
          // Hidden on a highlighted cell: the fill would fight the status colour.
          setAttr(cell.fill, 'opacity', status.read || status.write ? '0' : '0.35');
        }

        setText(cell.value, formatValue(values[index]));
        if (cell.value) setAttr(cell.value, 'fill', textFor(status));

        const justChanged = write?.index === index && changed;
        setText(cell.was, justChanged ? `was ${formatValue(write.previous)}` : '');

        // Restarting the animation requires removing the class and forcing a
        // reflow; toggling it alone does nothing when the same cell changes
        // twice in a row.
        if (justChanged) {
          cell.box.classList.remove('gc-cell-changed');
          void cell.box.getBoundingClientRect();
          cell.box.classList.add('gc-cell-changed');
        } else {
          cell.box.classList.remove('gc-cell-changed');
        }

        if (cell.index) {
          setText(cell.index, status.pointers.length > 0 ? status.pointers.join(',') : String(index));
          setAttr(
            cell.index,
            'fill',
            status.pointers.length > 0 ? 'var(--link)' : 'var(--foreground-muted)',
          );
        }
      });
    },

    destroy() {
      svg?.remove();
      svg = null;
      cells = [];
    },
  };
}

/**
 * A plain-language account of one step (H4).
 *
 * Serves two audiences with one string, which is why it is generated from the
 * same state the renderer draws rather than written separately: a screen-reader
 * user gets an equivalent to the animation, and a sighted learner gets the
 * sentence that says *what changed* — the thing colour alone cannot convey.
 *
 * Leads with the change (a write, then a read) because that is the answer to
 * "what just happened". Reports only what the trace recorded; it never
 * characterises progress toward a solution, which the trace cannot know.
 */
export function describeStep(state: RenderState, arrayName: string): string {
  const parts: string[] = [];

  const values = state.arrays.get(arrayName);
  const write = state.lastWrite?.array === arrayName ? state.lastWrite : null;
  const read = state.lastRead?.array === arrayName ? state.lastRead : null;
  const put = state.lastPut;

  /**
   * A map change outranks an array access.
   *
   * When a lesson's picture is the map, describing the input array instead
   * leaves the words and the drawing talking about different things — the exact
   * failure this function exists to prevent. A put is also the more informative
   * event: the array read that fed it is visible on the highlighted line.
   */
  if (put) {
    parts.push(
      put.previous === undefined
        ? `${put.map}[${put.key}] added, set to ${format(put.value)}`
        : Object.is(put.previous, put.value)
          ? `${put.map}[${put.key}] rewritten with the same value, ${format(put.value)}`
          : `${put.map}[${put.key}] changed from ${format(put.previous)} to ${format(put.value)}`,
    );
  } else if (write && !Object.is(write.previous, write.value)) {
    parts.push(
      `${arrayName}[${write.index}] changed from ${format(write.previous)} to ${format(write.value)}`,
    );
  } else if (write) {
    parts.push(
      `${arrayName}[${write.index}] was rewritten with the same value, ${format(write.value)}`,
    );
  } else if (read && values) {
    parts.push(`read ${arrayName}[${read.index}], which is ${format(read.value)}`);
  }

  const moved = [...state.changed]
    .filter((name) => state.variables.get(name) !== undefined)
    .map((name) => {
      const now = state.variables.get(name) ?? null;
      const before = state.previousValues.get(name) ?? null;
      return before === null || Object.is(before, now)
        ? `${name} is ${format(now)}`
        : `${name} moved from ${format(before)} to ${format(now)}`;
    });
  if (moved.length > 0) parts.push(moved.join(', '));

  if (state.finished) parts.push(`returned ${format(state.returned as Scalar)}`);

  if (parts.length === 0 && state.line !== null) return `Line ${state.line}: no change recorded.`;
  if (parts.length === 0) return 'No state yet.';

  const prefix = state.line !== null ? `Line ${state.line}: ` : '';
  return `${prefix}${parts.join('. ')}.`;
}

function format(value: Scalar | unknown): string {
  if (value === null) return 'null';
  if (typeof value === 'string') return `"${value}"`;
  if (Array.isArray(value)) return `[${value.map(format).join(', ')}]`;
  return String(value);
}
