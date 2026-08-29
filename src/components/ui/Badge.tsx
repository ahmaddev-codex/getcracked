import type { ReactNode } from 'react';
import { nodeClasses, type NodeTone } from './Node';

/**
 * Progress state, rendered identically everywhere it appears (K7).
 *
 * The same vocabulary serves roadmap nodes, lesson cards, and problem rows, so
 * "done" looks like "done" wherever a learner meets it.
 */
export type ProgressState = 'not-started' | 'in-progress' | 'done';

const STATE_TONE: Record<ProgressState, NodeTone> = {
  'not-started': 'muted',
  'in-progress': 'accent',
  done: 'strong',
};

const STATE_LABEL: Record<ProgressState, string> = {
  'not-started': 'Not started',
  'in-progress': 'In progress',
  done: 'Done',
};

export function Badge({
  state,
  children,
}: {
  state: ProgressState;
  children?: ReactNode;
}) {
  return (
    <span className={nodeClasses(STATE_TONE[state], 'inline-block px-2 py-0.5 text-xs')}>
      {children ?? STATE_LABEL[state]}
    </span>
  );
}
