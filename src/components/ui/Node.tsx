import type { ReactNode } from 'react';

/**
 * The K3 node treatment — the platform's single shape primitive.
 *
 * Rounded rectangle, solid outline, hard offset shadow (no blur). Everything
 * that reads as a discrete object composes this: cards, buttons, badges, panels,
 * and later the roadmap nodes themselves. That is the point — a lesson card and
 * a roadmap node visibly belong to the same system because they *are* the same
 * component with different padding.
 */

export type NodeTone = 'surface' | 'accent' | 'strong' | 'alt' | 'muted';

const TONES: Record<NodeTone, string> = {
  surface: 'bg-surface text-foreground',
  accent: 'bg-accent text-accent-foreground',
  strong: 'bg-accent-strong text-accent-foreground',
  alt: 'bg-alt text-alt-foreground',
  muted: 'bg-surface-muted text-foreground',
};

export interface NodeProps {
  tone?: NodeTone;
  className?: string;
  children: ReactNode;
}

export function nodeClasses(tone: NodeTone = 'surface', className = ''): string {
  return `node-surface ${TONES[tone]} ${className}`.trim();
}

export function Node({ tone = 'surface', className = '', children }: NodeProps) {
  return <div className={nodeClasses(tone, className)}>{children}</div>;
}
