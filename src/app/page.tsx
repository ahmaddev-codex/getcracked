import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  ClipboardCheck,
  Hammer,
  Play,
  SquareCode,
  MessageSquare,
  Trophy,
  Users,
  Briefcase,
  Flame,
  Shield,
  Brain,
  Sparkles,
  Network,
} from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { Page } from '@/components/ui/Page';
import { catalogCounts } from '@/lib/catalog';
import { conceptCount } from '@/content/concepts';
import { getLabs, getTopics, getTrack } from '@/content/registry';
import { getCompanies } from '@/content/companies';
import { CompanyLogo } from '@/components/company/CompanyLogo';
import { LanguageIcon } from '@/components/ui/LanguageIcon';

export const metadata = {
  title: 'GetCracked — Build real systems. Step by step. In your browser.',
  description:
    'Learn data structures, algorithms and system design by writing code that runs and animates in your browser. Start exploring instantly — sign up to save your progress.',
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
      {/* Hero Header */}
      <header className="node-surface flex flex-col gap-5 bg-surface p-6 sm:p-10">
        <h1 className="max-w-3xl font-sans text-4xl font-bold tracking-tight sm:text-6xl">
          Build real systems. Step by step. In your browser.
        </h1>
        <p className="max-w-2xl text-base text-foreground-muted sm:text-lg">
          Not slides, not videos. You write the code, run it against real tests, watch
          your own solution physically execute in spatial visualizers, and build complete production architectures.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link
            href="/sign-up"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-2 bg-accent-strong px-5 py-2.5 text-sm font-bold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Create free account
            <ArrowRight size={15} aria-hidden />
          </Link>
          <Link
            href="/learn/visualizer"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-2 bg-surface px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            <Play size={15} className="text-link" />
            Try DS Visualizer
          </Link>
          <Link
            href="/problems"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-2 bg-surface px-4 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Explore Problems
          </Link>
          <span className="w-full text-xs text-foreground-muted pt-1">
            Start solving and visualizing instantly without an account — sign up when you&apos;re ready to permanently save your progress.
          </span>
        </div>
      </header>

      {/* Visualizer Showcase: True Spatial Motion */}
      <section className="node-surface flex flex-col gap-6 bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 font-mono text-3xs font-bold uppercase tracking-wider text-link">
              <Sparkles size={13} aria-hidden />
              Stepwise Data Structure Visualizer
            </span>
            <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
              Watch data structures move in physical space
            </h2>
            <p className="max-w-2xl text-sm text-foreground-muted">
              Not a pre-recorded animation. Elements actually lift, translate along arcs, and land in their new slots.
              Step forward and backward line-by-line with synchronized algorithmic code across 6 languages.
            </p>
          </div>
          <Link
            href="/learn/visualizer"
            className="node-surface node-interactive node-pressable inline-flex shrink-0 items-center gap-2 bg-accent-strong px-4 py-2 text-xs font-bold text-accent-foreground"
          >
            Launch Visualizer
            <ArrowRight size={14} aria-hidden />
          </Link>
        </div>

        {/* Live Visualizer Teaser Card */}
        <div className="grid gap-4 lg:grid-cols-12 rounded-md border border-border-subtle bg-surface-muted/50 p-4 sm:p-6">
          {/* Animated Buffer Mockup */}
          <div className="lg:col-span-7 flex flex-col justify-between gap-6 rounded-md border border-border bg-surface p-4 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-border-subtle pb-3">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-accent-strong ring-2 ring-accent-strong/20" />
                <span className="font-mono text-xs font-bold">Two-Pointer Array In-Place Reversal</span>
              </div>
              <span className="rounded bg-accent-strong/15 px-2 py-0.5 font-mono text-3xs font-bold text-accent-foreground">
                Step 3 of 7 · Physical Swap
              </span>
            </div>

            {/* Visual Arc Crossover Simulation */}
            <div className="flex flex-col items-center justify-center py-6">
              <div className="flex items-end gap-2.5 sm:gap-3 flex-wrap justify-center min-h-24">
                {[
                  { val: 12, idx: 0, motion: 'gc-swap-arc-right-4', label: 'left pointer' },
                  { val: 24, idx: 1, motion: '', label: '' },
                  { val: 36, idx: 2, motion: '', label: 'mid' },
                  { val: 48, idx: 3, motion: '', label: '' },
                  { val: 60, idx: 4, motion: 'gc-swap-arc-left-4', label: 'right pointer' },
                ].map((item) => (
                  <div key={item.idx} className="flex flex-col items-center gap-1.5">
                    <span className="text-3xs font-mono text-foreground-muted">[{item.idx}]</span>
                    <div
                      className={`flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-md border-2 font-mono text-sm font-bold shadow-sm transition-all ${item.motion
                          ? `${item.motion} border-link bg-accent-strong text-accent-foreground shadow-xl`
                          : 'border-border-strong bg-surface text-foreground'
                        }`}
                    >
                      {item.val}
                    </div>
                    {item.label ? (
                      <span className="rounded bg-surface-muted px-1.5 py-0.5 font-mono text-3xs text-link font-semibold">
                        {item.label}
                      </span>
                    ) : (
                      <span className="h-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border-subtle pt-3 text-xs text-foreground-muted">
              <span>Time: <strong className="text-foreground">O(n)</strong> · Space: <strong className="text-foreground">O(1)</strong></span>
              <span className="font-mono text-3xs">Speed: 0.25x slow-motion enabled</span>
            </div>
          </div>

          {/* Synchronized Algorithmic Code Preview */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4 rounded-md border border-border bg-header p-4 text-header-foreground font-mono text-xs shadow-xs">
            <div className="flex items-center justify-between border-b border-header-foreground/15 pb-2.5">
              <div className="flex items-center gap-1.5">
                <SquareCode size={14} className="text-accent-strong" />
                <span className="text-3xs uppercase tracking-wider font-bold">Algorithmic Code</span>
              </div>
              <div className="flex items-center gap-1">
                {(['TS', 'Python', 'Java', 'C++', 'Go'] as const).map((lang) => (
                  <span
                    key={lang}
                    className={`flex items-center gap-1 rounded px-1.5 py-0.5 text-3xs font-bold ${lang === 'TS' ? 'bg-accent-strong text-accent-foreground' : 'text-header-foreground/60'
                      }`}
                  >
                    <LanguageIcon language={lang} size={10} />
                    {lang}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1 py-1 font-mono text-2xs sm:text-xs">
              <div className="text-header-foreground/50">{`// In-place two-pointer crossover`}</div>
              <div><span className="text-link">function</span> <span className="text-accent-strong">reverseArray</span>(arr: number[]) &#123;</div>
              <div className="pl-3">let left = 0, right = arr.length - 1;</div>
              <div className="pl-3">while (left &lt; right) &#123;</div>
              <div className="pl-6 bg-header-foreground/15 rounded px-1.5 py-0.5 border-l-2 border-accent-strong text-accent-strong font-bold">
                [arr[left], arr[right]] = [arr[right], arr[left]];
              </div>
              <div className="pl-6">left++; right--;</div>
              <div className="pl-3">&#125;</div>
              <div>&#125;</div>
            </div>

            <div className="border-t border-header-foreground/15 pt-2 text-2xs text-header-foreground/70">
              Covers Arrays, Linked Lists, Trees, Heaps, Hash Maps &amp; Graphs.
            </div>
          </div>
        </div>
      </section>

      {/* System Design Canvas & Architecture Labs Showcase */}
      <section className="node-surface flex flex-col gap-6 bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1.5 font-mono text-3xs font-bold uppercase tracking-wider text-link">
              <Network size={13} aria-hidden />
              Interactive System Design
            </span>
            <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
              Architect real-world scale before you get interviewed
            </h2>
            <p className="max-w-2xl text-sm text-foreground-muted">
              Draw system topologies, run automated reliability validation, and estimate storage, QPS,
              and network throughput with back-of-the-envelope calculators.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/learn/system-design/labs"
              className="node-surface node-interactive node-pressable inline-flex items-center gap-1.5 bg-surface px-3.5 py-2 text-xs font-semibold"
            >
              Scored Labs
            </Link>
            <Link
              href="/learn/system-design/canvas"
              className="node-surface node-interactive node-pressable inline-flex items-center gap-1.5 bg-accent-strong px-3.5 py-2 text-xs font-bold text-accent-foreground"
            >
              Open Canvas
              <ArrowRight size={14} aria-hidden />
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <Node tone="surface" className="flex flex-col gap-2.5 p-5">
            <span className="font-mono text-3xs font-bold uppercase tracking-wider text-link">01 · Topology Canvas</span>
            <h3 className="font-sans text-base font-bold">Drag &amp; Drop Architectures</h3>
            <p className="text-xs text-foreground-muted">
              Connect Load Balancers, API Gateways, Microservices, Redis Caches, Message Queues, and Sharded Databases with instant topology linting.
            </p>
            <Link href="/learn/system-design/canvas" className="mt-auto pt-2 text-xs text-link font-medium hover:underline">
              Launch canvas &rarr;
            </Link>
          </Node>
          <Node tone="surface" className="flex flex-col gap-2.5 p-5">
            <span className="font-mono text-3xs font-bold uppercase tracking-wider text-link">02 · Capacity Estimator</span>
            <h3 className="font-sans text-base font-bold">Back-of-the-Envelope Math</h3>
            <p className="text-xs text-foreground-muted">
              Live calculations for Daily Active Users, Peak Read/Write QPS, Bandwidth egress, and 5-year distributed storage capacities.
            </p>
            <Link href="/learn/system-design/capacity" className="mt-auto pt-2 text-xs text-link font-medium hover:underline">
              Run calculations &rarr;
            </Link>
          </Node>
          <Node tone="surface" className="flex flex-col gap-2.5 p-5">
            <span className="font-mono text-3xs font-bold uppercase tracking-wider text-link">03 · Decision Trees</span>
            <h3 className="font-sans text-base font-bold">Consistency vs Availability</h3>
            <p className="text-xs text-foreground-muted">
              Interactive guides on SQL vs NoSQL, Eventual vs Strong Consistency, Write-Through vs Cache-Aside, and Leader-Follower replication.
            </p>
            <Link href="/learn/system-design" className="mt-auto pt-2 text-xs text-link font-medium hover:underline">
              Read reference &rarr;
            </Link>
          </Node>
        </div>
      </section>

      {/* Three Tiers Section */}
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

      {/* The Part That Is Actually Different */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-2xl font-bold tracking-tight">
            The part that is actually different
          </h2>
          <p className="max-w-2xl text-sm text-foreground-muted">
            Everything runs in your browser — Python, JavaScript, TypeScript, Go, C++, and Java on real
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

      {/* Mock Interviews Section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-2xl font-bold tracking-tight">
            Mock interviews that feel real
          </h2>
          <p className="max-w-2xl text-sm text-foreground-muted">
            Timed rounds with a Socratic AI interviewer that listens, pushes back, and
            scores you — not a quiz, an actual conversation about your approach.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          <li>
            <Node tone="surface" className="flex h-full flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Brain size={15} aria-hidden />
                DSA Rounds
              </span>
              <p className="text-xs text-foreground-muted">
                45-minute timed DSA interviews with live code editing, progressive
                hints, and a detailed scorecard across communication, correctness,
                and complexity analysis.
              </p>
            </Node>
          </li>
          <li>
            <Node tone="surface" className="flex h-full flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Shield size={15} aria-hidden />
                System Design Rounds
              </span>
              <p className="text-xs text-foreground-muted">
                Full system design sessions: requirements, API design, data modelling,
                component architecture, and bottleneck analysis — scored across
                the 10-dimensional architectural reference.
              </p>
            </Node>
          </li>
          <li>
            <Node tone="surface" className="flex h-full flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Flame size={15} aria-hidden />
                Post-Round Debrief
              </span>
              <p className="text-xs text-foreground-muted">
                After each round, a detailed scorecard shows what went well and
                what to practise. Decision points are highlighted, and each section
                maps back to the lesson that covers it.
              </p>
            </Node>
          </li>
        </ul>

        <Link
          href="/interviews"
          className="node-surface node-interactive node-pressable inline-flex w-fit items-center gap-2 bg-surface px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          Try a mock interview
          <ArrowRight size={15} aria-hidden />
        </Link>
      </section>

      {/* Company Guides Section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-2xl font-bold tracking-tight">
            {companies} company interview guides
          </h2>
          <p className="max-w-2xl text-sm text-foreground-muted">
            Verified, first-party engineering interview guides for Amazon, Google, Meta,
            Microsoft, Apple, Netflix, and Uber — sourced from official engineering blogs,
            recruiter documentation, and public tech talks.
          </p>
        </div>

        {/* Company Logos Grid from logo.dev */}
        <div className="flex flex-wrap items-center gap-2.5">
          {['Amazon', 'Google', 'Meta', 'Microsoft', 'Apple', 'Netflix', 'Uber'].map((name) => (
            <Link
              key={name}
              href={`/companies/${name.toLowerCase()}`}
              className="node-surface node-interactive flex items-center gap-2 px-3 py-1.5 bg-surface text-xs font-semibold hover:border-border-strong transition-all"
            >
              <CompanyLogo name={name} size={18} className="rounded-xs" />
              <span>{name}</span>
            </Link>
          ))}
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: 'Interview Format', detail: 'Round structure, timing, what to expect' },
            { label: 'Technical Focus', detail: 'Which topics each company favours most' },
            { label: 'Leadership Principles', detail: 'Behavioral and culture fit dimensions' },
            { label: 'Sourced & Verified', detail: 'Every claim links back to a public source' },
          ].map((item) => (
            <li key={item.label}>
              <Node tone="surface" className="flex h-full flex-col gap-1 p-4">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Briefcase size={12} aria-hidden />
                  {item.label}
                </span>
                <p className="text-2xs text-foreground-muted">{item.detail}</p>
              </Node>
            </li>
          ))}
        </ul>

        <Link
          href="/companies"
          className="node-surface node-interactive node-pressable inline-flex w-fit items-center gap-2 bg-surface px-4 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
        >
          Browse company guides
          <ArrowRight size={15} aria-hidden />
        </Link>
      </section>

      {/* Community Layer Section */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="font-sans text-2xl font-bold tracking-tight">Learn from the community</h2>
          <p className="max-w-2xl text-sm text-foreground-muted">
            After you solve a problem, see how others approached it. Share your own solution,
            discuss edge cases, and compare complexity trade-offs — all within the workspace.
          </p>
        </div>

        <ul className="grid gap-3 sm:grid-cols-3">
          <li>
            <Node tone="surface" className="flex h-full flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Users size={15} aria-hidden />
                Peer Solutions
              </span>
              <p className="text-xs text-foreground-muted">
                A completion-gated gallery of community approaches — with Big-O tags,
                language filters, upvoting, and spoiler protection. See the hash map
                approach next to the two-pointer one.
              </p>
            </Node>
          </li>
          <li>
            <Node tone="surface" className="flex h-full flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-sm font-bold">
                <MessageSquare size={15} aria-hidden />
                Problem Discussions
              </span>
              <p className="text-xs text-foreground-muted">
                Threaded Q&A on every problem. Edge-case callouts, optimization
                follow-ups, and intuition discussions — tagged and filterable so
                the signal stays high.
              </p>
            </Node>
          </li>
          <li>
            <Node tone="surface" className="flex h-full flex-col gap-2 p-5">
              <span className="flex items-center gap-2 text-sm font-bold">
                <Trophy size={15} aria-hidden />
                Leaderboard
              </span>
              <p className="text-xs text-foreground-muted">
                Ranked by problems solved, streak length, challenges built, and total
                submissions. See where you stand and what the pace looks like at
                the top.
              </p>
              <Link
                href="/leaderboard"
                className="mt-auto pt-1 text-xs text-link underline underline-offset-2"
              >
                View leaderboard →
              </Link>
            </Node>
          </li>
        </ul>
      </section>

      {/* Catalog Counts Section */}
      <section className="flex flex-col gap-3">
        <h2 className="font-sans text-2xl font-bold tracking-tight">What is in it</h2>
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

      {/* Final Call to Action */}
      <section className="flex flex-col items-center gap-3 py-6 text-center">
        <h2 className="font-sans text-2xl font-bold tracking-tight sm:text-3xl">
          Ready to start cracking?
        </h2>
        <p className="max-w-lg text-sm text-foreground-muted">
          Jump in and start exploring — when you&apos;re ready to track your streaks,
          save progress, and climb the leaderboard, create a free account in seconds.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/sign-up"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-2 bg-accent-strong px-5 py-2.5 text-sm font-bold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Create free account
            <ArrowRight size={15} aria-hidden />
          </Link>
          <Link
            href="/learn/visualizer"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-2 bg-surface px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Interactive Visualizer
          </Link>
          <Link
            href="/learn/dsa"
            className="node-surface node-interactive node-pressable inline-flex items-center gap-2 bg-surface px-5 py-2.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            Explore Roadmap
          </Link>
        </div>
      </section>
    </Page>
  );
}
