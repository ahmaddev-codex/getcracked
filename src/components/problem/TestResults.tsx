import { Node } from '@/components/ui/Node';
import { humanizeError } from '@/lib/runtime/errors';
import type { CaseResult, SpecResult } from '@/content/test-runner';

/**
 * Per-case pass/fail with expected-vs-actual (A7).
 *
 * A bare "3 of 5 failed" tells a learner nothing they can act on, so each case
 * shows the inputs it ran with and what it got back. Hidden cases report
 * pass/fail but withhold their inputs — they exist so the visible set cannot be
 * pattern-matched, and printing them would defeat that.
 */

function formatValue(value: unknown): string {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}

function CaseRow({ result }: { result: CaseResult }) {
  const error = humanizeError(result.error);

  return (
    <Node tone={result.passed ? 'muted' : 'surface'} className="p-3">
      <div className="flex items-baseline gap-2">
        <span aria-hidden className="text-sm">
          {result.passed ? '✓' : '✗'}
        </span>
        <span className="text-sm font-medium">
          {result.hidden ? 'Hidden case' : result.name}
        </span>
        <span className="sr-only">{result.passed ? 'passed' : 'failed'}</span>
      </div>

      {!result.passed && !result.hidden && (
        <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs">
          <dt className="text-foreground-muted">expected</dt>
          <dd className="overflow-x-auto">{formatValue(result.expected)}</dd>
          <dt className="text-foreground-muted">received</dt>
          <dd className="overflow-x-auto">{formatValue(result.actual)}</dd>
        </dl>
      )}

      {!result.passed && result.hidden && (
        <p className="mt-1 text-xs text-foreground-muted">
          Inputs are withheld so the visible cases can&apos;t be gamed.
        </p>
      )}

      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </Node>
  );
}

export function TestResults({ result }: { result: SpecResult }) {
  const passedCount = result.cases.filter((c) => c.passed).length;

  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <div className="flex items-baseline gap-2">
        <h2 className="text-sm font-semibold">
          {result.passed ? 'All tests passed' : 'Tests failed'}
        </h2>
        <span className="text-xs text-foreground-muted">
          {passedCount} of {result.cases.length} passing
        </span>
      </div>

      {result.timedOut && (
        <Node tone="surface" className="p-3 text-sm">
          Execution stopped early, so the remaining cases were not run.
        </Node>
      )}

      {result.cases.map((c, i) => (
        <CaseRow key={i} result={c} />
      ))}
    </section>
  );
}
