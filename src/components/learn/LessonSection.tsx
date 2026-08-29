import type { ReactNode } from 'react';

/** One of B10's five sections, so every lesson teaches in the same shape. */
export function LessonSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </section>
  );
}
