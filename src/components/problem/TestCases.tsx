import { Node } from '@/components/ui/Node';
import type { TestSpec } from '@/content/schema';
import type { SpecResult } from '@/content/test-runner';

/**
 * The cases a submission will be judged against (A7).
 *
 * Shown *before* running, not only in the results. A learner who cannot see
 * what they are being graded on is guessing at the spec, and the inputs are
 * part of the problem statement — hiding them turns a solvable exercise into a
 * riddle about what the grader wants.
 *
 * Hidden cases are the deliberate exception. Their existence and count are
 * shown, their inputs are not: they are what stops the visible set from being
 * pattern-matched.
 */
function formatCall(entry: string, args: unknown[]): string {
  return `${entry}(${args.map((a) => JSON.stringify(a)).join(', ')})`;
}

export function TestCases({ spec, result }: { spec: TestSpec; result?: SpecResult | null }) {
  const visible = spec.cases.filter((c) => !c.hidden);
  const hiddenCount = spec.cases.length - visible.length;

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold">Tests</h2>
        <span className="text-xs text-foreground-muted">
          {spec.cases.length} {spec.cases.length === 1 ? 'case' : 'cases'}
          {hiddenCount > 0 && `, ${hiddenCount} hidden`}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left font-mono text-xs">
          <thead>
            <tr className="text-foreground-muted">
              <th className="pb-2 pr-4 font-normal">call</th>
              <th className="pb-2 pr-4 font-normal">expected</th>
              <th className="pb-2 font-normal">result</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((testCase, i) => {
              // Results align with the spec's own order.
              const outcome = result?.cases[spec.cases.indexOf(testCase)];
              return (
                <tr key={i} className="border-t border-border-subtle align-top">
                  <td className="py-2 pr-4">{formatCall(spec.entry, testCase.args)}</td>
                  <td className="py-2 pr-4">{JSON.stringify(testCase.expected)}</td>
                  <td className="py-2">
                    {!outcome ? (
                      <span className="text-foreground-muted">—</span>
                    ) : outcome.passed ? (
                      <span>✓ pass</span>
                    ) : (
                      <span className="text-danger">
                        ✗ {outcome.actual === undefined ? 'undefined' : JSON.stringify(outcome.actual)}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hiddenCount > 0 && (
        <Node tone="muted" className="p-3 text-xs text-foreground-muted">
          {hiddenCount} hidden {hiddenCount === 1 ? 'case runs' : 'cases run'} too. Their inputs
          are withheld so a solution has to be general rather than fitted to the visible cases.
        </Node>
      )}
    </section>
  );
}
