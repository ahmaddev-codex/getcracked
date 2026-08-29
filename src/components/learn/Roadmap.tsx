import Link from 'next/link';
import type { Lesson, Problem } from '@/content/schema';

/**
 * The roadmap view (K2) — the reference's central idea, and the reason the
 * lessons are ordered at all.
 *
 * A spine of lesson nodes runs down the middle, joined by a solid connector.
 * Each lesson's practice problems branch off it on dotted connectors. That
 * mapping is not decorative: the spine is the path through the material and the
 * branches are what you do with each step, which is exactly the distinction the
 * reference draws between a track and its subtopics.
 *
 * **Drawn with layout, not SVG.** The connectors are bordered pseudo-elements on
 * positioned boxes, so the graph reflows on a narrow screen instead of
 * overflowing a fixed viewBox, and every node stays a real focusable link that
 * a screen reader reads in curriculum order. An SVG graph would look closer to
 * the reference at one width and be unusable at every other.
 *
 * Order is a recommendation, never a gate (B14): every node links straight
 * through regardless of what came before it.
 */

export interface RoadmapTopic {
  lesson: Lesson;
  problems: readonly Problem[];
}

function Spine() {
  // The trunk the lesson nodes hang from. Sits behind them, hence aria-hidden.
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-0 hidden h-full w-0.5 -translate-x-1/2 bg-link/40 md:block"
    />
  );
}

export function Roadmap({ topics }: { topics: RoadmapTopic[] }) {
  return (
    <div className="relative flex flex-col gap-6">
      <Spine />

      <ol className="relative flex flex-col gap-6">
        {topics.map(({ lesson, problems }, index) => {
          // Branches alternate sides. The reference balances its graph the same
          // way, and it is not only decoration: a single column of branches
          // leaves half the width empty and pushes the spine off-centre, which
          // makes the trunk read as a margin rule rather than the path.
          const branchRight = index % 2 === 0;

          const branches = (
            <ul
              className={`relative flex w-full flex-col gap-2 md:w-72 ${
                branchRight ? 'md:ml-8' : 'md:ml-auto md:mr-8'
              }`}
            >
              {problems.length > 0 && (
                <span
                  aria-hidden
                  className={`absolute top-1/2 hidden h-0 w-8 border-t-2 border-dotted border-link/60 md:block ${
                    branchRight ? '-left-8' : '-right-8'
                  }`}
                />
              )}
              {problems.map((problem) => (
                <li key={problem.slug}>
                  <Link
                    href={`/problems/${problem.topic}/${problem.slug}`}
                    className="node-surface block bg-accent px-3 py-1.5 text-sm text-accent-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                  >
                    {problem.title}
                  </Link>
                </li>
              ))}
            </ul>
          );

          return (
            <li key={lesson.slug} className="relative">
              <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
                <div className="hidden md:block">{!branchRight && branches}</div>

                <Link
                  href={`/learn/dsa/${lesson.slug}`}
                  className="node-surface relative z-10 mx-auto flex w-full max-w-sm flex-col gap-0.5 bg-accent-strong px-4 py-2.5 text-accent-foreground transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link md:w-80"
                >
                  <span className="text-base font-bold">
                    {index + 1}. {lesson.title}
                  </span>
                  <span className="text-xs opacity-80">{lesson.summary}</span>
                </Link>

                {/* On narrow screens the grid collapses, so branches always
                    render here and the left cell stays empty. */}
                <div className="md:block">
                  <div className="md:hidden">{branches}</div>
                  <div className="hidden md:block">{branchRight && branches}</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
