import { describe, expect, it } from 'vitest';
import { recommend, STRUGGLE_THRESHOLD } from '@/lib/recommendations';
import { isPublicPath } from '@/lib/access';
import { getProblemSet, getProblems } from '@/content/registry';

/**
 * B16 — guidance, never gating.
 *
 * The most important assertions here are the negative ones: that nothing this
 * module produces can deny access. The module's only output is a message, so a
 * lock cannot be added without changing its signature.
 */

const base = {
  recommendedAfter: ['hashing'],
  lessonStates: {},
  dismissed: [],
};

describe('nothing is locked', () => {
  it('every problem route is public, regardless of prerequisites', () => {
    for (const problem of getProblems()) {
      expect(isPublicPath(`/problems/${problem.topic}/${problem.slug}`)).toBe(true);
    }
  });

  it('returns a message, never a permission', () => {
    const rec = recommend(base)!;
    // The shape itself is the guarantee: there is no boolean to misread.
    expect(Object.keys(rec).sort()).toEqual(['lessonSlug', 'message', 'reason']);
  });

  it('lists a problem set without consulting any progress', () => {
    // getProblemSet takes a topic and nothing else.
    expect(getProblemSet('hashing').length).toBeGreaterThan(0);
  });
});

describe('on arrival', () => {
  it('suggests the prerequisite when it has not been read', () => {
    const rec = recommend(base)!;
    expect(rec.reason).toBe('prerequisite-unread');
    expect(rec.lessonSlug).toBe('hashing');
  });

  it('says nothing once the prerequisite is complete', () => {
    expect(recommend({ ...base, lessonStates: { hashing: 'complete' } })).toBeNull();
  });

  it('still suggests when the lesson was only started, not finished', () => {
    expect(recommend({ ...base, lessonStates: { hashing: 'in_progress' } })).not.toBeNull();
  });

  it('says nothing when there are no prerequisites at all', () => {
    expect(recommend({ ...base, recommendedAfter: [] })).toBeNull();
  });

  it('phrases it as an invitation, not an instruction', () => {
    // Tone is load-bearing: this must not read as a wall.
    expect(recommend(base)!.message).toMatch(/welcome to dive straight in/i);
  });
});

describe('on struggle', () => {
  it('switches to a stronger nudge after repeated failures', () => {
    const rec = recommend({ ...base, consecutiveFailures: STRUGGLE_THRESHOLD })!;
    expect(rec.reason).toBe('struggling');
    expect(rec.message).toMatch(/stuck/i);
  });

  it('does not nudge before the threshold', () => {
    const rec = recommend({ ...base, consecutiveFailures: STRUGGLE_THRESHOLD - 1 })!;
    expect(rec.reason).toBe('prerequisite-unread');
  });

  it('nudges when every hint has been opened, however few failures', () => {
    const rec = recommend({ ...base, hintsExhausted: true })!;
    expect(rec.reason).toBe('struggling');
  });

  it('stays silent while struggling if the lesson is already done', () => {
    // They have read it. Telling them to read it again is not help.
    expect(
      recommend({
        ...base,
        lessonStates: { hashing: 'complete' },
        consecutiveFailures: 10,
        hintsExhausted: true,
      }),
    ).toBeNull();
  });
});

describe('dismissal is remembered', () => {
  it('says nothing more about a dismissed topic', () => {
    expect(recommend({ ...base, dismissed: ['hashing'] })).toBeNull();
  });

  it('stays silent even when the learner is struggling', () => {
    // A learner who said "I know this" is not asked twice, however it goes.
    expect(
      recommend({ ...base, dismissed: ['hashing'], consecutiveFailures: 99 }),
    ).toBeNull();
  });

  it('still suggests a different topic they have not dismissed', () => {
    const rec = recommend({
      recommendedAfter: ['hashing', 'two-pointers'],
      lessonStates: {},
      dismissed: ['hashing'],
    })!;
    expect(rec.lessonSlug).toBe('two-pointers');
  });
});

describe('multiple prerequisites', () => {
  it('suggests the earliest unread one', () => {
    // Sending someone to the third lesson when they have not read the first is
    // worse than saying nothing.
    const rec = recommend({
      recommendedAfter: ['hashing', 'two-pointers'],
      lessonStates: {},
      dismissed: [],
    })!;
    expect(rec.lessonSlug).toBe('hashing');
  });

  it('moves to the next once the first is done', () => {
    const rec = recommend({
      recommendedAfter: ['hashing', 'two-pointers'],
      lessonStates: { hashing: 'complete' },
      dismissed: [],
    })!;
    expect(rec.lessonSlug).toBe('two-pointers');
  });

  it('returns at most one, so guidance never becomes a stack of banners', () => {
    const rec = recommend({
      recommendedAfter: ['hashing', 'two-pointers'],
      lessonStates: {},
      dismissed: [],
    });
    expect(rec).not.toBeNull();
    expect(Array.isArray(rec)).toBe(false);
  });
});
