import type { RenderState } from './registry';

/**
 * Shared drawing primitives for the structure renderers.
 *
 * Every renderer draws the same *state* — a collection, the element just read,
 * the element just written, and any index variables pointing at it — in the
 * shape that structure actually has. Sharing the primitives is what keeps the
 * meaning of a colour identical across all of them: if a written cell were
 * yellow in the array view and green in the tree view, the learner would have to
 * relearn the legend on every lesson.
 *
 * All of these mutate nodes created at mount. Nothing here allocates DOM per
 * frame, which is what holds H5's 60fps budget at 500 elements — allocation is
 * the cost that scales badly, not painting.
 */

const NS = 'http://www.w3.org/2000/svg';

export function svgEl<K extends keyof SVGElementTagNameMap>(
  tag: K,
  attrs: Record<string, string | number> = {},
): SVGElementTagNameMap[K] {
  const node = document.createElementNS(NS, tag);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
  return node;
}

/** Sets an attribute only when it changed, so untouched cells cost nothing. */
export function setAttr(node: Element, name: string, value: string): void {
  if (node.getAttribute(name) !== value) node.setAttribute(name, value);
}

/** Sets text only when it changed — writing it unconditionally forces layout. */
export function setText(node: Element | null, value: string): void {
  if (node && node.textContent !== value) node.textContent = value;
}

/** How a cell should look, given what the trace says just happened to it. */
export interface CellStatus {
  read: boolean;
  write: boolean;
  /** Names of index variables currently pointing here. */
  pointers: string[];
}

export function statusAt(state: RenderState, name: string, index: number): CellStatus {
  return {
    read: state.lastRead?.array === name && state.lastRead.index === index,
    write: state.lastWrite?.array === name && state.lastWrite.index === index,
    pointers: pointersAt(state, index),
  };
}

/**
 * Index variables sitting on this position.
 *
 * What makes a two-pointer or sliding-window solution legible rather than a wall
 * of numbers: `i` and `j` become marks on the structure instead of entries in a
 * list the learner has to cross-reference.
 */
export function pointersAt(state: RenderState, index: number): string[] {
  const names: string[] = [];
  for (const [name, value] of state.variables) {
    if (typeof value === 'number' && Number.isInteger(value) && value === index) {
      names.push(name);
    }
  }
  return names;
}

export function fillFor(status: CellStatus): string {
  if (status.write) return 'var(--accent-strong)';
  if (status.read) return 'var(--accent)';
  return 'var(--surface-muted)';
}

export function textFor(status: CellStatus): string {
  return status.write || status.read ? 'var(--accent-foreground)' : 'var(--foreground)';
}

export function strokeFor(status: CellStatus): string {
  return status.pointers.length > 0 ? 'var(--link)' : 'var(--border)';
}

/** Renders a traced value the way a learner would write it. */
export function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '·';
  if (typeof value === 'string') return value;
  return String(value);
}

/**
 * The array a renderer should draw.
 *
 * Prefers the collection the trace actually recorded reads and writes against,
 * because that is the one the algorithm is working on. Falls back to the first
 * array so a structure that is only read still appears.
 */
export function primaryArray(state: RenderState, preferred: string): unknown[] | null {
  return state.arrays.get(preferred) ?? null;
}
