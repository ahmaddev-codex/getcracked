import { describe, expect, it } from 'vitest';
import { RAW_LESSONS } from '@/content/registry';
import { entryFor } from '@/content/schema';
import { walkthroughSpec, walkthroughLanguages } from '@/content/walkthrough';

/**
 * The walkthrough's language wiring.
 *
 * Guards a bug that cost a full interpreter download to discover: the page built
 * its spec without `entryByLanguage`, so a Python walkthrough was asked for the
 * JavaScript entry name and failed with `KeyError` only in the browser. The
 * content gate missed it because the gate built its own, correct spec.
 */
describe('walkthrough spec', () => {
  const lessons = RAW_LESSONS.filter((l) => l.walkthrough).map((l) => ({
    slug: l.slug,
    walkthrough: l.walkthrough!,
  }));

  it('covers every lesson that has one', () => {
    expect(lessons.length).toBeGreaterThan(0);
  });

  it.each(lessons)('$slug resolves an entry that exists in each language', ({ walkthrough }) => {
    const spec = walkthroughSpec(walkthrough);

    for (const language of walkthroughLanguages(walkthrough)) {
      const entry = entryFor(spec, language);
      const source = walkthrough.source[language]!;

      // The definition, not merely the name: a Python source mentioning
      // `runningSum` in a comment must not count as defining it.
      const defines =
        language === 'python'
          ? new RegExp(`def\\s+${entry}\\s*\\(`).test(source)
          : new RegExp(`function\\s+${entry}\\s*\\(`).test(source);

      expect(defines, `${language} source does not define ${entry}`).toBe(true);
    }
  });

  it('carries the per-language entry into the spec', () => {
    const spec = walkthroughSpec({
      entry: 'runningSum',
      entryByLanguage: { python: 'running_sum' },
      args: [],
    });

    expect(entryFor(spec, 'python')).toBe('running_sum');
    expect(entryFor(spec, 'javascript')).toBe('runningSum');
  });

  it('offers only languages that have source', () => {
    expect(
      walkthroughLanguages({ source: { javascript: 'x' } }),
    ).toEqual(['javascript']);
  });
});
