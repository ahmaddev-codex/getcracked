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
 * Tree and heap renderer (B2) — circles joined by edges, the shape a tree has.
 *
 * Both lessons store their tree in an array, where node `i` has children at
 * `2i+1` and `2i+2`. That representation is the thing being taught, and drawing
 * it as a flat row hides it completely: sift-down looks like three unrelated
 * swaps instead of a value sinking to its level, and a depth-first walk looks
 * like a scan.
 *
 * So the array is laid out as the tree it encodes. The index is printed under
 * each node, because the whole trick is that the parent/child arithmetic is
 * doing the work of pointers — a learner who cannot see both the shape and the
 * index has only half the idea.
 *
 * Missing children are simply not drawn. A sentinel (`-1` in the trees lesson)
 * marks an absent node, and inventing a circle for it would draw a tree the data
 * does not describe.
 */

const RADIUS = 16;
const LEVEL_H = 58;
const MIN_GAP = 38;

interface NodeCell {
  circle: SVGCircleElement;
  value: SVGTextElement;
  index: SVGTextElement;
  group: SVGGElement;
}

/** Sentinels used by the content to mean "no node here". */
function isAbsent(value: unknown): boolean {
  return value === null || value === undefined || value === -1;
}

export function createTreeRenderer(): Renderer {
  let svg: SVGSVGElement | null = null;
  let nodes: (NodeCell | null)[] = [];
  let name = '';

  return {
    mount(container: HTMLElement, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'array');
      if (!collection) return;
      name = collection.name;

      const values = collection.initial;
      const depth = Math.max(1, Math.ceil(Math.log2(values.length + 1)));
      const widest = 2 ** (depth - 1);
      const width = Math.max(320, widest * MIN_GAP + RADIUS * 2);
      const height = depth * LEVEL_H;

      svg = svgEl('svg', {
        role: 'img',
        'aria-label': `Tree ${name}, ${values.length} array slots drawn as a tree; node i has children at 2i+1 and 2i+2.`,
        width,
        height,
      });

      /** Centre of node `index`, spread evenly across its level. */
      const position = (index: number) => {
        const level = Math.floor(Math.log2(index + 1));
        const first = 2 ** level - 1;
        const slotsOnLevel = 2 ** level;
        const offset = index - first;
        const band = width / slotsOnLevel;
        return { x: band * (offset + 0.5), y: level * LEVEL_H + RADIUS + 4 };
      };

      // Edges first, so nodes paint over them.
      values.forEach((value, index) => {
        if (isAbsent(value)) return;
        const parent = Math.floor((index - 1) / 2);
        if (index === 0 || isAbsent(values[parent])) return;
        const from = position(parent);
        const to = position(index);
        svg!.append(
          svgEl('line', {
            x1: from.x,
            y1: from.y,
            x2: to.x,
            y2: to.y,
            stroke: 'var(--border)',
            'stroke-width': 1.5,
          }),
        );
      });

      values.forEach((value, index) => {
        if (isAbsent(value)) {
          nodes.push(null);
          return;
        }
        const { x, y } = position(index);
        const group = svgEl('g');

        const circle = svgEl('circle', {
          class: 'gc-cell',
          cx: x,
          cy: y,
          r: RADIUS,
          fill: 'var(--surface-muted)',
          stroke: 'var(--border)',
        });

        const text = svgEl('text', {
          x,
          y: y + 4,
          'text-anchor': 'middle',
          'font-size': 11,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground)',
        });
        text.textContent = formatValue(value);

        const idx = svgEl('text', {
          x,
          y: y + RADIUS + 11,
          'text-anchor': 'middle',
          'font-size': 8,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground-muted)',
        });
        idx.textContent = String(index);

        group.append(circle, text, idx);
        svg!.append(group);
        nodes.push({ circle, value: text, index: idx, group });
      });

      container.append(svg);
    },

    update(state: RenderState) {
      const values = state.arrays.get(name);
      if (!values) return;

      nodes.forEach((node, index) => {
        if (!node) return;
        const status = statusAt(state, name, index);

        setAttr(node.circle, 'fill', fillFor(status));
        setAttr(node.circle, 'stroke', strokeFor(status));
        setAttr(node.circle, 'stroke-width', status.pointers.length > 0 ? '2.5' : '1');
        setText(node.value, formatValue(values[index]));
        setAttr(node.value, 'fill', textFor(status));
        setText(
          node.index,
          status.pointers.length > 0 ? status.pointers.join(',') : String(index),
        );
        setAttr(
          node.index,
          'fill',
          status.pointers.length > 0 ? 'var(--link)' : 'var(--foreground-muted)',
        );
      });
    },

    destroy() {
      svg?.remove();
      svg = null;
      nodes = [];
    },
  };
}
