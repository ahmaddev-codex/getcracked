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
 * **Linked list**: circular vertices joined by arrows, ending in null, with head
 * and tail labelled. Circles rather than boxes, following VisuAlgo: a list is a
 * set of nodes joined by pointers, and a row of adjacent rectangles is a picture
 * of an array — the one structure a list is defined by not being. The visible
 * gap, spanned by an arrow, is why there is no index arithmetic and why you
 * cannot jump to the middle.
 *
 * **Graph row**: circles with edges to their neighbours. The graphs lesson walks
 * a row of cells where a node's neighbours are `i-1` and `i+1`, so this draws
 * exactly the adjacency the algorithm uses. It is deliberately not a
 * force-directed layout of an arbitrary graph: the trace records an array, and
 * inventing a topology it does not describe would be a picture of a different
 * problem.
 */

const NODE_R = 19;
/** Gap between adjacent list nodes, spanned by the pointer arrow. */
const LINK = 30;
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
      const pitch = NODE_R * 2 + LINK;

      svg = svgEl('svg', {
        role: 'img',
        'aria-label': `Linked list ${name}: ${values.length} nodes joined by pointers, ending in null.`,
        width: values.length * pitch + 46,
        height: NODE_R * 2 + 34,
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

      const cy = NODE_R + 4;
      const cx = (i: number) => NODE_R + 4 + i * pitch;

      values.forEach((value, index) => {
        // Vertices, not boxes. A linked list is a set of nodes joined by
        // pointers, and drawing it as a row of adjacent rectangles is drawing an
        // array — the one structure it is defined by not being. The gap between
        // circles, spanned by an arrow, is the whole idea.
        const circle = svgEl('circle', {
          class: 'gc-cell',
          cx: cx(index),
          cy,
          r: NODE_R,
          fill: 'var(--surface-muted)',
          stroke: 'var(--border-strong)',
          'stroke-width': 2,
        });

        const text = svgEl('text', {
          x: cx(index),
          y: cy + 5,
          'text-anchor': 'middle',
          'font-size': 13,
          'font-family': 'var(--font-mono)',
          'font-weight': 600,
          fill: 'var(--foreground)',
        });
        text.textContent = formatValue(value);

        // head / tail, the two positions a list gives you O(1) access to.
        const label = svgEl('text', {
          x: cx(index),
          y: cy + NODE_R + 15,
          'text-anchor': 'middle',
          'font-size': 10,
          'font-family': 'var(--font-mono)',
          fill: 'var(--link)',
        });
        if (index === 0) label.textContent = 'head';
        else if (index === values.length - 1) label.textContent = 'tail';

        if (index < values.length - 1) {
          svg!.append(
            svgEl('line', {
              x1: cx(index) + NODE_R + 3,
              y1: cy,
              x2: cx(index + 1) - NODE_R - 4,
              y2: cy,
              stroke: 'var(--foreground-muted)',
              'stroke-width': 2,
              'marker-end': 'url(#gc-arrow)',
            }),
          );
        }

        svg!.append(circle, text, label);
        cells.push({ shape: circle, value: text, label });
      });

      // The terminator. VisuAlgo labels the tail instead, but null is why a
      // traversal stops, and a learner meeting linked lists needs to see it.
      const last = cx(values.length - 1);
      svg.append(
        svgEl('line', {
          x1: last + NODE_R + 3,
          y1: cy,
          x2: last + NODE_R + LINK - 4,
          y2: cy,
          stroke: 'var(--foreground-muted)',
          'stroke-width': 2,
          'marker-end': 'url(#gc-arrow)',
        }),
      );
      const tail = svgEl('text', {
        x: last + NODE_R + LINK + 2,
        y: cy + 4,
        'font-size': 12,
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
        setAttr(cell.shape, 'stroke-width', status.pointers.length > 0 ? '3' : '2');
        setText(cell.value, formatValue(values[index]));
        setAttr(cell.value, 'fill', textFor(status));

        // Structural landmark and pointer together, not one instead of the
        // other — the same rule the stack and queue use. "head" is what makes
        // this a list; the pointer is where the code currently is. Dropping
        // either loses half the picture.
        const structural = index === 0 ? 'head' : index === cells.length - 1 ? 'tail' : '';
        setText(cell.label, [structural, ...status.pointers].filter(Boolean).join(' '));
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
