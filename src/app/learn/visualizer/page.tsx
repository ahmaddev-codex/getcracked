import Link from 'next/link';
import { Page } from '@/components/ui/Page';
import { Node } from '@/components/ui/Node';
import { DataStructureWorkbench } from '@/components/visualizer/DataStructureWorkbench';

export const metadata = {
  title: 'Data Structure Visualizer — Stepwise Operations — GetCracked',
  description:
    'Explore and perform stepwise operations across all data structures — from arrays and linked lists to binary trees, heaps, and hash maps with live animation.',
};

export default function VisualizerPage() {
  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">
          Data Structure Visualizer
        </h1>
        <p className="max-w-3xl text-sm text-foreground-muted leading-relaxed">
          Step through fundamental to advanced operations across all data structures.
          Watch push, pop, shift, pointer reversals, tree descents, heap sift-downs, and hash bucket
          chaining animate in real time with line-by-line explanations and Big-O complexity notes.
        </p>
      </header>

      <DataStructureWorkbench />

      <Node tone="muted" className="p-4 text-sm text-foreground-muted">
        Ready to solve algorithmic problems with these data structures? Head to{' '}
        <Link href="/problems" className="text-link underline underline-offset-2 font-medium">
          Practice Problems
        </Link>{' '}
        or explore the animated curriculum on the{' '}
        <Link href="/learn/dsa" className="text-link underline underline-offset-2 font-medium">
          DSA Roadmap
        </Link>.
      </Node>
    </Page>
  );
}
