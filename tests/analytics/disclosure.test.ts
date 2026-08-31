import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { isPublicPath } from '@/lib/access';

/**
 * The disclosure surfaces have to agree with the code (A16, PRD Q7).
 *
 * Privacy is disclosed here as a *product surface* — a banner a signed-out
 * visitor sees, and the account page for someone who signed in — rather than as
 * a policy page nobody opens. That is a better decision and a more fragile one:
 * a policy page is stale in a way nobody acts on, whereas a banner someone reads
 * is a claim they rely on.
 *
 * It had already drifted once. The sign-up form carried a note saying "we don't
 * track visitors who aren't signed in" while `analytics/device.ts` had been
 * assigning signed-out visitors a rotating id since T0.5, and the banner three
 * components away said so out loud. Nothing caught it, because nothing was
 * looking — the surfaces are in different directories and neither imports the
 * thing it describes.
 *
 * **That note has since been removed entirely** (2026-08-31, by request), which
 * changes where the obligation sits rather than removing it: the banner is now
 * the only surface that discloses *before* anything is recorded, and the account
 * page is the only one that says what is held afterwards. So both are checked
 * here, and the check that the sign-up path makes no false claim is now a check
 * that it makes no claim at all.
 */

const SIGNED_OUT_NOTICE = readFileSync('src/app/SignedOutNotice.tsx', 'utf8');
const ACCOUNT_PAGE = readFileSync('src/app/account/page.tsx', 'utf8');
const SIGN_UP_FORM = readFileSync('src/components/auth/SignUpForm.tsx', 'utf8');
const LAYOUT = readFileSync('src/app/layout.tsx', 'utf8');

/** JSX prose, with entities and wrapping removed so phrases match across lines. */
function prose(source: string): string {
  return source
    .replace(/&apos;/g, "'")
    .replace(/\{'[^']*'\}/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/** Every surface that makes a claim about what is recorded. */
const SURFACES = {
  'the signed-out banner': SIGNED_OUT_NOTICE,
  'the account page': ACCOUNT_PAGE,
  'the sign-up form': SIGN_UP_FORM,
};

describe('signed-out measurement is happening', () => {
  it('the endpoint accepts writes without a session', () => {
    // The premise of everything below. If this ever becomes false the
    // disclosure should change with it, rather than these tests being deleted.
    expect(isPublicPath('/api/events')).toBe(true);
  });
});

describe('no surface denies it', () => {
  it.each(Object.entries(SURFACES))('%s makes no false claim', (_name, source) => {
    // The exact regression, checked everywhere rather than only where it
    // happened: a denial is worse than silence, and it is the one thing none of
    // these may say.
    const text = prose(source);
    for (const denial of [
      "don't track visitors who aren't signed in",
      'do not track visitors who are not signed in',
      "we don't track",
      'we do not track',
      'no tracking',
      'not tracked',
    ]) {
      expect(text, `claims: ${denial}`).not.toContain(denial);
    }
  });
});

describe('the banner carries the disclosure', () => {
  it('says activity is recorded', () => {
    // It is now the only surface that says so *before* anything is recorded, so
    // this is the load-bearing one.
    expect(prose(SIGNED_OUT_NOTICE)).toMatch(/we count anonymous usage|we record/);
  });

  it('describes the identifier honestly', () => {
    // What makes anonymous measurement defensible is that the id is random and
    // rotates. A disclosure that omits it describes a different system.
    expect(prose(SIGNED_OUT_NOTICE)).toMatch(/random id/);
    expect(prose(SIGNED_OUT_NOTICE)).toMatch(/resets monthly|resets every month|rotat/);
  });
});

describe('the account page says what is held', () => {
  it('names what is recorded, not only where it is stored', () => {
    const text = prose(ACCOUNT_PAGE);
    expect(text).toMatch(/what you complete/);
    expect(text).toMatch(/hints/);
  });

  it('says the same is true signed out', () => {
    // Someone reading their account page should not come away thinking the
    // recording started when they signed up.
    expect(prose(ACCOUNT_PAGE)).toMatch(/signed out/);
  });
});

describe('third-party measurement', () => {
  it('is limited to the two Vercel components, both cookieless', () => {
    // A guard on scope rather than on presence. Analytics and Speed Insights are
    // cookieless and carry no identifier of ours; a vendor that is neither would
    // need the surfaces above rewritten before it could ship, and this is what
    // makes that a conscious step.
    //
    // `@/` is this project's own path alias, not a scope — excluded, or every
    // internal import would read as a vendor.
    const thirdParty = [...LAYOUT.matchAll(/from "(@(?!\/)[^"]+)"/g)].map((m) => m[1]);
    expect(thirdParty.sort()).toEqual(['@vercel/analytics/next', '@vercel/speed-insights/next']);
  });

  it('is not claimed to be absent', () => {
    // "No third parties at all" would be the easy sentence to write and would
    // now be false.
    for (const source of Object.values(SURFACES)) {
      expect(prose(source)).not.toContain('no third parties');
    }
  });
});
