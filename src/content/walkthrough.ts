import type { Language, Lesson, TestSpec } from './schema';

/**
 * The spec a walkthrough runs under, built in one place.
 *
 * This exists because of a bug it now prevents. The lesson page and the content
 * gate each constructed this object themselves, and they disagreed: the gate
 * passed `entryByLanguage`, the page did not. So the gate verified a Python
 * walkthrough that ran correctly, while the page asked Pyodide for the
 * JavaScript name and died with `KeyError: 'runningSum'` — after downloading the
 * entire interpreter.
 *
 * Neither side was individually wrong; the gap between them was. Sharing the
 * construction means the gate now checks what the page actually runs.
 */
export type LessonWalkthrough = NonNullable<Lesson['walkthrough']>;

/**
 * Typed on the fields each helper actually reads, rather than on the whole
 * walkthrough. `visual` has a schema default, so the parsed type requires it
 * while every hand-written literal — tests, and the component's own call — does
 * not have one to give. Asking callers for a field the function ignores would be
 * noise that invites a wrong value.
 */
type SpecFields = Pick<LessonWalkthrough, 'entry' | 'args'> &
  Partial<Pick<LessonWalkthrough, 'entryByLanguage'>>;

export function walkthroughSpec(walkthrough: SpecFields): TestSpec {
  return {
    entry: walkthrough.entry,
    entryByLanguage: walkthrough.entryByLanguage,
    cases: [{ args: walkthrough.args, expected: null, hidden: false }],
  };
}

/** Languages a walkthrough can actually be run in. */
export function walkthroughLanguages(
  walkthrough: Pick<LessonWalkthrough, 'source'>,
): Language[] {
  return (Object.keys(walkthrough.source) as Language[]).filter((l) => walkthrough.source[l]);
}
