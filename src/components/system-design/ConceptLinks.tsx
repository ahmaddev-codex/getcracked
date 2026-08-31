'use client';

import Link from 'next/link';
import { BookMarked } from 'lucide-react';
import { findConcept } from '@/content/concepts';

/**
 * The terms a lab step turns on, linked to the reference (C9).
 *
 * **Reuses A14 rather than restating it.** The concept map already defines these
 * and its entries are deep-linkable by anchor, so a lab that explained "cache
 * aside" in its own words would be a second definition to keep in step with the
 * first. Linking is the whole feature.
 *
 * **Shown only after the step is answered**, which is enforced by the caller.
 * A strip reading "cache aside · replication · CDN" above the scaling question
 * is the answer key — the terms that matter are exactly the ones a good answer
 * picks, so revealing them early turns the step into a matching exercise.
 *
 * A slug naming nothing renders nothing rather than a dead link, though the
 * content gate should have caught it first.
 */
export function ConceptLinks({ slugs }: { slugs: readonly string[] }) {
  const concepts = slugs.map((slug) => findConcept(slug)).filter((c) => c !== undefined);

  if (concepts.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="flex items-center gap-1.5 text-foreground-muted">
        <BookMarked size={13} aria-hidden />
        Terms this turns on:
      </span>
      {concepts.map((concept) => (
        <Link
          key={concept.slug}
          href={`/learn/system-design#${concept.slug}`}
          // The definition as the title, so hovering answers the question
          // without the navigation — most of the time that is all anyone wants.
          title={concept.definition}
          className="node-surface bg-surface-muted px-2 py-0.5 hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          {concept.term}
        </Link>
      ))}
    </div>
  );
}
