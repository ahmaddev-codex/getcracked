'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Node } from '@/components/ui/Node';
import { Visualizer } from '@/components/visualizer/Visualizer';
import { RuntimeClient } from '@/lib/runtime/client';
import type { Trace } from '@/lib/trace/protocol';
import type { Language } from '@/content/schema';

/**
 * The animated walkthrough slot (B10b), filled by T2.8.
 *
 * Runs a reference implementation through the *same* runtime and the same trace
 * protocol a learner's own code uses, rather than replaying a recording. That is
 * the difference the PRD's G1 rests on: what a learner sees in the lesson is the
 * same machinery that will animate their own attempt a minute later.
 *
 * Run on demand rather than on mount — it costs a sandboxed execution, and a
 * lesson page should not pay for one nobody watches.
 */
export function Walkthrough({
  entry,
  source,
  args,
  caption,
  language = 'javascript',
}: {
  entry: string;
  source: string;
  args: unknown[];
  caption?: string;
  language?: Language;
}) {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [running, setRunning] = useState(false);
  const runtime = useRef<RuntimeClient | null>(null);

  useEffect(() => {
    const client = new RuntimeClient();
    runtime.current = client;
    return () => {
      client.dispose();
      runtime.current = null;
    };
  }, []);

  const run = useCallback(async () => {
    if (running || !runtime.current) return;
    setRunning(true);
    try {
      const result = await runtime.current.run({
        spec: { entry, cases: [{ args, expected: null, hidden: false }] },
        source,
        language,
        trace: true,
      });
      setTrace(result.trace);
    } catch {
      // The lesson still reads without it; failing loudly here would put an
      // error banner in the middle of an explanation.
    } finally {
      setRunning(false);
    }
  }, [entry, source, args, language, running]);

  if (trace) return <Visualizer trace={trace} source={source} />;

  return (
    <Node tone="muted" className="flex flex-wrap items-center justify-between gap-3 p-4">
      <p className="text-sm text-foreground-muted">
        {caption ?? 'Step through this pattern one operation at a time.'}
      </p>
      <Button onClick={run} disabled={running}>
        {running ? 'Preparing…' : 'Run the walkthrough'}
      </Button>
    </Node>
  );
}
