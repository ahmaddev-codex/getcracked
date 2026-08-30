import { describe, expect, it } from 'vitest';
import { runTestSpec } from '@/content/test-runner';
import type { Language, TestSpec } from '@/content/schema';

/**
 * The multi-file runner (tier 3).
 *
 * Two runtimes reach the same behaviour by genuinely different routes — QuickJS
 * has no module loader so it gets a CommonJS registry, while Pyodide writes the
 * files to its virtual filesystem and imports them for real — so the important
 * assertions are made against **both**, not against whichever was easier.
 */

const LANGUAGES: Language[] = ['javascript', 'python'];

/** `entry` differs by language exactly as it does for a problem. */
function spec(cases: TestSpec['cases']): TestSpec {
  return { entry: 'run', entryByLanguage: { python: 'run' }, cases };
}

const SOURCES: Record<Language, { harness: string; helper: string }> = {
  javascript: {
    harness: `const { double } = require('./helper');
function run(n) { return double(n) + 1; }
module.exports = { run };`,
    helper: `function double(n) { return n * 2; }
module.exports = { double };`,
  },
  python: {
    harness: `from helper import double


def run(n):
    return double(n) + 1
`,
    helper: `def double(n):
    return n * 2
`,
  },
};

describe.each(LANGUAGES)('%s', (language) => {
  it('runs an entry module that imports a sibling', async () => {
    const result = await runTestSpec({
      spec: spec([{ args: [4], expected: 9, hidden: false }]),
      source: SOURCES[language].harness,
      entryModule: 'harness',
      modules: [{ name: 'helper', source: SOURCES[language].helper }],
      language,
    });

    expect(result.cases[0].error).toBeUndefined();
    expect(result.passed).toBe(true);
  });

  it('reports a failure in a sibling module as a failure, not a crash', async () => {
    const broken =
      language === 'javascript'
        ? `function double(n) { throw new Error('boom'); }\nmodule.exports = { double };`
        : `def double(n):\n    raise ValueError("boom")\n`;

    const result = await runTestSpec({
      spec: spec([{ args: [4], expected: 9, hidden: false }]),
      source: SOURCES[language].harness,
      entryModule: 'harness',
      modules: [{ name: 'helper', source: broken }],
      language,
    });

    expect(result.passed).toBe(false);
    expect(result.cases[0].error).toMatch(/boom/);
  });

  it('records structure events but no line events across several files', async () => {
    // A trace event carries one line number, which says nothing across a
    // workspace of files. Both adapters draw the line in the same place, so a
    // build animates identically — which is to say, structurally — in either.
    const sum =
      language === 'javascript'
        ? {
            harness: `const { total } = require('./helper');
function run(xs) { return total(xs); }
module.exports = { run };`,
            helper: `function total(xs) {
  let t = 0;
  for (let i = 0; i < xs.length; i++) t += xs[i];
  return t;
}
module.exports = { total };`,
          }
        : {
            harness: `from helper import total


def run(xs):
    return total(xs)
`,
            helper: `def total(xs):
    t = 0
    for i in range(len(xs)):
        t += xs[i]
    return t
`,
          };

    const result = await runTestSpec({
      spec: spec([{ args: [[1, 2, 3]], expected: 6, hidden: false }]),
      source: sum.harness,
      entryModule: 'harness',
      modules: [{ name: 'helper', source: sum.helper }],
      language,
      trace: true,
    });

    expect(result.passed).toBe(true);
    expect(result.traceDegraded).toBe(true);
    // Degraded, not empty: the argument proxy still reports what was touched.
    expect(result.trace?.events.some((e) => e.kind === 'array_read')).toBe(true);
    expect(result.trace?.events.some((e) => e.kind === 'line')).toBe(false);
  });

  it('leaves the single-file path untouched', async () => {
    // Every problem and every lesson exercise runs through this branch, so
    // multi-file support must be strictly additive.
    const source =
      language === 'javascript'
        ? `function run(n) {\n  let t = 0;\n  for (let i = 0; i < n; i++) t += i;\n  return t;\n}`
        : `def run(n):\n    t = 0\n    for i in range(n):\n        t += i\n    return t\n`;

    const result = await runTestSpec({
      spec: spec([{ args: [4], expected: 6, hidden: false }]),
      source,
      language,
      trace: true,
    });

    expect(result.passed).toBe(true);
    // Undegraded, with real line numbers — the property the visualizer needs.
    expect(result.traceDegraded).toBe(false);
    expect(result.trace?.events.some((e) => e.kind === 'line')).toBe(true);
  });
});

describe('javascript module registry', () => {
  const helper = `function double(n) { return n * 2; }\nmodule.exports = { double };`;

  it.each(['./helper', 'helper', './helper.js'])(
    'resolves require(%o) to the same module',
    async (path) => {
      // A learner should not lose a run to an import spelling.
      const result = await runTestSpec({
        spec: spec([{ args: [4], expected: 8, hidden: false }]),
        source: `const { double } = require(${JSON.stringify(path)});\nfunction run(n) { return double(n); }\nmodule.exports = { run };`,
        entryModule: 'harness',
        modules: [{ name: 'helper', source: helper }],
        language: 'javascript',
      });

      expect(result.cases[0].error).toBeUndefined();
      expect(result.passed).toBe(true);
    },
  );

  it('names the files in the workspace when a module is missing', async () => {
    const result = await runTestSpec({
      spec: spec([{ args: [1], expected: 1, hidden: false }]),
      source: `const x = require('./nope');\nfunction run(n) { return n; }\nmodule.exports = { run };`,
      entryModule: 'harness',
      modules: [{ name: 'helper', source: helper }],
      language: 'javascript',
    });

    expect(result.cases[0].error).toMatch(/Cannot find module/);
    // The list is the useful half: a typo is only obvious next to the real name.
    expect(result.cases[0].error).toMatch(/helper/);
  });

  it('lets a sibling import the entry module back', async () => {
    // The registry holds the entry alongside its siblings rather than leaving it
    // at the top level, which is what makes this work at all.
    const result = await runTestSpec({
      spec: spec([{ args: [], expected: 'ok', hidden: false }]),
      source: `const { ask } = require('./helper');\nfunction answer() { return 'ok'; }\nfunction run() { return ask(); }\nmodule.exports = { run, answer };`,
      entryModule: 'harness',
      modules: [
        {
          name: 'helper',
          source: `function ask() { return require('./harness').answer(); }\nmodule.exports = { ask };`,
        },
      ],
      language: 'javascript',
    });

    expect(result.cases[0].error).toBeUndefined();
    expect(result.passed).toBe(true);
  });

  it('reports a missing export by name rather than as "not a function"', async () => {
    const result = await runTestSpec({
      spec: spec([{ args: [1], expected: 1, hidden: false }]),
      source: `function run(n) { return n; }\n// no module.exports`,
      entryModule: 'harness',
      modules: [{ name: 'helper', source: helper }],
      language: 'javascript',
    });

    expect(result.cases[0].error).toMatch(/run/);
    expect(result.cases[0].error).toMatch(/exports/);
  });
});

describe('python workspace', () => {
  it('picks up an edited module rather than the previous run‘s copy', async () => {
    // Pyodide is cached for the life of the tab, so a stale `sys.modules` entry
    // would serve a learner their last attempt back and report it as this one.
    const run = (helper: string) =>
      runTestSpec({
        spec: spec([{ args: [4], expected: 8, hidden: false }]),
        source: SOURCES.python.harness.replace('double(n) + 1', 'double(n)'),
        entryModule: 'harness',
        modules: [{ name: 'helper', source: helper }],
        language: 'python',
      });

    const wrong = await run(`def double(n):\n    return n * 3\n`);
    expect(wrong.passed).toBe(false);

    const right = await run(`def double(n):\n    return n * 2\n`);
    expect(right.passed).toBe(true);
  });

  it('says which module was missing a definition', async () => {
    const result = await runTestSpec({
      spec: { entry: 'missing', cases: [{ args: [], expected: 1, hidden: false }] },
      source: `def run():\n    return 1\n`,
      entryModule: 'harness',
      modules: [{ name: 'helper', source: SOURCES.python.helper }],
      language: 'python',
    });

    expect(result.cases[0].error).toMatch(/harness\.py/);
    expect(result.cases[0].error).toMatch(/missing/);
  });
});
