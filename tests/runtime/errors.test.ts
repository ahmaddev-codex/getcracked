import { describe, expect, it } from 'vitest';
import { humanizeError, TIMEOUT_MESSAGE } from '@/lib/runtime/errors';

/**
 * Error messages are teaching material, not diagnostics. A beginner shown
 * `at <eval> (eval.js:1:1)` learns nothing, and the line numbers refer to
 * harness code they never wrote.
 */

describe('humanizeError', () => {
  it('passes through undefined so callers need no guard', () => {
    expect(humanizeError(undefined)).toBeUndefined();
  });

  it('strips QuickJS stack frames pointing at code the learner never wrote', () => {
    const raw = 'TypeError: x is not a function\n    at <eval> (eval.js:1:1)\n    at __invoke';
    const out = humanizeError(raw)!;

    expect(out).not.toMatch(/eval\.js/);
    expect(out).not.toMatch(/__invoke/);
    expect(out).toMatch(/is not a function/);
  });

  it('explains an undefined variable', () => {
    expect(humanizeError('ReferenceError: total is not defined')).toMatch(/typo|declaration/i);
  });

  it('explains reading a property of undefined, the classic off-by-one', () => {
    const out = humanizeError("TypeError: Cannot read properties of undefined (reading 'x')")!;
    expect(out).toMatch(/index past the end/i);
  });

  it('explains a temporal dead zone error in the learner’s own terms', () => {
    expect(humanizeError("ReferenceError: Cannot access 'x' before initialization")).toMatch(
      /above the line that declares it/i,
    );
  });

  it('explains runaway recursion', () => {
    expect(humanizeError('RangeError: Maximum call stack size exceeded')).toMatch(/base case/i);
  });

  it('leaves an unrecognised error intact rather than guessing', () => {
    // A wrong explanation is worse than none — it sends the learner the wrong way.
    expect(humanizeError('SomethingWeird: no idea')).toBe('SomethingWeird: no idea');
  });

  it('never returns an empty string when there was a message', () => {
    // Stripping every line would otherwise leave a blank error panel.
    expect(humanizeError('    at <eval> (eval.js:1:1)')).toBeTruthy();
  });

  it('names the likely cause for a timeout instead of just saying it stopped', () => {
    expect(TIMEOUT_MESSAGE).toMatch(/never becomes false/i);
  });
});
