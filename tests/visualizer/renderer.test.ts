import { describe, expect, it } from 'vitest';
import { toProtocol, stateAtStep } from '@/lib/trace/protocol';
import { createArrayRenderer, describeStep } from '@/lib/visualizer/array-renderer';
import { selectRenderer, registeredKinds, type RenderState } from '@/lib/visualizer/registry';
import '@/lib/visualizer/renderers';

/**
 * The array renderer (B2) and the registry that makes the next eleven cheap.
 *
 * The renderer is imperative and outside React (ADR 0001 §7), so it is tested
 * by driving it against real DOM rather than by rendering a component.
 */

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

    expect(host.querySelectorAll('rect.gc-cell')).toHaveLength(3);
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
    expect(describeStep(state(1), 'xs')).toMatch(/read xs\[0\], which is 3/i);
  });

  /**
   * The point of the narration: a learner should be told what the value *was*,
   * not merely that a cell changed. Colour alone cannot carry that, and asking
   * someone to remember the previous frame defeats the purpose of the animation.
   */
  it('reports both sides of a write, not just the new value', () => {
    const text = describeStep(state(3), 'xs');
    expect(text).toMatch(/xs\[1\] changed from 1 to 9/i);
  });

  it('names the current line and the variable that moved', () => {
    const text = describeStep(state(2), 'xs');
    expect(text).toMatch(/line 2/i);
    expect(text).toMatch(/i moved from 0 to 1/i);
  });

  it('reports only the variables that changed on this step', () => {
    // `i` changed at step 2 and nothing changed at step 3, so step 3 must not
    // claim `i` just moved — that would make every frame look eventful.
    expect(state(2).changed.has('i')).toBe(true);
    expect(state(3).changed.has('i')).toBe(false);
  });

  it('does not announce a change when a write stores the same value', () => {
    // `a[i] = a[i]` appears in plenty of correct code; flagging it as a change
    // trains learners to distrust the annotation.
    const same = toProtocol([
      { kind: 'line', line: 1, vars: { xs: [5], i: 0 } },
      { kind: 'array_write', array: 'xs', index: 0, value: 5 },
    ]);
    const text = describeStep(stateAtStep(same, 1), 'xs');
    expect(text).toMatch(/same value/i);
    expect(text).not.toMatch(/changed from/i);
  });

  it('reports the returned value once the run finishes', () => {
    const returning = toProtocol([
      { kind: 'line', line: 1, vars: { xs: [1], i: 0 } },
      { kind: 'return', value: 42 },
    ]);
    const finished = stateAtStep(returning, 1);
    expect(finished.finished).toBe(true);
    expect(describeStep(finished, 'xs')).toMatch(/returned 42/i);
  });

  it('says something rather than nothing when there is no state', () => {
    const empty = toProtocol([]);
    expect(describeStep(stateAtStep(empty, 0), 'xs')).toBeTruthy();
  });
});

/**
 * The "was N" annotation.
 *
 * The renderer draws a bar whose height is the value, so a change is visible as
 * movement — but the value it moved *from* is gone by the time the learner looks.
 * The annotation is what makes the change readable rather than merely visible.
 */
describe('change annotation', () => {
  function mounted(t: ReturnType<typeof toProtocol>) {
    const host = document.createElement('div');
    const renderer = createArrayRenderer();
    renderer.mount(host, t);
    return { host, renderer };
  }

  const texts = (host: HTMLElement) =>
    [...host.querySelectorAll('text')].map((t) => t.textContent);

  it('labels the cell that changed with the value it replaced', () => {
    const { host, renderer } = mounted(trace);
    renderer.update(stateAtStep(trace, 3));

    expect(texts(host)).toContain('was 1');
    renderer.destroy();
  });

  it('clears the label once the step moves on', () => {
    const { host, renderer } = mounted(trace);
    renderer.update(stateAtStep(trace, 3));
    renderer.update(stateAtStep(trace, 2));

    expect(texts(host).some((t) => t?.startsWith('was'))).toBe(false);
    renderer.destroy();
  });

  it('does not label a write that stored the same value', () => {
    const same = toProtocol([
      { kind: 'line', line: 1, vars: { xs: [5, 6], i: 0 } },
      { kind: 'array_write', array: 'xs', index: 0, value: 5 },
    ]);
    const { host, renderer } = mounted(same);
    renderer.update(stateAtStep(same, 1));

    expect(texts(host).some((t) => t?.startsWith('was'))).toBe(false);
    renderer.destroy();
  });

  it('still allocates no DOM per frame', () => {
    // The annotation is a text node created at mount and mutated, not appended
    // per step — H5's 60fps budget does not survive per-frame allocation.
    const { host, renderer } = mounted(trace);
    const before = host.querySelectorAll('*').length;
    for (let step = 0; step < trace.events.length; step++) {
      renderer.update(stateAtStep(trace, step));
    }
    expect(host.querySelectorAll('*').length).toBe(before);
    renderer.destroy();
  });
});
