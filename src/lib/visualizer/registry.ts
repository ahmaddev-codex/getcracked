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

/**
 * The shape a structure should be drawn in.
 *
 * Declared by the lesson author rather than inferred, because it cannot be
 * inferred: a heap, a DP table, a queue and a plain list are all "an array" as
 * far as the trace is concerned. The runtime knows what the data *is*; only the
 * author knows what it *means*.
 */
export type VisualKind =
  | 'array'
  | 'stack'
  | 'queue'
  | 'linked-list'
  | 'tree'
  | 'heap'
  | 'graph';

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
 * `preferred` is the shape the content declares; the array renderer is the
 * fallback because every trace collection really is an array underneath, so it
 * is always a truthful picture even when it is not the most illuminating one.
 *
 * Returns null when the trace holds no collection at all: an empty panel is
 * honest, whereas a generic "here are some numbers" view would imply the
 * visualizer understands a structure it does not.
 */
export function selectRenderer(
  trace: Trace,
  preferred: VisualKind = 'array',
): { kind: string; renderer: Renderer } | null {
  if (!trace.collections.some((c) => c.kind === 'array')) return null;

  const renderer = createRenderer(preferred) ?? createRenderer('array');
  return renderer ? { kind: REGISTRY.has(preferred) ? preferred : 'array', renderer } : null;
}

export function registeredKinds(): string[] {
  return [...REGISTRY.keys()];
}
