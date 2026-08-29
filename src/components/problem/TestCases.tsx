import { Node } from '@/components/ui/Node';
import { humanizeError } from '@/lib/runtime/errors';
import type { TestSpec } from '@/content/schema';
import type { CaseResult, SpecResult } from '@/content/test-runner';

/**
 * The cases a submission is judged against, and how it did (A7).
 *
 * Deliberately one table rather than a list before the run and a separate
 * results block after it. Two views of the same five cases means a learner
 * reading a failure has to look in one place for the inputs and another for the
 * outcome, and the pass count ends up stated twice.
 *
 * Shown *before* running, because the inputs are part of the problem statement.
 * Hiding them turns a solvable exercise into a riddle about what the grader
 * wants.
 *
 * Hidden cases stay in the same table with their inputs withheld, so a learner
 * reading the page is not tempted to fit a solution to them.
 *
 * **They are hidden, not secret, and the distinction is architectural.** Tests
 * execute in the learner's own browser (AD-2), so the full spec — hidden cases
 * included — necessarily reaches the client and is visible in devtools. Making
 * them genuinely secret would mean running tests on a server, which is the cost
 * model §2.6 exists to avoid. This is spoiler friction, and the copy below says
 * so rather than implying a guarantee that does not hold.
 */

function formatCall(entry: string, args: unknown[]): string {
  return `${entry}(${args.map((a) => JSON.stringify(a)).join(', ')})`;
}

function formatValue(value: unknown): string {
  return value === undefined ? 'undefined' : JSON.stringify(value);
}

const WITHHELD = <span className="text-foreground-muted">withheld</span>;

function ResultCell({ outcome }: { outcome: CaseResult | undefined }) {
  if (!outcome) return <span className="text-foreground-muted">—</span>;
  if (outcome.passed) return <span>✓ pass</span>;

  const error = humanizeError(outcome.error);
  if (error) return <span className="text-danger">✗ {error}</span>;

  return (
    <span className="text-danger">
      ✗ {outcome.hidden ? 'fail' : formatValue(outcome.actual)}
    </span>
  );
}

export function TestCases({ spec, result }: { spec: TestSpec; result?: SpecResult | null }) {
  const hiddenCount = spec.cases.filter((c) => c.hidden).length;
  const passedCount = result?.cases.filter((c) => c.passed).length ?? 0;

  return (
    <section className="flex flex-col gap-3" aria-live="polite">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="text-sm font-semibold">
          {result ? (result.passed ? 'All tests passed' : 'Tests failed') : 'Tests'}
        </h2>
        <span className="text-xs text-foreground-muted">
          {result
            ? `${passedCount} of ${spec.cases.length} passing`
            : `${spec.cases.length} ${spec.cases.length === 1 ? 'case' : 'cases'}`}
          {hiddenCount > 0 && `, ${hiddenCount} hidden`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="text-foreground-muted">
              <th scope="col" className="pb-2 pr-4 font-normal">call</th>
              <th scope="col" className="pb-2 pr-4 font-normal">type</th>
              <th scope="col" className="pb-2 pr-4 font-normal">expected</th>
              <th scope="col" className="pb-2 font-normal">result</th>
            </tr>
          </thead>
          <tbody>
            {spec.cases.map((testCase, i) => {
              const outcome = result?.cases[i];
              return (
                <tr key={i} className="border-t border-border-subtle align-top">
                  <td className="py-2 pr-4">
                    {testCase.hidden ? WITHHELD : formatCall(spec.entry, testCase.args)}
                  </td>
                  <td className="py-2 pr-4 text-foreground-muted">
                    {testCase.hidden ? 'hidden' : (testCase.name ?? 'visible')}
                  </td>
                  <td className="py-2 pr-4">
                    {testCase.hidden ? WITHHELD : formatValue(testCase.expected)}
                  </td>
                  <td className="py-2">
                    <ResultCell outcome={outcome} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {result?.timedOut && (
        <Node tone="surface" className="p-3 text-sm">
          Execution stopped early, so the remaining cases were not run.
        </Node>
      )}

      {hiddenCount > 0 && (
        <p className="text-xs text-foreground-muted">
          Hidden cases run too — their inputs aren&apos;t listed here, so aim for a general
          solution rather than one fitted to the cases above.
        </p>
      )}
    </section>
  );
}
