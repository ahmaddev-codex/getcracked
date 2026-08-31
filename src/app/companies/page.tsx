import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { Page } from '@/components/ui/Page';
import { getCompanies } from '@/content/companies';
import { companyTags } from '@/lib/catalog';

/**
 * Company interview-loop guides (D7), and the way into the D1 filter.
 *
 * **Public** (§2.6). Editorial, sourced per claim, nothing scraped.
 */
export const metadata = {
  title: 'Company interview guides — GetCracked',
  description:
    'What each loop assesses, with a source on every claim and the ones nobody has confirmed marked as such. Free, no account needed.',
};

export default function CompaniesPage() {
  const companies = getCompanies();
  const written = new Set(companies.map((c) => c.name.toLowerCase()));
  const untagged = companyTags().filter((t) => !written.has(t.name.toLowerCase()));

  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Companies</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          What each loop assesses, taken from what the companies publish themselves. Every
          claim carries the source it came from, and the widely-believed things nobody has
          ever confirmed are labelled rather than repeated as fact.
        </p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Interview guides</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {companies.map((company) => (
            <li key={company.slug}>
              <Link
                href={`/companies/${company.slug}`}
                className="node-surface node-interactive flex h-full flex-col gap-2 bg-surface p-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
              >
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-bold">{company.name}</span>
                  <ArrowRight size={15} aria-hidden className="mt-0.5 shrink-0" />
                </span>
                <span className="text-xs text-foreground-muted">{company.summary}</span>
                <span className="mt-auto pt-1 text-xs text-foreground-muted">
                  reviewed {company.reviewed}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {untagged.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Tagged on problems, no guide yet</h2>
          <p className="text-sm text-foreground-muted">
            Filterable, but nothing written up. A guide only exists once there are openable
            first-party sources to build it from, so naming the gap beats implying these
            three are the only companies worth knowing about.
          </p>
          <ul className="flex flex-wrap gap-2">
            {untagged.map((tag) => (
              <li key={tag.name}>
                <Link
                  href={`/dashboard?company=${encodeURIComponent(tag.name)}`}
                  className="node-surface bg-surface-muted px-3 py-1.5 text-xs hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  {tag.name} <span className="opacity-60">{tag.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Node tone="muted" className="flex flex-col gap-2 p-4 text-sm text-foreground-muted">
        <p>
          <strong className="font-semibold text-foreground">No scraped question bank.</strong>{' '}
          The obvious sources for one — LeetCode discussions, Glassdoor, Blind — forbid it in
          their terms, so building it would mean ignoring that or reproducing their content
          with the exposure that carries.
        </p>
        <p>
          The company tags on practice problems are widely-reported associations with no
          source and no date. Treat them as a rough signal about what a company tends to ask,
          not as evidence that it asked this.
        </p>
      </Node>
    </Page>
  );
}
