import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DISCLOSURE_DISMISSED_KEY,
  PROMPT_GROWTH,
  PROMPT_THRESHOLD,
  noticeFor,
  readNotice,
  resetNoticeCache,
  serverNotice,
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

/**
 * Snapshot identity, which `useSyncExternalStore` requires and which is very
 * easy to get wrong.
 *
 * It compares snapshots by reference, so a function returning a fresh object
 * each call renders forever — React reports it as "the result of
 * getServerSnapshot should be cached to avoid an infinite loop". This shipped
 * twice in one file: the derived path was cached and the two paths that return a
 * *constant* were not, which is the easier half to overlook precisely because
 * they look too simple to need it.
 */
describe('snapshot identity', () => {
  const PROGRESS_KEY = 'gc.progress';
  const countSolved = () => 0;

  beforeEach(() => {
    localStorage.clear();
    resetNoticeCache();
    vi.restoreAllMocks();
  });

  it('returns the same object while storage is unchanged', () => {
    expect(readNotice(countSolved, PROGRESS_KEY)).toBe(readNotice(countSolved, PROGRESS_KEY));
  });

  it('returns the same object on every server render', () => {
    // The one that actually threw the warning.
    expect(serverNotice()).toBe(serverNotice());
  });

  it('returns the same object when storage is unavailable', () => {
    // A private window takes this path on *every* render, so a fresh object
    // here is an infinite loop for exactly the people least able to report it.
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    const first = readNotice(countSolved, PROGRESS_KEY);
    expect(first).toBe(readNotice(countSolved, PROGRESS_KEY));
    expect(first.kind).toBe('disclosure');
  });

  it('does return a new object once storage actually changes', () => {
    // The cache must not be so stable that dismissing does nothing.
    const before = readNotice(countSolved, PROGRESS_KEY);
    localStorage.setItem(DISCLOSURE_DISMISSED_KEY, '1');
    const after = readNotice(countSolved, PROGRESS_KEY);

    expect(after).not.toBe(before);
    expect(before.kind).toBe('disclosure');
    expect(after.kind).toBe('none');
  });

  it('recomputes when the solved count changes', () => {
    let solved = 0;
    const counter = () => solved;

    expect(readNotice(counter, PROGRESS_KEY).kind).toBe('disclosure');

    solved = PROMPT_THRESHOLD;
    // The count is read from the progress store, so the key has to move with it
    // or a solve would not re-derive.
    localStorage.setItem(PROGRESS_KEY, 'changed');
    expect(readNotice(counter, PROGRESS_KEY).kind).toBe('keep-progress');
  });
});
