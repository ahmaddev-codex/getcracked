import { Node } from '@/components/ui/Node';
import type { ActivityDay } from '@/lib/account';

/**
 * A year of submissions, one square per day.
 *
 * The value is not the count — it is seeing the gaps. A calendar of practice
 * makes consistency visible in a way a total never does, which is the entire
 * reason GitHub's and LeetCode's versions work.
 *
 * Rendered as one SVG rather than 365 elements: this sits on a page that is
 * mostly text, and a grid of divs is 365 layout boxes to shape for a picture
 * that never changes after paint. Rects also let the whole thing scale to its
 * container without per-square media queries.
 */

const CELL = 11;
const GAP = 3;
const WEEKS = 53;
const DAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Four steps, because more shades than that stop being distinguishable. */
function intensity(count: number): string {
  if (count === 0) return 'var(--surface-muted)';
  if (count < 3) return 'color-mix(in srgb, var(--accent-strong) 35%, var(--surface-muted))';
  if (count < 6) return 'color-mix(in srgb, var(--accent-strong) 70%, var(--surface-muted))';
  return 'var(--accent-strong)';
}

export function ActivityHeatmap({
  activity,
  activeDays,
  currentStreak,
  longestStreak,
}: {
  activity: readonly ActivityDay[];
  activeDays: number;
  currentStreak: number;
  longestStreak: number;
}) {
  const total = activity.reduce((sum, d) => sum + d.submissions, 0);

  // Align the first column to a Sunday so the rows are weekdays, as every
  // calendar heatmap does — otherwise the day labels mean nothing.
  const leading = activity.length > 0 ? new Date(activity[0].date + 'T00:00:00Z').getUTCDay() : 0;

  const width = WEEKS * (CELL + GAP) + 30;
  const height = 7 * (CELL + GAP) + 20;

  const monthMarks: Array<{ x: number; label: string }> = [];
  let lastMonth = -1;
  activity.forEach((day, index) => {
    const month = new Date(day.date + 'T00:00:00Z').getUTCMonth();
    const column = Math.floor((index + leading) / 7);
    if (month !== lastMonth && (index + leading) % 7 === 0) {
      monthMarks.push({ x: 30 + column * (CELL + GAP), label: MONTHS[month] });
      lastMonth = month;
    }
  });

  return (
    <Node tone="surface" className="flex flex-col gap-3 overflow-x-auto p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <p className="text-sm">
          <span className="font-semibold">{total}</span>{' '}
          <span className="text-foreground-muted">
            {total === 1 ? 'submission' : 'submissions'} in the past year
          </span>
        </p>
        <p className="flex flex-wrap gap-4 text-xs text-foreground-muted">
          <span>
            Active days <span className="font-semibold text-foreground">{activeDays}</span>
          </span>
          <span>
            Current streak{' '}
            <span className="font-semibold text-foreground">{currentStreak}</span>
          </span>
          <span>
            Longest streak{' '}
            <span className="font-semibold text-foreground">{longestStreak}</span>
          </span>
        </p>
      </div>

      <svg
        role="img"
        aria-label={`${total} submissions over the past year, across ${activeDays} active days.`}
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-2xl"
      >
        {monthMarks.map((mark) => (
          <text
            key={`${mark.label}-${mark.x}`}
            x={mark.x}
            y={9}
            fontSize="9"
            fill="var(--foreground-muted)"
          >
            {mark.label}
          </text>
        ))}

        {DAY_LABELS.map((label, row) =>
          label ? (
            <text
              key={label}
              x={0}
              y={20 + row * (CELL + GAP) + CELL - 2}
              fontSize="9"
              fill="var(--foreground-muted)"
            >
              {label}
            </text>
          ) : null,
        )}

        {activity.map((day, index) => {
          const slot = index + leading;
          return (
            <rect
              key={day.date}
              x={30 + Math.floor(slot / 7) * (CELL + GAP)}
              y={14 + (slot % 7) * (CELL + GAP)}
              width={CELL}
              height={CELL}
              rx={2}
              fill={intensity(day.submissions)}
            >
              {/* A native tooltip: no JavaScript, and it survives this being a
                  server component. */}
              <title>
                {day.submissions === 0
                  ? `No submissions on ${day.date}`
                  : `${day.submissions} on ${day.date}, ${day.passed} passing`}
              </title>
            </rect>
          );
        })}
      </svg>

      <p className="flex items-center gap-1.5 text-xs text-foreground-muted">
        Less
        {[0, 2, 5, 9].map((n) => (
          <svg key={n} width="11" height="11" aria-hidden>
            <rect width="11" height="11" rx="2" fill={intensity(n)} />
          </svg>
        ))}
        More
      </p>
    </Node>
  );
}
