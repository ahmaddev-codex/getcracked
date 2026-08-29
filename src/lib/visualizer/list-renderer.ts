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
 * Linked-list and graph-row renderers (B2).
 *
 * **Linked list**: boxes joined by arrows, ending in a null marker. The arrow is
 * the entire difference from an array — it is why there is no index arithmetic
 * and why you cannot jump to the middle — so drawing the link explicitly is the
 * point rather than decoration.
 *
 * **Graph row**: circles with edges to their neighbours. The graphs lesson walks
 * a row of cells where a node's neighbours are `i-1` and `i+1`, so this draws
 * exactly the adjacency the algorithm uses. It is deliberately not a
 * force-directed layout of an arbitrary graph: the trace records an array, and
 * inventing a topology it does not describe would be a picture of a different
 * problem.
 */

const BOX_W = 52;
const BOX_H = 34;
const ARROW = 26;
const NODE_R = 16;
const NODE_GAP = 58;

interface Cell {
  shape: SVGElement;
  value: SVGTextElement;
  label: SVGTextElement;
}

export function createListRenderer(): Renderer {
  let svg: SVGSVGElement | null = null;
  let cells: Cell[] = [];
  let name = '';

  return {
    mount(container: HTMLElement, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'array');
      if (!collection) return;
      name = collection.name;
      const values = collection.initial;
      const pitch = BOX_W + ARROW;

      svg = svgEl('svg', {
        role: 'img',
        'aria-label': `Linked list ${name}: ${values.length} nodes joined by pointers, ending in null.`,
        width: values.length * pitch + 34,
        height: BOX_H + 22,
      });

      const marker = svgEl('marker', {
        id: 'gc-arrow',
        viewBox: '0 0 8 8',
        refX: 7,
        refY: 4,
        markerWidth: 6,
        markerHeight: 6,
        orient: 'auto-start-reverse',
      });
      marker.append(svgEl('path', { d: 'M 0 1 L 7 4 L 0 7 z', fill: 'var(--foreground-muted)' }));
      const defs = svgEl('defs');
      defs.append(marker);
      svg.append(defs);

      values.forEach((value, index) => {
        const x = index * pitch;

        const box = svgEl('rect', {
          class: 'gc-cell',
          x,
          y: 0,
          width: BOX_W,
          height: BOX_H,
          rx: 3,
          fill: 'var(--surface-muted)',
          stroke: 'var(--border)',
        });

        const text = svgEl('text', {
          x: x + BOX_W / 2,
          y: BOX_H / 2 + 4,
          'text-anchor': 'middle',
          'font-size': 12,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground)',
        });
        text.textContent = formatValue(value);

        const label = svgEl('text', {
          x: x + BOX_W / 2,
          y: BOX_H + 13,
          'text-anchor': 'middle',
          'font-size': 9,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground-muted)',
        });

        // The link itself — the reason this is not an array.
        svg!.append(
          svgEl('line', {
            x1: x + BOX_W + 3,
            y1: BOX_H / 2,
            x2: x + BOX_W + ARROW - 4,
            y2: BOX_H / 2,
            stroke: 'var(--foreground-muted)',
            'stroke-width': 1.5,
            'marker-end': 'url(#gc-arrow)',
          }),
        );

        svg!.append(box, text, label);
        cells.push({ shape: box, value: text, label });
      });

      const tail = svgEl('text', {
        x: values.length * pitch + 4,
        y: BOX_H / 2 + 4,
        'font-size': 11,
        'font-family': 'var(--font-mono)',
        fill: 'var(--foreground-muted)',
      });
      tail.textContent = 'null';
      svg.append(tail);

      container.append(svg);
    },

    update(state: RenderState) {
      const values = state.arrays.get(name);
      if (!values) return;
      cells.forEach((cell, index) => {
        const status = statusAt(state, name, index);
        setAttr(cell.shape, 'fill', fillFor(status));
        setAttr(cell.shape, 'stroke', strokeFor(status));
        setAttr(cell.shape, 'stroke-width', status.pointers.length > 0 ? '2' : '1');
        setText(cell.value, formatValue(values[index]));
        setAttr(cell.value, 'fill', textFor(status));
        setText(cell.label, status.pointers.join(','));
      });
    },

    destroy() {
      svg?.remove();
      svg = null;
      cells = [];
    },
  };
}

export function createGraphRenderer(): Renderer {
  let svg: SVGSVGElement | null = null;
  let cells: Cell[] = [];
  let name = '';

  return {
    mount(container: HTMLElement, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'array');
      if (!collection) return;
      name = collection.name;
      const values = collection.initial;

      svg = svgEl('svg', {
        role: 'img',
        'aria-label': `Graph ${name}: ${values.length} nodes, each joined to its neighbours.`,
        width: values.length * NODE_GAP + NODE_R * 2,
        height: NODE_R * 2 + 30,
      });

      const cx = (i: number) => NODE_R + 4 + i * NODE_GAP;
      const cy = NODE_R + 4;

      // Edges between adjacent nodes — the adjacency the algorithm actually uses.
      for (let i = 0; i + 1 < values.length; i++) {
        svg.append(
          svgEl('line', {
            x1: cx(i) + NODE_R,
            y1: cy,
            x2: cx(i + 1) - NODE_R,
            y2: cy,
            stroke: 'var(--border)',
            'stroke-width': 1.5,
          }),
        );
      }

      values.forEach((value, index) => {
        const circle = svgEl('circle', {
          class: 'gc-cell',
          cx: cx(index),
          cy,
          r: NODE_R,
          fill: 'var(--surface-muted)',
          stroke: 'var(--border)',
        });
        const text = svgEl('text', {
          x: cx(index),
          y: cy + 4,
          'text-anchor': 'middle',
          'font-size': 11,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground)',
        });
        text.textContent = formatValue(value);

        const label = svgEl('text', {
          x: cx(index),
          y: cy + NODE_R + 12,
          'text-anchor': 'middle',
          'font-size': 8,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground-muted)',
        });
        label.textContent = String(index);

        svg!.append(circle, text, label);
        cells.push({ shape: circle, value: text, label });
      });

      container.append(svg);
    },

    update(state: RenderState) {
      const values = state.arrays.get(name);
      if (!values) return;
      cells.forEach((cell, index) => {
        const status = statusAt(state, name, index);
        setAttr(cell.shape, 'fill', fillFor(status));
        setAttr(cell.shape, 'stroke', strokeFor(status));
        setAttr(cell.shape, 'stroke-width', status.pointers.length > 0 ? '2.5' : '1');
        setText(cell.value, formatValue(values[index]));
        setAttr(cell.value, 'fill', textFor(status));
        setText(
          cell.label,
          status.pointers.length > 0 ? status.pointers.join(',') : String(index),
        );
      });
    },

    destroy() {
      svg?.remove();
      svg = null;
      cells = [];
    },
  };
}
