'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback } from 'react';
import { Button } from '@/components/ui/Button';
import { CompanyLogo } from '@/components/company/CompanyLogo';

/**
 * Difficulty, topic and company filters (A4, D1).
 *
 * State lives in the URL, not React, so a filtered view is shareable, survives
 * a reload, and works with the back button. Holding it in component state would
 * make all three quietly fail.
 */
export function Filters({
  difficulties,
  topics,
  companies = [],
}: {
  difficulties: readonly string[];
  topics: readonly string[];
  /**
   * Company tags, most-used first (D1).
   *
   * Optional because not every surface that filters has them — and a row
   * labelled "company" with nothing under it is worse than no row.
   */
  companies?: ReadonlyArray<{ name: string; count: number }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const toggle = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (next.get(key) === value) next.delete(key);
      else next.set(key, value);
      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [params, pathname, router],
  );

  const active = (key: string, value: string) => params.get(key) === value;
  const hasFilters =
    params.has('difficulty') || params.has('topic') || params.has('company');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-foreground-muted">difficulty</span>
        {difficulties.map((d) => (
          <Button
            key={d}
            tone={active('difficulty', d) ? 'strong' : 'surface'}
            onClick={() => toggle('difficulty', d)}
            aria-pressed={active('difficulty', d)}
          >
            {d}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-foreground-muted">topic</span>
        {topics.map((t) => (
          <Button
            key={t}
            tone={active('topic', t) ? 'strong' : 'surface'}
            onClick={() => toggle('topic', t)}
            aria-pressed={active('topic', t)}
          >
            {t}
          </Button>
        ))}
      </div>

      {companies.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground-muted">company</span>
          {companies.map((c) => (
            <Button
              key={c.name}
              tone={active('company', c.name) ? 'strong' : 'surface'}
              onClick={() => toggle('company', c.name)}
              aria-pressed={active('company', c.name)}
              className="inline-flex items-center gap-1.5"
            >
              <CompanyLogo name={c.name} size={14} className="rounded-xs" />
              <span>{c.name}</span>{' '}
              {/* The count, because a tag that returns two problems and one
                  that returns twenty look identical without it. */}
              <span className="opacity-60">{c.count}</span>
            </Button>
          ))}
        </div>
      )}

      {hasFilters && (
        <div>
          <Button tone="muted" onClick={() => router.replace(pathname, { scroll: false })}>
            Clear filters
          </Button>
        </div>
      )}
    </div>
  );
}
