import Link from 'next/link';
import { redirect } from 'next/navigation';
import { KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { Node } from '@/components/ui/Node';
import { Avatar } from '@/components/account/Avatar';
import { ActivityHeatmap } from '@/components/account/ActivityHeatmap';
import { DifficultyBreakdown } from '@/components/account/DifficultyBreakdown';
import { StatCard } from '@/components/account/StatCard';
import { getAccountSummary, methodLabel } from '@/lib/account';
import { getSession } from '@/lib/session';
import { Page } from '@/components/ui/Page';

/**
 * The account page (A2, A10).
 *
 * It was two lines — a heading and an email address — which told a signed-in
 * learner nothing they did not already know and gave them nothing to do. This
 * is the page that has to answer "what is this account actually holding for
 * me?", because that is the only argument for having one (§2.6).
 *
 * Server-rendered against the authoritative session (AD-5): middleware proves a
 * cookie exists, this proves the session record does.
 */
export const metadata = {
  title: 'Your account — GetCracked',
};

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect('/sign-in?next=/account');

  const summary = await getAccountSummary(session.user.id);
  const joined = new Date(session.user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Page width="catalog">
      <header className="node-surface flex flex-col gap-3 bg-surface p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar
            src={session.user.image}
            name={session.user.name}
            email={session.user.email}
            size={56}
            className="h-14 w-14 text-xl"
          />
          <div className="flex flex-col gap-0.5">
            <h1 className="font-sans text-3xl font-bold tracking-tight sm:text-4xl">
              {session.user.name || 'Your account'}
            </h1>
            <p className="flex items-center gap-1.5 text-sm text-foreground-muted">
              <Mail size={14} aria-hidden />
              {session.user.email}
            </p>
            <p className="text-xs text-foreground-muted">Joined {joined}</p>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Practice</h2>
        <DifficultyBreakdown tallies={summary.byDifficulty} />

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Lesson exercises"
            value={summary.completedExercises}
            of={summary.totalExercises}
          />
          <StatCard
            label="Build steps"
            value={summary.completedSteps}
            of={summary.totalSteps}
          />
          <StatCard
            label="In progress"
            value={summary.inProgress}
            hint={
              summary.inProgress > 0 ? 'Started but not yet passing.' : 'Nothing part-finished.'
            }
          />
          <StatCard
            label="Current streak"
            value={summary.currentStreak}
            hint={
              summary.longestStreak > 0
                ? `Longest ${summary.longestStreak} days.`
                : 'Practise on two days in a row to start one.'
            }
          />
        </div>

        {summary.languages.length > 0 && (
          <p className="text-xs text-foreground-muted">
            You have submitted in {summary.languages.join(' and ')}.
          </p>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Activity</h2>
        <ActivityHeatmap
          activity={summary.activity}
          activeDays={summary.activeDays}
          currentStreak={summary.currentStreak}
          longestStreak={summary.longestStreak}
        />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">How you sign in</h2>
        <Node tone="surface" className="flex flex-col divide-y divide-border-subtle p-0">
          {summary.methods.map((method) => (
            <div
              key={method.providerId}
              className="flex flex-wrap items-center justify-between gap-2 p-4"
            >
              <span className="flex items-center gap-2 text-sm font-medium">
                {method.providerId === 'credential' ? (
                  <KeyRound size={15} aria-hidden />
                ) : (
                  <ShieldCheck size={15} aria-hidden />
                )}
                {methodLabel(method.providerId)}
              </span>
              <span className="text-xs text-foreground-muted">
                Added {method.linkedAt.toLocaleDateString()}
              </span>
            </div>
          ))}
        </Node>
        <p className="text-xs text-foreground-muted">
          {/*
            Stated rather than left to be discovered: someone who signed up with
            a password and later used Google reasonably wonders whether they now
            have two accounts. They do not — linking is on for verified
            providers, and their progress stayed in one place.
          */}
          Signing in with a provider that uses the same email address links to this account
          rather than creating a second one, so your progress stays in one place.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Your data</h2>
        <Node tone="muted" className="flex flex-col gap-2 p-4 text-sm">
          <p className="text-foreground-muted">
            Progress is stored against this account so it follows you across devices: what you
            complete, which hints you open, how your test runs go, and when you were last
            active. We read it to see which lessons actually work.
          </p>
          <p className="text-foreground-muted">
            Everything on GetCracked is readable and runnable without an account — signing in
            adds the record, not the access. Signed out, the same activity is counted against a
            random id that resets every month.
          </p>
          <p className="text-foreground-muted">
            Want it gone? Email us and we will delete the account and everything attached to
            it. Self-service deletion is not built yet, and saying so is better than a button
            that does not work.
          </p>
        </Node>
      </section>

      <p className="text-sm text-foreground-muted">
        Back to{' '}
        <Link href="/dashboard" className="text-link underline underline-offset-2">
          your dashboard
        </Link>
        .
      </p>
    </Page>
  );
}
