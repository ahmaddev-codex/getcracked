'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { useSolved } from '@/lib/use-solved';
import { SignInToTrack } from '@/components/account/SignInToTrack';
import { exerciseId, type Problem } from '@/content/schema';

/**
 * A scannable list of problems.
 *
 * Deliberately a table rather than the node graph the learning surfaces use.
 * The roadmap answers "what order should I go in?", which is the right question
 * for a curriculum and the wrong one for a practice catalogue — there, the
 * question is "find me an easy graph problem I have not done", and a table with
 * sortable columns answers it in a way a spine of nodes cannot.
 *
 * It still wears the platform's node treatment, so it belongs to the same
 * product; consistency is in the shape language, not in forcing one layout onto
 * two different jobs.
 */

const DIFFICULTY_TONE: Record<string, string> = {
  easy: 'bg-success-soft text-success',
  medium: 'bg-warning-soft text-warning',
  hard: 'bg-danger-soft text-danger',
};

export function ProblemTable({ problems }: { problems: readonly Problem[] }) {
  const solved = useSolved();
  const done = problems.filter((p) => solved.has(exerciseId(p))).length;

  return (
    <div className="flex flex-col gap-2">
      {/* The count LeetCode puts above its list: a tick per row answers "have I
          done this one", and the total answers "how far through am I", which is
          the question that actually keeps someone going. */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted" aria-live="polite">
          {done} / {problems.length} solved
        </p>
        <SignInToTrack what="solved count" />
      </div>

    <Node tone="surface" className="overflow-x-auto p-0">
      <table className="w-full min-w-md text-left text-sm">
        <thead className="border-b-2 border-border-strong">
          <tr className="text-xs uppercase tracking-wide text-foreground-muted">
            <th scope="col" className="w-10 px-4 py-2.5 font-semibold">
              <span className="sr-only">Solved</span>
            </th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Problem</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Topic</th>
            <th scope="col" className="px-4 py-2.5 font-semibold">Difficulty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border-subtle">
          {problems.map((problem) => {
            const isDone = solved.has(exerciseId(problem));
            return (
            <tr key={`${problem.topic}/${problem.slug}`} className="hover:bg-surface-muted">
              <td className="px-4 py-2.5">
                {isDone ? (
                  <Check size={16} className="text-success" aria-label="Solved" />
                ) : (
                  <span
                    aria-hidden
                    className="block h-3.5 w-3.5 rounded-full border-2 border-border-subtle"
                  />
                )}
              </td>
              <td className="px-4 py-2.5">
                <Link
                  href={`/problems/${problem.topic}/${problem.slug}`}
                  className="font-medium text-link underline-offset-2 hover:underline"
                >
                  {problem.title}
                </Link>
              </td>
              <td className="px-4 py-2.5 text-foreground-muted">{problem.topic}</td>
              <td className="px-4 py-2.5">
                <span
                  className={`rounded px-1.5 py-0.5 text-[11px] font-semibold capitalize ${
                    DIFFICULTY_TONE[problem.difficulty] ?? 'bg-surface-muted'
                  }`}
                >
                  {problem.difficulty}
                </span>
              </td>
            </tr>
            );
          })}
        </tbody>
      </table>
    </Node>
    </div>
  );
}
