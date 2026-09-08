import { describe, expect, it } from 'vitest';
import { runJavaScript } from '@/lib/runtime/javascript';

const TWO_SUM = `
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i];
    if (seen.has(complement)) {
      return [seen.get(complement), i];
    }
    seen.set(nums[i], i);
  }
  return [];
}
`;

describe('runJavaScript', () => {
  it('executes learner code and returns its value', async () => {
    const r = await runJavaScript({
      source: TWO_SUM,
      entry: 'twoSum',
      args: [[2, 7, 11, 15], 9],
    });

    expect(r.ok).toBe(true);
    expect(r.value).toEqual([0, 1]);
  });

  it('reports a runtime error without crashing the host', async () => {
    const r = await runJavaScript({
      source: 'function boom() { throw new Error("kaboom"); }',
      entry: 'boom',
      args: [],
    });

    expect(r.ok).toBe(false);
    expect(r.error).toMatch(/kaboom/);
  });

  it('emits ordered line events carrying variable state', async () => {
    const r = await runJavaScript({
      source: TWO_SUM,
      entry: 'twoSum',
      args: [[2, 7, 11, 15], 9],
      trace: true,
    });

    const lines = r.events.filter((e) => e.kind === 'line');
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.some((e) => 'i' in e.vars)).toBe(true);
  });

  it('emits array index reads for subscript access', async () => {
    const r = await runJavaScript({
      source: TWO_SUM,
      entry: 'twoSum',
      args: [[2, 7, 11, 15], 9],
      trace: true,
    });

    const reads = r.events.filter((e) => e.kind === 'array_read');
    expect(reads.length).toBeGreaterThan(0);
    expect(reads[0]).toMatchObject({ array: 'nums', index: 0, value: 2 });
  });

  it('emits array index writes for subscript assignment', async () => {
    const r = await runJavaScript({
      source: 'function bump(xs) { xs[1] = 99; return xs; }',
      entry: 'bump',
      args: [[1, 2, 3]],
      trace: true,
    });

    expect(r.events).toContainEqual({
      kind: 'array_write',
      array: 'xs',
      index: 1,
      value: 99,
    });
  });

  it('terminates an infinite loop via the interrupt handler', async () => {
    const started = Date.now();
    const r = await runJavaScript({
      source: 'function spin() { while (true) {} }',
      entry: 'spin',
      args: [],
      timeoutMs: 250,
    });
    const elapsed = Date.now() - started;

    expect(r.timedOut).toBe(true);
    expect(r.ok).toBe(false);
    // Proves the interrupt actually fired rather than the promise hanging.
    expect(elapsed).toBeLessThan(5000);
  });

  it('leaves tracing off by default so a plain test run pays no trace cost', async () => {
    const r = await runJavaScript({
      source: TWO_SUM,
      entry: 'twoSum',
      args: [[2, 7, 11, 15], 9],
    });

    expect(r.events).toEqual([]);
  });

  it('captures console.log and various console methods without throwing ReferenceError', async () => {
    const r = await runJavaScript({
      source: `
      function logTest() {
        console.log("hello", 123, { a: 1 });
        console.info("info msg");
        console.warn("warn msg");
        return "done";
      }
      `,
      entry: 'logTest',
      args: [],
    });

    expect(r.ok).toBe(true);
    expect(r.logs).toBeDefined();
    expect(r.logs).toContain('hello 123 {"a":1}');
    expect(r.logs).toContain('info msg');
    expect(r.logs).toContain('warn msg');
  });

  it('preserves logs produced before an exception is thrown', async () => {
    const r = await runJavaScript({
      source: `
      function failWithLogs() {
        console.log("checkpoint 1 reached");
        throw new Error("unhandled error");
      }
      `,
      entry: 'failWithLogs',
      args: [],
    });

    expect(r.ok).toBe(false);
    expect(r.logs).toEqual(['checkpoint 1 reached']);
    expect(r.error).toContain('unhandled error');
  });

  it('supports PriorityQueue and Queue data structures from prelude', async () => {
    const r = await runJavaScript({
      source: `
      function testStructures() {
        var pq = new PriorityQueue();
        pq.offer(15);
        pq.offer(5);
        pq.offer(30);
        pq.offer(10);
        var sorted = [];
        while (!pq.isEmpty()) {
          sorted.push(pq.poll());
        }

        var q = new Queue();
        q.offer('a');
        q.offer('b');
        var fifo = [q.poll(), q.poll()];

        return { sorted: sorted, fifo: fifo };
      }
      `,
      entry: 'testStructures',
      args: [],
    });

    expect(r.ok).toBe(true);
    expect(r.value).toEqual({
      sorted: [5, 10, 15, 30],
      fifo: ['a', 'b'],
    });
  });

  it('catches deep stack overflow gracefully without crashing the runner', async () => {
    const r = await runJavaScript({
      source: `
      function recurse(n) {
        return recurse(n + 1);
      }
      `,
      entry: 'recurse',
      args: [1],
    });

    expect(r.ok).toBe(false);
    expect(r.error).toContain('stack');
  });

  it('bounds linear memory allocation via setMemoryLimit', async () => {
    const r = await runJavaScript({
      source: `
      function hog() {
        var arr = [];
        while (true) arr.push(new Array(100000));
      }
      `,
      entry: 'hog',
      args: [],
      timeoutMs: 1000,
    });

    expect(r.ok).toBe(false);
    expect(r.error?.toLowerCase()).toMatch(/out of memory|interrupted/);
  });
});
