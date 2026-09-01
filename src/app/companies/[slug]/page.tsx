import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Node } from '@/components/ui/Node';
import { Page } from '@/components/ui/Page';
import { Claim } from '@/components/company/Claim';
import { CompanyLogo } from '@/components/company/CompanyLogo';
import { ProblemTable } from '@/components/problem/ProblemTable';
import { findCompany, getCompanies, sourcesOf } from '@/content/companies';
import { filterProblems } from '@/lib/catalog';

/**
 * One company's interview-loop guide (D7).
 *
 * **Public** (§2.6). Every claim renders with its source or with the reason it
 * has none — the schema will not parse one without either.
 */

export function generateStaticParams() {
  return getCompanies().map((c) => ({ slug: c.slug }));
}

interface CompanyRouteProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: CompanyRouteProps) {
  const { slug } = await props.params;
  const company = findCompany(slug);
  if (!company) return { title: 'Company not found' };

  return {
    title: `${company.name} interview guide — GetCracked`,
    description: `${company.summary} Sourced from what ${company.name} publishes, with unconfirmed claims marked.`,
  };
}

export default async function CompanyPage(props: CompanyRouteProps) {
  const { slug } = await props.params;
  const company = findCompany(slug);
  if (!company) notFound();

  const problems = filterProblems({ company: company.name });
  const sources = sourcesOf(company);
  const oldest = sources
    .map((s) => s.published)
    .filter((d) => d !== null)
    .sort()[0];

  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <p className="text-xs text-foreground-muted">
          <Link href="/companies" className="text-link underline underline-offset-2">
            ← Companies
          </Link>
        </p>
        <div className="flex items-center gap-3">
          <CompanyLogo name={company.name} size={40} className="rounded-xs" />
          <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">
            {company.name}
          </h1>
        </div>
        <p className="max-w-2xl text-sm text-foreground-muted">{company.summary}</p>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">The loop</h2>
        <ol className="flex flex-col gap-2">
          {company.rounds.map((round, i) => (
            <li key={round.name}>
              <Node tone="surface" className="flex flex-col gap-2 p-4">
                <span className="flex items-baseline gap-2">
                  <span className="text-xs text-foreground-muted">{i + 1}</span>
                  <span className="text-sm font-semibold">{round.name}</span>
                </span>
                <Claim claim={round.assesses} />
                {round.practice && (
                  <Link
                    href={round.practice.href}
                    className="text-xs text-link underline underline-offset-2"
                  >
                    {round.practice.label} →
                  </Link>
                )}
              </Node>
            </li>
          ))}
        </ol>
      </section>

      {company.notes.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Worth knowing</h2>
          <div className="flex flex-col gap-4">
            {company.notes.map((note) => (
              <Claim key={note.text} claim={note} />
            ))}
          </div>
        </section>
      )}

      {problems.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Problems tagged {company.name}</h2>
          <p className="text-sm text-foreground-muted">
            Widely-reported associations, not verified reports — a rough signal about what
            gets asked here rather than evidence that it was.
          </p>
          <ProblemTable problems={problems} />
        </section>
      )}

      <Node tone="muted" className="flex flex-col gap-1.5 p-4 text-xs text-foreground-muted">
        <p>
          Every source above was read on <strong>{company.reviewed}</strong> and said what it
          is quoted as saying.
          {oldest && (
            <>
              {' '}
              The oldest is from <strong>{oldest}</strong> — hiring processes change, so treat
              the timings as a guide rather than a promise.
            </>
          )}
        </p>
        <p>If this disagrees with what a recruiter tells you, believe the recruiter.</p>
      </Node>
    </Page>
  );
}
