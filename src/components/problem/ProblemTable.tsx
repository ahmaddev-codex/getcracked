'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { Button } from '@/components/ui/Button';
import { useSolved } from '@/lib/use-solved';
import { SignInToTrack } from '@/components/account/SignInToTrack';
import { exerciseId, type Problem } from '@/content/schema';

/**
 * A scannable, paginated list of problems.
 *
 * Deliberately a table rather than the node graph the learning surfaces use.
 * The roadmap answers "what order should I go in?", which is the right question
 * for a curriculum and the wrong one for a practice catalogue — there, the
 * question is "find me an easy graph problem I have not done", and a table with
 * sortable columns answers it in a way a spine of nodes cannot.
 */

const DIFFICULTY_TONE: Record<string, string> = {
  easy: 'bg-success-soft text-success',
  medium: 'bg-warning-soft text-warning',
  hard: 'bg-danger-soft text-danger',
};

const PAGE_SIZE = 15;

export function ProblemTable({
  problems,
  pageSize = PAGE_SIZE,
}: {
  problems: readonly Problem[];
  pageSize?: number;
}) {
  const solved = useSolved();
  const done = problems.filter((p) => solved.has(exerciseId(p))).length;
  const [currentPage, setCurrentPage] = useState(1);
  const [prevProblems, setPrevProblems] = useState(problems);

  if (problems !== prevProblems) {
    setPrevProblems(problems);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(problems.length / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, problems.length);
  const paginatedProblems = problems.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col gap-3">
      {/* Solved counter & sign-in nudge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-foreground-muted" aria-live="polite">
          {done} / {problems.length} solved
          {problems.length > pageSize && (
            <span className="ml-2 opacity-75">
              (showing {startIndex + 1}–{endIndex} of {problems.length})
            </span>
          )}
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
            {paginatedProblems.map((problem) => {
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
                      className={`rounded px-1.5 py-0.5 text-xs font-semibold capitalize ${
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

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <nav
          aria-label="Problem pagination"
          className="flex flex-wrap items-center justify-between gap-3 pt-1"
        >
          <span className="text-xs text-foreground-muted">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              tone="surface"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs"
            >
              <ChevronLeft size={14} aria-hidden />
              <span>Prev</span>
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              const isActive = page === currentPage;
              return (
                <Button
                  key={page}
                  tone={isActive ? 'strong' : 'surface'}
                  onClick={() => setCurrentPage(page)}
                  aria-label={`Page ${page}`}
                  aria-current={isActive ? 'page' : undefined}
                  className="min-w-7 px-2 py-1 text-xs font-medium"
                >
                  {page}
                </Button>
              );
            })}

            <Button
              tone="surface"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs"
            >
              <span>Next</span>
              <ChevronRight size={14} aria-hidden />
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}
