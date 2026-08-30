import type { Trace } from '@/lib/trace/protocol';
import type { RenderState, Renderer } from './registry';
import { formatValue, setAttr, setText, svgEl } from './svg';

/**
 * Two-dimensional table renderer (B2) — a DP grid, with its indices.
 *
 * The row and column headers are not decoration. A DP table is only legible if
 * you can see *which* cell a recurrence reads: `dp[r][c] = dp[r-1][c] +
 * dp[r][c-1]` means nothing against an unlabelled block of numbers, and means
 * everything when you can watch a cell take the value above it plus the value
 * to its left.
 *
 * Cells are built once and mutated, like every other renderer here, so a table
 * of any size costs nothing per frame (H5).
 */

const MIN_CELL = 26;
const MAX_CELL = 54;
const HEADER = 20;
const FALLBACK_WIDTH = 680;

interface Cell {
  box: SVGRectElement;
  text: SVGTextElement;
}

export function createGridRenderer(): Renderer {
  let svg: SVGSVGElement | null = null;
  let cells: Cell[][] = [];
  let name = '';

  return {
    mount(container: HTMLElement, trace: Trace) {
      const collection = trace.collections.find((c) => c.kind === 'grid');
      if (!collection?.rows?.length) return;

      name = collection.name;
      const rows = collection.rows;
      const height = rows.length;
      const width = rows[0].length;

      const available = container.clientWidth || FALLBACK_WIDTH;
      const size = Math.max(
        MIN_CELL,
        Math.min(MAX_CELL, Math.floor((available - HEADER) / width) - 2),
      );
      const font = Math.max(9, Math.min(14, Math.round(size / 2.6)));

      svg = svgEl('svg', {
        role: 'img',
        'aria-label': `Table ${name}, ${height} rows by ${width} columns. A text description of each step follows.`,
        width: HEADER + width * size,
        height: HEADER + height * size,
      });

      // Column indices along the top, row indices down the left.
      for (let c = 0; c < width; c++) {
        const label = svgEl('text', {
          x: HEADER + c * size + size / 2,
          y: HEADER - 6,
          'text-anchor': 'middle',
          'font-size': 9,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground-muted)',
        });
        label.textContent = String(c);
        svg.append(label);
      }

      rows.forEach((row, r) => {
        const label = svgEl('text', {
          x: HEADER - 6,
          y: HEADER + r * size + size / 2 + 3,
          'text-anchor': 'end',
          'font-size': 9,
          'font-family': 'var(--font-mono)',
          fill: 'var(--foreground-muted)',
        });
        label.textContent = String(r);
        svg!.append(label);

        const built: Cell[] = row.map((value, c) => {
          const box = svgEl('rect', {
            class: 'gc-cell',
            x: HEADER + c * size,
            y: HEADER + r * size,
            width: size - 2,
            height: size - 2,
            rx: 2,
            fill: 'var(--surface-muted)',
            stroke: 'var(--border)',
          });

          const text = svgEl('text', {
            x: HEADER + c * size + (size - 2) / 2,
            y: HEADER + r * size + (size - 2) / 2 + font / 3,
            'text-anchor': 'middle',
            'font-size': font,
            'font-family': 'var(--font-mono)',
            fill: 'var(--foreground)',
          });
          text.textContent = formatValue(value);

          svg!.append(box, text);
          return { box, text };
        });

        cells.push(built);
      });

      container.append(svg);
    },

    update(state: RenderState) {
      const rows = state.grids.get(name);
      if (!rows) return;

      const set = state.lastCell?.grid === name ? state.lastCell : null;
      const changed = set && !Object.is(set.previous, set.value);

      cells.forEach((row, r) => {
        row.forEach((cell, c) => {
          const isSet = set?.row === r && set.col === c;

          setAttr(
            cell.box,
            'fill',
            isSet && changed ? 'var(--accent-strong)' : 'var(--surface-muted)',
          );
          setAttr(cell.box, 'stroke', isSet ? 'var(--border-strong)' : 'var(--border)');
          setAttr(cell.box, 'stroke-width', isSet ? '2' : '1');

          setText(cell.text, formatValue(rows[r]?.[c]));
          setAttr(
            cell.text,
            'fill',
            isSet && changed ? 'var(--accent-foreground)' : 'var(--foreground)',
          );
          setAttr(cell.text, 'font-weight', isSet ? '700' : '400');
        });
      });
    },

    destroy() {
      svg?.remove();
      svg = null;
      cells = [];
    },
  };
}
