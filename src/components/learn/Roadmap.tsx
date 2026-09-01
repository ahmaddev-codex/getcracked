'use client';

import { Fragment, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';
import { ConnectorFan, FAN_ORIGIN, FAN_TARGET } from './ConnectorFan';
import { TopicPanel } from './TopicPanel';
import { useTopicStatuses } from '@/lib/topic-status';
import { useSolved } from '@/lib/use-solved';
import { exerciseId } from '@/content/schema';
import { DIFFICULTY_BADGE, DIFFICULTY_NOTE, lessonBase } from './difficulty';
import { stepIds } from '@/content/challenge';
import type { Challenge, Lesson, Problem } from '@/content/schema';
import type { Concept } from '@/content/concepts';

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
  /**
   * Build challenges applying this topic — the third tier, and the one a
   * roadmap node had nothing to say about until tier 3 existed (I4).
   */
  challenges?: readonly Challenge[];
  /** Pattern cues rendered on the server — see the note in TopicPanel. */
  cues?: ReactNode;
  /** Reference terms this lesson covers. */
  concepts?: readonly Concept[];
}

const TRACK_LABELS: Record<Lesson['track'], string> = {
  'data-structures': 'Data Structures',
  algorithms: 'Algorithms',
  'system-design': 'System Design',
};

/**
 * What the colours mean (I2).
 *
 * The reference puts this in a bordered box beside the graph rather than in a
 * caption, and it earns the space: two node fills and a status dot are three
 * things a learner would otherwise have to infer from context. A graph whose
 * colour carries meaning needs a key, or the meaning is decoration.
 */
function Legend() {
  const rows = [
    { swatch: 'bg-accent-strong', label: 'Lesson', note: 'read the concept' },
    { swatch: 'bg-accent', label: 'Problem', note: 'practise it' },
  ];

  return (
    <aside
      aria-label="Legend"
      className="node-surface flex flex-col gap-2 bg-surface p-4 text-sm"
    >
      <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        What the colours mean
      </h2>

      <ul className="flex flex-col gap-1.5">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center gap-2">
            <span
              aria-hidden
              className={`inline-block h-4 w-6 rounded-xs border-2 border-border-strong ${row.swatch}`}
            />
            <span className="font-semibold">{row.label}</span>
            <span className="text-foreground-muted">— {row.note}</span>
          </li>
        ))}
        <li className="flex items-center gap-2">
          <span
            aria-hidden
            className="grid h-5 w-5 place-items-center rounded-full border-2 border-border-strong bg-alt text-alt-foreground"
          >
            <Check size={11} strokeWidth={3} />
          </span>
          <span className="font-semibold">Done</span>
          <span className="text-foreground-muted">— you marked it complete</span>
        </li>
      </ul>

      <h2 className="mt-2 text-xs font-semibold uppercase tracking-wide text-foreground-muted">
        Where to start
      </h2>
      <ul className="flex flex-col gap-1.5">
        {(Object.keys(DIFFICULTY_NOTE) as Array<Lesson['difficulty']>).map((level) => (
          <li key={level} className="flex items-center gap-2">
            <span className={DIFFICULTY_BADGE[level]}>{level}</span>
            <span className="text-foreground-muted">{DIFFICULTY_NOTE[level]}</span>
          </li>
        ))}
      </ul>

      <p className="mt-1 text-xs text-foreground-muted">
        Difficulty is a suggestion, not a gate — every topic is open from the start.
      </p>
    </aside>
  );
}



/** Sampled from the reference: the branch node is about 1.3x the spine node. */
const SPINE_W = 'md:w-56';
const BRANCH_W = 'md:w-72';

/**
 * The trunk the lesson nodes hang from.
 *
 * Scoped to the node list rather than the whole component. As a sibling of the
 * legend its `h-full` covered that too, drawing a long stretch of line from the
 * top of the page down to the first node — a connector joining nothing to
 * nothing. It now starts at the first track label and ends at the last node.
 */
function Spine() {
  return (
    <span
      aria-hidden
      className="absolute left-1/2 top-16 bottom-0 hidden spine-line -translate-x-1/2 bg-connector md:block"
    />
  );
}

/**
 * Per-node progress (I4).
 *
 * Two states, not one, because they are earned differently. The **self-reported**
 * mark is what a learner says about a topic; the **derived** counts are what
 * they actually did — lesson exercises passing, and problems solved. Collapsing
 * them into a single tick would let clicking "Done" look identical to finishing
 * the work, which is precisely the confusion `deriveLessonState` exists to
 * prevent.
 *
 * The self-report keeps the badge on the node edge, since that is a claim about
 * the whole topic. The derived counts sit under the title as fractions, because
 * "2/3 problems" carries information a tick cannot.
 */
function DoneBadge({ title }: { title: string }) {
  return (
    <span
      title={title}
      className="absolute -right-2 top-1/2 grid h-5 w-5 -translate-y-1/2 place-items-center rounded-full border-2 border-border-strong bg-alt text-alt-foreground"
    >
      <Check size={11} strokeWidth={3} aria-hidden />
      <span className="sr-only">{title}</span>
    </span>
  );
}

function NodeProgress({
  exercisesDone,
  exercisesTotal,
  problemsDone,
  problemsTotal,
  stepsDone,
  stepsTotal,
}: {
  exercisesDone: number;
  exercisesTotal: number;
  problemsDone: number;
  problemsTotal: number;
  /**
   * Build-challenge steps, counted rather than challenges.
   *
   * A challenge is four or five sittings, so `0/1 challenges` would sit at zero
   * through most of an evening's work. Steps are the unit that actually gets
   * finished, and the unit progress is recorded against.
   */
  stepsDone: number;
  stepsTotal: number;
}) {
  const parts: string[] = [];
  if (exercisesTotal > 0) parts.push(`${exercisesDone}/${exercisesTotal} exercises`);
  if (problemsTotal > 0) parts.push(`${problemsDone}/${problemsTotal} problems`);
  if (stepsTotal > 0) parts.push(`${stepsDone}/${stepsTotal} build steps`);
  if (parts.length === 0) return null;

  // Only once something has been done. A row of zeroes on every node is noise
  // that makes the graph harder to read and tells a new learner nothing.
  if (exercisesDone === 0 && problemsDone === 0 && stepsDone === 0) return null;

  return (
    <span className="mt-0.5 block text-xs font-normal opacity-70">{parts.join(' · ')}</span>
  );
}

function RoadmapRow({
  topic,
  position,
  branchRight,
  onOpen,
  done,
  solved,
}: {
  topic: RoadmapTopic;
  /** Number shown on the node — its place within its own track. */
  position: number;
  branchRight: boolean;
  onOpen: () => void;
  done: boolean;
  /** Completed exercise ids, for the derived half of the progress display. */
  solved: ReadonlySet<string>;
}) {
  const rowRef = useRef<HTMLLIElement>(null);
  const { lesson, problems, challenges = [] } = topic;

  // Derived from real results, unlike the self-reported mark beside it.
  const exercisesDone = lesson.exercises.filter((e) =>
    solved.has(exerciseId(lesson, e.slug)),
  ).length;
  const problemsDone = problems.filter((p) => solved.has(exerciseId(p))).length;
  const steps = challenges.flatMap((c) => stepIds(c));
  const stepsDone = steps.filter((id) => solved.has(id)).length;

  const branches = (
    <ul className={`flex w-full flex-col gap-2 ${BRANCH_W}`}>
      {problems.map((problem) => (
        <li key={problem.slug}>
          <Link
            {...{ [FAN_TARGET]: problem.slug }}
            href={`/problems/${problem.topic}/${problem.slug}`}
            className="node-surface node-interactive flex items-center justify-center gap-1.5 truncate bg-accent px-3 py-2 text-center text-sm text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
          >
            {/* Derived, not self-reported: this tick means the tests passed. */}
            {solved.has(exerciseId(problem)) && (
              <Check size={13} strokeWidth={3} aria-label="Solved" className="shrink-0" />
            )}
            <span className="truncate">{problem.title}</span>
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
            href={`${lessonBase(lesson.track)}/${lesson.slug}`}
            onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              onOpen();
            }}
            className={`node-surface node-interactive relative z-10 block w-full max-w-xs bg-accent-strong px-4 py-2 text-center text-sm font-bold text-accent-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${SPINE_W}`}
          >
            {/* Difficulty is deliberately not on the node. A badge per card
                turns the graph into a wall of labels and competes with the one
                thing the node is for — its name. It lives in the panel, which
                is where a learner is deciding whether to start. */}
            {position}. {lesson.title}
            <NodeProgress
              exercisesDone={exercisesDone}
              exercisesTotal={lesson.exercises.length}
              problemsDone={problemsDone}
              problemsTotal={problems.length}
              stepsDone={stepsDone}
              stepsTotal={steps.length}
            />
            {done && <DoneBadge title="You marked this done" />}
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

/**
 * A track heading, sitting on the spine between groups.
 *
 * Plain text on the trunk rather than a node, which is how the reference marks
 * its sections: a boxed heading would read as another step on the path, and the
 * whole point is that it is a label for what follows.
 */
function TrackLabel({ children }: { children: ReactNode }) {
  return (
    <li className="relative flex justify-center py-2">
      <span className="relative z-10 bg-background px-4 text-lg font-bold tracking-tight">
        {children}
      </span>
    </li>
  );
}

export function Roadmap({ topics }: { topics: RoadmapTopic[] }) {
  const [openSlug, setOpenSlug] = useState<string | null>(null);
  const statuses = useTopicStatuses();
  const solved = useSolved();
  const open = topics.find((t) => t.lesson.slug === openSlug) ?? null;

  return (
    <div className="relative flex flex-col gap-6">
      {/*
        The legend sits in the left gutter on wide screens rather than above the
        graph. Stacked, it pushed the whole path down by its own height and left
        a band of empty space beside it — the graph is centred, so that gutter
        was going to be empty anyway. It returns to the flow on narrow screens,
        where there is no gutter to sit in.
      */}
      <div className="md:absolute md:left-0 md:top-0 md:z-20 md:w-64 lg:w-72">
        <Legend />
      </div>

      <div className="relative">
        <Spine />

        <ol className="relative flex flex-col gap-8">
        {topics.map((topic, index) => (
          <Fragment key={topic.lesson.slug}>
            {/* A label wherever the track changes, including the first group. */}
            {topic.lesson.track !== topics[index - 1]?.lesson.track && (
              <TrackLabel>{TRACK_LABELS[topic.lesson.track]}</TrackLabel>
            )}
            <RoadmapRow
              topic={topic}
              // Numbered within its track, not across the whole page: the
              // Algorithms track starting at 10 implies the two are one
              // sequence, when the point of splitting them is that they are not.
              position={topics.filter((t, i) => i <= index && t.lesson.track === topic.lesson.track).length}
            // Branches alternate sides. The reference balances its graph the
            // same way, and it is not only decoration: a single column leaves
            // half the width empty and pushes the spine off-centre, which makes
            // the trunk read as a margin rule rather than the path.
              branchRight={index % 2 === 0}
              done={statuses[topic.lesson.slug] === 'done'}
              solved={solved}
              onOpen={() => setOpenSlug(topic.lesson.slug)}
            />
            </Fragment>
          ))}
        </ol>
      </div>

      {open && (
        <TopicPanel
          lesson={open.lesson}
          problems={open.problems}
          challenges={open.challenges}
          concepts={open.concepts}
          cues={open.cues}
          onClose={() => setOpenSlug(null)}
        />
      )}
    </div>
  );
}
