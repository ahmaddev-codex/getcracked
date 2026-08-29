import type { Trace, TraceState } from '@/lib/trace/protocol';

/**
 * Renderer registry (B2).
 *
 * A renderer draws one structure type — arrays now; linked lists, trees, graphs,
 * heaps and the rest in Phase 4. Registering is the whole integration: the
 * player, the controls, and the scrubber know nothing about which renderer they
 * are driving, so adding the next eleven requires no change to any of them.
 *
 * Renderers are imperative on purpose (ADR 0001 §7). H5 requires 60fps for 500
 * elements; 500 SVG rects is unremarkable, but 500 React components reconciling
 * every frame is not. React owns the container, the controls, and the scrubber —
 * the frame loop mutates the DOM directly and never touches React state.
 */

/**
 * What renderers draw, which is exactly what the trace can reconstruct.
 *
 * Aliased to `TraceState` rather than restated so the two cannot drift: a
 * renderer written against a field the protocol stops producing should fail to
 * compile, not silently draw nothing.
 */
export type RenderState = TraceState;

export interface Renderer {
  /** Builds the initial DOM inside `host`. Called once per mount. */
  mount(host: HTMLElement, trace: Trace): void;
  /** Called per frame. Must not allocate DOM — update what mount() created. */
  update(state: RenderState): void;
  /** Releases anything mount() created. */
  destroy(): void;
}

export type RendererFactory = () => Renderer;

const REGISTRY = new Map<string, RendererFactory>();

export function registerRenderer(kind: string, factory: RendererFactory): void {
  REGISTRY.set(kind, factory);
}

export function createRenderer(kind: string): Renderer | null {
  return REGISTRY.get(kind)?.() ?? null;
}

/**
 * Picks a renderer for a trace.
 *
 * Returns null rather than a fallback when nothing matches: an empty panel is
 * honest, whereas a generic "here are some numbers" view would imply the
 * visualizer understands a structure it does not.
 */
export function selectRenderer(trace: Trace): { kind: string; renderer: Renderer } | null {
  const array = trace.collections.find((c) => c.kind === 'array');
  if (array) {
    const renderer = createRenderer('array');
    if (renderer) return { kind: 'array', renderer };
  }
  return null;
}

export function registeredKinds(): string[] {
  return [...REGISTRY.keys()];
}
