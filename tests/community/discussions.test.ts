import { beforeEach, describe, expect, it } from 'vitest';
import {
  getDiscussionComments,
  postDiscussionComment,
  toggleCommentUpvote,
  hasUserUpvotedComment,
  SEED_COMMENTS,
} from '@/lib/community/discussions';

describe('Community Discussions & Q&A Engine (Module G1)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('retrieves seeded comments for two-sum and invert-binary-tree', () => {
    const comments = getDiscussionComments('problem:two-sum');
    expect(comments.length).toBeGreaterThanOrEqual(3);

    const hasEdgeCase = comments.some((c) => c.tag === 'edge_case');
    expect(hasEdgeCase).toBe(true);

    const hasReplies = comments.some((c) => c.parentId === 'disc-two-sum-1');
    expect(hasReplies).toBe(true);
  });

  it('posts a root comment and a nested reply', () => {
    const root = postDiscussionComment({
      exerciseId: 'problem:two-sum',
      author: 'CandidateAlpha',
      content: 'Can the input array contain floating point numbers?',
      tag: 'question',
    });

    expect(root.id).toBeDefined();
    expect(root.upvotes).toBe(1);
    expect(root.parentId).toBeUndefined();

    const reply = postDiscussionComment({
      exerciseId: 'problem:two-sum',
      author: 'SeniorEngineer',
      content: 'The problem statement specifies 32-bit integers.',
      parentId: root.id,
      tag: 'intuition',
    });

    expect(reply.id).toBeDefined();
    expect(reply.parentId).toBe(root.id);

    const all = getDiscussionComments('problem:two-sum');
    expect(all.some((c) => c.id === root.id)).toBe(true);
    expect(all.some((c) => c.id === reply.id)).toBe(true);
  });

  it('toggles upvotes on discussion comments correctly', () => {
    const targetId = SEED_COMMENTS[0]!.id;

    expect(hasUserUpvotedComment(targetId)).toBe(false);

    const vote1 = toggleCommentUpvote(targetId);
    expect(vote1.upvoted).toBe(true);
    expect(vote1.countDelta).toBe(1);
    expect(hasUserUpvotedComment(targetId)).toBe(true);

    const vote2 = toggleCommentUpvote(targetId);
    expect(vote2.upvoted).toBe(false);
    expect(vote2.countDelta).toBe(-1);
    expect(hasUserUpvotedComment(targetId)).toBe(false);
  });
});
