import { describe, expect, it } from 'vitest';
import { getProblems, findProblem, RAW_PROBLEMS } from '@/content/registry';
import { exerciseId, problemSchema } from '@/content/schema';
import { runTestSpec } from '@/content/test-runner';

/**
 * The content gate, as tests rather than only as a build script.
 *
 * The script fails the build; these fail the suite. Both matter — a contributor
 * running `pnpm test` should learn their exercise is broken without waiting for
 * a build.
 */

describe('authored content', () => {
  it('validates against the schema', () => {
    for (const raw of RAW_PROBLEMS) {
      const parsed = problemSchema.safeParse(raw);
      expect(parsed.success, `${raw.slug}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
    }
  });

  it('has unique ids', () => {
    const ids = getProblems().map((p) => exerciseId(p));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('applies defaults on parse so runtime never sees an absent field', () => {
    // `companies` and `hidden` are optional to authors, required at runtime.
    for (const p of getProblems()) {
      expect(Array.isArray(p.companies)).toBe(true);
      for (const c of p.testSpec.cases) expect(typeof c.hidden).toBe('boolean');
    }
  });
});

describe.each(getProblems().map((p) => [p.slug, p] as const))(
  'problem: %s',
  (_slug, problem) => {
    it('has a JavaScript starter and reference for the Phase 1 slice', () => {
      expect(problem.starterCode.javascript).toBeTruthy();
      expect(problem.referenceSolution.javascript).toBeTruthy();
    });

    it('reference solution passes every case', async () => {
      const r = await runTestSpec({
        spec: problem.testSpec,
        source: problem.referenceSolution.javascript!,
        language: 'javascript',
      });

      const failed = r.cases.filter((c) => !c.passed);
      expect(
        r.passed,
        failed.map((c) => `${c.name}: expected ${JSON.stringify(c.expected)}, got ${JSON.stringify(c.actual)}`).join('; '),
      ).toBe(true);
    }, 60_000);

    it('starter code fails, or the exercise tests nothing', async () => {
      const r = await runTestSpec({
        spec: problem.testSpec,
        source: problem.starterCode.javascript!,
        language: 'javascript',
      });

      // A stub that passes means a learner "solves" it without writing code.
      expect(r.passed).toBe(false);
    }, 60_000);

    it('has at least one hidden case, so the visible set cannot be pattern-matched', () => {
      expect(problem.testSpec.cases.some((c) => c.hidden)).toBe(true);
    });
  },
);

describe('lookup', () => {
  it('finds a problem by topic and slug', () => {
    expect(findProblem('hashing', 'two-sum')?.title).toBe('Two Sum');
  });

  it('returns undefined rather than throwing for an unknown slug', () => {
    expect(findProblem('hashing', 'nope')).toBeUndefined();
  });
});

describe('test spec runner', () => {
  it('reports which specific cases failed, not just an overall verdict', async () => {
    const r = await runTestSpec({
      spec: {
        entry: 'f',
        cases: [
          { args: [1], expected: 1, hidden: false },
          { args: [2], expected: 99, hidden: false },
        ],
      },
      source: 'function f(n) { return n; }',
      language: 'javascript',
    });

    expect(r.passed).toBe(false);
    expect(r.cases[0].passed).toBe(true);
    expect(r.cases[1].passed).toBe(false);
    expect(r.cases[1].actual).toBe(2);
  }, 60_000);

  it('stops at a timeout instead of making the learner wait out every case', async () => {
    const r = await runTestSpec({
      spec: {
        entry: 'spin',
        cases: [
          { args: [], expected: 1, hidden: false },
          { args: [], expected: 2, hidden: false },
          { args: [], expected: 3, hidden: false },
        ],
      },
      source: 'function spin() { while (true) {} }',
      language: 'javascript',
      timeoutMs: 200,
    });

    expect(r.timedOut).toBe(true);
    expect(r.cases).toHaveLength(1);
    expect(r.cases[0].error).toMatch(/infinite loop/i);
  }, 60_000);

  it('runs Python through the same spec, with its own entry name', async () => {
    const r = await runTestSpec({
      spec: {
        entry: 'f',
        entryByLanguage: { python: 'f_py' },
        cases: [{ args: [2], expected: 4, hidden: false }],
      },
      source: 'def f_py(n):\n    return n * 2',
      language: 'python',
    });

    expect(r.passed).toBe(true);
  }, 60_000);

  it('refuses a language with no registered adapter', async () => {
    // Java is suspended (H1). Asking for it should say so plainly rather than
    // failing somewhere obscure downstream.
    await expect(
      runTestSpec({
        spec: { entry: 'f', cases: [{ args: [], expected: 1, hidden: false }] },
        source: 'x',
        language: 'java' as never,
      }),
    ).rejects.toThrow(/no runtime adapter/i);
  });
});
