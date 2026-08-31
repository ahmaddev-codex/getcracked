import { describe, expect, it } from 'vitest';
import {
  PROMPT_GROWTH,
  PROMPT_THRESHOLD,
  noticeFor,
  type NoticeInputs,
} from '@/lib/signed-out-prompt';

/**
 * What a signed-out learner is told, and when (A16, A15).
 *
 * The rules here are the whole feature — the component only draws them — and
 * they encode a bug that shipped: the notice used to do disclosure and the
 * sign-up prompt in one sentence, shown on arrival, dismissible forever. So it
 * asked people to keep progress they did not have yet, they dismissed it
 * correctly, and it was gone by the time they had twelve solved problems worth
 * losing.
 */

const inputs = (over: Partial<NoticeInputs> = {}): NoticeInputs => ({
  solved: 0,
  disclosureDismissed: false,
  snoozedAt: null,
  ...over,
});

describe('disclosure', () => {
  it('is what a first-time visitor sees', () => {
    // A16: it has to appear before anything is recorded, so it cannot wait for
    // the learner to earn it.
    expect(noticeFor(inputs()).kind).toBe('disclosure');
  });

  it('stays gone once dismissed', () => {
    // A statement of fact. Repeating it adds nothing and trains people to
    // dismiss without reading.
    expect(noticeFor(inputs({ disclosureDismissed: true })).kind).toBe('none');
  });

  it('shows while there is nothing yet to keep', () => {
    // Below the threshold the prompt's sentence is not true, so the disclosure
    // is still the honest thing to say.
    expect(noticeFor(inputs({ solved: PROMPT_THRESHOLD - 1 })).kind).toBe('disclosure');
  });
});

describe('the keep-progress prompt', () => {
  it('appears once there is something to lose', () => {
    expect(noticeFor(inputs({ solved: PROMPT_THRESHOLD })).kind).toBe('keep-progress');
  });

  it('replaces the disclosure rather than stacking with it', () => {
    // Strictly more informative: it makes the same claim about recording *and*
    // names the stake. Two banners would be the nagging this design avoids.
    const both = noticeFor(inputs({ solved: PROMPT_THRESHOLD, disclosureDismissed: false }));
    expect(both.kind).toBe('keep-progress');
  });

  it('reaches someone who dismissed the disclosure long ago', () => {
    // The exact case that was broken: dismissed on day one, twelve solved by
    // week three, and nothing was ever said again.
    expect(
      noticeFor(inputs({ solved: 12, disclosureDismissed: true })).kind,
    ).toBe('keep-progress');
  });

  it('carries the real number, since that is what makes it land', () => {
    expect(noticeFor(inputs({ solved: 7 })).solved).toBe(7);
  });
});

describe('snoozing', () => {
  const snoozedAt = 10;

  /**
   * Dismissing the prompt settles the disclosure too, which the component
   * writes at the same moment.
   *
   * Without that, "Dismiss" swapped the prompt for the plain disclosure — the
   * banner downgraded rather than gone, needing a second click to actually
   * leave. The prompt already makes the disclosure's claim, so there is nothing
   * left to say.
   */
  const snoozed = (solved: number) =>
    inputs({ solved, snoozedAt, disclosureDismissed: true });

  it('stays quiet at the count it was dismissed at', () => {
    expect(noticeFor(snoozed(snoozedAt)).kind).toBe('none');
  });

  it('stays quiet while the stake has barely moved', () => {
    // Coming back to say the same thing is what makes a prompt noise.
    expect(noticeFor(snoozed(snoozedAt + PROMPT_GROWTH - 1)).kind).toBe('none');
  });

  it('returns when it has something new to say', () => {
    expect(noticeFor(snoozed(snoozedAt + PROMPT_GROWTH)).kind).toBe('keep-progress');
  });

  it('never returns for someone who stops solving', () => {
    // Correct rather than a gap: there is no new information, so there is
    // nothing to say. Growth is the whole rule and there is deliberately no
    // timer.
    for (const solved of [snoozedAt, snoozedAt + 1, snoozedAt + 2]) {
      expect(noticeFor(snoozed(solved)).kind).toBe('none');
    }
  });

  it('one dismissal is enough — it does not fall back to the disclosure', () => {
    // The bug this pairing exists to prevent, stated directly.
    expect(noticeFor(snoozed(snoozedAt)).kind).not.toBe('disclosure');
  });

  it('does not resurrect the disclosure behind it', () => {
    // Snoozing the prompt must not fall through to a banner the learner already
    // dismissed months earlier.
    expect(
      noticeFor(inputs({ solved: 10, snoozedAt: 10, disclosureDismissed: true })).kind,
    ).toBe('none');
  });
});

describe('the thresholds themselves', () => {
  it('let a learner reach the prompt in one sitting', () => {
    // High enough that "you have work to lose" is true, low enough that it is
    // not a milestone nobody hits.
    expect(PROMPT_THRESHOLD).toBeGreaterThan(1);
    expect(PROMPT_THRESHOLD).toBeLessThanOrEqual(5);
  });

  it('require real growth before a snoozed prompt returns', () => {
    expect(PROMPT_GROWTH).toBeGreaterThanOrEqual(PROMPT_THRESHOLD);
  });
});
