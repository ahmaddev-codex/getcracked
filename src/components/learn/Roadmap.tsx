'use client';

import { useState } from 'react';
import Link from 'next/link';
import { TopicPanel } from './TopicPanel';
import type { ReactNode } from 'react';
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
  /** Pattern cues rendered on the server — see the note in TopicPanel. */
  cues?: ReactNode;
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
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const open = topics.find((t) => t.lesson.slug === openSlug) ?? null;

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

          /**
           * The fan: a stub out of the lesson node to a vertical bus, then one
           * elbow off the bus into each problem.
           *
           * A single straight line between the node and the column says the two
           * are related but not which problem is which — with four problems
           * stacked, the line points at the gap between two of them. One
           * terminating segment per card is what makes the branching readable.
           *
           * The bus spans first-to-last card centre rather than the full column
           * height, so it starts and ends on a connection instead of overshooting
           * into empty space. With a single problem it collapses to zero height
           * and the elbow degenerates to a straight line, which is correct.
           */
          const connectors = problems.length > 0 && (
            <span aria-hidden className="pointer-events-none hidden md:block">
              {/* Stub from the node edge to the bus, at the row's centre. */}
              <span
                className={`absolute top-1/2 w-6 border-t-2 border-dotted border-link/60 ${
                  branchRight ? '-left-12' : '-right-12'
                }`}
              />
              {/* The bus itself. */}
              <span
                className={`absolute top-[1.0625rem] bottom-[1.0625rem] border-l-2 border-dotted border-link/60 ${
                  branchRight ? '-left-6' : '-right-6'
                }`}
              />
            </span>
          );

          const branches = (
            <div
              className={`relative w-full md:w-72 ${
                branchRight ? 'md:ml-12' : 'md:ml-auto md:mr-12'
              }`}
            >
              {connectors}
              <ul className="flex flex-col gap-2">
                {problems.map((problem) => (
                  <li key={problem.slug} className="relative">
                    {/* The elbow's terminating segment, one per card. */}
                    <span
                      aria-hidden
                      className={`absolute top-1/2 hidden w-6 border-t-2 border-dotted border-link/60 md:block ${
                        branchRight ? '-left-6' : '-right-6'
                      }`}
                    />
                    <Link
                      href={`/problems/${problem.topic}/${problem.slug}`}
                      className="node-surface node-interactive block bg-accent px-3 py-1.5 text-sm text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                    >
                      {problem.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );

          return (
            <li key={lesson.slug} className="relative">
              <div className="grid items-center gap-3 md:grid-cols-[1fr_auto_1fr]">
                <div className="hidden md:block">{!branchRight && branches}</div>

                {/*
                  Still a real anchor with a real href, so the lesson is
                  crawlable (ADR 0001 §1 makes search the primary channel) and
                  ⌘-click, middle-click and "open in new tab" all work. A plain
                  left click is intercepted to open the panel instead, which is
                  the only case where staying on the roadmap is the better
                  outcome.
                */}
                <Link
                  href={`/learn/dsa/${lesson.slug}`}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
                    event.preventDefault();
                    setOpenSlug(lesson.slug);
                  }}
                  className="node-surface node-interactive relative z-10 mx-auto flex w-full max-w-sm flex-col gap-0.5 bg-accent-strong px-4 py-2.5 text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link md:w-80"
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

      {open && (
        <TopicPanel
          lesson={open.lesson}
          problems={open.problems}
          cues={open.cues}
          onClose={() => setOpenSlug(null)}
        />
      )}
    </div>
  );
}
