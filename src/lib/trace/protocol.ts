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
  /**
   * Variables the source uses to subscript this collection.
   *
   * Static, from the source, because a trace cannot tell an index from a number
   * that happens to be in range. Renderers mark a variable as a pointer only if
   * it appears here, which is what stops a counter like `swaps` being drawn as
   * pointing at element 0.
   *
   * Empty means "unknown", not "none": a trace from before this existed, or
   * source that would not parse, should fall back to labelling nothing rather
   * than to labelling everything.
   */
  indexedBy?: string[];
  /**
   * Starting contents of a map-like collection, as ordered pairs.
   *
   * Separate from `initial`, which is positional: a map has keys, not indices,
   * and flattening one into the other would make a renderer guess which it was
   * handed.
   */
  entries?: Array<[string, Scalar]>;
}

export type ProtocolEvent =
  /** Only variables whose value differs from the previous line event. */
  | { kind: 'line'; line: number; changed: Record<string, Scalar> }
  | { kind: 'array_read'; array: string; index: number; value: Scalar }
  | { kind: 'array_write'; array: string; index: number; value: Scalar }
  /**
   * A key gained or changed a value in a map.
   *
   * Derived from the line snapshots rather than from a runtime hook. Both
   * adapters already snapshot every live variable on every line, so the map's
   * contents were in the raw trace all along — `toProtocol` was discarding
   * them, hoisting the object with empty contents and never mentioning it
   * again. Diffing consecutive snapshots recovers the mutations without either
   * runtime having to wrap or instrument anything, which is also why the two
   * languages produce identical map events for free.
   */
  | { kind: 'map_put'; map: string; key: string; value: Scalar }
  | { kind: 'map_delete'; map: string; key: string }
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

/**
 * A plain object's entries, keeping only scalar values.
 *
 * A nested value becomes null rather than being dropped: the key exists, and
 * showing it with an unrepresentable value is more honest than pretending the
 * map does not contain it.
 */
function mapEntries(value: unknown): Array<[string, Scalar]> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.entries(value as Record<string, unknown>).map(([k, v]) => [
    k,
    isScalar(v) ? v : null,
  ]);
}

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
export function toProtocol(
  raw: RawEvent[],
  options: { degraded?: boolean; indexedBy?: Record<string, string[]> } = {},
): Trace {
  const collections: CollectionSnapshot[] = [];
  const seenCollections = new Set<string>();
  const events: ProtocolEvent[] = [];

  // Last known scalar value per variable, for diffing.
  const previous = new Map<string, Scalar>();
  // Last known contents per map, for the same reason.
  const previousMaps = new Map<string, Map<string, Scalar>>();

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

          const isArray = Array.isArray(value);

          // A collection: hoist it once and never repeat it.
          if (!seenCollections.has(name)) {
            seenCollections.add(name);
            const asArray = isArray ? (value as unknown[]) : [];
            const asEntries = isArray ? [] : mapEntries(value);
            collections.push({
              name,
              kind: isArray ? 'array' : 'map',
              initial: asArray.slice(0, MAX_COLLECTION_ELEMENTS),
              truncated:
                asArray.length > MAX_COLLECTION_ELEMENTS ||
                asEntries.length > MAX_COLLECTION_ELEMENTS,
              indexedBy: options.indexedBy?.[name],
              entries: isArray ? undefined : asEntries.slice(0, MAX_COLLECTION_ELEMENTS),
            });
            if (!isArray) previousMaps.set(name, new Map(asEntries));
          }

          /**
           * Arrays already describe their own changes through read and write
           * events, so re-diffing them here would double-report. A map has no
           * such events — nothing in either runtime hooks `counts[k] = v` — so
           * its mutations are recovered by diffing consecutive snapshots.
           */
          if (!isArray && seenCollections.has(name)) {
            const before = previousMaps.get(name) ?? new Map<string, Scalar>();
            const after = new Map(mapEntries(value));

            for (const [key, next] of after) {
              if (!before.has(key) || !Object.is(before.get(key), next)) {
                events.push({ kind: 'map_put', map: name, key, value: next });
              }
            }
            for (const key of before.keys()) {
              if (!after.has(key)) events.push({ kind: 'map_delete', map: name, key });
            }
            previousMaps.set(name, after);
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
 * What a renderer draws at one step.
 *
 * `lastWrite` carries the **previous** value as well as the new one, and
 * `changed` names the variables that moved on this exact step. Both are
 * reconstructed during the replay below rather than sent on the wire, so they
 * cost nothing in payload — the whole point of the diffing in `toProtocol`.
 *
 * They exist because "index 3 turned yellow" does not teach anything. "index 3
 * went from 9 to 5" does, and it is the difference between watching an animation
 * and following an algorithm.
 */
export interface TraceState {
  line: number | null;
  variables: Map<string, Scalar>;
  arrays: Map<string, unknown[]>;
  /** Map-like collections, replayed from their put and delete events. */
  maps: Map<string, Map<string, Scalar>>;
  lastRead: { array: string; index: number; value: Scalar } | null;
  lastWrite: { array: string; index: number; value: Scalar; previous: Scalar } | null;
  /** The map entry that changed on this step, with what it replaced. */
  lastPut: { map: string; key: string; value: Scalar; previous: Scalar | undefined } | null;
  /** Variables whose value changed on this step, for highlighting. */
  changed: Set<string>;
  /** Value of each changed variable immediately before this step. */
  previousValues: Map<string, Scalar>;
  /** The value returned, once the trace has reached its return event. */
  returned: unknown;
  /** True once the run has returned by this step. */
  finished: boolean;
}

/**
 * Rebuilds the state a renderer should draw at a given step.
 *
 * Replaying from the start is deliberate. Keeping a running mutable state and
 * stepping it backwards means writing an inverse for every event type, and any
 * gap there shows up as an animation that is subtly wrong only when scrubbed
 * backwards — the hardest kind of bug to notice. Traces are bounded by
 * `maxEvents`, so replay is cheap enough not to need the risk.
 *
 * The same reasoning covers `previous` on a write: the prior value is read out
 * of the array being replayed, immediately before it is overwritten, so it is
 * always the value that was actually there rather than a guess.
 */
export function stateAtStep(trace: Trace, step: number): TraceState {
  const variables = new Map<string, Scalar>();
  const arrays = new Map<string, unknown[]>();
  const maps = new Map<string, Map<string, Scalar>>();

  for (const collection of trace.collections) {
    if (collection.kind === 'map') maps.set(collection.name, new Map(collection.entries ?? []));
    else arrays.set(collection.name, [...collection.initial]);
  }

  let line: number | null = null;
  let lastRead: TraceState['lastRead'] = null;
  let lastWrite: TraceState['lastWrite'] = null;
  let lastPut: TraceState['lastPut'] = null;
  let changed = new Set<string>();
  let previousValues = new Map<string, Scalar>();
  let returned: unknown;
  let finished = false;

  const target = Math.max(0, step + 1);

  trace.events.slice(0, target).forEach((event, index) => {
    // Only the final step's changes are "what just happened"; earlier ones are
    // history. Reset per event so scrubbing to a step reports that step alone.
    const isCurrent = index === target - 1;
    if (isCurrent) {
      changed = new Set();
      previousValues = new Map();
    }

    switch (event.kind) {
      case 'line':
        line = event.line;
        for (const [name, value] of Object.entries(event.changed)) {
          if (isCurrent) {
            changed.add(name);
            // `variables` still holds the pre-update value at this point.
            previousValues.set(name, variables.get(name) ?? null);
          }
          variables.set(name, value);
        }
        break;

      case 'array_read':
        lastRead = { array: event.array, index: event.index, value: event.value };
        break;

      case 'array_write': {
        const array = arrays.get(event.array);
        // Read the outgoing value before overwriting it — this is the only
        // moment it is available.
        const previous = (array?.[event.index] ?? null) as Scalar;
        if (array) array[event.index] = event.value;
        lastWrite = { array: event.array, index: event.index, value: event.value, previous };
        break;
      }

      case 'map_put': {
        const target = maps.get(event.map);
        // The outgoing value, read before it is replaced — the only moment it
        // is available, exactly as with an array write.
        const before = target?.get(event.key);
        target?.set(event.key, event.value);
        lastPut = { map: event.map, key: event.key, value: event.value, previous: before };
        break;
      }

      case 'map_delete':
        maps.get(event.map)?.delete(event.key);
        break;

      case 'return':
        returned = event.value;
        finished = true;
        break;

      default:
        break;
    }
  });

  return {
    line,
    variables,
    arrays,
    maps,
    lastRead,
    lastWrite,
    lastPut,
    changed,
    previousValues,
    returned,
    finished,
  };
}

/** Byte size of a trace on the wire, for measuring the payload reduction. */
export function traceBytes(trace: Trace): number {
  return JSON.stringify(trace).length;
}
