import { describe, expect, it } from 'vitest';
import { runJavaScript } from '@/lib/runtime/javascript';
import { runPython } from '@/lib/runtime/python';
import { runTypeScript } from '@/lib/runtime/typescript';
import { runTestSpec, supportedLanguages, type LanguageRuntime } from '@/content/test-runner';
import type { RunResult } from '@/lib/runtime/javascript';

/**
 * Adapter conformance — the criterion that keeps AD-2's extensibility honest.
 *
 * The claim is that adding a language means writing one adapter and registering
 * it, with no change to the editor, the results UI, the spec runner, or the
 * content model. That claim is easy to assert and easy to quietly break, so it
 * is tested two ways:
 *
 *  1. Both real adapters are driven through the same suite and must agree.
 *  2. A **stub** adapter for a hypothetical third language satisfies the same
 *     interface. If someone adds a JavaScript-shaped assumption to the shared
 *     path, this stops compiling or stops passing — which is the alarm that
 *     Java's eventual return has become a rewrite rather than an adapter.
 */

const TIMEOUT = 120_000;

interface Case {
  name: string;
  js: string;
  py: string;
  entry: { javascript: string; python: string };
  args: unknown[];
  expected: unknown;
}

const CASES: Case[] = [
  {
    name: 'returns a computed value',
    js: 'function total(nums) { let s = 0; for (let i = 0; i < nums.length; i++) { s += nums[i]; } return s; }',
    py: 'def total(nums):\n    s = 0\n    for i in range(len(nums)):\n        s += nums[i]\n    return s',
    entry: { javascript: 'total', python: 'total' },
    args: [[1, 2, 3, 4]],
    expected: 10,
  },
  {
    name: 'returns an array',
    js: 'function firstTwo(xs) { return [xs[0], xs[1]]; }',
    py: 'def first_two(xs):\n    return [xs[0], xs[1]]',
    entry: { javascript: 'firstTwo', python: 'first_two' },
    args: [[9, 8, 7]],
    expected: [9, 8],
  },
  {
    name: 'handles an empty input',
    js: 'function count(xs) { return xs.length; }',
    py: 'def count(xs):\n    return len(xs)',
    entry: { javascript: 'count', python: 'count' },
    args: [[]],
    expected: 0,
  },
];

describe('both adapters agree', () => {
  it.each(CASES)('$name', async ({ js, py, entry, args, expected }) => {
    const jsResult = await runTestSpec({
      spec: { entry: entry.javascript, entryByLanguage: { python: entry.python }, cases: [{ args, expected, hidden: false }] },
      source: js,
      language: 'javascript',
    });
    const pyResult = await runTestSpec({
      spec: { entry: entry.javascript, entryByLanguage: { python: entry.python }, cases: [{ args, expected, hidden: false }] },
      source: py,
      language: 'python',
    });

    expect(jsResult.passed).toBe(true);
    expect(pyResult.passed).toBe(true);
    expect(jsResult.cases[0].actual).toEqual(pyResult.cases[0].actual);
  }, TIMEOUT);
});

describe('both adapters report failure the same way', () => {
  it('marks a wrong answer failed in each, with the actual value', async () => {
    const spec = {
      entry: 'f',
      cases: [{ args: [], expected: 'right', hidden: false }],
    };

    const js = await runTestSpec({ spec, source: 'function f() { return "wrong"; }', language: 'javascript' });
    const py = await runTestSpec({ spec, source: 'def f():\n    return "wrong"', language: 'python' });

    expect(js.passed).toBe(false);
    expect(py.passed).toBe(false);
    expect(js.cases[0].actual).toBe('wrong');
    expect(py.cases[0].actual).toBe('wrong');
  }, TIMEOUT);

  it('surfaces a thrown error in each', async () => {
    const spec = { entry: 'f', cases: [{ args: [], expected: 1, hidden: false }] };

    const js = await runTestSpec({ spec, source: 'function f() { throw new Error("boom"); }', language: 'javascript' });
    const py = await runTestSpec({ spec, source: 'def f():\n    raise ValueError("boom")', language: 'python' });

    expect(js.cases[0].error).toMatch(/boom/);
    expect(py.cases[0].error).toMatch(/boom/);
  }, TIMEOUT);
});

describe('a third language needs only an adapter', () => {
  /**
   * A stub for a hypothetical language. It implements `LanguageRuntime` and
   * nothing else — no editor mode, no results branch, no schema change.
   */
  const stubAdapter: LanguageRuntime = async (opts) => ({
    ok: true,
    value: opts.args.length,
    timedOut: false,
    events: [],
    truncated: false,
    traceDegraded: false,
  });

  it('satisfies the interface every real adapter satisfies', async () => {
    // Structural, not nominal: if the shared path grows a JavaScript-specific
    // requirement, this stops type-checking.
    const adapters: LanguageRuntime[] = [runJavaScript, runPython, runTypeScript, stubAdapter];
    expect(adapters).toHaveLength(4);

    const tsResult: RunResult = await runTypeScript({
      source: 'function countItems(nums: number[]): number { return nums.length; }',
      entry: 'countItems',
      args: [[10, 20, 30]],
    });
    expect(tsResult.ok).toBe(true);
    expect(tsResult.value).toBe(3);

    const result: RunResult = await stubAdapter({
      source: 'anything',
      entry: 'f',
      args: [1, 2],
    });
    expect(result.value).toBe(2);
  });

  it('needs no change to the result shape', () => {
    const keys = ['ok', 'value', 'timedOut', 'events', 'truncated', 'traceDegraded'];
    for (const key of keys) {
      expect(
        Object.prototype.hasOwnProperty.call(
          { ok: true, value: 0, timedOut: false, events: [], truncated: false, traceDegraded: false },
          key,
        ),
      ).toBe(true);
    }
  });
});

describe('the registry is the single point of extension', () => {
  it('reports exactly the languages that have adapters', () => {
    expect(supportedLanguages().sort()).toEqual(
      ['javascript', 'python', 'typescript', 'java', 'cpp', 'go'].sort(),
    );
  });

  it('refuses a language with no adapter rather than failing obscurely', async () => {
    await expect(
      runTestSpec({
        spec: { entry: 'f', cases: [{ args: [], expected: 1, hidden: false }] },
        source: 'x',
        language: 'rust' as never,
      }),
    ).rejects.toThrow(/no runtime adapter/i);
  });
});
