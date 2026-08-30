import { describe, expect, it } from 'vitest';
import { toProtocol, stateAtStep } from '@/lib/trace/protocol';
import { createRenderer, selectRenderer, registeredKinds } from '@/lib/visualizer/registry';
import '@/lib/visualizer/renderers';

/**
 * Structure-shaped renderers (B2).
 *
 * Each structure is drawn as the thing it is — boxes for an array, a node-link
 * diagram for a tree, arrows for a linked list — because the shape is usually
 * the idea being taught. A heap drawn as a flat row makes sift-down look like
 * three unrelated swaps instead of a value sinking to its level.
 *
 * These tests drive the renderers against real DOM: they are imperative and
 * outside React on purpose (ADR 0001 §7).
 */

const trace = toProtocol([
  { kind: 'line', line: 1, vars: { xs: [4, 2, 7, 1], i: 0 } },
  { kind: 'array_read', array: 'xs', index: 0, value: 4 },
  { kind: 'array_write', array: 'xs', index: 1, value: 9 },
]);

function draw(kind: string, step = 2) {
  const host = document.createElement('div');
  const renderer = createRenderer(kind)!;
  renderer.mount(host, trace);
  renderer.update(stateAtStep(trace, step));
  return { host, renderer };
}

describe('renderer registry', () => {
  it('registers every shape the content schema allows', () => {
    // The schema's enum and the registry must not drift: a lesson declaring a
    // shape nobody registered would silently fall back to the array picture.
    for (const kind of ['array', 'stack', 'queue', 'linked-list', 'tree', 'heap', 'graph']) {
      expect(registeredKinds(), `${kind} has no renderer`).toContain(kind);
    }
  });

  it('draws the shape the content asks for', () => {
    expect(selectRenderer(trace, 'tree')?.kind).toBe('tree');
    expect(selectRenderer(trace, 'stack')?.kind).toBe('stack');
  });

  it('falls back to the array picture for an unknown shape', () => {
    // Always truthful, if less illuminating — every collection really is an
    // array underneath.
    expect(selectRenderer(trace, 'nonsense' as 'array')?.kind).toBe('array');
  });

  it('draws nothing when the trace holds no collection', () => {
    const bare = toProtocol([{ kind: 'line', line: 1, vars: { n: 1 } }]);
    expect(selectRenderer(bare, 'array')).toBeNull();
  });
});

describe('shapes', () => {
  it('draws an array as boxes with values inside', () => {
    const { host, renderer } = draw('array');
    expect(host.querySelectorAll('rect.gc-cell')).toHaveLength(4);
    const labels = [...host.querySelectorAll('text')].map((t) => t.textContent);
    expect(labels).toContain('9');
    renderer.destroy();
  });

  it('draws a tree as circles joined by edges', () => {
    const { host, renderer } = draw('tree');
    expect(host.querySelectorAll('circle').length).toBe(4);
    // Three edges for four nodes: every node but the root has one parent.
    expect(host.querySelectorAll('line').length).toBe(3);
    renderer.destroy();
  });

  it('omits absent nodes rather than inventing them', () => {
    // -1 is the content's "no node here" sentinel. Drawing a circle for it would
    // show a tree the data does not describe.
    const sparse = toProtocol([
      { kind: 'line', line: 1, vars: { t: [1, 2, -1, 4], i: 0 } },
      { kind: 'array_read', array: 't', index: 0, value: 1 },
    ]);
    const host = document.createElement('div');
    const renderer = createRenderer('tree')!;
    renderer.mount(host, sparse);
    expect(host.querySelectorAll('circle').length).toBe(3);
    renderer.destroy();
  });

  it('draws a linked list as vertices joined by arrows, not adjacent boxes', () => {
    // Following VisuAlgo: a row of touching rectangles is a picture of an
    // array, which is the one structure a list is defined by not being.
    const { host, renderer } = draw('linked-list');
    expect(host.querySelectorAll('circle').length).toBe(4);
    expect(host.querySelectorAll('rect').length).toBe(0);
    // One arrow between each pair, plus the one to null.
    expect(host.querySelectorAll('line').length).toBe(4);
    renderer.destroy();
  });

  it('labels the ends of a linked list and terminates it in null', () => {
    const { host, renderer } = draw('linked-list');
    // Labels combine the landmark with any pointer sitting there, so "head i"
    // is the expected shape rather than "head" alone.
    const labels = [...host.querySelectorAll('text')].map((t) => t.textContent ?? '');
    expect(labels.some((l) => l.includes('head'))).toBe(true);
    expect(labels.some((l) => l.includes('tail'))).toBe(true);
    // null is why a traversal stops, which a learner meeting lists needs to see.
    expect(labels).toContain('null');
    renderer.destroy();
  });

  it('lays a tree out by in-order rank rather than by level', () => {
    // A chain leans; it does not spread across the full width with two thirds
    // empty, which is what per-level slotting produced.
    const chain = toProtocol([
      { kind: 'line', line: 1, vars: { t: [3, 2, -1, 1], i: 0 } },
      { kind: 'array_read', array: 't', index: 0, value: 3 },
    ]);
    const host = document.createElement('div');
    const renderer = createRenderer('tree')!;
    renderer.mount(host, chain);

    // Circles are emitted in array-index order — root, then its left child,
    // then that child's left child — so the root is drawn *first* but sits
    // *rightmost*, because its entire subtree hangs to the left of it. That
    // inversion is exactly what in-order layout produces and what per-level
    // slotting does not.
    const xs = [...host.querySelectorAll('circle')].map((c) => Number(c.getAttribute('cx')));
    expect(xs).toHaveLength(3);
    expect(new Set(xs).size, 'nodes must not share a column').toBe(3);
    const [root, child, grandchild] = xs;
    expect(root).toBeGreaterThan(child);
    expect(child).toBeGreaterThan(grandchild);
    renderer.destroy();
  });

  it('marks the top of a stack', () => {
    const { host, renderer } = draw('stack');
    const labels = [...host.querySelectorAll('text')].map((t) => t.textContent);
    expect(labels.some((l) => l?.includes('top'))).toBe(true);
    renderer.destroy();
  });

  it('marks both ends of a queue, because that is the whole difference', () => {
    const { host, renderer } = draw('queue');
    // Labels combine the structural end with any pointer sitting there, so
    // "front i" is the expected shape rather than "front" alone.
    const labels = [...host.querySelectorAll('text')].map((t) => t.textContent ?? '');
    expect(labels.some((l) => l.includes('front'))).toBe(true);
    expect(labels.some((l) => l.includes('back'))).toBe(true);
    renderer.destroy();
  });

  it('draws a graph as nodes joined to their neighbours', () => {
    const { host, renderer } = draw('graph');
    expect(host.querySelectorAll('circle').length).toBe(4);
    expect(host.querySelectorAll('line').length).toBe(3);
    renderer.destroy();
  });

  it.each(['array', 'stack', 'queue', 'linked-list', 'tree', 'heap', 'graph'])(
    '%s allocates no DOM per frame',
    (kind) => {
      // H5's 60fps budget does not survive per-frame allocation; every renderer
      // must mutate what mount() built.
      const host = document.createElement('div');
      const renderer = createRenderer(kind)!;
      renderer.mount(host, trace);
      const before = host.querySelectorAll('*').length;
      for (let step = 0; step < trace.events.length; step++) {
        renderer.update(stateAtStep(trace, step));
      }
      expect(host.querySelectorAll('*').length).toBe(before);
      renderer.destroy();
    },
  );

  it.each(['array', 'stack', 'queue', 'linked-list', 'tree', 'heap', 'graph'])(
    '%s removes everything it created on destroy',
    (kind) => {
      const host = document.createElement('div');
      const renderer = createRenderer(kind)!;
      renderer.mount(host, trace);
      renderer.destroy();
      expect(host.querySelectorAll('*')).toHaveLength(0);
    },
  );

  it.each(['array', 'stack', 'queue', 'linked-list', 'tree', 'heap', 'graph'])(
    '%s carries an accessible label (H4)',
    (kind) => {
      const host = document.createElement('div');
      const renderer = createRenderer(kind)!;
      renderer.mount(host, trace);
      expect(host.querySelector('svg')?.getAttribute('aria-label')).toBeTruthy();
      renderer.destroy();
    },
  );
});

/**
 * Pointer marks (B2).
 *
 * A variable is drawn on the structure only when the source actually subscripts
 * that collection with it. Matching on value alone marked every integer that
 * landed in range — which made the picture assert something false about the
 * code, not merely something cluttered.
 */
describe('pointer marks', () => {
  const withIndexes = (indexedBy: string[]) => {
    const t = toProtocol(
      [
        { kind: 'line', line: 1, vars: { heap: [9, 8, 7], i: 0, swaps: 0 } },
        { kind: 'array_read', array: 'heap', index: 0, value: 9 },
      ],
      { indexedBy: { heap: indexedBy } },
    );
    return t;
  };

  function labels(trace: ReturnType<typeof toProtocol>) {
    const host = document.createElement('div');
    const renderer = createRenderer('array')!;
    renderer.mount(host, trace);
    renderer.update(stateAtStep(trace, 1));
    const out = [...host.querySelectorAll('text')].map((t) => t.textContent ?? '');
    renderer.destroy();
    return out;
  }

  it('marks a variable the source uses as a subscript', () => {
    expect(labels(withIndexes(['i']))).toContain('i');
  });

  it('does not mark a counter that never indexes the array', () => {
    // `swaps` is 0 exactly when `i` is 0. Only one of them points at element 0.
    const shown = labels(withIndexes(['i']));
    expect(shown).toContain('i');
    expect(shown).not.toContain('swaps');
    expect(shown.some((l) => l.includes('swaps'))).toBe(false);
  });

  it('marks nothing when the trace cannot say which variables index', () => {
    // Silence beats a confident wrong claim — and an older trace carrying no
    // index information must not fall back to labelling everything.
    const trace = toProtocol([
      { kind: 'line', line: 1, vars: { heap: [9, 8, 7], i: 0, swaps: 0 } },
      { kind: 'array_read', array: 'heap', index: 0, value: 9 },
    ]);
    const shown = labels(trace);
    expect(shown).not.toContain('i');
    expect(shown).not.toContain('swaps');
    // The index number is still drawn; only the pointer name is withheld.
    expect(shown).toContain('0');
  });

  it('carries the index variables through the protocol per collection', () => {
    const trace = withIndexes(['i', 'left']);
    expect(trace.collections.find((c) => c.name === 'heap')?.indexedBy).toEqual(['i', 'left']);
  });
});

/**
 * The map renderer (B2).
 *
 * A hash map's contents are recovered by diffing the line snapshots both
 * runtimes already produce, so these events exist without either runtime
 * hooking assignment. What the renderer must get right is growth: keys appear
 * as the code inserts them, and none of them may be legible before that.
 */
describe('map renderer', () => {
  const trace = toProtocol([
    { kind: 'line', line: 1, vars: { counts: {}, i: 0 } },
    { kind: 'line', line: 2, vars: { counts: { a: 1 }, i: 1 } },
    { kind: 'line', line: 3, vars: { counts: { a: 1, b: 1 }, i: 2 } },
    { kind: 'line', line: 4, vars: { counts: { a: 2, b: 1 }, i: 3 } },
  ]);

  function mounted() {
    const host = document.createElement('div');
    const renderer = createRenderer('map')!;
    renderer.mount(host, trace);
    return { host, renderer };
  }

  const visibleRows = (host: HTMLElement) =>
    [...host.querySelectorAll('g')].filter((g) => g.getAttribute('opacity') !== '0');

  it('recovers map mutations the runtimes never reported directly', () => {
    const puts = trace.events.filter((e) => e.kind === 'map_put');
    expect(puts).toHaveLength(3);
    expect(trace.collections.find((c) => c.name === 'counts')?.kind).toBe('map');
  });

  it('builds one row per key the run will ever hold', () => {
    // Pre-allocated, because a renderer may not allocate DOM per frame (H5).
    const { host, renderer } = mounted();
    expect(host.querySelectorAll('g')).toHaveLength(2);
    renderer.destroy();
  });

  /**
   * A put is emitted *before* the line event that revealed it, which is correct
   * rather than incidental: a line's variable snapshot describes state at the
   * start of that line, so the mutation it exposes was performed by the line
   * before. Steps are located by event kind rather than hardcoded, so the
   * ordering can change without these tests quietly asserting the wrong frame.
   */
  const putSteps = trace.events
    .map((e, i) => (e.kind === 'map_put' ? i : -1))
    .filter((i) => i >= 0);

  it('hides a key until the step that inserts it', () => {
    const { host, renderer } = mounted();

    renderer.update(stateAtStep(trace, 0));
    expect(visibleRows(host), 'nothing before the first put').toHaveLength(0);

    renderer.update(stateAtStep(trace, putSteps[0]));
    expect(visibleRows(host)).toHaveLength(1);

    renderer.update(stateAtStep(trace, putSteps[1]));
    expect(visibleRows(host)).toHaveLength(2);
    renderer.destroy();
  });

  it('does not leak a future key into the visible text', () => {
    const { host, renderer } = mounted();
    renderer.update(stateAtStep(trace, putSteps[0]));
    const shown = visibleRows(host).flatMap((g) =>
      [...g.querySelectorAll('text')].map((t) => t.textContent ?? ''),
    );
    expect(shown.some((t) => t.includes('b'))).toBe(false);
    renderer.destroy();
  });

  it('tells a new key apart from one whose value changed', () => {
    // The entire mechanic of a counting map: first sighting versus increment.
    const { host, renderer } = mounted();

    // Second put inserts a different key; third overwrites the first key.
    renderer.update(stateAtStep(trace, putSteps[1]));
    let labels = [...host.querySelectorAll('text')].map((t) => t.textContent ?? '');
    expect(labels, 'a first sighting reads as new').toContain('new');

    renderer.update(stateAtStep(trace, putSteps[2]));
    labels = [...host.querySelectorAll('text')].map((t) => t.textContent ?? '');
    expect(
      labels.some((l) => l.startsWith('was')),
      'an increment reports what it replaced',
    ).toBe(true);
    renderer.destroy();
  });

  it('allocates no DOM per frame', () => {
    const { host, renderer } = mounted();
    const before = host.querySelectorAll('*').length;
    for (let step = 0; step < trace.events.length; step++) {
      renderer.update(stateAtStep(trace, step));
    }
    expect(host.querySelectorAll('*').length).toBe(before);
    renderer.destroy();
  });

  it('falls back to the array picture when the run built no map', () => {
    // A lesson can declare `map` and still take a branch that never creates one.
    const arrayOnly = toProtocol([
      { kind: 'line', line: 1, vars: { xs: [1, 2], i: 0 } },
      { kind: 'array_read', array: 'xs', index: 0, value: 1 },
    ]);
    expect(selectRenderer(arrayOnly, 'map')?.kind).toBe('array');
  });
});

/**
 * The two-dimensional table (B2).
 *
 * A DP grid's cells are written through an inner array the Proxy never wrapped,
 * so `grid[r][c] = v` produces no write event at all — the same blind spot maps
 * had, one dimension up. The contents are in the line snapshots regardless, so
 * the mutations are recovered by diffing rather than by instrumenting anything.
 */
describe('grid renderer', () => {
  const trace = toProtocol([
    { kind: 'line', line: 1, vars: { dp: [[0, 0], [0, 0]], r: 0 } },
    { kind: 'line', line: 2, vars: { dp: [[1, 0], [0, 0]], r: 0 } },
    { kind: 'line', line: 3, vars: { dp: [[1, 1], [0, 0]], r: 0 } },
    { kind: 'line', line: 4, vars: { dp: [[1, 1], [1, 2]], r: 1 } },
  ]);

  it('recognises a rectangular array as a table', () => {
    expect(trace.collections.find((c) => c.name === 'dp')?.kind).toBe('grid');
  });

  it('leaves a ragged array as a plain collection', () => {
    // Drawing it as a grid would imply a rectangle the data does not have, and
    // the missing cells would read as empty rather than as absent.
    const ragged = toProtocol([
      { kind: 'line', line: 1, vars: { rows: [[1, 2], [3]], i: 0 } },
    ]);
    expect(ragged.collections.find((c) => c.name === 'rows')?.kind).toBe('array');
  });

  it('recovers cell writes the runtime never reported', () => {
    const sets = trace.events.filter((e) => e.kind === 'grid_set');
    expect(sets.length).toBeGreaterThan(0);
    expect(sets[0]).toMatchObject({ grid: 'dp', row: 0, col: 0, value: 1 });
  });

  it('replays the table to the right state', () => {
    const final = stateAtStep(trace, trace.events.length - 1);
    expect(final.grids.get('dp')).toEqual([
      [1, 1],
      [1, 2],
    ]);
  });

  it('reports the value a cell replaced', () => {
    const last = trace.events.map((e, i) => (e.kind === 'grid_set' ? i : -1)).filter((i) => i >= 0);
    const state = stateAtStep(trace, last.at(-1)!);
    expect(state.lastCell).toMatchObject({ grid: 'dp', previous: 0 });
  });

  it('draws a cell per entry, with row and column headers', () => {
    const host = document.createElement('div');
    const renderer = createRenderer('grid')!;
    renderer.mount(host, trace);

    expect(host.querySelectorAll('rect.gc-cell')).toHaveLength(4);
    // Headers are what make a recurrence legible — dp[r-1][c] means nothing
    // against an unlabelled block of numbers.
    const labels = [...host.querySelectorAll('text')].map((t) => t.textContent);
    expect(labels).toContain('0');
    expect(labels).toContain('1');
    renderer.destroy();
  });

  it('allocates no DOM per frame', () => {
    const host = document.createElement('div');
    const renderer = createRenderer('grid')!;
    renderer.mount(host, trace);
    const before = host.querySelectorAll('*').length;
    for (let step = 0; step < trace.events.length; step++) {
      renderer.update(stateAtStep(trace, step));
    }
    expect(host.querySelectorAll('*').length).toBe(before);
    renderer.destroy();
  });

  it('is selected for a lesson declaring it, and falls back when absent', () => {
    expect(selectRenderer(trace, 'grid')?.kind).toBe('grid');

    const flat = toProtocol([
      { kind: 'line', line: 1, vars: { xs: [1, 2], i: 0 } },
      { kind: 'array_read', array: 'xs', index: 0, value: 1 },
    ]);
    expect(selectRenderer(flat, 'grid')?.kind).toBe('array');
  });
});
