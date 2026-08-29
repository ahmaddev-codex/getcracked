import type { TraceEvent as RawEvent } from '@/lib/runtime/trace';

/**
 * The trace protocol (B1) — the contract every visualizer renderer consumes.
 *
 * Versioned because renderers are written against it and the two evolve on
 * different schedules: a renderer built for v1 must be able to say "I cannot
 * read this" rather than silently mis-drawing a v2 trace.
 *
 * ## The payload problem this exists to fix
 *
 * T0.2 measured a 500-element loop producing a ~1 MB trace, because every line
 * event snapshotted every live variable — including the whole array. Payload was
 * O(n²) in array size. The `maxEvents` cap bounded event *count* but not event
 * *size*, so a truncated 1 MB trace was still 1 MB.
 *
 * The fix is structural rather than a tighter cap: line events carry only what
 * **changed** since the previous event, and large collections are represented
 * once in a preamble and mutated by reference afterwards. Array reads and writes
 * already describe collection state precisely, which made snapshotting the whole
 * array on every line redundant as well as expensive.
 */

export const TRACE_PROTOCOL_VERSION = 1 as const;

/** Values small enough to inline in an event. */
export type Scalar = string | number | boolean | null;

/**
 * A collection hoisted into the preamble.
 *
 * Sent once with its initial contents; subsequent changes arrive as
 * `array_write` events against the same name. Reconstructing state at step *n*
 * means replaying writes up to *n*, which is what the player does.
 */
export interface CollectionSnapshot {
  name: string;
  kind: 'array' | 'map' | 'set' | 'object';
  initial: unknown[];
  /** True when the value was too large to send in full. */
  truncated: boolean;
}

export type ProtocolEvent =
  /** Only variables whose value differs from the previous line event. */
  | { kind: 'line'; line: number; changed: Record<string, Scalar> }
  | { kind: 'array_read'; array: string; index: number; value: Scalar }
  | { kind: 'array_write'; array: string; index: number; value: Scalar }
  | { kind: 'return'; value: unknown }
  | { kind: 'truncated'; dropped: number };

export interface Trace {
  version: typeof TRACE_PROTOCOL_VERSION;
  /** Collections referenced by name in the events. */
  collections: CollectionSnapshot[];
  events: ProtocolEvent[];
  /** True when tracing degraded to structure-only (see instrument.ts). */
  degraded: boolean;
}

/** PRD H5 caps visualized arrays; larger ones are truncated with a marker. */
export const MAX_COLLECTION_ELEMENTS = 500;

function isScalar(value: unknown): value is Scalar {
  return (
    value === null ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * Converts a raw runtime trace into the wire protocol.
 *
 * Two reductions happen here, and together they are what turns a megabyte into
 * kilobytes:
 *
 *  1. **Hoisting** — a collection appearing in `vars` is emitted once into
 *     `collections` instead of on every line event.
 *  2. **Diffing** — a line event keeps only the scalars that changed since the
 *     last one. A loop counter changes; the six other variables in scope do not.
 */
export function toProtocol(raw: RawEvent[], options: { degraded?: boolean } = {}): Trace {
  const collections: CollectionSnapshot[] = [];
  const seenCollections = new Set<string>();
  const events: ProtocolEvent[] = [];

  // Last known scalar value per variable, for diffing.
  const previous = new Map<string, Scalar>();

  for (const event of raw) {
    switch (event.kind) {
      case 'line': {
        const changed: Record<string, Scalar> = {};

        for (const [name, value] of Object.entries(event.vars)) {
          if (isScalar(value)) {
            // Only what moved. `Object.is` so NaN does not report as changed
            // on every single step.
            if (!previous.has(name) || !Object.is(previous.get(name), value)) {
              changed[name] = value;
              previous.set(name, value);
            }
            continue;
          }

          // A collection: hoist it once and never repeat it.
          if (!seenCollections.has(name)) {
            seenCollections.add(name);
            const asArray = Array.isArray(value) ? value : [];
            collections.push({
              name,
              kind: Array.isArray(value) ? 'array' : 'object',
              initial: asArray.slice(0, MAX_COLLECTION_ELEMENTS),
              truncated: asArray.length > MAX_COLLECTION_ELEMENTS,
            });
          }
        }

        events.push({ kind: 'line', line: event.line, changed });
        break;
      }

      case 'array_read':
      case 'array_write':
        events.push({
          kind: event.kind,
          array: event.array,
          index: event.index,
          value: isScalar(event.value) ? event.value : null,
        });
        break;

      case 'return':
        events.push({ kind: 'return', value: event.value });
        break;

      case 'truncated':
        events.push({ kind: 'truncated', dropped: event.dropped });
        break;
    }
  }

  return {
    version: TRACE_PROTOCOL_VERSION,
    collections,
    events,
    degraded: options.degraded ?? false,
  };
}

/**
 * Rebuilds the state a renderer should draw at a given step.
 *
 * Replaying from the start is deliberate. Keeping a running mutable state and
 * stepping it backwards means writing an inverse for every event type, and any
 * gap there shows up as an animation that is subtly wrong only when scrubbed
 * backwards — the hardest kind of bug to notice. Traces are bounded by
 * `maxEvents`, so replay is cheap enough not to need the risk.
 */
export function stateAtStep(trace: Trace, step: number) {
  const variables = new Map<string, Scalar>();
  const arrays = new Map<string, unknown[]>();

  for (const collection of trace.collections) {
    arrays.set(collection.name, [...collection.initial]);
  }

  let line: number | null = null;
  let lastRead: { array: string; index: number } | null = null;
  let lastWrite: { array: string; index: number } | null = null;

  for (const event of trace.events.slice(0, Math.max(0, step + 1))) {
    switch (event.kind) {
      case 'line':
        line = event.line;
        for (const [name, value] of Object.entries(event.changed)) variables.set(name, value);
        break;
      case 'array_read':
        lastRead = { array: event.array, index: event.index };
        break;
      case 'array_write': {
        const target = arrays.get(event.array);
        if (target) target[event.index] = event.value;
        lastWrite = { array: event.array, index: event.index };
        break;
      }
      default:
        break;
    }
  }

  return { line, variables, arrays, lastRead, lastWrite };
}

/** Byte size of a trace on the wire, for measuring the payload reduction. */
export function traceBytes(trace: Trace): number {
  return JSON.stringify(trace).length;
}
