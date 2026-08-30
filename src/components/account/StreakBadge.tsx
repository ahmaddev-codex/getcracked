'use client';

import { useEffect, useState } from 'react';
import { Flame } from 'lucide-react';

/**
 * The current practice streak, in the header.
 *
 * A streak only works if it is visible constantly — buried on a profile page it
 * is a statistic, in the header it is a reason to come back. That is the whole
 * argument for it, and why the reference puts it beside the avatar.
 *
 * Shown at zero too. Hiding it until there was something to show meant a new
 * account never saw the affordance at all, so nobody learned it existed — and
 * the reference shows a zero for exactly that reason. The flame is muted rather
 * than absent, which reads as "not started" instead of as a scolding.
 */
export function StreakBadge() {
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    let cancelled = false;

    void fetch('/api/progress/solved')
      .then((res) => (res.ok ? res.json() : { currentStreak: 0 }))
      .then((data: { currentStreak?: number }) => {
        if (!cancelled) setStreak(data.currentStreak ?? 0);
      })
      .catch(() => {
        // A missing streak is not worth surfacing an error for.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      className="flex items-center gap-1 text-sm"
      title={
        streak > 0
          ? `${streak} day practice streak`
          : 'No streak yet — practise two days in a row to start one'
      }
    >
      <Flame
        size={14}
        aria-hidden
        className={streak > 0 ? 'text-accent-strong' : 'text-header-foreground opacity-40'}
      />
      <span className={streak > 0 ? 'font-semibold' : 'opacity-60'}>{streak}</span>
      <span className="sr-only">day practice streak</span>
    </span>
  );
}
