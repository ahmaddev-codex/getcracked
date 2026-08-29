import { describe, expect, it } from 'vitest';
import {
  findLesson,
  getLessons,
  getLessonPosition,
  getProblemSet,
  RAW_LESSONS,
} from '@/content/registry';
import { lessonSchema } from '@/content/schema';
import { isPublicPath } from '@/lib/access';

/**
 * The Learn surface (B9, B10) and, most importantly, B14 — read-ahead.
 *
 * The read-ahead tests are structural rather than behavioural on purpose: they
 * assert that nothing in the lesson path *can* consult progress, so the property
 * holds by construction rather than by everyone remembering not to break it.
 */

describe('authored lessons', () => {
  it('validate against the schema', () => {
    for (const raw of RAW_LESSONS) {
      const parsed = lessonSchema.safeParse(raw);
      expect(parsed.success, `${raw.slug}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true);
    }
  });

  it('has at least two, so ordering and prerequisites are exercised by real content', () => {
    expect(getLessons().length).toBeGreaterThanOrEqual(2);
  });

  it('has unique slugs', () => {
    const slugs = getLessons().map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('is returned in curriculum order', () => {
    const orders = getLessons().map((l) => l.order);
    expect(orders).toEqual([...orders].sort((a, b) => a - b));
  });

  it('declares at least one prerequisite relationship somewhere', () => {
    expect(getLessons().some((l) => l.recommendedAfter.length > 0)).toBe(true);
  });

  it('only ever recommends lessons that exist', () => {
    // A dangling recommendation would render a link to nothing.
    const slugs = new Set(getLessons().map((l) => l.slug));
    for (const lesson of getLessons()) {
      for (const prereq of lesson.recommendedAfter) {
        expect(slugs.has(prereq), `${lesson.slug} recommends missing "${prereq}"`).toBe(true);
      }
    }
  });

  it('never recommends a lesson that comes later in the curriculum', () => {
    const order = new Map(getLessons().map((l) => [l.slug, l.order]));
    for (const lesson of getLessons()) {
      for (const prereq of lesson.recommendedAfter) {
        expect(order.get(prereq)!).toBeLessThan(lesson.order);
      }
    }
  });
});

describe('lesson content shape (B10)', () => {
  it.each(getLessons().map((l) => [l.slug, l] as const))('%s teaches in the fixed shape', (_slug, lesson) => {
    expect(lesson.explainer.length).toBeGreaterThan(200);
    expect(lesson.patternCues.length).toBeGreaterThan(0);
    expect(lesson.pitfalls.length).toBeGreaterThan(0);
    expect(lesson.complexity?.time).toBeTruthy();
    expect(lesson.complexity?.space).toBeTruthy();
  });
});

describe('read-ahead is unrestricted (B14)', () => {
  it('serves the last lesson without the first having been read', () => {
    const last = getLessons().at(-1)!;
    // Lookup takes a slug and nothing else — there is no progress argument to
    // pass, so a lock could not be added here without changing the signature.
    expect(findLesson(last.slug)).toBeDefined();
  });

  it('exposes every lesson route publicly, with no session needed', () => {
    for (const lesson of getLessons()) {
      expect(isPublicPath(`/learn/dsa/${lesson.slug}`)).toBe(true);
    }
    expect(isPublicPath('/learn/dsa')).toBe(true);
  });

  it('keeps prerequisites as data, never as a gate', () => {
    const gated = getLessons().find((l) => l.recommendedAfter.length > 0)!;
    // The relationship exists and is still freely readable.
    expect(gated.recommendedAfter.length).toBeGreaterThan(0);
    expect(findLesson(gated.slug)).toBeDefined();
  });

  it('links a lesson to its problems without consulting progress', () => {
    // getProblemSet takes a topic only; there is nowhere to pass a user.
    expect(getProblemSet('hashing').length).toBeGreaterThan(0);
  });
});

describe('lesson navigation', () => {
  it('reports position and neighbours', () => {
    const first = getLessons()[0];
    const { index, total, previous, next } = getLessonPosition(first);

    expect(index).toBe(0);
    expect(total).toBe(getLessons().length);
    expect(previous).toBeUndefined();
    expect(next?.slug).toBe(getLessons()[1].slug);
  });

  it('has no next on the final lesson', () => {
    expect(getLessonPosition(getLessons().at(-1)!).next).toBeUndefined();
  });
});
