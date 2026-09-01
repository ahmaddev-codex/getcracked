/**
 * Unified Execution Trace Intermediate Representation (IR) (Track 6).
 *
 * A language-agnostic, canonical event stream protocol that decouples all
 * language execution runtimes (QuickJS, Pyodide, JVM, Clang WASM, Go WASM)
 * from visualizer renderers and step-through debuggers.
 */

export const UNIFIED_IR_VERSION = '2.0.0' as const;

export type IRScalar = string | number | boolean | null;

export type IRCollectionKind =
  | 'array'
  | 'grid'
  | 'map'
  | 'set'
  | 'tree'
  | 'stack'
  | 'queue'
  | 'graph';

export interface IRCollectionDeclaration {
  id: string;
  name: string;
  kind: IRCollectionKind;
  initialElements?: IRScalar[];
  indexedBy?: string[];
  metadata?: Record<string, unknown>;
}

export type UnifiedIREvent =
  | {
      kind: 'line';
      line: number;
      column?: number;
      file?: string;
      changed: Record<string, IRScalar>;
    }
  | {
      kind: 'array_read';
      array: string;
      index: number;
      value: IRScalar;
    }
  | {
      kind: 'array_write';
      array: string;
      index: number;
      value: IRScalar;
      previousValue?: IRScalar;
    }
  | {
      kind: 'pointer_move';
      pointer: string;
      targetIndex: number;
      collection: string;
      label?: string;
    }
  | {
      kind: 'map_put';
      map: string;
      key: string;
      value: IRScalar;
    }
  | {
      kind: 'map_delete';
      map: string;
      key: string;
    }
  | {
      kind: 'grid_set';
      grid: string;
      row: number;
      col: number;
      value: IRScalar;
    }
  | {
      kind: 'tree_node';
      tree: string;
      nodeId: string;
      value: IRScalar;
      leftId?: string | null;
      rightId?: string | null;
    }
  | {
      kind: 'stack_op';
      stack: string;
      op: 'push' | 'pop';
      value?: IRScalar;
    }
  | {
      kind: 'queue_op';
      queue: string;
      op: 'enqueue' | 'dequeue';
      value?: IRScalar;
    }
  | {
      kind: 'return';
      value: unknown;
    }
  | {
      kind: 'error';
      message: string;
      line?: number;
    }
  | {
      kind: 'truncated';
      droppedCount: number;
    };

export interface UnifiedExecutionTrace {
  version: typeof UNIFIED_IR_VERSION;
  language: string;
  collections: IRCollectionDeclaration[];
  events: UnifiedIREvent[];
  totalSteps: number;
  isDegraded: boolean;
}

/** Validates that a raw JSON payload strictly conforms to the Unified IR schema. */
export function validateTraceIR(data: unknown): data is UnifiedExecutionTrace {
  if (!data || typeof data !== 'object') return false;
  const trace = data as Record<string, unknown>;

  if (trace.version !== UNIFIED_IR_VERSION) return false;
  if (typeof trace.language !== 'string') return false;
  if (!Array.isArray(trace.collections) || !Array.isArray(trace.events)) return false;

  for (const event of trace.events) {
    if (!event || typeof event !== 'object') return false;
    const ev = event as Record<string, unknown>;
    if (typeof ev.kind !== 'string') return false;
  }

  return true;
}

/** Serializes a unified trace into a compressed JSON payload. */
export function serializeTraceIR(trace: UnifiedExecutionTrace): string {
  return JSON.stringify(trace);
}

/** Deserializes and validates a JSON string into a UnifiedExecutionTrace. */
export function parseTraceIR(rawJson: string): UnifiedExecutionTrace {
  const parsed = JSON.parse(rawJson);
  if (!validateTraceIR(parsed)) {
    throw new Error('Payload does not conform to Unified Execution Trace IR specification.');
  }
  return parsed;
}

/** Builder helper for language runtime adapters to construct conformant traces. */
export class TraceIRBuilder {
  private collections: IRCollectionDeclaration[] = [];
  private events: UnifiedIREvent[] = [];
  private isDegraded = false;

  constructor(private readonly language: string) {}

  declareCollection(decl: IRCollectionDeclaration): this {
    this.collections.push(decl);
    return this;
  }

  emit(event: UnifiedIREvent): this {
    this.events.push(event);
    return this;
  }

  emitLine(line: number, changed: Record<string, IRScalar>): this {
    this.events.push({ kind: 'line', line, changed });
    return this;
  }

  emitArrayRead(array: string, index: number, value: IRScalar): this {
    this.events.push({ kind: 'array_read', array, index, value });
    return this;
  }

  emitArrayWrite(array: string, index: number, value: IRScalar, previousValue?: IRScalar): this {
    this.events.push({ kind: 'array_write', array, index, value, previousValue });
    return this;
  }

  emitPointerMove(pointer: string, targetIndex: number, collection: string, label?: string): this {
    this.events.push({ kind: 'pointer_move', pointer, targetIndex, collection, label });
    return this;
  }

  emitTreeMutation(tree: string, nodeId: string, value: IRScalar, leftId?: string | null, rightId?: string | null): this {
    this.events.push({ kind: 'tree_node', tree, nodeId, value, leftId, rightId });
    return this;
  }

  emitStackOp(stack: string, op: 'push' | 'pop', value?: IRScalar): this {
    this.events.push({ kind: 'stack_op', stack, op, value });
    return this;
  }

  emitQueueOp(queue: string, op: 'enqueue' | 'dequeue', value?: IRScalar): this {
    this.events.push({ kind: 'queue_op', queue, op, value });
    return this;
  }

  emitReturn(value: unknown): this {
    this.events.push({ kind: 'return', value });
    return this;
  }

  setDegraded(degraded: boolean): this {
    this.isDegraded = degraded;
    return this;
  }

  build(): UnifiedExecutionTrace {
    return {
      version: UNIFIED_IR_VERSION,
      language: this.language,
      collections: [...this.collections],
      events: [...this.events],
      totalSteps: this.events.length,
      isDegraded: this.isDegraded,
    };
  }
}
