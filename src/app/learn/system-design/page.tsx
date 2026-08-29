import Link from 'next/link';
import { ConceptMap } from '@/components/learn/ConceptMap';
import { conceptCount, getConceptCategories } from '@/content/concepts';

/**
 * The System Design concept map (A14), moved here from `/learn` now that
 * `/learn` is a hub over both tracks (§2.1a).
 *
 * Public and statically rendered — one of the platform's strongest organic
 * acquisition surfaces, and the vocabulary Module C's labs and Module I's
 * roadmaps link into.
 */
export const metadata = {
  title: 'System Design concepts — GetCracked',
  description:
    'A reference map of system design concepts: what each term means and why it matters. Free, no account needed.',
};

export default function ConceptMapPage() {
  const categories = getConceptCategories();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs text-foreground-muted">
          <Link href="/learn" className="text-link underline underline-offset-2">
            Learn
          </Link>
        </p>
        <h1 className="font-sans text-2xl font-semibold tracking-tight">System Design concepts</h1>
        <p className="text-sm text-foreground-muted">
          {conceptCount()} concepts across {categories.length} areas. Definitions, not essays
          — each one links to itself, so you can send someone straight to a term.
        </p>
      </header>

      <ConceptMap categories={categories} />
    </main>
  );
}
