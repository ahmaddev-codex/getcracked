import Link from 'next/link';
import { ArrowRight, BookOpen, ClipboardCheck, Hammer, Play, SquareCode } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { Page } from '@/components/ui/Page';
import { catalogCounts } from '@/lib/catalog';
import { conceptCount } from '@/content/concepts';
import { getLabs, getTopics, getTrack } from '@/content/registry';
import { getCompanies } from '@/content/companies';

/**
 * The landing page.
 *
 * **Every number here is derived, none is written down.** A marketing page is
 * the single most tempting place to round up, and it is also the page nobody
 * revisits when the catalogue changes — so a hardcoded "100+ problems" is a
 * claim that starts false and stays false. Counting the content at build time
 * means the page is either accurate or it does not build.
 *
 * **Structured around the three tiers (AD-7)** rather than around features,
 * because that progression *is* the product: read the topic, practise it on
 * single functions, then build the thing across several files. A feature grid
 * would list the same surfaces without saying why there are three of them.
 *
 * Public and static, which matters more here than anywhere: this is the page
 * search engines land on, and ADR 0001 §1 makes organic search the primary
 * channel.
 */
export const metadata = {
  title: 'GetCracked — Build real systems. Step by step. In your browser.',
  description:
    'Learn data structures, algorithms and system design by writing code that runs and animates in your browser. Free, and it works without an account.',
};

export default function LandingPage() {
  const counts = catalogCounts();
  const labs = getLabs().length;
  const companies = getCompanies().length;
  const topics = getTopics().length;
  const lessonTracks = {
    dsa: getTrack('data-structures').length + getTrack('algorithms').length,
    systemDesign: getTrack('system-design').length,
  };

  const tiers = [
    {
      icon: BookOpen,
      step: 'Read it',
      title: 'Lessons',
      href: '/learn/dsa',
      detail: `${lessonTracks.dsa} DSA topics and ${lessonTracks.systemDesign} on system design. Each one explains the pattern, then animates a real run of it — your code, stepping line by line.`,
      cta: 'Start with arrays',
      ctaHref: '/learn/dsa/arrays',
    },
    {
      icon: SquareCode,
      step: 'Practise it',
      title: 'Problems',
      href: '/problems',
      detail: `${counts.problems} single-function problems across ${topics} topics, easiest first. Progressive hints, a real test runner, and hidden cases so a solution fitted to the examples does not pass.`,
      cta: 'Try Two Sum',
      ctaHref: '/problems/hashing/two-sum',
    },
    {
      icon: Hammer,
      step: 'Build it',
      title: 'Challenges',
      href: '/challenges',
      detail: `${counts.challenges} multi-step builds, ${counts.challengeSteps} steps in all. An LRU cache, a rate limiter, undo and redo — assembled across several files, one rule at a time.`,
      cta: 'Build an LRU cache',
      ctaHref: '/challenges/lru-cache',
    },
  ];

  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-4 bg-surface p-6 sm:p-10">
        <h1 className="max-w-3xl font-sans text-4xl font-bold tracking-tight sm:text-6xl">
          Build real systems. Step by step. In your browser.
        </h1>
        <p className="max-w-2xl text-base text-foreground-muted sm:text-lg">
          Not slides, not videos. You write the code, run it against real tests, and watch
          your own solution execute — then go and build the thing itself.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <Link
            href="/learn/dsa"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-2 bg-accent-strong px-4 py-2 text-sm font-bold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Start learning
            <ArrowRight size={15} aria-hidden />
          </Link>
          <Link
            href="/problems"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-2 bg-surface px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Jump into a problem
          </Link>
          {/*
            Said here rather than in a footer. The single most common reason a
            visitor bounces from a learning site is not knowing whether they are
            about to hit a sign-up wall, and the answer is no.
          */}
          <span className="text-xs text-foreground-muted">
            Free, and it all works without an account.
          </span>
        </div>
      </header>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-2xl font-bold tracking-tight">Three tiers, one loop</h2>
          <p className="max-w-2xl text-sm text-foreground-muted">
            Most sites give you one of these. The gap between reading about an LRU cache and
            being able to write one is where people get stuck, so the path runs all the way
            through — and nothing is locked, so you can start wherever you like.
          </p>
        </div>

        <ol className="grid gap-3 lg:grid-cols-3">
          {tiers.map((tier, i) => {
            const Icon = tier.icon;
            return (
              <li key={tier.title}>
                <Node tone="surface" className="flex h-full flex-col gap-2 p-5">
                  <span className="flex items-center gap-2 text-xs font-semibold text-foreground-muted">
                    <Icon size={15} aria-hidden />
                    {i + 1}. {tier.step}
                  </span>
                  <Link
                    href={tier.href}
                    className="font-sans text-xl font-bold tracking-tight underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                  >
                    {tier.title}
                  </Link>
                  <p className="text-sm text-foreground-muted">{tier.detail}</p>
                  <Link
                    href={tier.ctaHref}
                    className="mt-auto pt-2 text-sm text-link underline underline-offset-2"
                  >
                    {tier.cta} →
                  </Link>
                </Node>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-2xl font-bold tracking-tight">
            The part that is actually different
          </h2>
          <p className="max-w-2xl text-sm text-foreground-muted">
            Everything runs in your browser — Python and JavaScript both, on real
            interpreters compiled to WebAssembly. Nothing is queued on a server, so nothing
            costs anything to run.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          <li>
            <Node tone="strong" className="flex h-full flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Play size={15} aria-hidden />
                Watch your own code run
              </span>
              <p className="text-sm opacity-90">
                Not a recorded animation of someone else&apos;s solution. The visualiser
                traces the code you wrote — array reads and writes, pointers, the line
                currently executing, highlighted in your editor as it steps.
              </p>
            </Node>
          </li>
          <li>
            <Node tone="alt" className="flex h-full flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-sm font-bold">
                <ClipboardCheck size={15} aria-hidden />
                Design labs that score reasoning
              </span>
              <p className="text-sm opacity-90">
                {labs === 1 ? 'A scenario' : `${labs} scenarios`} worked the way an interview
                goes — requirements, estimation, API, data model, scaling, bottleneck — with
                a scorecard naming which of the six went worst.
              </p>
            </Node>
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-sans text-2xl font-bold tracking-tight">What is in it</h2>
        {/*
          Counted, never claimed. These move on their own as content lands, which
          is the only way a number on a landing page stays true.
        */}
        <Node tone="surface" className="grid gap-px overflow-hidden bg-border-subtle sm:grid-cols-3">
          {[
            { value: counts.lessons, label: 'lessons', href: '/learn/dsa' },
            { value: counts.problems, label: 'practice problems', href: '/problems' },
            { value: counts.challengeSteps, label: 'build steps', href: '/challenges' },
            { value: conceptCount(), label: 'reference terms', href: '/learn/system-design' },
            { value: labs, label: 'design labs', href: '/learn/system-design/labs' },
            { value: companies, label: 'company guides', href: '/companies' },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="flex flex-col gap-0.5 bg-surface p-4 transition-colors hover:bg-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              <span className="font-sans text-3xl font-bold tracking-tight">{stat.value}</span>
              <span className="text-xs text-foreground-muted">{stat.label}</span>
            </Link>
          ))}
        </Node>
      </section>
    </Page>
  );
}
