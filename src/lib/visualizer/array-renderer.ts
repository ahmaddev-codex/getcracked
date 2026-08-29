import type { Trace } from '@/lib/trace/protocol';
import type { RenderState, Renderer } from './registry';

/**
 * Array renderer (B2) — the first structure type, and the pattern the rest
 * follow.
 *
 * **Bars, not boxes.** Height is proportional to value, which is what makes a
 * sort legible: a swap is a visible exchange of two heights rather than two
 * numbers changing in place. Boxes alone show *that* something moved but not
 * whether the array is getting closer to sorted. Values and indices are still
 * labelled, so the representation works for non-numeric arrays too.
 *
 * **Colour carries meaning**, and the meanings are the ones the trace can
 * actually justify:
 *
 * | state | meaning |
 * |---|---|
 * | read | the element the code just looked at |
 * | write | the element it just changed |
 * | pointer | an index variable currently sitting here |
 *
 * Deliberately absent: a "sorted" colour. Knowing which elements are in final
 * position requires understanding the algorithm, and the trace does not. Showing
 * a green "done" bar the code has not earned would be a guess presented as fact.
 *
 * Builds one bar per element at mount and then only mutates attributes. Nothing
 * is created or destroyed per frame, which is what holds 500 elements at 60fps
 * (H5) — allocation is the cost that scales badly, not painting.
 *
 * Deliberately outside React (ADR 0001 §7).
 */

const MAX_CELL = 30;
const MIN_CELL = 4;
const GAP = 2;
const PLOT_HEIGHT = 120;
const LABEL_BAND = 30;

interface Cell {
  group: SVGGElement;
  rect: SVGRectElement;
  value: SVGTextElement | null;
  index: SVGTextElement | null;
}

/** Bars stay readable when few, and stay on screen when many. */
function cellWidth(count: number): number {
  if (count <= 0) return MAX_CELL;
  return Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(640 / count) - GAP));
}

export function createArrayRenderer(): Renderer {
  let svg: SVGSVGElement | null = null;
  let cells: Cell[] = [];
  let arrayName = '';
  let scaleMin = 0;
  let scaleMax = 1;
  let width = MAX_CELL;
  let showLabels = true;

  function el<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  /** Bar height for a value, floored so a zero or minimum still reads as a bar. */
  function heightFor(value: unknown): number {
    if (typeof value !== 'number' || !Number.isFinite(value)) return PLOT_HEIGHT * 0.35;
    const span = scaleMax - scaleMin || 1;
    return 6 + ((value - scaleMin) / span) * (PLOT_HEIGHT - 6);
  }

  return {
    mount(container, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'array');
      if (!collection) return;

      arrayName = collection.name;
      const values = collection.initial;

      const numbers = values.filter((v): v is number => typeof v === 'number');
      scaleMin = numbers.length ? Math.min(0, ...numbers) : 0;
      scaleMax = numbers.length ? Math.max(...numbers) : 1;

      width = cellWidth(values.length);
      // Below this the text is unreadable and the labels become noise.
      showLabels = width >= 16;

      svg = el('svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute(
        'aria-label',
        `Array ${arrayName}, ${values.length} elements, drawn as bars whose height is the value. A text description of each step follows.`,
      );
      svg.setAttribute('width', String(values.length * (width + GAP)));
      svg.setAttribute('height', String(PLOT_HEIGHT + LABEL_BAND));

      values.forEach((value, index) => {
        const group = el('g');
        group.setAttribute('transform', `translate(${index * (width + GAP)}, 0)`);

        const rect = el('rect');
        rect.setAttribute('width', String(width));
        rect.setAttribute('rx', '2');
        const h = heightFor(value);
        rect.setAttribute('height', String(h));
        rect.setAttribute('y', String(PLOT_HEIGHT - h));
        rect.setAttribute('fill', 'var(--surface-muted)');
        rect.setAttribute('stroke', 'var(--border)');
        group.append(rect);

        let valueText: SVGTextElement | null = null;
        let indexText: SVGTextElement | null = null;

        if (showLabels) {
          valueText = el('text');
          valueText.setAttribute('x', String(width / 2));
          valueText.setAttribute('y', String(PLOT_HEIGHT + 12));
          valueText.setAttribute('text-anchor', 'middle');
          valueText.setAttribute('font-size', '10');
          valueText.setAttribute('font-family', 'var(--font-mono)');
          valueText.setAttribute('fill', 'var(--foreground)');
          valueText.textContent = String(value);

          indexText = el('text');
          indexText.setAttribute('x', String(width / 2));
          indexText.setAttribute('y', String(PLOT_HEIGHT + 24));
          indexText.setAttribute('text-anchor', 'middle');
          indexText.setAttribute('font-size', '9');
          indexText.setAttribute('fill', 'var(--foreground-muted)');
          indexText.textContent = String(index);

          group.append(valueText, indexText);
        }

        svg!.append(group);
        cells.push({ group, rect, value: valueText, index: indexText });
      });

      container.append(svg);
    },

    update(state: RenderState) {
      const values = state.arrays.get(arrayName);
      if (!values) return;

      // Index variables become pointer markers — what makes a two-pointer or
      // sliding-window solution legible rather than a wall of numbers.
      const pointers = new Map<number, string[]>();
      for (const [name, value] of state.variables) {
        if (
          typeof value === 'number' &&
          Number.isInteger(value) &&
          value >= 0 &&
          value < cells.length
        ) {
          pointers.set(value, [...(pointers.get(value) ?? []), name]);
        }
      }

      cells.forEach((cell, index) => {
        const isRead = state.lastRead?.array === arrayName && state.lastRead.index === index;
        const isWrite = state.lastWrite?.array === arrayName && state.lastWrite.index === index;
        const marked = pointers.get(index);

        cell.rect.setAttribute(
          'fill',
          isWrite ? 'var(--accent-strong)' : isRead ? 'var(--accent)' : 'var(--surface-muted)',
        );
        cell.rect.setAttribute('stroke', marked ? 'var(--link)' : 'var(--border)');
        cell.rect.setAttribute('stroke-width', marked ? '2' : '1');

        // Height follows the value, so a swap is a visible exchange.
        const h = heightFor(values[index]);
        const current = cell.rect.getAttribute('height');
        if (current !== String(h)) {
          cell.rect.setAttribute('height', String(h));
          cell.rect.setAttribute('y', String(PLOT_HEIGHT - h));
        }

        if (cell.value) {
          const next = String(values[index]);
          // Guarded: writing textContent unconditionally invalidates layout for
          // every cell every frame, which is the difference between 60fps and not.
          if (cell.value.textContent !== next) cell.value.textContent = next;
        }
        if (cell.index) {
          const label = marked ? marked.join(',') : String(index);
          if (cell.index.textContent !== label) cell.index.textContent = label;
          cell.index.setAttribute(
            'fill',
            marked ? 'var(--link)' : 'var(--foreground-muted)',
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
 * A screen-reader-equivalent description of one step (H4).
 *
 * The animation is not the only way to follow the trace. Generated from the same
 * state the renderer draws, so the two cannot describe different things.
 */
export function describeStep(state: RenderState, arrayName: string): string {
  const parts: string[] = [];
  if (state.line !== null) parts.push(`Line ${state.line}`);

  const values = state.arrays.get(arrayName);
  if (state.lastWrite?.array === arrayName && values) {
    parts.push(`wrote ${String(values[state.lastWrite.index])} to index ${state.lastWrite.index}`);
  } else if (state.lastRead?.array === arrayName && values) {
    parts.push(`read index ${state.lastRead.index}, value ${String(values[state.lastRead.index])}`);
  }

  const vars = [...state.variables]
    .filter(([, v]) => v !== null)
    .map(([k, v]) => `${k} is ${String(v)}`);
  if (vars.length > 0) parts.push(vars.join(', '));

  return parts.join('. ') || 'No state yet.';
}
