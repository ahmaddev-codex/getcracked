import type { Trace } from '@/lib/trace/protocol';
import type { RenderState, Renderer } from './registry';

/**
 * Array renderer (B2) — the first structure type, and the pattern the rest
 * follow.
 *
 * Builds one cell per element at mount and then only ever mutates their
 * attributes. Nothing is created or destroyed per frame, which is what keeps a
 * 500-element array at 60fps (H5) — allocation is the cost that scales badly,
 * not painting.
 *
 * Deliberately outside React (ADR 0001 §7). 500 SVG rects is unremarkable; 500
 * React components reconciling every frame is not.
 */

const CELL = 28;
const GAP = 3;
const HEIGHT = 34;

interface Cell {
  group: SVGGElement;
  rect: SVGRectElement;
  text: SVGTextElement;
}

export function createArrayRenderer(): Renderer {
  let svg: SVGSVGElement | null = null;
  let cells: Cell[] = [];
  let arrayName = '';
  let pointerLabels: SVGTextElement[] = [];

  function el<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  return {
    mount(container, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'array');
      if (!collection) return;

      arrayName = collection.name;
      const values = collection.initial;

      svg = el('svg');
      svg.setAttribute('role', 'img');
      svg.setAttribute(
        'aria-label',
        `Array ${arrayName} with ${values.length} elements. A text description of each step follows.`,
      );
      svg.setAttribute('width', String(values.length * (CELL + GAP)));
      svg.setAttribute('height', String(HEIGHT + 18));

      values.forEach((value, index) => {
        const group = el('g');
        group.setAttribute('transform', `translate(${index * (CELL + GAP)}, 0)`);

        const rect = el('rect');
        rect.setAttribute('width', String(CELL));
        rect.setAttribute('height', String(HEIGHT));
        rect.setAttribute('rx', '3');
        rect.setAttribute('fill', 'var(--surface-muted)');
        rect.setAttribute('stroke', 'var(--border)');

        const text = el('text');
        text.setAttribute('x', String(CELL / 2));
        text.setAttribute('y', String(HEIGHT / 2 + 4));
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '11');
        text.setAttribute('font-family', 'var(--font-mono)');
        text.setAttribute('fill', 'var(--foreground)');
        text.textContent = String(value);

        // Index labels, so a highlighted cell can be named.
        const label = el('text');
        label.setAttribute('x', String(CELL / 2));
        label.setAttribute('y', String(HEIGHT + 13));
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '9');
        label.setAttribute('fill', 'var(--foreground-muted)');
        label.textContent = String(index);

        group.append(rect, text);
        svg!.append(group, label);
        cells.push({ group, rect, text });
        pointerLabels.push(label);
      });

      container.append(svg);
    },

    update(state: RenderState) {
      const values = state.arrays.get(arrayName);
      if (!values) return;

      // Index variables become pointer markers — this is what makes a
      // two-pointer or sliding-window solution legible rather than a wall of
      // numbers.
      const pointers = new Map<number, string[]>();
      for (const [name, value] of state.variables) {
        if (typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < cells.length) {
          const existing = pointers.get(value) ?? [];
          existing.push(name);
          pointers.set(value, existing);
        }
      }

      cells.forEach((cell, index) => {
        const isRead = state.lastRead?.array === arrayName && state.lastRead.index === index;
        const isWrite = state.lastWrite?.array === arrayName && state.lastWrite.index === index;
        const marked = pointers.get(index);

        cell.rect.setAttribute(
          'fill',
          isWrite
            ? 'var(--accent-strong)'
            : isRead
              ? 'var(--accent)'
              : marked
                ? 'var(--surface)'
                : 'var(--surface-muted)',
        );
        cell.rect.setAttribute(
          'stroke',
          marked ? 'var(--border-strong)' : 'var(--border)',
        );
        cell.rect.setAttribute('stroke-width', marked ? '2' : '1');

        const next = String(values[index]);
        // Guarded: writing textContent unconditionally invalidates layout for
        // every cell on every frame, which is the difference between 60fps and
        // not at 500 elements.
        if (cell.text.textContent !== next) cell.text.textContent = next;

        const label = pointerLabels[index];
        const labelText = marked ? marked.join(',') : String(index);
        if (label.textContent !== labelText) label.textContent = labelText;
        label.setAttribute('fill', marked ? 'var(--foreground)' : 'var(--foreground-muted)');
      });
    },

    destroy() {
      svg?.remove();
      svg = null;
      cells = [];
      pointerLabels = [];
    },
  };
}

/**
 * A screen-reader-equivalent description of one step (H4).
 *
 * The animation is not the only way to follow the trace. This is the same
 * information as prose, and it is generated from the same state the renderer
 * draws so the two cannot describe different things.
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
