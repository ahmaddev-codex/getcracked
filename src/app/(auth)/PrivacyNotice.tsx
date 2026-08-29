/**
 * Shown at sign-up, per the PRD Open Question 7 decision.
 *
 * Deliberately states what is *not* collected as well as what is: signed-out
 * visitors are not tracked at all, and saying so is the honest counterpart to
 * asking a learner to create an account.
 */
export function PrivacyNotice() {
  return (
    <p className="text-xs leading-relaxed opacity-70">
      Creating an account lets us save your progress across devices. We record
      what you complete, which hints you open, and how your test runs go, so we
      can tell which lessons actually work. We don&apos;t track visitors who
      aren&apos;t signed in, and we don&apos;t sell anything to anyone.
    </p>
  );
}
