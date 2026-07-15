'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetDiscussionQuery,
  useAddReplyMutation,
  useDeleteDiscussionMutation,
  useTogglePinDiscussionMutation,
  useToggleSolutionMutation,
  useDeleteReplyMutation,
} from '@/services/api';
import type { DiscussionReply } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { cn, timeAgo } from '@/lib/utils';
import {
  ArrowLeft,
  MessageSquare,
  Pin,
  PinOff,
  CheckCircle,
  Trash2,
  Send,
  Reply,
} from 'lucide-react';

export default function DiscussionThreadPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const discussionId = params.id as string;

  const [replyContent, setReplyContent] = useState('');

  const { data, isLoading, error } = useGetDiscussionQuery(discussionId);
  const [addReply, { isLoading: isReplying }] = useAddReplyMutation();
  const [deleteDiscussion] = useDeleteDiscussionMutation();
  const [togglePin] = useTogglePinDiscussionMutation();
  const [toggleSolution] = useToggleSolutionMutation();
  const [deleteReply] = useDeleteReplyMutation();

  const discussion = data?.data;
  const replies = discussion?.replies || [];

  const isOwner = user?.id === discussion?.user_id;
  const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    try {
      await addReply({ discussionId, content: replyContent.trim() }).unwrap();
      toast.success('Reply posted!');
      setReplyContent('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to post reply');
    }
  };

  const handleDeleteThread = async () => {
    try {
      await deleteDiscussion(discussionId).unwrap();
      toast.success('Thread deleted');
      router.push('/dashboard/discussions');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete thread');
    }
  };

  const handleTogglePin = async () => {
    try {
      await togglePin(discussionId).unwrap();
      toast.success('Pin status updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update pin status');
    }
  };

  const handleMarkSolution = async (replyId: string) => {
    try {
      await toggleSolution(replyId).unwrap();
      toast.success('Solution marked!');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to mark solution');
    }
  };

  const handleDeleteReply = async (replyId: string) => {
    try {
      await deleteReply(replyId).unwrap();
      toast.success('Reply deleted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete reply');
    }
  };

  if (!user) return <Spinner size="lg" />;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-slate-800/40 animate-shimmer rounded-lg" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 bg-slate-800/40 animate-shimmer rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !discussion) {
    return (
      <div className="space-y-4">
        <Alert type="error">Discussion not found.</Alert>
        <Link href="/dashboard/discussions" className="text-sm text-primary-400 hover:underline inline-flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Back to Discussions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/dashboard/discussions"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Discussions
      </Link>

      {/* Main Thread */}
      <div className={cn(
        'rounded-2xl border p-6 space-y-4',
        discussion.is_pinned
          ? 'bg-primary-500/[0.04] border-primary-500/15'
          : discussion.is_resolved
            ? 'bg-emerald-500/[0.03] border-emerald-500/10'
            : 'bg-white/[0.02] border-white/[0.06]'
      )}>
        {/* Thread Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center text-lg font-bold border',
              discussion.is_pinned
                ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                : discussion.is_resolved
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
            )}>
              {discussion.author_name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                {discussion.is_pinned && (
                  <span className="badge-published text-[10px] px-2 py-0.5">Pinned</span>
                )}
                {discussion.is_resolved && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" /> Resolved
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold text-white mt-1">{discussion.title}</h1>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                <span className="font-medium text-slate-400">{discussion.author_name || 'Unknown'}</span>
                <span>{discussion.author_role && `(${discussion.author_role})`}</span>
                <span>{timeAgo(discussion.created_at)}</span>
                {discussion.course_title && <span>in {discussion.course_title}</span>}
              </div>
            </div>
          </div>

          {/* Thread Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {isInstructor && (
              <button
                onClick={handleTogglePin}
                className="p-2 rounded-xl text-slate-500 hover:text-primary-400 hover:bg-white/10 transition-all"
                title={discussion.is_pinned ? 'Unpin' : 'Pin'}
              >
                {discussion.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              </button>
            )}
            {(isOwner || user?.role === 'admin') && (
              <button
                onClick={handleDeleteThread}
                className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                title="Delete thread"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Thread Content */}
        <div className="pl-[60px]">
          <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{discussion.content}</p>
        </div>
      </div>

      {/* Replies Section */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary-400" />
          Replies ({replies.length})
        </h2>

        {replies.length === 0 ? (
          <Card glass>
            <CardContent className="py-10 text-center">
              <Reply className="h-8 w-8 text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500">No replies yet. Be the first to respond!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {replies.map((reply: DiscussionReply) => {
              const isReplyOwner = user?.id === reply.user_id;

              return (
                <div
                  key={reply.id}
                  className={cn(
                    'relative flex gap-4 p-4 rounded-2xl border transition-all duration-200 group',
                    reply.is_solution
                      ? 'bg-emerald-500/[0.05] border-emerald-500/20'
                      : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                  )}
                >
                  {/* Solution badge */}
                  {reply.is_solution && (
                    <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    </div>
                  )}

                  {/* Avatar */}
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
                    {reply.author_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-white">{reply.author_name || 'Unknown'}</span>
                      {reply.author_role && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.04] text-slate-500">{reply.author_role}</span>
                      )}
                      <span className="text-xs text-slate-500">{timeAgo(reply.created_at)}</span>
                      {reply.is_solution && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" /> Solution
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 mt-1 whitespace-pre-line">{reply.content}</p>
                  </div>

                  {/* Reply Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Mark as solution (only thread owner) */}
                    {isOwner && !reply.is_solution && !discussion.is_resolved && (
                      <button
                        onClick={() => handleMarkSolution(reply.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        title="Mark as solution"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </button>
                    )}
                    {/* Delete (reply owner or admin) */}
                    {(isReplyOwner || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDeleteReply(reply.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete reply"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reply Form */}
      <Card glass>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 space-y-2">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:border-primary-500/30 focus:outline-none transition-all resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-500">Press Enter to send, Shift+Enter for new line</p>
                <Button
                  onClick={handleReply}
                  isLoading={isReplying}
                  disabled={!replyContent.trim()}
                  size="sm"
                >
                  <Send className="h-4 w-4" />
                  Reply
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
