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
