import { Node } from '@/components/ui/Node';
import type { RuntimeMetrics } from '@/lib/runtime/measure';

/**
 * Complexity and measured cost (PRD B4).
 *
 * Two different kinds of claim, kept visibly separate because conflating them
 * would teach the wrong thing:
 *
 * - **Target** is asymptotic and comes from the problem author. Big-O is a
 *   statement about growth; no single execution can establish it, so a tool
 *   that printed "O(n²)" after running one 5-element input would be guessing
 *   and a learner would have no way to know.
 * - **Measured** is what actually happened on the largest test case: statements
 *   executed, array slots touched, elapsed time, interpreter memory.
 *
 * The measured numbers are what make the target concrete — a learner who sees
 * 100 array reads for 100 elements has seen linearity, rather than been told it.
 */

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs text-foreground-muted">{label}</dt>
      <dd className="font-mono text-sm">{value}</dd>
    </div>
  );
}

export function Complexity({
  target,
  metrics,
  inputSize,
}: {
  target?: { time: string; space: string; note?: string };
  metrics: RuntimeMetrics | null;
  /** Elements in the largest test input, so counts can be read against it. */
  inputSize?: number;
}) {
  if (!target && !metrics) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">Complexity</h2>

      {target && (
        <Node tone="accent" className="p-3">
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            <Stat label="target time" value={target.time} />
            <Stat label="target space" value={target.space} />
          </dl>
          {target.note && <p className="mt-2 text-xs">{target.note}</p>}
        </Node>
      )}

      {metrics && (
        <Node tone="surface" className="p-3">
          <p className="mb-2 text-xs text-foreground-muted">
            Measured on the largest test case
            {inputSize !== undefined && ` (${inputSize} elements)`} — one run, not a proof.
          </p>
          <dl className="flex flex-wrap gap-x-8 gap-y-2">
            <Stat label="statements run" value={metrics.steps.toLocaleString()} />
            <Stat label="array reads" value={metrics.arrayReads.toLocaleString()} />
            <Stat label="array writes" value={metrics.arrayWrites.toLocaleString()} />
            <Stat label="time" value={`${metrics.elapsedMs.toFixed(2)} ms`} />
            {metrics.memoryBytes !== null && (
              <Stat label="interpreter memory" value={formatBytes(metrics.memoryBytes)} />
            )}
          </dl>
        </Node>
      )}
    </section>
  );
}
