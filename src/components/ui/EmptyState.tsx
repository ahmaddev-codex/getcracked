import type { ReactNode } from 'react';
import { Node } from './Node';

/**
 * Shown wherever a list has nothing in it.
 *
 * Exists as a component so an empty result is never a blank region — the reason
 * a filter returned nothing should always be visible.
 */
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Node tone="muted" className="flex flex-col items-center gap-2 p-8 text-center">
      <p className="text-sm font-semibold">{title}</p>
      {children && <p className="max-w-prose text-sm text-foreground-muted">{children}</p>}
      {action}
    </Node>
  );
}
