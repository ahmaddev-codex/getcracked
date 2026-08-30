import Link from 'next/link';
import { Node } from '@/components/ui/Node';
import { Page } from '@/components/ui/Page';
import { Sandbox } from '@/components/sandbox/Sandbox';

/**
 * The free-play sandbox (B7).
 *
 * **Public**, like every learning surface (§2.6) — and unusually literally so:
 * nothing here touches an account at all, because there is nothing to record.
 *
 * `reading` rather than `canvas`: it is a single column of editor, controls and
 * animation, with no second column and no graph. The visualizer scrolls inside
 * its own container when a structure is wider than the measure, which is what
 * that container is for.
 */
export const metadata = {
  title: 'Sandbox — GetCracked',
  description:
    'Write any function, run it on any input, and watch your own code animate. No account, no grading.',
};

export default function SandboxPage() {
  return (
    <Page width="reading">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Sandbox</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          Your code, your input, animated. Nothing is graded and nothing is recorded —
          this is the visualizer with the curriculum taken off.
        </p>
      </header>

      <Sandbox />

      <Node tone="muted" className="p-4 text-sm text-foreground-muted">
        Looking for something to work on instead? The{' '}
        <Link href="/problems" className="text-link underline underline-offset-2">
          problem sets
        </Link>{' '}
        grade what you write, the{' '}
        <Link href="/learn/dsa" className="text-link underline underline-offset-2">
          lessons
        </Link>{' '}
        walk a worked example through this same animation, and the{' '}
        <Link href="/challenges" className="text-link underline underline-offset-2">
          builds
        </Link>{' '}
        assemble a real thing across several files.
      </Node>
    </Page>
  );
}
