import { describe, expect, it } from 'vitest';
import {
  TraceIRBuilder,
  UNIFIED_IR_VERSION,
  validateTraceIR,
  serializeTraceIR,
  parseTraceIR,
} from '@/lib/trace/unified-ir';
import {
  getLanguageProfile,
  getAllLanguageProfiles,
  createMockExecutionTrace,
} from '@/lib/runtime/multi-language';

describe('Track 6: Unified Execution IR Protocol', () => {
  it('builds a conformant trace with collections, pointer moves, and tree events', () => {
    const builder = new TraceIRBuilder('python');

    builder.declareCollection({
      id: 'col-1',
      name: 'nums',
      kind: 'array',
      initialElements: [10, 20, 30],
      indexedBy: ['left', 'right'],
    });

    builder.emitLine(1, { left: 0, right: 2 });
    builder.emitArrayRead('nums', 0, 10);
    builder.emitPointerMove('left', 0, 'nums', 'search pointer');
    builder.emitTreeMutation('bst', 'node-root', 20, 'node-left', 'node-right');
    builder.emitStackOp('callstack', 'push', 'solve()');
    builder.emitQueueOp('bfs_queue', 'enqueue', 10);
    builder.emitReturn(10);

    const trace = builder.build();

    expect(trace.version).toBe(UNIFIED_IR_VERSION);
    expect(trace.language).toBe('python');
    expect(trace.collections).toHaveLength(1);
    expect(trace.collections[0]?.kind).toBe('array');
    expect(trace.events).toHaveLength(7);
    expect(trace.totalSteps).toBe(7);
    expect(validateTraceIR(trace)).toBe(true);
  });

  it('validates and round-trips via serializeTraceIR and parseTraceIR', () => {
    const trace = createMockExecutionTrace('javascript', 3, [5, 10, 15]);

    const serialized = serializeTraceIR(trace);
    expect(typeof serialized).toBe('string');

    const deserialized = parseTraceIR(serialized);
    expect(deserialized.version).toBe(UNIFIED_IR_VERSION);
    expect(deserialized.language).toBe('javascript');
    expect(deserialized.totalSteps).toBe(trace.totalSteps);
    expect(deserialized.events).toEqual(trace.events);
  });

  it('rejects invalid or corrupted payloads', () => {
    expect(validateTraceIR(null)).toBe(false);
    expect(validateTraceIR({})).toBe(false);
    expect(validateTraceIR({ version: 'invalid-version' })).toBe(false);
    expect(validateTraceIR({ version: UNIFIED_IR_VERSION, language: 123 })).toBe(false);

    expect(() => parseTraceIR(JSON.stringify({ bad: 'data' }))).toThrowError();
  });
});

describe('Track 6: Multi-Language Runtime Registry', () => {
  it('registers all Tier 1 and Tier 2 language profiles', () => {
    const profiles = getAllLanguageProfiles();
    expect(profiles.length).toBe(6);

    const languages = profiles.map((p) => p.id);
    expect(languages).toContain('python');
    expect(languages).toContain('javascript');
    expect(languages).toContain('typescript');
    expect(languages).toContain('java');
    expect(languages).toContain('cpp');
    expect(languages).toContain('go');
  });

  it('provides valid starter templates and monaco bindings for each language', () => {
    for (const id of ['python', 'javascript', 'typescript', 'java', 'cpp', 'go'] as const) {
      const profile = getLanguageProfile(id);
      expect(profile).toBeDefined();
      expect(profile.defaultStarterTemplate.length).toBeGreaterThan(10);
      expect(profile.fileExtension.startsWith('.')).toBe(true);
      expect(profile.version.length).toBeGreaterThan(3);
    }
  });
});
