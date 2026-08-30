import { beforeEach, describe, expect, it } from 'vitest';
import { setTopicStatus } from '@/lib/topic-status';

/**
 * Self-reported topic status (K4).
 *
 * Kept deliberately separate from `deriveLessonState`, which reports what a
 * learner has actually completed. These tests exist mainly to pin that
 * separation: a self-mark must never look like a completion record.
 */

function stored(): Record<string, string> {
  const raw = globalThis.localStorage.getItem('gc.topic-status.v1');
  return raw ? (JSON.parse(raw) as Record<string, string>) : {};
}

describe('topic status', () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it('records a status against a topic', () => {
    setTopicStatus('arrays', 'done');
    expect(stored()).toEqual({ arrays: 'done' });
  });

  it('replaces rather than accumulates when the status changes', () => {
    setTopicStatus('arrays', 'learning');
    setTopicStatus('arrays', 'skipped');
    expect(stored()).toEqual({ arrays: 'skipped' });
  });

  it('removes the entry when cleared, rather than storing "none"', () => {
    // A stored "none" would be indistinguishable from a status the UI has to
    // render, and would grow the record for every topic a learner ever opened.
    setTopicStatus('arrays', 'done');
    setTopicStatus('arrays', 'none');
    expect(stored()).toEqual({});
  });

  it('keeps topics independent', () => {
    setTopicStatus('arrays', 'done');
    setTopicStatus('graphs', 'learning');
    expect(stored()).toEqual({ arrays: 'done', graphs: 'learning' });
  });

  it('survives corrupt stored JSON rather than throwing', () => {
    // A thrown error here would take down the roadmap, and a missing status is
    // a perfectly valid state to fall back to.
    globalThis.localStorage.setItem('gc.topic-status.v1', '{not json');
    expect(() => setTopicStatus('arrays', 'done')).not.toThrow();
    expect(stored()).toEqual({ arrays: 'done' });
  });
});
