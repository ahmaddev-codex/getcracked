import { describe, expect, it } from 'vitest';
import { TraceCollector } from '@/lib/runtime/trace';

describe('TraceCollector', () => {
  it('records events in the order they occur', () => {
    const c = new TraceCollector({ maxEvents: 10 });
    c.line(1, { i: 0 });
    c.arrayRead('nums', 0, 7);
    c.arrayWrite('nums', 1, 9);

    expect(c.events.map((e) => e.kind)).toEqual([
      'line',
      'array_read',
      'array_write',
    ]);
  });

  it('snapshots variable values so later mutation does not rewrite history', () => {
    const c = new TraceCollector({ maxEvents: 10 });
    const seen = [1, 2];

    c.line(1, { seen });
    seen.push(3);

    expect(c.events[0]).toMatchObject({ kind: 'line', vars: { seen: [1, 2] } });
  });

  it('stops recording at the cap and appends one truncation marker', () => {
    const c = new TraceCollector({ maxEvents: 3 });
    for (let i = 0; i < 10; i++) c.line(i, {});

    expect(c.events).toHaveLength(4);
    expect(c.events[3]).toEqual({ kind: 'truncated', dropped: 7 });
  });

  it('reports truncation so a renderer can show the trace is incomplete', () => {
    const c = new TraceCollector({ maxEvents: 2 });
    for (let i = 0; i < 5; i++) c.line(i, {});

    expect(c.truncated).toBe(true);
  });

  it('is not truncated when it stays under the cap', () => {
    const c = new TraceCollector({ maxEvents: 5 });
    c.line(1, {});

    expect(c.truncated).toBe(false);
    expect(c.events.some((e) => e.kind === 'truncated')).toBe(false);
  });
});
