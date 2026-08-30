import { describe, expect, it } from 'vitest';
import { entryPoints, resolveEntry } from '@/lib/runtime/entry-points';
import { SANDBOX_PRESETS } from '@/lib/sandbox-presets';

/**
 * Finding what there is to call (B7).
 *
 * Everywhere else the entry point is named by a test spec. The sandbox has no
 * spec, so this is the only thing standing between "run it" and running the
 * wrong function — which would animate a helper and look like the visualizer
 * being broken.
 */

describe('javascript', () => {
  it('finds top-level function declarations in source order', () => {
    expect(
      entryPoints('function helper(a) { return a; }\nfunction solve(n) { return helper(n); }', 'javascript'),
    ).toEqual(['helper', 'solve']);
  });

  it('finds function and arrow expressions bound to a name', () => {
    // Half of JavaScript is written this way; treating only declarations as
    // entry points would leave that half with an empty picker.
    expect(
      entryPoints('const solve = (n) => n * 2;\nconst other = function (n) { return n; };', 'javascript'),
    ).toEqual(['solve', 'other']);
  });

  it('ignores nested functions, which cannot be called by name', () => {
    const source = `function outer(n) {
  function inner(m) { return m; }
  const also = () => n;
  return inner(n) + also();
}`;
    expect(entryPoints(source, 'javascript')).toEqual(['outer']);
  });

  it('ignores a name bound to something that is not a function', () => {
    expect(entryPoints('const total = 3;\nfunction solve() {}', 'javascript')).toEqual(['solve']);
  });

  it('keeps finding declarations while the source does not parse', () => {
    // Half-written code is the normal state of a sandbox. An empty picker
    // mid-keystroke would make the control flicker as someone typed.
    const broken = 'function solve(n) { return n * ';
    expect(entryPoints(broken, 'javascript')).toEqual(['solve']);
  });

  it('returns nothing for source with no functions at all', () => {
    expect(entryPoints('const x = 1;', 'javascript')).toEqual([]);
    expect(entryPoints('', 'javascript')).toEqual([]);
  });

  it('lists a redefined name once', () => {
    expect(entryPoints('function f() {}\nfunction f() {}', 'javascript')).toEqual(['f']);
  });
});

describe('python', () => {
  it('finds top-level defs in source order', () => {
    expect(entryPoints('def helper(a):\n    return a\n\n\ndef solve(n):\n    return helper(n)\n', 'python')).toEqual(
      ['helper', 'solve'],
    );
  });

  it('ignores an indented def, which is a method or a closure', () => {
    // Anchored to column zero deliberately: `self.method` is not callable by
    // name from the runner, so offering it would guarantee a failed run.
    const source = `class Thing:
    def method(self):
        return 1


def solve():
    return Thing().method()
`;
    expect(entryPoints(source, 'python')).toEqual(['solve']);
  });

  it('returns nothing when there is nothing to call', () => {
    expect(entryPoints('x = 1\n', 'python')).toEqual([]);
  });
});

describe('resolveEntry', () => {
  it('keeps the learner’s choice while it still exists', () => {
    // Otherwise the selection jumps as they type, which is worse than useless.
    expect(resolveEntry(['a', 'b'], 'a')).toBe('a');
  });

  it('falls back to the last declared function when the choice is gone', () => {
    // Last rather than first: a scratchpad is usually written helpers-first.
    expect(resolveEntry(['helper', 'solve'], 'renamed')).toBe('solve');
    expect(resolveEntry(['helper', 'solve'], null)).toBe('solve');
  });

  it('reports nothing to run rather than an empty name', () => {
    expect(resolveEntry([], 'solve')).toBeNull();
  });
});

describe('the presets', () => {
  it.each(SANDBOX_PRESETS.map((p) => [p.id, p] as const))(
    '%s declares an entry the detector actually finds, in both languages',
    (_id, preset) => {
      // A preset whose entry cannot be found loads into a sandbox that refuses
      // to run — the worst possible first impression for the page.
      for (const language of ['javascript', 'python'] as const) {
        expect(entryPoints(preset.source[language], language)).toContain(preset.entry);
      }
    },
  );

  it('gives every preset a JSON-serialisable argument list', () => {
    for (const preset of SANDBOX_PRESETS) {
      expect(Array.isArray(preset.args)).toBe(true);
      expect(() => JSON.parse(JSON.stringify(preset.args))).not.toThrow();
    }
  });
});
