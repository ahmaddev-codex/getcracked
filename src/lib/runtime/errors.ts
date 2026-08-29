/**
 * Turns runtime errors into something a learner can act on.
 *
 * QuickJS reports errors with its own stack frames and internal file names —
 * `eval.js`, harness line numbers, the instrumentation wrapper. Showing that raw
 * teaches a beginner nothing and actively misleads them, because the line
 * numbers refer to code they did not write.
 *
 * This keeps the message, drops the machinery, and adds a nudge where the error
 * has a common cause.
 */

interface Explanation {
  /** Matches the raw error text. */
  match: RegExp;
  /** Appended after the original message. */
  nudge: string;
}

const EXPLANATIONS: Explanation[] = [
  {
    match: /is not a function/i,
    nudge: 'Check the spelling, and that the value is what you expect at that point.',
  },
  {
    match: /is not defined/i,
    nudge: 'That name has not been declared — check for a typo or a missing declaration.',
  },
  {
    match: /Cannot read propert(y|ies).*of (undefined|null)/i,
    nudge: 'Something is undefined before you use it. An index past the end of an array is a common cause.',
  },
  {
    match: /before initialization/i,
    nudge: 'A `let` or `const` is being used above the line that declares it.',
  },
  {
    match: /Maximum call stack/i,
    nudge: 'Runaway recursion — check that your base case is reachable.',
  },
  {
    match: /unexpected token|expecting/i,
    nudge: 'A syntax error — often a missing bracket, brace, or comma.',
  },
];

/** Strips QuickJS's internal frames, which point at code the learner never wrote. */
function stripInternalFrames(raw: string): string {
  return raw
    .split('\n')
    .filter((line) => !/^\s*at\s/.test(line))
    .filter((line) => !/eval\.js|__t\(|__invoke|__wrapArr/.test(line))
    .join('\n')
    .trim();
}

export function humanizeError(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  const message = stripInternalFrames(raw) || raw.trim();
  const explanation = EXPLANATIONS.find((e) => e.match.test(message));

  return explanation ? `${message} — ${explanation.nudge}` : message;
}

/** Shown when execution was cut off rather than failing. */
export const TIMEOUT_MESSAGE =
  'Your code ran too long and was stopped. Check for a loop whose condition never becomes false.';
