import Link from 'next/link';
import { ConceptMindMap } from '@/components/learn/ConceptMindMap';
import { getPatternCategories } from '@/content/concepts';

/**
 * The Design Patterns catalogue (I5), split out of System Design.
 *
 * The two answer different questions. System design vocabulary describes
 * properties and mechanisms — latency, quorum, sharding — and answers "how will
 * this system behave?". A pattern has a proper name and answers "what is the
 * known solution to this recurring problem?". Circuit Breaker and Saga are
 * things you *apply*; eventual consistency is something you *reason about*.
 *
 * Keeping them on one page meant a learner looking for a named solution had to
 * scroll past forty terms that are not solutions, and a learner reasoning about
 * consistency had to scroll past seventeen patterns they did not want.
 */
export const metadata = {
  title: 'Design Patterns — GetCracked',
  description:
    'A catalogue of named solutions to recurring distributed systems problems: circuit breaker, saga, CQRS, sidecar, and more. Free, no account needed.',
};

export default function DesignPatternsPage() {
  const categories = getPatternCategories();
  const total = categories.reduce((sum, c) => sum + c.concepts.length, 0);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 sm:px-6">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <p className="text-xs text-foreground-muted">
          Related:{' '}
          <Link href="/learn/system-design" className="text-link underline underline-offset-2">
            System Design
          </Link>
        </p>
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">
          Design Patterns
        </h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          {total} named solutions to problems that keep recurring in distributed systems.
          Each one has a name because it has been solved before — knowing the name is how you
          skip solving it again, and how you describe the shape of an answer in an interview.
        </p>
      </header>

      <ConceptMindMap categories={categories} />
    </main>
  );
}
