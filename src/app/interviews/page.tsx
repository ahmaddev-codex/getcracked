import Link from 'next/link';
import { Clock, ArrowRight, Code2, Network, ShieldCheck, Sparkles } from 'lucide-react';
import { Page } from '@/components/ui/Page';
import { Node } from '@/components/ui/Node';
import { getMockTracks } from '@/lib/interviews/mock-tracks';

export const metadata = {
  title: 'Mock Interviews — GetCracked',
  description: 'Timed DSA and System Design mock rounds with real-time Socratic AI interviewer follow-ups and candidate scorecards.',
};

export default function MockInterviewsPage() {
  const tracks = getMockTracks();
  const dsaTracks = tracks.filter((t) => t.kind === 'dsa');
  const sysDesignTracks = tracks.filter((t) => t.kind === 'system-design');

  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-node text-2xs font-bold uppercase tracking-wider bg-accent text-accent-foreground border border-border-strong shadow-2xs">
            <Sparkles size={11} className="shrink-0" />
            Module E & F
          </span>
        </div>
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
          Mock Interview Simulator
        </h1>
        <p className="max-w-2xl text-sm text-foreground-muted leading-relaxed">
          Experience realistic technical rounds with structured stage timers, time budgets, and a proactive Socratic AI interviewer challenging your complexity claims, architecture, and edge cases.
        </p>
      </header>

      {/* DSA Simulation Tracks */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
          <Code2 size={18} className="text-link" />
          <h2 className="text-base font-bold text-foreground">
            Data Structures & Algorithms Tracks (E1)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dsaTracks.map((track) => (
            <Node
              key={track.id}
              tone="surface"
              className="flex flex-col justify-between gap-4 p-5 hover:border-border-strong transition-all duration-(--duration-fast)"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-node text-2xs font-bold uppercase bg-accent/20 border border-border-strong text-foreground shadow-2xs">
                    Target Level: {track.targetLevel}
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground-muted flex items-center gap-1">
                    <Clock size={12} />
                    {track.durationMinutes} min
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">{track.title}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  {track.description}
                </p>

                {/* Stage Roadmap preview */}
                <div className="pt-2 border-t border-border-subtle flex flex-col gap-1.5 text-2xs text-foreground-muted">
                  <span className="font-bold uppercase text-foreground">Stage Breakdown:</span>
                  <div className="grid grid-cols-2 gap-1 font-mono">
                    {track.stages.map((st) => (
                      <span key={st.id} className="truncate">
                        • {st.name.split(':')[0]} ({st.budgetMinutes}m)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href={`/interviews/dsa/${track.slug}`}
                className="mt-2 w-full py-2 bg-accent text-accent-foreground border border-border-strong font-bold rounded-node hover:bg-accent-strong transition-all duration-(--duration-fast) active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs text-xs"
              >
                <span>Start Timed DSA Mock</span>
                <ArrowRight size={13} />
              </Link>
            </Node>
          ))}
        </div>
      </section>

      {/* System Design Simulation Tracks */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
          <Network size={18} className="text-link" />
          <h2 className="text-base font-bold text-foreground">
            System Design & Architecture Tracks (E2)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sysDesignTracks.map((track) => (
            <Node
              key={track.id}
              tone="surface"
              className="flex flex-col justify-between gap-4 p-5 hover:border-border-strong transition-all duration-(--duration-fast)"
            >
              <div className="flex flex-col gap-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-node text-2xs font-bold uppercase bg-accent text-accent-foreground border border-border-strong shadow-2xs">
                    Target Level: {track.targetLevel}
                  </span>
                  <span className="text-xs font-mono font-semibold text-foreground-muted flex items-center gap-1">
                    <Clock size={12} />
                    {track.durationMinutes} min
                  </span>
                </div>

                <h3 className="text-lg font-bold text-foreground">{track.title}</h3>
                <p className="text-xs text-foreground-muted leading-relaxed">
                  {track.description}
                </p>

                {/* Stage Roadmap preview */}
                <div className="pt-2 border-t border-border-subtle flex flex-col gap-1.5 text-2xs text-foreground-muted">
                  <span className="font-bold uppercase text-foreground">Stage Breakdown:</span>
                  <div className="grid grid-cols-2 gap-1 font-mono">
                    {track.stages.map((st) => (
                      <span key={st.id} className="truncate">
                        • {st.name.split(':')[0]} ({st.budgetMinutes}m)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <Link
                href={`/interviews/system-design/${track.slug}`}
                className="mt-2 w-full py-2 bg-accent text-accent-foreground border border-border-strong font-bold rounded-node hover:bg-accent-strong transition-all duration-(--duration-fast) active:scale-[0.98] flex items-center justify-center gap-1.5 shadow-xs text-xs"
              >
                <span>Start System Design Mock</span>
                <ArrowRight size={13} />
              </Link>
            </Node>
          ))}
        </div>
      </section>

      {/* Preparation philosophy banner */}
      <div className="p-4 rounded-node bg-surface-muted/60 border border-border-subtle flex items-start gap-3 text-xs leading-relaxed text-foreground-muted">
        <ShieldCheck size={18} className="text-success shrink-0 mt-0.5" />
        <p>
          Unlike passive leetcode practice, mock rounds evaluate <strong>communication under real time limits</strong>, manual dry runs before execution, and the ability to articulate trade-offs when an interviewer asks &ldquo;What breaks next?&rdquo;.
        </p>
      </div>
    </Page>
  );
}
