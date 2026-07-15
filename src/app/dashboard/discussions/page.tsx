'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  useListDiscussionsQuery,
  useListCoursesQuery,
  useCreateDiscussionMutation,
  useDeleteDiscussionMutation,
  useTogglePinDiscussionMutation,
} from '@/services/api';
import type { Discussion, PaginationMeta } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { cn, timeAgo } from '@/lib/utils';
import {
  MessageSquare,
  Plus,
  Pin,
  PinOff,
  CheckCircle,
  Trash2,
  ChevronRight,
  ChevronLeft,
  MessageCircle,
} from 'lucide-react';

export default function DiscussionsPage() {
  const { user } = useAuth();
  const [courseId, setCourseId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const limit = 15;

  const { data: coursesData } = useListCoursesQuery({ limit: 100 });
  const { data, isLoading, error } = useListDiscussionsQuery(
    { courseId, page, limit },
    { skip: !courseId }
  );
  const [createDiscussion, { isLoading: isCreating }] = useCreateDiscussionMutation();
  const [deleteDiscussion] = useDeleteDiscussionMutation();
  const [togglePin] = useTogglePinDiscussionMutation();

  const courses = coursesData?.data || [];
  const discussions = data?.data || [];
  const meta = data?.meta as PaginationMeta | undefined;



  const handleCreate = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      toast.error('Title and content are required');
      return;
    }
    try {
      await createDiscussion({ courseId, title: newTitle.trim(), content: newContent.trim() }).unwrap();
      toast.success('Discussion created!');
      setShowCreate(false);
      setNewTitle('');
      setNewContent('');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to create discussion');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDiscussion(id).unwrap();
      toast.success('Discussion deleted');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete discussion');
    }
  };

  const handleTogglePin = async (id: string) => {
    try {
      await togglePin(id).unwrap();
      toast.success('Discussion pin status updated');
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to update pin status');
    }
  };

  if (!user) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Discussions</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {courseId ? `${discussions.length} thread${discussions.length !== 1 ? 's' : ''}` : 'Select a course to get started'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Course selector */}
          <select
            value={courseId}
            onChange={(e) => { setCourseId(e.target.value); setPage(1); }}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:border-primary-500/30 focus:outline-none appearance-none cursor-pointer hover:bg-white/[0.06] transition-all"
          >
            <option value="" className="bg-slate-900">Select a course...</option>
            {courses.map((c: any) => (
              <option key={c.id} value={c.id} className="bg-slate-900">{c.title}</option>
            ))}
          </select>

          {courseId && (
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!courseId ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-10 w-10 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">Select a Course</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Choose a course from the dropdown above to view its discussion threads.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <Card glass>
          <CardContent className="p-6">
            <SkeletonList rows={5} />
          </CardContent>
        </Card>
      ) : error ? (
        <Alert type="error" title="Failed to load discussions">
          {(error as any)?.data?.message || (error as any)?.error || 'Please try selecting a different course or check that the backend is running.'}
        </Alert>
      ) : discussions.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="h-10 w-10 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">No discussions yet</h2>
            <p className="text-sm text-slate-400 mb-4">Be the first to start a discussion!</p>
            <Button onClick={() => setShowCreate(true)}>
              <Plus className="h-4 w-4" />
              Start Discussion
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Threads List */}
          <div className="space-y-2">
            {discussions.map((disc: Discussion) => {
              const isOwner = user?.id === disc.user_id;
              const isInstructor = user?.role === 'instructor' || user?.role === 'admin';

              return (
                <Link
                  key={disc.id}
                  href={`/dashboard/discussions/${disc.id}`}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 group',
                    disc.is_pinned
                      ? 'bg-primary-500/[0.04] border-primary-500/15'
                      : disc.is_resolved
                        ? 'bg-emerald-500/[0.03] border-emerald-500/10'
                        : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                  )}
                >
                  {/* Icon */}
                  <div className={cn(
                    'h-10 w-10 rounded-2xl flex items-center justify-center flex-shrink-0 border',
                    disc.is_pinned
                      ? 'bg-primary-500/10 border-primary-500/20 text-primary-400'
                      : disc.is_resolved
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-white/[0.04] border-white/[0.08] text-slate-400'
                  )}>
                    {disc.is_pinned ? (
                      <Pin className="h-5 w-5" />
                    ) : disc.is_resolved ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <MessageSquare className="h-5 w-5" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {disc.is_pinned && (
                        <span className="badge-published text-[10px] px-2 py-0.5">Pinned</span>
                      )}
                      {disc.is_resolved && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Resolved</span>
                      )}
                    </div>
                    <h3 className="text-sm font-medium text-white mt-1 truncate group-hover:text-primary-400 transition-colors">
                      {disc.title}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-1">{disc.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>{disc.author_name || 'Unknown'}</span>
                      <span>{timeAgo(disc.created_at)}</span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {disc.reply_count || 0}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.preventDefault()}>
                    {(isInstructor) && (
                      <button
                        onClick={() => handleTogglePin(disc.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-primary-400 hover:bg-white/10 transition-all"
                        title={disc.is_pinned ? 'Unpin' : 'Pin'}
                      >
                        {disc.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                      </button>
                    )}
                    {(isOwner || user?.role === 'admin') && (
                      <button
                        onClick={() => handleDelete(disc.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    <ChevronRight className="h-4 w-4 text-slate-500 group-hover:text-primary-400 transition-colors ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</p>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
                  .filter(p => p === 1 || p === meta.totalPages || Math.abs(p - page) <= 1)
                  .map((p, idx, arr) => (
                    <span key={p} className="flex items-center">
                      {idx > 0 && arr[idx - 1] !== p - 1 && (
                        <span className="px-1 text-slate-600">...</span>
                      )}
                      <button
                        onClick={() => setPage(p)}
                        className={cn(
                          'h-8 min-w-[32px] px-2 rounded-lg text-sm font-medium transition-all',
                          p === page
                            ? 'bg-primary-500/15 text-primary-400'
                            : 'text-slate-400 hover:text-white hover:bg-white/10'
                        )}
                      >
                        {p}
                      </button>
                    </span>
                  ))}
                <button
                  onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))}
                  disabled={page >= meta.totalPages}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Thread Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
          <div className="relative w-full max-w-lg rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl p-6 space-y-4 animate-fade-in">
            <h2 className="text-lg font-semibold text-white">New Discussion Thread</h2>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Thread title..."
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:border-primary-500/30 focus:outline-none transition-all"
              autoFocus
            />
            <textarea
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="What's on your mind?"
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:border-primary-500/30 focus:outline-none transition-all resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button onClick={() => setShowCreate(false)} variant="secondary">Cancel</Button>
              <Button onClick={handleCreate} isLoading={isCreating}>
                <Plus className="h-4 w-4" />
                Create Thread
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
