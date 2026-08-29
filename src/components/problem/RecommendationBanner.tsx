'use client';

import Link from 'next/link';
import { useSyncExternalStore } from 'react';
import { Node } from '@/components/ui/Node';
import { readDismissals, dismissTopic, subscribeToDismissals } from '@/lib/dismissals';
import { readLocalProgress } from '@/lib/progress-local';
import { recommend } from '@/lib/recommendations';
import { useHydrated } from '@/lib/use-hydrated';
import type { ProgressState } from '@/lib/progress';

/**
 * Surfaces at most one recommendation (B16).
 *
 * Renders nothing when there is nothing to say, and is dismissible. It never
 * blocks the page and never covers the editor — a suggestion that gets in the
 * way of the thing it is suggesting about would be a lock with extra steps.
 */
export function RecommendationBanner({
  recommendedAfter,
  lessonExerciseIds,
  consecutiveFailures = 0,
  hintsExhausted = false,
}: {
  recommendedAfter: string[];
  /** Exercise ids per prerequisite lesson, so its state can be derived. */
  lessonExerciseIds: Record<string, string[]>;
  consecutiveFailures?: number;
  hintsExhausted?: boolean;
}) {
  const hydrated = useHydrated();

  const snapshot = useSyncExternalStore(
    subscribeToDismissals,
    () => JSON.stringify({ d: readDismissals(), p: readLocalProgress() }),
    () => JSON.stringify({ d: [], p: [] }),
  );

  if (!hydrated) return null;

  const { d: dismissed, p: progress } = JSON.parse(snapshot) as {
    d: string[];
    p: Array<{ exerciseId: string; state: ProgressState }>;
  };

  const done = new Set(progress.filter((e) => e.state === 'complete').map((e) => e.exerciseId));
  const lessonStates: Record<string, ProgressState> = {};
  for (const [slug, ids] of Object.entries(lessonExerciseIds)) {
    lessonStates[slug] =
      ids.length > 0 && ids.every((id) => done.has(id)) ? 'complete' : 'not_started';
  }

  const recommendation = recommend({
    recommendedAfter,
    lessonStates,
    dismissed,
    consecutiveFailures,
    hintsExhausted,
  });
  if (!recommendation) return null;

  return (
    <Node tone="muted" className="flex flex-wrap items-center justify-between gap-3 p-3">
      <p className="text-sm">
        {recommendation.message}{' '}
        <Link
          href={`/learn/dsa/${recommendation.lessonSlug}`}
          className="text-link underline underline-offset-2"
        >
          Read it
        </Link>
      </p>
      <button
        onClick={() => dismissTopic(recommendation.lessonSlug)}
        className="text-xs text-foreground-muted underline underline-offset-2"
      >
        Don&apos;t suggest this again
      </button>
    </Node>
  );
}
