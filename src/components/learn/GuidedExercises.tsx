'use client';

import { useCallback, useState, useSyncExternalStore } from 'react';
import { Node } from '@/components/ui/Node';
import { Disclosure } from '@/components/ui/Disclosure';
import { Badge } from '@/components/ui/Badge';
import { Markdown } from '@/components/Markdown';
import { Hints } from '@/components/problem/Hints';
import { Workspace } from '@/components/problem/Workspace';
import { readLocalLessonState, readLocalProgress } from '@/lib/progress-local';
import { subscribeToDrafts } from '@/lib/drafts';
import { track } from '@/lib/analytics/track';
import { useHydrated } from '@/lib/use-hydrated';
import type { Language, RunnableExercise } from '@/content/schema';
import type { ProgressState } from '@/lib/progress';

/**
 * A lesson's guided exercises (B11) and the state they add up to (B12).
 *
 * Each one is a `Workspace` in compact mode — the same editor, the same runner,
 * the same persistence a full problem uses. Building a lighter parallel runner
 * for lessons is precisely the divergence AD-7 exists to prevent.
 *
 * Short by design: these are comprehension checks taken immediately after
 * reading, not practice. Practice is the problem set the lesson hands off to.
 */

const BADGE_STATE: Record<ProgressState, 'not-started' | 'in-progress' | 'done'> = {
  not_started: 'not-started',
  in_progress: 'in-progress',
  complete: 'done',
};

export function GuidedExercises({
  lessonSlug,
  exerciseIds,
  exercises,
  language = 'javascript',
}: {
  lessonSlug: string;
  /** Parallel to `exercises`; computed server-side so ids stay canonical. */
  exerciseIds: string[];
  exercises: RunnableExercise[];
  language?: Language;
}) {
  const hydrated = useHydrated();
  const [celebrated, setCelebrated] = useState(false);

  // Progress lives in storage, so it is read as an external store rather than
  // pulled into state inside an effect.
  const state = useSyncExternalStore(
    subscribeToDrafts,
    () => readLocalLessonState(exerciseIds),
    () => 'not_started' as ProgressState,
  );

  /** Per-exercise state, so a collapsed row still shows whether it is done. */
  const perExercise = useSyncExternalStore(
    subscribeToDrafts,
    () => {
      const byId = new Map(readLocalProgress().map((e) => [e.exerciseId, e.state]));
      return exerciseIds.map((id) => byId.get(id) ?? 'not_started').join(',');
    },
    () => exerciseIds.map(() => 'not_started').join(','),
  ).split(',') as ProgressState[];

  const handleSolved = useCallback(() => {
    // Re-derived after the write, so the check reflects the attempt just saved.
    if (readLocalLessonState(exerciseIds) === 'complete' && !celebrated) {
      setCelebrated(true);
      track('lesson_completed', { lessonSlug });
    }
  }, [exerciseIds, lessonSlug, celebrated]);

  if (exercises.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      {/* No aggregate badge here: every exercise card shows its own state, and
          a summary beside them just repeats what is already visible. */}
      <h2 className="text-sm font-semibold">Try it</h2>

      <p className="text-sm text-foreground-muted">
        Two short checks. They run the same way the practice problems do — write the
        function, press Run.
      </p>

      {exercises.map((exercise, i) => (
        <Node key={exercise.slug} tone="surface" className="p-4">
          <Disclosure
            // The first is open so the section is not a wall of closed rows;
            // the rest stay shut to keep the lesson readable at a glance.
            defaultOpen={i === 0}
            summary={
              <span className="flex flex-col">
                <span className="text-xs text-foreground-muted">Exercise {i + 1}</span>
                <span className="text-sm font-semibold">{exercise.title}</span>
              </span>
            }
            aside={
              hydrated && perExercise[i] ? <Badge state={BADGE_STATE[perExercise[i]]} /> : null
            }
          >
            <div className="flex flex-col gap-4">
              <Markdown>{exercise.brief}</Markdown>

              <Workspace
                compact
                tier="lesson"
                exerciseId={exerciseIds[i]}
                language={language}
                starterCode={exercise.starterCode[language] ?? ''}
                spec={exercise.testSpec}
                onSolved={handleSolved}
              />

              <Hints exerciseId={exerciseIds[i]} hints={exercise.hints} />
            </div>
          </Disclosure>
        </Node>
      ))}

      {hydrated && state === 'complete' && (
        <Node tone="strong" className="p-3 text-sm">
          Both checks pass — you have the pattern. The problems below are where it gets
          used in anger.
        </Node>
      )}
    </section>
  );
}
