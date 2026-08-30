import {
  exerciseId,
  LANGUAGES,
  type Challenge,
  type ChallengeFile,
  type ChallengeStep,
  type Language,
} from './schema';

/**
 * Resolving a build challenge's workspace (tier 3).
 *
 * A challenge is one workspace of several files carried across four to six
 * steps. What a learner sees at step 3 is not written down anywhere — it is
 * *resolved*: their own work where they have written some, the author's build
 * where they have not, and the step's fresh scaffolding where the step
 * introduces a new file.
 *
 * That resolution is the whole of the tier-3 content model, so it lives in one
 * pure module with no React and no storage in it. The UI, the content gate, and
 * the tests all resolve the same way, which is what stops a learner passing a
 * step the gate never actually verified.
 */

/** One module name, one extension per language. */
const FILE_EXTENSIONS: Record<Language, string> = {
  javascript: 'js',
  python: 'py',
};

export function fileNameFor(name: string, language: Language): string {
  return `${name}.${FILE_EXTENSIONS[language]}`;
}

/** The file holding the step's test entry. Defaults to the first listed. */
export function entryFileFor(step: ChallengeStep): string {
  return step.entryFile ?? step.files[0].name;
}

/**
 * Newest declaration of a carried property, at or before `stepIndex`.
 *
 * Editability and the tab label carry forward the same way the content does, so
 * an author states them once. Restating `editable: false` on every step works
 * until the one step that forgets — and that is the step where a learner could
 * edit the harness the tests run them through.
 */
function carriedFlag<K extends 'editable' | 'label'>(
  challenge: Challenge,
  stepIndex: number,
  name: string,
  field: K,
): ChallengeFile[K] {
  for (let i = stepIndex; i >= 0; i--) {
    const declared = challenge.steps[i]?.files.find((f) => f.name === name);
    if (declared?.[field] !== undefined) return declared[field];
  }
  return undefined;
}

/** Whether a learner may write to this file at this step. Absent means yes. */
export function fileEditable(
  challenge: Challenge,
  stepIndex: number,
  name: string,
): boolean {
  return carriedFlag(challenge, stepIndex, name, 'editable') ?? true;
}

/**
 * The file the editor opens on: the step's own focus, else its first editable
 * file.
 *
 * Takes the challenge rather than the step alone, because editability is
 * carried across steps — reading `file.editable` off one step's entry would
 * treat a bare `{ name: 'harness' }` as writable and open the editor on
 * scaffolding.
 */
export function focusFileFor(challenge: Challenge, stepIndex: number): string {
  const step = challenge.steps[stepIndex];
  if (step.focus) return step.focus;
  const editable = step.files.find((f) => fileEditable(challenge, stepIndex, f.name));
  return (editable ?? step.files[0]).name;
}

export interface ResolvedFile {
  /** Module identifier, extension-free. */
  name: string;
  /** Tab label. */
  label: string;
  /** `store.js` — what the tab and any import statement actually say. */
  fileName: string;
  editable: boolean;
  /**
   * What the editor seeds with when the learner has no draft.
   *
   * For a carried file this is the author's build from the *previous* step, not
   * this one — handing over the answer to the step in progress would make the
   * step pointless.
   */
  starter: string;
  /** The author's build of this file as of this step. Used by the content gate. */
  reference: string;
}

export class ChallengeResolutionError extends Error {}

/**
 * Every file in the step's workspace, with its starter and reference contents.
 *
 * Resolution walks backwards through the steps, which is what lets an author
 * list a carried file as one line (`{ name: 'harness' }`) instead of restating
 * its whole body on every step. The rules, stated once:
 *
 * - **reference** — this step's `solution`, else the newest `solution` from an
 *   earlier step, else the newest `starterCode` from this step or an earlier
 *   one. The last case is how read-only scaffolding resolves: it has no
 *   solution because there is nothing to solve.
 * - **starter** — this step's `starterCode`, else the newest `solution` from an
 *   *earlier* step, else the newest earlier `starterCode`.
 *
 * The two differ by exactly one step, and that offset is the model: what you are
 * handed is the build up to here; what the author would write is the build
 * including here.
 *
 * @throws ChallengeResolutionError when a file has no content in this language
 * at all — a mistake the content gate turns into a build failure rather than an
 * empty editor.
 */
export function resolveStepFiles(
  challenge: Challenge,
  stepIndex: number,
  language: Language,
): ResolvedFile[] {
  const step = challenge.steps[stepIndex];
  if (!step) {
    throw new ChallengeResolutionError(
      `${challenge.slug}: no step at index ${stepIndex}`,
    );
  }

  return step.files.map((file) => {
    /** Newest declared value for this file at or before `limit`. */
    const newest = (
      field: 'solution' | 'starterCode',
      limit: number,
    ): string | undefined => {
      for (let i = limit; i >= 0; i--) {
        const declared = challenge.steps[i]?.files.find((f) => f.name === file.name);
        const value = declared?.[field]?.[language];
        if (value) return value;
      }
      return undefined;
    };

    const reference =
      file.solution?.[language] ??
      newest('solution', stepIndex - 1) ??
      newest('starterCode', stepIndex);

    const starter =
      file.starterCode?.[language] ??
      newest('solution', stepIndex - 1) ??
      newest('starterCode', stepIndex - 1);

    if (!starter || !reference) {
      throw new ChallengeResolutionError(
        `${challenge.slug}/${step.slug}: file "${file.name}" has no ${
          starter ? 'reference' : 'starter'
        } content in ${language}. Declare starterCode or solution on this step or an earlier one.`,
      );
    }

    return {
      name: file.name,
      label: carriedFlag(challenge, stepIndex, file.name, 'label') ??
        fileNameFor(file.name, language),
      fileName: fileNameFor(file.name, language),
      editable: fileEditable(challenge, stepIndex, file.name),
      starter,
      reference,
    };
  });
}

/**
 * Languages the whole build is authored in.
 *
 * Stricter than "does it resolve", and deliberately. Carry-forward means a step
 * that adds nothing in Python still *resolves* in Python — by handing back the
 * previous step's code — so resolution alone would report a half-translated
 * build as bilingual and offer a switcher into a step that asks for nothing.
 *
 * So a language counts only when every piece of content the author declared is
 * declared in that language too. Translating a build is all of it or none of it.
 */
export function challengeLanguages(challenge: Challenge): Language[] {
  return LANGUAGES.filter((language) =>
    challenge.steps.every((step, i) => {
      const complete = step.files.every(
        (file) =>
          (!file.starterCode || Boolean(file.starterCode[language])) &&
          (!file.solution || Boolean(file.solution[language])),
      );
      if (!complete) return false;

      try {
        resolveStepFiles(challenge, i, language);
        return true;
      } catch {
        return false;
      }
    }),
  );
}

/**
 * The program a step runs, split the way the runtime adapters want it.
 *
 * `source` is the entry module and `modules` is everything else, because that
 * split keeps the single-file path — every problem and every lesson exercise —
 * byte-for-byte what it was. A runner that had to special-case "one module" on
 * every call would be a second execution path in disguise.
 */
export interface ComposedProgram {
  entryModule: string;
  source: string;
  modules: Array<{ name: string; source: string }>;
}

export function composeProgram(
  files: readonly { name: string }[],
  entryFile: string,
  contentsByName: Readonly<Record<string, string>>,
): ComposedProgram {
  const entry = contentsByName[entryFile];
  if (entry === undefined) {
    throw new ChallengeResolutionError(
      `Entry file "${entryFile}" is not part of this step's workspace.`,
    );
  }

  return {
    entryModule: entryFile,
    source: entry,
    modules: files
      .filter((f) => f.name !== entryFile)
      .map((f) => ({ name: f.name, source: contentsByName[f.name] })),
  };
}

/** The author's own build of a step, ready to run. Used by the content gate. */
export function referenceProgram(
  challenge: Challenge,
  stepIndex: number,
  language: Language,
): ComposedProgram {
  const files = resolveStepFiles(challenge, stepIndex, language);
  return composeProgram(
    files,
    entryFileFor(challenge.steps[stepIndex]),
    Object.fromEntries(files.map((f) => [f.name, f.reference])),
  );
}

/**
 * What a learner is handed at a step, ready to run.
 *
 * The gate runs this too, and requires it to *fail*: a step whose starting
 * workspace already passes its own spec teaches nothing, and at Module J's
 * eventual volume that is an easy mistake to generate by the hundred.
 */
export function starterProgram(
  challenge: Challenge,
  stepIndex: number,
  language: Language,
): ComposedProgram {
  const files = resolveStepFiles(challenge, stepIndex, language);
  return composeProgram(
    files,
    entryFileFor(challenge.steps[stepIndex]),
    Object.fromEntries(files.map((f) => [f.name, f.starter])),
  );
}

/** Stable progress id for one step. Same addressing a lesson exercise uses. */
export function stepId(challenge: Challenge, step: ChallengeStep): string {
  return exerciseId(challenge, step.slug);
}

export function stepIds(challenge: Challenge): string[] {
  return challenge.steps.map((s) => stepId(challenge, s));
}
