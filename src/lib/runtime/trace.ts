/**
 * Language-agnostic execution trace.
 *
 * Every runtime adapter (Python via sys.settrace, JavaScript via AST
 * instrumentation) emits this same event shape, so a visualizer renderer can
 * consume a trace without knowing which language produced it.
 */

export type TraceEvent =
  | { kind: 'line'; line: number; vars: Record<string, unknown> }
  | { kind: 'array_read'; array: string; index: number; value: unknown }
  | { kind: 'array_write'; array: string; index: number; value: unknown }
  | { kind: 'return'; value: unknown }
  | { kind: 'truncated'; dropped: number };

export interface TraceLimits {
  /** Hard cap on recorded events, before the truncation marker is appended. */
  maxEvents: number;
}

/** PRD H5 caps visualized structures; a long loop over one still floods events. */
export const DEFAULT_MAX_EVENTS = 10_000;

/**
 * Deep-copies a value into something JSON-safe.
 *
 * Snapshotting matters: `vars` holds live references, so without a copy a later
 * `arr.push(...)` would retroactively change what an earlier event claims the
 * state was, and the animation would replay a history that never happened.
 */
function snapshot(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[nested]';
  if (value === null || typeof value !== 'object') {
    return typeof value === 'bigint' ? value.toString() : value;
  }
  if (Array.isArray(value)) return value.map((v) => snapshot(v, depth + 1));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = snapshot(v, depth + 1);
  }
  return out;
}

export class TraceCollector {
  readonly events: TraceEvent[] = [];
  private dropped = 0;
  private readonly maxEvents: number;

  constructor(limits: Partial<TraceLimits> = {}) {
    this.maxEvents = limits.maxEvents ?? DEFAULT_MAX_EVENTS;
  }

  get truncated(): boolean {
    return this.dropped > 0;
  }

  line(line: number, vars: Record<string, unknown>): void {
    this.push({ kind: 'line', line, vars: snapshot(vars) as Record<string, unknown> });
  }

  arrayRead(array: string, index: number, value: unknown): void {
    this.push({ kind: 'array_read', array, index, value: snapshot(value) });
  }

  arrayWrite(array: string, index: number, value: unknown): void {
    this.push({ kind: 'array_write', array, index, value: snapshot(value) });
  }

  returned(value: unknown): void {
    this.push({ kind: 'return', value: snapshot(value) });
  }

  /** Adopt events produced inside a sandbox (Pyodide/QuickJS) as-is. */
  adopt(events: TraceEvent[]): void {
    for (const e of events) this.push(e);
  }

  /**
   * Finalize: appends the truncation marker if the cap was hit. Safe to call
   * more than once — the marker is only added on the first call.
   */
  finish(): TraceEvent[] {
    if (this.dropped > 0 && this.events.at(-1)?.kind !== 'truncated') {
      this.events.push({ kind: 'truncated', dropped: this.dropped });
    }
    return this.events;
  }

  private push(event: TraceEvent): void {
    if (this.events.length >= this.maxEvents) {
      this.dropped++;
      // Keep the marker current so callers reading `.events` mid-run still see
      // an accurate count without having to call finish() first.
      const last = this.events.at(-1);
      if (last?.kind === 'truncated') last.dropped = this.dropped;
      else this.events.push({ kind: 'truncated', dropped: this.dropped });
      return;
    }
    this.events.push(event);
  }
}
