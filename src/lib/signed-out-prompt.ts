/**
 * What to say to a signed-out learner, and when (A16, A15).
 *
 * One banner slot, two different messages, and the second has to be *earned*.
 *
 * **The problem this exists to fix.** The notice used to do both jobs at once
 * and show on arrival, which meant "sign in to keep your progress" was asking
 * someone to create an account to preserve nothing. They dismissed it — the
 * correct response — and the dismissal was permanent. So three weeks and twelve
 * solved problems later, at the moment the message was finally worth something,
 * there was no prompt at all. It spoke when it was worthless and went silent
 * when it became valuable.
 *
 * The two jobs have opposite timing requirements, which is why they are now
 * separate messages rather than one sentence:
 *
 * | | Must appear | May be dismissed |
 * |---|---|---|
 * | **Disclosure** — activity is recorded | Before anything is recorded, so: on arrival | Forever. It is a statement of fact and repeating it adds nothing |
 * | **Keep your progress** — you have something to lose | Once there is something to lose | Until it has something *new* to say |
 *
 * They are never both shown. Once the prompt qualifies it replaces the
 * disclosure, because it is strictly more informative: it makes the same claim
 * about recording *and* names what is at stake.
 *
 * For the same reason, dismissing the prompt settles the disclosure too. If it
 * did not, "Dismiss" would swap the prompt for the plain disclosure — the banner
 * downgraded rather than gone, needing a second click to actually leave. One
 * dismissal, one outcome.
 */

export const DISCLOSURE_DISMISSED_KEY = 'gc.notice.dismissed';
export const PROMPT_SNOOZE_KEY = 'gc.notice.snoozed';

/**
 * Solved items before the prompt is worth showing.
 *
 * Low enough that a learner reaches it in one sitting, high enough that the
 * sentence is true: at one solved problem, "you have work to lose" is a stretch.
 */
export const PROMPT_THRESHOLD = 3;

/**
 * Further solves before a snoozed prompt returns.
 *
 * **Growth is the whole re-show rule, and there is deliberately no timer.** A
 * prompt that comes back after a week saying exactly what it said before is
 * nagging, and it trains people to dismiss without reading. One that comes back
 * saying "now twelve" is new information about a stake that genuinely grew. A
 * learner who never solves anything else never sees it again, which is correct.
 */
export const PROMPT_GROWTH = 5;

export type NoticeKind =
  /** Activity is recorded. Shown until dismissed. */
  | 'disclosure'
  /** You have N solved and they live in this browser. Shown once earned. */
  | 'keep-progress'
  | 'none';

export interface NoticeState {
  kind: NoticeKind;
  /** Completed items held locally — the number the prompt actually says. */
  solved: number;
}

export interface NoticeInputs {
  solved: number;
  disclosureDismissed: boolean;
  /** Solved count when the prompt was last snoozed, or null if it never was. */
  snoozedAt: number | null;
}

export function noticeFor({
  solved,
  disclosureDismissed,
  snoozedAt,
}: NoticeInputs): NoticeState {
  const earned = solved >= PROMPT_THRESHOLD;
  const somethingNew = snoozedAt === null || solved >= snoozedAt + PROMPT_GROWTH;

  // Checked first: where both would apply, the prompt is the better of the two.
  if (earned && somethingNew) return { kind: 'keep-progress', solved };
  if (!disclosureDismissed) return { kind: 'disclosure', solved };
  return { kind: 'none', solved };
}

/** Reads both flags and the count, tolerating storage being unavailable. */
export function readNoticeInputs(solved: number): NoticeInputs {
  let disclosureDismissed = false;
  let snoozedAt: number | null = null;

  try {
    disclosureDismissed = localStorage.getItem(DISCLOSURE_DISMISSED_KEY) === '1';
    const raw = localStorage.getItem(PROMPT_SNOOZE_KEY);
    // A malformed value means "never snoozed" rather than "snoozed at NaN",
    // which would make `solved >= NaN + 5` false forever and silence the prompt
    // permanently — a storage glitch should not be able to do that.
    const parsed = raw === null ? Number.NaN : Number(raw);
    snoozedAt = Number.isFinite(parsed) ? parsed : null;
  } catch {
    // Private mode or blocked site data: nothing was dismissed, so the
    // disclosure shows. Failing towards *more* disclosure is the safe direction.
  }

  return { solved, disclosureDismissed, snoozedAt };
}

/**
 * Stable snapshots for `useSyncExternalStore`.
 *
 * It compares snapshots by identity, so a function returning a fresh object
 * literal each call re-renders forever — React catches it as "the result of
 * getServerSnapshot should be cached to avoid an infinite loop". That is easy to
 * get right for the main path and easy to forget on the two that return a
 * constant, which is exactly what happened here: the cached path was handled and
 * both the server snapshot and the storage-unavailable fallback were not.
 *
 * So the constants are module-level and the derivation is cached against the raw
 * strings it reads. Nothing below allocates unless the underlying storage
 * actually changed.
 */
export const NOTICE_NONE: NoticeState = Object.freeze({ kind: 'none', solved: 0 });
export const NOTICE_DISCLOSURE_ONLY: NoticeState = Object.freeze({
  kind: 'disclosure',
  solved: 0,
});

let cachedKey: string | null = null;
let cachedNotice: NoticeState = NOTICE_NONE;

/**
 * Reads storage and decides what to show, returning the *same object* until one
 * of the three values it depends on changes.
 *
 * `countSolved` is injected rather than imported so this module stays free of
 * the progress store — and so a test can drive it without writing progress.
 */
export function readNotice(
  countSolved: () => number,
  progressKey: string,
): NoticeState {
  let key: string;
  try {
    key = [
      localStorage.getItem(progressKey),
      localStorage.getItem(DISCLOSURE_DISMISSED_KEY),
      localStorage.getItem(PROMPT_SNOOZE_KEY),
    ].join('|');
  } catch {
    // Private mode or blocked site data. Failing towards *more* disclosure is
    // the safe direction — and this returns the shared constant, because it is
    // the path a private window takes on every single render.
    return NOTICE_DISCLOSURE_ONLY;
  }

  if (key === cachedKey) return cachedNotice;

  cachedKey = key;
  cachedNotice = noticeFor(readNoticeInputs(countSolved()));
  return cachedNotice;
}

/** The server sees no storage, so it never has anything to say. */
export function serverNotice(): NoticeState {
  return NOTICE_NONE;
}

/** Test seam: the cache is module state and would leak between cases. */
export function resetNoticeCache(): void {
  cachedKey = null;
  cachedNotice = NOTICE_NONE;
}
