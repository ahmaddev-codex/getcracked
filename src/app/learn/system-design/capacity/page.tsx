import Link from 'next/link';
import { CapacityCalculator } from '@/components/system-design/CapacityCalculator';

/**
 * The capacity calculator (C3), the first System Design lab.
 *
 * Its own route rather than a widget inside a lesson: back-of-the-envelope
 * estimation is a technique used *against* a question, not a section of one, and
 * a learner mid-interview-prep wants to reach it directly.
 */
export const metadata = {
  title: 'Capacity calculator — GetCracked',
  description:
    'Size a system out loud: QPS, peak, storage and bandwidth, with the arithmetic shown. Free, no account needed.',
};

export default function CapacityPage() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <p className="text-xs text-foreground-muted">
          <Link href="/learn/system-design" className="text-link underline underline-offset-2">
            ← System Design
          </Link>
        </p>
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">
          Capacity calculator
        </h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          Every design question starts with a number: how much traffic, how much storage, how
          much bandwidth. Change an assumption and watch what it costs — the arithmetic is shown
          beside each figure, because reproducing it on a whiteboard is the actual skill.
        </p>
      </header>

      <CapacityCalculator />

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold">Getting it wrong in the usual ways</h2>
        <ul className="flex list-disc flex-col gap-1 pl-5 text-sm text-foreground-muted">
          <li>
            Sizing the fleet against the daily average. Traffic is never flat, and a system
            planned on the average falls over every evening.
          </li>
          <li>
            Forgetting replication. Three replicas is three times the storage bill, and it is the
            single most common way an estimate lands three times too small.
          </li>
          <li>
            Deriving storage from total requests rather than from writes. At a 10% write ratio
            that is a tenfold error.
          </li>
          <li>
            Not estimating bandwidth at all. For anything serving media it is usually the largest
            line on the bill.
          </li>
          <li>
            Quoting seven significant digits. The inputs are guesses; the output is an order of
            magnitude, and saying &ldquo;roughly 3,000 QPS at peak&rdquo; is the correct precision.
          </li>
        </ul>
      </section>
    </main>
  );
}
