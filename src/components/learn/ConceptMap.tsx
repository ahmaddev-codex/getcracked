'use client';

import { useEffect, useState } from 'react';
import { Node } from '@/components/ui/Node';
import { Button } from '@/components/ui/Button';
import { Disclosure } from '@/components/ui/Disclosure';
import type { ConceptCategory } from '@/content/concepts';

/**
 * The concept map (A14): expandable categories, expand/collapse all, and a
 * stable anchor per concept.
 *
 * Deep links are the point. Module C's labs (C9) and Module I's roadmap nodes
 * (I3) both link *into* individual terms, so arriving at `#quorum` must open the
 * category containing it and scroll there — a link that lands on a collapsed
 * accordion has failed.
 */
export function ConceptMap({ categories }: { categories: readonly ConceptCategory[] }) {
  const [openAll, setOpenAll] = useState<boolean | null>(null);
  const [forced, setForced] = useState<string | null>(null);

  useEffect(() => {
    /**
     * Opens the category holding the hash target.
     *
     * Runs on mount and on hashchange, because a link from another page arrives
     * as a fresh load while a link within the page does not.
     */
    const openFromHash = () => {
      const slug = window.location.hash.slice(1);
      if (!slug) return;

      const category = categories.find((c) => c.concepts.some((x) => x.slug === slug));
      if (!category) return;

      setForced(category.slug);
      // After the panel has been told to open, so the target has a position.
      requestAnimationFrame(() => {
        document.getElementById(slug)?.scrollIntoView({ block: 'center' });
      });
    };

    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [categories]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          tone="surface"
          onClick={() => {
            setOpenAll(true);
            setForced(null);
          }}
        >
          Expand all
        </Button>
        <Button
          tone="surface"
          onClick={() => {
            setOpenAll(false);
            setForced(null);
          }}
        >
          Collapse all
        </Button>
      </div>

      {categories.map((category) => (
        <Node key={category.slug} tone="surface" className="p-4">
          <Disclosure
            // `key` forces a remount when expand/collapse-all changes, so the
            // control actually overrides whatever each panel was set to.
            key={`${category.slug}-${String(openAll)}-${forced ?? ''}`}
            defaultOpen={forced === category.slug || openAll === true}
            summary={
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{category.title}</span>
                <span className="text-xs text-foreground-muted">{category.summary}</span>
              </span>
            }
            aside={
              <span className="text-xs text-foreground-muted">{category.concepts.length}</span>
            }
          >
            <dl className="flex flex-col gap-4">
              {category.concepts.map((concept) => (
                <div key={concept.slug} id={concept.slug} className="scroll-mt-8">
                  <dt className="text-sm font-semibold">
                    <a
                      href={`#${concept.slug}`}
                      className="hover:text-link hover:underline hover:underline-offset-2"
                    >
                      {concept.term}
                    </a>
                  </dt>
                  <dd className="mt-1 text-sm">{concept.definition}</dd>
                  <dd className="mt-1 text-sm text-foreground-muted">{concept.matters}</dd>
                </div>
              ))}
            </dl>
          </Disclosure>
        </Node>
      ))}
    </div>
  );
}
