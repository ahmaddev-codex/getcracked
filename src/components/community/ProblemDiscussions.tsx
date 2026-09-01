'use client';

import { useState } from 'react';
import {
  MessageSquare,
  ThumbsUp,
  Reply,
  Send,
  Sparkles,
  Award,
  HelpCircle,
  AlertTriangle,
  Zap,
} from 'lucide-react';
import {
  getDiscussionComments,
  postDiscussionComment,
  toggleCommentUpvote,
  hasUserUpvotedComment,
  type DiscussionComment,
} from '@/lib/community/discussions';

interface ProblemDiscussionsProps {
  exerciseId: string;
}

export function ProblemDiscussions({ exerciseId }: ProblemDiscussionsProps) {
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [newContent, setNewContent] = useState('');
  const [authorHandle, setAuthorHandle] = useState('');
  const [commentTag, setCommentTag] = useState<DiscussionComment['tag']>('question');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [, setRefreshTrigger] = useState(0);

  const comments = getDiscussionComments(exerciseId);

  const rootComments = comments.filter((c) => !c.parentId);
  const repliesByParent = comments.reduce<Record<string, DiscussionComment[]>>((acc, c) => {
    if (c.parentId) {
      acc[c.parentId] = acc[c.parentId] || [];
      acc[c.parentId]!.push(c);
    }
    return acc;
  }, {});

  const filteredRoots = rootComments.filter((c) => {
    if (selectedTag === 'all') return true;
    return c.tag === selectedTag;
  });

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    postDiscussionComment({
      exerciseId,
      author: authorHandle.trim() || 'Anonymous Candidate',
      content: newContent.trim(),
      tag: commentTag,
    });

    setNewContent('');
    setRefreshTrigger((v) => v + 1);
  };

  const handlePostReply = (parentId: string) => {
    if (!replyContent.trim()) return;

    postDiscussionComment({
      exerciseId,
      author: authorHandle.trim() || 'Anonymous Candidate',
      content: replyContent.trim(),
      parentId,
      tag: 'intuition',
    });

    setReplyContent('');
    setReplyingToId(null);
    setRefreshTrigger((v) => v + 1);
  };

  const handleVote = (id: string) => {
    const { countDelta } = toggleCommentUpvote(id);
    const target = comments.find((c) => c.id === id);
    if (target) {
      target.upvotes += countDelta;
    }
    setRefreshTrigger((v) => v + 1);
  };

  const renderTagBadge = (tag?: DiscussionComment['tag']) => {
    if (!tag) return null;
    switch (tag) {
      case 'edge_case':
        return (
          <span className="px-1.5 py-0.5 rounded-xs bg-danger/15 text-danger font-semibold text-3xs flex items-center gap-1 border border-danger/25">
            <AlertTriangle size={9} />
            Edge Case
          </span>
        );
      case 'question':
        return (
          <span className="px-1.5 py-0.5 rounded-xs bg-accent/20 text-accent-foreground font-semibold text-3xs flex items-center gap-1 border border-border-subtle">
            <HelpCircle size={9} />
            Question
          </span>
        );
      case 'optimization':
        return (
          <span className="px-1.5 py-0.5 rounded-xs bg-success/15 text-success font-semibold text-3xs flex items-center gap-1 border border-success/25">
            <Zap size={9} />
            Optimization
          </span>
        );
      case 'intuition':
        return (
          <span className="px-1.5 py-0.5 rounded-xs bg-surface-muted text-foreground-muted font-semibold text-3xs flex items-center gap-1 border border-border-subtle">
            <Sparkles size={9} />
            Intuition
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface overflow-hidden">
      {/* Header and Tag Filters */}
      <header className="p-3 border-b border-border-subtle bg-surface-muted/30 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare size={14} className="text-accent" />
          <span className="text-xs font-bold text-foreground">
            Discussion & Q&A ({comments.length})
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-2xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'edge_case', label: 'Edge Cases' },
            { id: 'question', label: 'Questions' },
            { id: 'optimization', label: 'Optimizations' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSelectedTag(tab.id)}
              className={`px-2 py-0.5 rounded-node border transition-all cursor-pointer ${
                selectedTag === tab.id
                  ? 'bg-accent text-accent-foreground border-border-strong font-bold shadow-2xs'
                  : 'bg-surface text-foreground-muted hover:text-foreground border-border-subtle'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      {/* Main Container: New Comment Input + Thread List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Post New Comment Box */}
        <form onSubmit={handlePostComment} className="p-3 bg-background border border-border-strong rounded-node shadow-2xs space-y-2.5">
          <textarea
            required
            rows={2}
            placeholder="Ask a question, share an edge case, or clarify a constraint..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-surface border border-border-subtle rounded-xs text-foreground focus:outline-none focus:border-accent"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Name or handle (optional)"
                value={authorHandle}
                onChange={(e) => setAuthorHandle(e.target.value)}
                className="w-40 px-2 py-1 text-2xs bg-surface border border-border-subtle rounded-xs text-foreground focus:outline-none"
              />

              <select
                value={commentTag}
                aria-label="Comment category"
                onChange={(e) => setCommentTag(e.target.value as DiscussionComment['tag'])}
                className="px-2 py-1 text-2xs bg-surface border border-border-subtle rounded-xs text-foreground cursor-pointer focus:outline-none"
              >
                <option value="question">Question</option>
                <option value="edge_case">Edge Case</option>
                <option value="optimization">Optimization</option>
                <option value="intuition">Intuition</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-3 py-1 text-xs font-bold rounded-node bg-accent text-accent-foreground border border-border-strong hover:bg-accent-strong transition-all duration-(--duration-fast) active:scale-[0.98] cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <Send size={11} />
              <span>Post</span>
            </button>
          </div>
        </form>

        {/* Threaded Comments List */}
        {filteredRoots.length === 0 ? (
          <div className="p-6 text-center text-foreground-muted text-xs">
            No discussions found in this category. Start the conversation!
          </div>
        ) : (
          filteredRoots.map((comment) => {
            const hasVoted = hasUserUpvotedComment(comment.id);
            const replies = repliesByParent[comment.id] || [];

            return (
              <div key={comment.id} className="space-y-2 gc-tab-enter">
                {/* Root Comment Card */}
                <article className="p-3 bg-background border border-border-strong rounded-node shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-foreground">{comment.author}</span>
                      {comment.authorBadge && (
                        <span className="px-1.5 py-0.5 rounded-xs bg-accent/20 text-accent-foreground font-semibold text-3xs border border-border-subtle flex items-center gap-1">
                          <Award size={9} />
                          {comment.authorBadge}
                        </span>
                      )}
                      {renderTagBadge(comment.tag)}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleVote(comment.id)}
                        className={`px-2 py-0.5 rounded-node text-2xs font-semibold border transition-all flex items-center gap-1 cursor-pointer active:scale-[0.95] ${
                          hasVoted
                            ? 'bg-accent text-accent-foreground border-border-strong shadow-2xs font-bold'
                            : 'bg-surface text-foreground-muted hover:text-foreground border-border-subtle'
                        }`}
                      >
                        <ThumbsUp size={10} className={hasVoted ? 'fill-accent-foreground' : ''} />
                        <span>{comment.upvotes}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setReplyingToId(replyingToId === comment.id ? null : comment.id)}
                        className="px-2 py-0.5 rounded-node text-2xs font-semibold bg-surface border border-border-subtle text-foreground-muted hover:text-foreground cursor-pointer flex items-center gap-1"
                      >
                        <Reply size={10} />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {comment.content}
                  </p>

                  {/* Inline Reply Input */}
                  {replyingToId === comment.id && (
                    <div className="pt-2 border-t border-border-subtle flex items-center gap-2 gc-tab-enter">
                      <input
                        type="text"
                        placeholder="Write a reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handlePostReply(comment.id);
                          }
                        }}
                        className="flex-1 px-2.5 py-1 text-2xs bg-surface border border-border-subtle rounded-xs text-foreground focus:outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => handlePostReply(comment.id)}
                        className="px-2.5 py-1 text-2xs font-bold rounded-node bg-accent text-accent-foreground border border-border-strong hover:bg-accent-strong cursor-pointer"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </article>

                {/* Nested Replies */}
                {replies.length > 0 && (
                  <div className="pl-5 border-l-2 border-border-subtle space-y-2">
                    {replies.map((reply) => {
                      const replyVoted = hasUserUpvotedComment(reply.id);
                      return (
                        <article key={reply.id} className="p-2.5 bg-surface border border-border-subtle rounded-node text-xs space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-foreground text-2xs">{reply.author}</span>
                              {reply.authorBadge && (
                                <span className="px-1.5 py-0.5 rounded-xs bg-accent/20 text-accent-foreground font-semibold text-3xs border border-border-subtle">
                                  {reply.authorBadge}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={() => handleVote(reply.id)}
                              className={`px-1.5 py-0.5 rounded-node text-3xs font-semibold border transition-all flex items-center gap-1 cursor-pointer active:scale-[0.95] ${
                                replyVoted
                                  ? 'bg-accent text-accent-foreground border-border-strong font-bold'
                                  : 'bg-background text-foreground-muted hover:text-foreground border-border-subtle'
                              }`}
                            >
                              <ThumbsUp size={9} className={replyVoted ? 'fill-accent-foreground' : ''} />
                              <span>{reply.upvotes}</span>
                            </button>
                          </div>

                          <p className="text-2xs text-foreground leading-relaxed">
                            {reply.content}
                          </p>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
