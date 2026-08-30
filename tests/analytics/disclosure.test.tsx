import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PrivacyNotice } from '@/app/(auth)/PrivacyNotice';
import { isPublicPath } from '@/lib/access';

/**
 * The disclosure surfaces have to agree with the code (A16, PRD Q7).
 *
 * Privacy is disclosed here as a *product surface* — a banner a signed-out
 * visitor sees and a note at the moment of sign-up — rather than as a policy
 * page nobody opens. That is a better decision and a more fragile one: a policy
 * page is stale in a way nobody acts on, whereas a sentence shown at the moment
 * of consent is a claim someone relies on.
 *
 * It had already drifted. `PrivacyNotice` said "we don't track visitors who
 * aren't signed in" while `analytics/device.ts` had been assigning signed-out
 * visitors a rotating id since T0.5, and the banner three components away said
 * so out loud. Nothing caught it, because nothing was looking — the two
 * surfaces are in different directories and neither imports the thing it
 * describes.
 *
 * So this couples them: the copy is read as text and checked against what the
 * code actually does.
 */

const PRIVACY_NOTICE = readFileSync('src/app/(auth)/PrivacyNotice.tsx', 'utf8');
const SIGNED_OUT_NOTICE = readFileSync('src/app/SignedOutNotice.tsx', 'utf8');
const LAYOUT = readFileSync('src/app/layout.tsx', 'utf8');

/** JSX prose, with entities and wrapping removed so phrases match across lines. */
function prose(source: string): string {
  return source
    .replace(/&apos;/g, "'")
    .replace(/\{'[^']*'\}/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

describe('signed-out measurement is disclosed, not denied', () => {
  it('is actually happening — the endpoint accepts writes without a session', () => {
    // The premise of everything below. If this ever becomes false, the
    // disclosure should change with it rather than these tests being deleted.
    expect(isPublicPath('/api/events')).toBe(true);
  });

  it('the sign-up notice does not claim otherwise', () => {
    // The exact regression: a denial shown at the moment of consent, while the
    // banner on every other page said the opposite.
    const text = prose(PRIVACY_NOTICE);
    for (const denial of [
      "don't track visitors who aren't signed in",
      'do not track visitors who are not signed in',
      "we don't track signed-out",
      'we do not track signed-out',
    ]) {
      expect(text, `PrivacyNotice still claims: ${denial}`).not.toContain(denial);
    }
  });

  it('both surfaces say signed-out activity is measured', () => {
    // Not the same words — one is a banner and one is a consent note — but both
    // have to make the claim, because a learner may only ever see one of them.
    expect(prose(SIGNED_OUT_NOTICE)).toMatch(/anonymous usage|we record|we count/);
    expect(prose(PRIVACY_NOTICE)).toMatch(/signed out|signed-out/);
  });

  it('the sign-up notice describes the identifier honestly', () => {
    // What makes the tracking defensible is that the id is random and rotates.
    // A disclosure that omits that is describing a different system.
    const text = prose(PRIVACY_NOTICE);
    expect(text).toMatch(/random id|rotat|resets/);
  });
});

describe('third-party measurement', () => {
  it('is limited to the two Vercel components, both cookieless', () => {
    // A guard on scope rather than on presence. Analytics and Speed Insights
    // are cookieless and carry no identifier of ours; a vendor that is neither
    // would need the disclosure above rewritten before it could ship, and this
    // is what makes that a conscious step.
    // `@/` is this project's own path alias, not a scope — excluded, or every
    // internal import would read as a vendor.
    const thirdParty = [...LAYOUT.matchAll(/from "(@(?!\/)[^"]+)"/g)].map((m) => m[1]);
    expect(thirdParty.sort()).toEqual(['@vercel/analytics/next', '@vercel/speed-insights/next']);
  });

  it('is not claimed to be absent', () => {
    // "No third parties at all" would be the easy sentence to write and would
    // now be false.
    expect(prose(PRIVACY_NOTICE)).not.toContain('no third parties');
  });
});

/**
 * Rendered, not just read as source.
 *
 * The sign-up page cannot be checked by fetching it: the form calls
 * `useSearchParams`, so what prerenders is the Suspense fallback and the real
 * copy only appears after hydration. Reading the file catches a rewrite;
 * rendering it catches the component being changed to render something else.
 */
describe('the notice a learner actually sees', () => {
  it('says what is recorded, signed in and signed out', () => {
    render(<PrivacyNotice />);
    const text = screen.getByText(/Creating an account/).textContent ?? '';

    expect(text).toMatch(/what you complete/i);
    expect(text).toMatch(/signed out/i);
    expect(text).toMatch(/resets every month/i);
    expect(text).not.toMatch(/don.t track/i);
  });
});
