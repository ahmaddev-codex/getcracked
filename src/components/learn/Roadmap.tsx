'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { ConnectorFan, FAN_ORIGIN, FAN_TARGET } from './ConnectorFan';
import { TopicPanel } from './TopicPanel';
import { useTopicStatuses } from '@/lib/topic-status';
import type { Lesson, Problem } from '@/content/schema';

/**
 * The roadmap view (K2) — the reference's central idea, and the reason the
 * lessons are ordered at all.
 *
 * A spine of lesson nodes runs down the middle, joined by a solid connector.
 * Each lesson's practice problems fan off it on curved dotted connectors. That
 * mapping is not decorative: the spine is the path through the material and the
 * branches are what you do with each step, which is exactly the distinction the
 * reference draws between a track and its subtopics.
 *
 * **Nodes carry a label and nothing else.** They are signposts on a graph, not
 * cards: the summary, the cost, the cues and the practice list all live in the
 * panel a click away, and putting any of it on the node makes the row tall
 * enough that the path stops reading as a path.
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

/** Sampled from the reference: the branch node is about 1.3x the spine node. */
const SPINE_W = 'md:w-56';
const BRANCH_W = 'md:w-72';

function Spine() {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-0 hidden h-full w-[3.5px] -translate-x-1/2 bg-connector md:block"
    />
  );
}

/** The reference marks completed nodes with a check on the node's edge. */
function DoneBadge() {
  return (
    <span
      aria-hidden
      className="absolute -right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border-2 border-border-strong bg-alt text-alt-foreground"
    >
      <Check size={11} strokeWidth={3} />
    </span>
  );
}

function RoadmapRow({
  topic,
  index,
  branchRight,
  onOpen,
  done,
}: {
  topic: RoadmapTopic;
  index: number;
  branchRight: boolean;
  onOpen: () => void;
  done: boolean;
}) {
  const rowRef = useRef<HTMLLIElement>(null);
  const { lesson, problems } = topic;

  const branches = (
    <ul className={`flex w-full flex-col gap-2 ${BRANCH_W}`}>
      {problems.map((problem) => (
        <li key={problem.slug}>
          <Link
            {...{ [FAN_TARGET]: problem.slug }}
            href={`/problems/${problem.topic}/${problem.slug}`}
            className="node-surface node-interactive block truncate bg-accent px-3 py-2 text-center text-sm text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {problem.title}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <li ref={rowRef} className="relative">
      {problems.length > 0 && (
        <ConnectorFan
          containerRef={rowRef}
          side={branchRight ? 'right' : 'left'}
          signature={problems.map((p) => p.slug).join(',')}
        />
      )}

      {/*
        One grid, and the branch list rendered exactly once.

        Placing it in column 1 or column 3 by class is what keeps it single: an
        earlier version rendered the list twice — once for mobile, once for
        desktop — and hid one with CSS, which put two copies of every card in
        the DOM. The fan then measured each card twice and React saw duplicate
        keys. Hidden duplicates are still real elements.

        On mobile the grid collapses to one column and both cells stack in DOM
        order, which puts the node above its practice — the right reading order.
      */}
      <div className="grid items-center gap-4 md:grid-cols-[1fr_auto_1fr] md:gap-6">
        <div className="relative mx-auto md:col-start-2 md:row-start-1">
          {/*
            Still a real anchor with a real href, so the lesson is crawlable
            (ADR 0001 §1 makes search the primary channel) and ⌘-click,
            middle-click and "open in new tab" all work. A plain left click is
            intercepted to open the panel instead, which is the only case where
            staying on the roadmap is the better outcome.
          */}
          <Link
            {...{ [FAN_ORIGIN]: '' }}
            href={`/learn/dsa/${lesson.slug}`}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onOpen();
            }}
            className={`node-surface node-interactive relative z-10 block w-full max-w-xs bg-accent-strong px-4 py-2 text-center text-sm font-bold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${SPINE_W}`}
          >
            {index + 1}. {lesson.title}
            {done && <DoneBadge />}
          </Link>
        </div>

        {problems.length > 0 && (
          <div
            /*
              The padding is the fan's room to work in. Butted up against the
              node, six curves share ~24px of horizontal run and collapse into a
              vertical smear; the reference gives them roughly 90px, which is
              what lets each one leave the shared origin at its own angle and
              still arrive level with its card.
            */
            className={`md:row-start-1 ${
              branchRight
                ? 'md:col-start-3 md:justify-self-start md:pl-16'
                : 'md:col-start-1 md:justify-self-end md:pr-16'
            }`}
          >
            {branches}
          </div>
        )}
      </div>
    </li>
  );
}

export function Roadmap({ topics }: { topics: RoadmapTopic[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const statuses = useTopicStatuses();
  const open = topics.find((t) => t.lesson.slug === openSlug) ?? null;

  return (
    <div className="relative flex flex-col gap-6">
      <Spine />

      <ol className="relative flex flex-col gap-8">
        {topics.map((topic, index) => (
          <RoadmapRow
            key={topic.lesson.slug}
            topic={topic}
            index={index}
            // Branches alternate sides. The reference balances its graph the
            // same way, and it is not only decoration: a single column leaves
            // half the width empty and pushes the spine off-centre, which makes
            // the trunk read as a margin rule rather than the path.
            branchRight={index % 2 === 0}
            done={statuses[topic.lesson.slug] === 'done'}
            onOpen={() => setOpenSlug(topic.lesson.slug)}
          />
        ))}
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
