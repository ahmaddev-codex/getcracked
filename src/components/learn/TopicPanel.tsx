'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  Clock,
  Gauge,
  Info,
  ListChecks,
  Sparkles,
  Star,
  X,
} from 'lucide-react';
import { setTopicStatus, useTopicStatuses, type TopicStatus } from '@/lib/topic-status';
import type { ReactNode } from 'react';
import type { Lesson, Problem } from '@/content/schema';

/**
 * The topic detail panel (K4).
 *
 * Opens over the roadmap rather than navigating away, because the roadmap is
 * the thing a learner is reading: sending them to a full page to answer "what
 * is this node?" loses their place in the path they were scanning.
 *
 * The full lesson page still exists and is still the canonical URL. It is the
 * SEO surface (ADR 0001 §1) and the only place with room for the editor and the
 * visualizer, so the panel summarises and links to it rather than trying to
 * contain it — the same division the reference draws between a node's blurb and
 * the resources it points at.
 *
 * ## Behaviour the markup has to earn
 *
 * A drawer is a dialog. It traps nothing if it does not move focus, and a
 * keyboard user who cannot close it is stuck: hence the initial focus move,
 * Escape to close, and returning focus to whatever opened it.
 */

const STATUS_ACTIONS: Array<{
  value: Exclude<TopicStatus, 'none'>;
  label: string;
  Icon: typeof BookOpen;
  /** Colour only when active — an always-on colour reads as already selected. */
  activeClass: string;
}> = [
  { value: 'learning', label: 'Learning', Icon: BookOpen, activeClass: 'text-alt' },
  { value: 'done', label: 'Done', Icon: Check, activeClass: 'text-success' },
  { value: 'skipped', label: 'Skip', Icon: X, activeClass: 'text-foreground-muted' },
];

/** Keyed on the schema's own values, which are not easy/medium/hard. */
const DIFFICULTY_TONE: Record<string, string> = {
  'warm-up': 'bg-success-soft text-success',
  core: 'bg-accent text-accent-foreground',
  stretch: 'bg-danger-soft text-danger',
};

/** A bordered section, the panel's one repeating shape. */
function Section({
  icon,
  title,
  meta,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  meta?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-border-subtle p-3">
      <h3 className="flex flex-wrap items-center gap-1.5 text-sm font-semibold">
        {icon}
        {title}
        {meta}
      </h3>
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

export function TopicPanel({
  lesson,
  problems,
  cues,
  onClose,
}: {
  lesson: Lesson;
  problems: readonly Problem[];
  /**
   * Pattern cues, rendered on the server.
   *
   * The cues contain markdown, and this is a client component: rendering them
   * here would ship the markdown parser to the browser for four lines of
   * emphasis. Passing the finished elements across the boundary keeps the
   * parser server-side, which is the reason `Markdown` is a server component in
   * the first place.
   */
  cues?: ReactNode;
  onClose: () => void;
}) {
  const [closing, setClosing] = useState(false);

  /**
   * Plays the exit animation before unmounting.
   *
   * The panel has to stay mounted while it slides out, so every dismissal goes
   * through here rather than calling `onClose` directly. A timeout rather than
   * `animationend`: the duration is known, and an animation that never runs —
   * reduced motion, or the element being hidden — would never fire the event,
   * leaving the panel stuck open.
   */
  const requestClose = useCallback(() => {
    const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      onClose();
      return;
    }
    setClosing(true);
  }, [onClose]);

  useEffect(() => {
    if (!closing) return;
    const timer = setTimeout(onClose, 180);
    return () => clearTimeout(timer);
  }, [closing, onClose]);

  const statuses = useTopicStatuses();
  const status = statuses[lesson.slug] ?? 'none';
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') requestClose();
    };
    document.addEventListener('keydown', onKey);

    // The page behind must not scroll under the drawer.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
      opener?.focus?.();
    };
  }, [requestClose]);

  const exerciseCount = lesson.exercises.length;

  return (
    <div className="fixed inset-0 z-60 flex justify-end">
      {/* Dimmed backdrop, dismissing on click as a drawer is expected to. */}
      <button
        type="button"
        aria-label="Close panel"
        onClick={requestClose}
        data-closing={closing}
        className="gc-scrim absolute inset-0 bg-black/45"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        data-closing={closing}
        className="gc-panel relative flex h-full w-full max-w-xl flex-col overflow-y-auto bg-surface shadow-2xl outline-none"
      >
        {/* Toolbar: what you are looking at on the left, what you have decided
            about it on the right — the reference's split. */}
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border-subtle bg-surface px-5 py-3">
          <span className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-semibold text-background">
            <Sparkles size={13} aria-hidden />
            Overview
          </span>

          <div className="ml-auto flex items-center gap-1 rounded-md border border-border-subtle p-0.5">
            {STATUS_ACTIONS.map(({ value, label, Icon, activeClass }) => {
              const active = status === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={active}
                  // Clicking the active status clears it, so a mis-click is
                  // undoable without hunting for a separate "unmark".
                  onClick={() => setTopicStatus(lesson.slug, active ? 'none' : value)}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-xs transition-colors hover:bg-surface-muted ${
                    active ? `${activeClass} font-semibold` : 'text-foreground-muted'
                  }`}
                >
                  <Icon size={13} aria-hidden />
                  {label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={requestClose}
            aria-label="Close"
            className="rounded-md border border-border-subtle p-1.5 text-foreground-muted transition-colors hover:bg-surface-muted hover:text-foreground"
          >
            <X size={15} aria-hidden />
          </button>
        </div>

        <div className="flex flex-col gap-4 px-5 pb-8 pt-5">
          <h2 id={titleId} className="font-sans text-3xl font-bold tracking-tight">
            {lesson.title}
          </h2>
          <p className="text-base leading-7 text-foreground-muted">{lesson.summary}</p>

          <Section
            icon={<Star size={15} className="text-accent-strong" aria-hidden />}
            title="Start here"
            meta={<span className="font-normal text-foreground-muted">· the lesson</span>}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{lesson.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
                  <span className="inline-flex items-center gap-1">
                    <ListChecks size={13} aria-hidden />
                    {exerciseCount} {exerciseCount === 1 ? 'exercise' : 'exercises'}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BookOpen size={13} aria-hidden />
                    animated walkthrough
                  </span>
                </p>
              </div>
              <Link
                href={`/learn/dsa/${lesson.slug}`}
                className="node-surface inline-flex items-center gap-1 bg-accent-strong px-3 py-1.5 text-sm font-semibold text-accent-foreground node-interactive"
              >
                Open
                <ArrowUpRight size={14} aria-hidden />
              </Link>
            </div>
          </Section>

          {lesson.complexity && (
            <Section
              icon={<Gauge size={15} className="text-alt" aria-hidden />}
              title="What it costs"
            >
              <dl className="flex flex-col gap-1 font-mono text-xs">
                <div className="flex gap-2">
                  <dt className="text-foreground-muted">time</dt>
                  <dd>{lesson.complexity.time}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="text-foreground-muted">space</dt>
                  <dd>{lesson.complexity.space}</dd>
                </div>
              </dl>
            </Section>
          )}

          {cues && (
            <Section
              icon={<Info size={15} className="text-link" aria-hidden />}
              title="How to spot it"
            >
              {cues}
            </Section>
          )}

          {problems.length > 0 && (
            <Section
              icon={<Clock size={15} className="text-success" aria-hidden />}
              title="Practice"
              meta={
                <span className="font-normal text-foreground-muted">
                  · {problems.length} {problems.length === 1 ? 'problem' : 'problems'}
                </span>
              }
            >
              <ul className="flex flex-col gap-1.5">
                {problems.map((problem) => (
                  <li key={problem.slug} className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize ${
                        DIFFICULTY_TONE[problem.difficulty] ?? 'bg-surface-muted'
                      }`}
                    >
                      {problem.difficulty}
                    </span>
                    <Link
                      href={`/problems/${problem.topic}/${problem.slug}`}
                      className="text-sm text-link underline underline-offset-2 hover:no-underline"
                    >
                      {problem.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
