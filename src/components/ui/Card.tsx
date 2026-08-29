import type { ReactNode } from 'react';
import { Node, type NodeTone } from './Node';

/** A card is a node with room to breathe. Same shape, more padding. */
export function Card({
  tone = 'surface',
  title,
  children,
  className = '',
}: {
  tone?: NodeTone;
  title?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Node tone={tone} className={`p-4 ${className}`}>
      {title && <h3 className="mb-1 text-sm font-semibold">{title}</h3>}
      <div className="text-sm">{children}</div>
    </Node>
  );
}
