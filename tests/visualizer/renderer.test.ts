import { beforeEach, describe, expect, it } from 'vitest';
import { toProtocol, stateAtStep } from '@/lib/trace/protocol';
import { createArrayRenderer, describeStep } from '@/lib/visualizer/array-renderer';
import {
  registerRenderer,
  selectRenderer,
  registeredKinds,
  type RenderState,
} from '@/lib/visualizer/registry';

/**
 * The array renderer (B2) and the registry that makes the next eleven cheap.
 *
 * The renderer is imperative and outside React (ADR 0001 §7), so it is tested
 * by driving it against real DOM rather than by rendering a component.
 */

beforeEach(() => {
  registerRenderer('array', createArrayRenderer);
});

const trace = toProtocol([
  { kind: 'line', line: 1, vars: { xs: [3, 1, 2], i: 0 } },
  { kind: 'array_read', array: 'xs', index: 0, value: 3 },
  { kind: 'line', line: 2, vars: { i: 1 } },
  { kind: 'array_write', array: 'xs', index: 1, value: 9 },
]);

describe('registry', () => {
  it('selects the array renderer for a trace containing an array', () => {
    expect(selectRenderer(trace)?.kind).toBe('array');
  });

  it('returns null rather than a fallback when nothing matches', () => {
    // An empty panel is honest; a generic view would imply the visualizer
    // understands a structure it does not.
    const noCollections = toProtocol([{ kind: 'line', line: 1, vars: { n: 1 } }]);
    expect(selectRenderer(noCollections)).toBeNull();
  });

  it('reports what is registered, so adding a kind needs no other change', () => {
    expect(registeredKinds()).toContain('array');
  });
});

describe('array renderer', () => {
  it('creates one cell per element at mount', () => {
    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, trace);

    expect(host.querySelectorAll('rect')).toHaveLength(3);
    renderer.destroy();
  });

  it('allocates no DOM on update — the reason it holds 60fps', () => {
    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, trace);

    const before = host.querySelectorAll('*').length;
    for (let step = 0; step < trace.events.length; step++) {
      renderer.update(stateAtStep(trace, step));
    }
    expect(host.querySelectorAll('*').length).toBe(before);
    renderer.destroy();
  });

  it('reflects a write in the cell text', () => {
    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, trace);

    renderer.update(stateAtStep(trace, 3));
    const texts = [...host.querySelectorAll('text')].map((t) => t.textContent);
    expect(texts).toContain('9');
    renderer.destroy();
  });

  it('removes everything it created on destroy', () => {
    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, trace);
    renderer.destroy();

    expect(host.querySelectorAll('*')).toHaveLength(0);
  });

  it('carries an accessible label describing the structure', () => {
    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, trace);

    expect(host.querySelector('svg')?.getAttribute('aria-label')).toMatch(/array xs/i);
    renderer.destroy();
  });
});

describe('text equivalent (H4)', () => {
  const state = (step: number): RenderState => stateAtStep(trace, step);

  it('describes a read in words', () => {
    expect(describeStep(state(1), 'xs')).toMatch(/read index 0, value 3/i);
  });

  it('describes a write in words', () => {
    expect(describeStep(state(3), 'xs')).toMatch(/wrote 9 to index 1/i);
  });

  it('names the current line and variables', () => {
    const text = describeStep(state(2), 'xs');
    expect(text).toMatch(/line 2/i);
    expect(text).toMatch(/i is 1/i);
  });

  it('says something rather than nothing when there is no state', () => {
    const empty = toProtocol([]);
    expect(describeStep(stateAtStep(empty, 0), 'xs')).toBeTruthy();
  });
});
