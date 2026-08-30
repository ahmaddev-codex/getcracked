import { beforeEach, describe, expect, it, vi } from 'vitest';
import { clearDraft, draftKey, readDraft, writeDraft } from '@/lib/drafts';

/**
 * Draft storage, and the two things tier 3 changed about it.
 *
 * A build challenge edits several files under one scope, and it re-seeds the
 * editor every time a learner switches tab — which turned a previously harmless
 * weakness (a blocked `localStorage` silently dropping writes) into "your work
 * vanishes when you click another file".
 */

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('keys', () => {
  it('keeps a file-scoped draft separate from the tier-2 shape', () => {
    expect(draftKey('problems/two-sum', 'javascript')).toBe(
      'gc.draft.problems/two-sum.javascript',
    );
    expect(draftKey('challenges/lru-cache', 'javascript', 'lru_cache')).toBe(
      'gc.draft.challenges/lru-cache.lru_cache.javascript',
    );
  });

  it('separates files, languages, and challenges from each other', () => {
    writeDraft('challenges/lru-cache', 'javascript', 'A', 'lru_cache');
    writeDraft('challenges/lru-cache', 'javascript', 'B', 'harness');
    writeDraft('challenges/lru-cache', 'python', 'C', 'lru_cache');
    writeDraft('challenges/token-bucket', 'javascript', 'D', 'lru_cache');

    expect(readDraft('challenges/lru-cache', 'javascript', 'lru_cache')).toBe('A');
    expect(readDraft('challenges/lru-cache', 'javascript', 'harness')).toBe('B');
    expect(readDraft('challenges/lru-cache', 'python', 'lru_cache')).toBe('C');
    expect(readDraft('challenges/token-bucket', 'javascript', 'lru_cache')).toBe('D');
  });

  it('scopes a build‘s drafts to the challenge, not the step', () => {
    // The workspace is carried across steps. Keying by step would hand a learner
    // the starter code again at every step and discard what they had written —
    // the exact failure the two-scope split exists to prevent.
    writeDraft('challenges/lru-cache', 'javascript', 'MY WORK', 'lru_cache');

    // Whichever step the learner moves to, the read is the same key.
    expect(readDraft('challenges/lru-cache', 'javascript', 'lru_cache')).toBe('MY WORK');
  });
});

describe('when storage refuses', () => {
  /** A private window: `setItem` throws, and `getItem` never sees the value. */
  function blockWrites() {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
  }

  it('still hands back what was typed this session', () => {
    blockWrites();
    writeDraft('challenges/lru-cache', 'javascript', 'TYPED', 'lru_cache');

    // Without the in-memory mirror this is null, and switching file tabs would
    // re-seed the editor from the starter code.
    expect(readDraft('challenges/lru-cache', 'javascript', 'lru_cache')).toBe('TYPED');
  });

  it('does not resurrect a draft that was reset', () => {
    blockWrites();
    writeDraft('challenges/lru-cache', 'javascript', 'TYPED', 'lru_cache');
    clearDraft('challenges/lru-cache', 'javascript', 'lru_cache');

    expect(readDraft('challenges/lru-cache', 'javascript', 'lru_cache')).toBeNull();
  });

  it('prefers stored content once storage is working again', () => {
    writeDraft('challenges/lru-cache', 'javascript', 'STORED', 'lru_cache');
    expect(readDraft('challenges/lru-cache', 'javascript', 'lru_cache')).toBe('STORED');
  });
});

describe('a draft that was never written', () => {
  it('reads as absent, so the caller falls back to the starter code', () => {
    expect(readDraft('challenges/lru-cache', 'javascript', 'nothing_here')).toBeNull();
  });
});
