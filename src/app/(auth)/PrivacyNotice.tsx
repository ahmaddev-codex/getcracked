/**
 * Shown at sign-up, per the PRD Open Question 7 decision.
 *
 * **Corrected 2026-08-31.** This previously said "we don't track visitors who
 * aren't signed in", which had not been true since T0.5: the Phase 0 privacy
 * decision was to measure *both* tiers — signed in by account, signed out by a
 * rotating device id (A16) — and `lib/analytics/device.ts` has done exactly
 * that ever since. The signed-out banner says so plainly; this said the
 * opposite, so the two disclosure surfaces contradicted each other and the one
 * shown at the moment of consent was the false one.
 *
 * Adding Vercel Analytics is what surfaced it, and it would have made the claim
 * worse rather than merely stale. Disclosure is treated as a product surface
 * here rather than a policy page (A16), which only means anything if it stays
 * accurate when the measurement changes.
 *
 * It still states what is *not* collected, because that is the honest
 * counterpart to asking someone to create an account — the list is just true
 * now.
 */
export function PrivacyNotice() {
  return (
    <p className="text-xs leading-relaxed opacity-70">
      Creating an account lets us save your progress across devices. We record
      what you complete, which hints you open, and how your test runs go, so we
      can tell which lessons actually work. Signed out, we count the same
      activity against a random id that resets every month — never a name, an
      email, or anything about your device. No advertising, no third-party
      profiling, and nothing sold to anyone.
    </p>
  );
}
