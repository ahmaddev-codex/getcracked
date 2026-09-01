import { Page } from '@/components/ui/Page';
import { Leaderboard } from '@/components/community/Leaderboard';

/**
 * Community Leaderboard page (Module G3).
 *
 * Public and unauthed — every learner can see the rankings. The leaderboard
 * is seeded with phantom entries so it is never empty at launch.
 */
export const metadata = {
  title: 'Leaderboard — GetCracked',
  description:
    'See who is cracking it. Problems solved, longest streaks, challenges built — ranked and updated live.',
};

export default function LeaderboardPage() {
  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-2 bg-surface p-6">
        <h1 className="font-sans text-4xl font-bold tracking-tight sm:text-5xl">Leaderboard</h1>
        <p className="max-w-2xl text-sm text-foreground-muted">
          See who is cracking it. Problems solved, longest streaks, challenges built —
          ranked and updated as you practise.
        </p>
      </header>

      <Leaderboard />
    </Page>
  );
}
