import type { Trace, Scalar } from '@/lib/trace/protocol';
import type { RenderState, Renderer } from './registry';
import { formatValue, setAttr, setText, svgEl } from './svg';

/**
 * Hash map renderer (B2) — key-to-value entries, appearing as they are inserted.
 *
 * **Deliberately not drawn as buckets.** VisuAlgo shows a hash table as an array
 * of slots with chaining, because it is teaching the hash function and collision
 * handling. Our trace knows neither: it sees `counts[value] = n` and nothing
 * about where the runtime put it. Drawing numbered buckets would invent a
 * placement the code never chose — a picture of a hash table rather than a
 * picture of *this* map. What the lesson is actually about is what the map
 * remembers, so that is what is drawn.
 *
 * **Rows are pre-allocated from the trace's own future.** A map grows as it
 * runs, but a renderer may not allocate DOM per frame (H5). So mount scans the
 * `map_put` events for every key the run will ever hold and builds a row for
 * each, hidden until the step that inserts it. Nothing about a key is revealed
 * before the code reaches it — the row is invisible, not empty — so the
 * animation still shows the map growing.
 */

const KEY_W = 92;
const VAL_W = 72;
const ARROW = 26;
const ROW_H = 32;
const GAP = 6;

interface Row {
  group: SVGGElement;
  keyBox: SVGRectElement;
  valueBox: SVGRectElement;
  keyText: SVGTextElement;
  valueText: SVGTextElement;
  was: SVGTextElement;
}

export function createMapRenderer(): Renderer {
  let svg: SVGSVGElement | null = null;
  let rows = new Map<string, Row>();
  let name = '';

  return {
    mount(container: HTMLElement, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'map');
      if (!collection) return;
      name = collection.name;

      // Every key this run will ever hold, in the order it first appears.
      const keys: string[] = [];
      for (const [key] of collection.entries ?? []) keys.push(key);
      for (const event of trace.events) {
        if (event.kind === 'map_put' && event.map === name && !keys.includes(event.key)) {
          keys.push(event.key);
        }
      }
      if (keys.length === 0) return;

      const width = KEY_W + ARROW + VAL_W;
      svg = svgEl('svg', {
        role: 'img',
        'aria-label': `Map ${name}: ${keys.length} entries, each a key and the value stored against it.`,
        width,
        height: keys.length * (ROW_H + GAP),
      });

      const marker = svgEl('marker', {
        id: 'gc-map-arrow',
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

      keys.forEach((key, index) => {
        const y = index * (ROW_H + GAP);
        const group = svgEl('g', { transform: `translate(0, ${y})` });

        const keyBox = svgEl('rect', {
          class: 'gc-cell',
          width: KEY_W,
          height: ROW_H,
          rx: 3,
          fill: 'var(--surface-muted)',
          stroke: 'var(--border-strong)',
          'stroke-width': 2,
        });
        const keyText = svgEl('text', {
          x: KEY_W / 2,
          y: ROW_H / 2 + 4,
          'text-anchor': 'middle',
          'font-size': 12,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground)',
        });
        keyText.textContent = formatValue(key);

        group.append(
          svgEl('line', {
            x1: KEY_W + 4,
            y1: ROW_H / 2,
            x2: KEY_W + ARROW - 5,
            y2: ROW_H / 2,
            stroke: 'var(--foreground-muted)',
            'stroke-width': 2,
            'marker-end': 'url(#gc-map-arrow)',
          }),
        );

        const valueBox = svgEl('rect', {
          class: 'gc-cell',
          x: KEY_W + ARROW,
          width: VAL_W,
          height: ROW_H,
          rx: 3,
          fill: 'var(--surface-muted)',
          stroke: 'var(--border-strong)',
          'stroke-width': 2,
        });
        const valueText = svgEl('text', {
          x: KEY_W + ARROW + VAL_W / 2,
          y: ROW_H / 2 + 4,
          'text-anchor': 'middle',
          'font-size': 12,
          'font-family': 'var(--font-mono)',
          'font-weight': 600,
          fill: 'var(--foreground)',
        });

        const was = svgEl('text', {
          x: KEY_W + ARROW + VAL_W + 6,
          y: ROW_H / 2 + 4,
          'font-size': 9,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground-muted)',
        });

        group.append(keyBox, keyText, valueBox, valueText, was);
        svg!.append(group);
        rows.set(key, { group, keyBox, valueBox, keyText, valueText, was });
      });

      container.append(svg);
    },

    update(state: RenderState) {
      const entries = state.maps.get(name);
      if (!entries) return;

      const put = state.lastPut?.map === name ? state.lastPut : null;

      for (const [key, row] of rows) {
        const present = entries.has(key);
        // Hidden rather than blank: a key the code has not reached yet must not
        // be legible, or the animation gives away where it is going.
        setAttr(row.group, 'opacity', present ? '1' : '0');

        if (!present) {
          setText(row.valueText, '');
          setText(row.was, '');
          continue;
        }

        const value = entries.get(key) as Scalar;
        const changed = put?.key === key;

        setText(row.valueText, formatValue(value));
        setAttr(row.valueBox, 'fill', changed ? 'var(--accent-strong)' : 'var(--surface-muted)');
        setAttr(row.valueText, 'fill', changed ? 'var(--accent-foreground)' : 'var(--foreground)');
        setAttr(row.keyBox, 'fill', changed ? 'var(--accent)' : 'var(--surface-muted)');

        // Distinguishes "this key is new" from "this key's count went up",
        // which is the entire mechanic of a counting map.
        const replaced = changed && put.previous !== undefined && !Object.is(put.previous, value);
        setText(row.was, replaced ? `was ${formatValue(put.previous)}` : changed ? 'new' : '');
      }
    },

    destroy() {
      svg?.remove();
      svg = null;
      rows = new Map();
    },
  };
}
