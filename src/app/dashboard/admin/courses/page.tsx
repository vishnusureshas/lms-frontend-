'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  useAdminListCoursesQuery,
  useAdminApproveCourseMutation,
  usePublishCourseMutation,
  useAdminDeleteCourseMutation,
  useRejectCourseMutation,
  useArchiveCourseMutation,
} from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import toast from 'react-hot-toast';
import { cn, timeAgo } from '@/lib/utils';
import {
  BookOpen,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  Filter,
  Archive,
  Ban,
} from 'lucide-react';

export default function AdminCoursesPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useAdminListCoursesQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter || undefined,
  });

  const [approveCourse] = useAdminApproveCourseMutation();
  const [publishCourse] = usePublishCourseMutation();
  const [deleteCourse] = useAdminDeleteCourseMutation();
  const [rejectCourse] = useRejectCourseMutation();
  const [archiveCourse] = useArchiveCourseMutation();

  const courses = data?.data || [];
  const meta = (data as any)?.meta;

  const handleApprove = async (id: string, title: string) => {
    try {
      await approveCourse(id).unwrap();
      toast.success(`"${title}" approved and published`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to approve course');
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await deleteCourse(id).unwrap();
      toast.success(`"${title}" deleted`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to delete course');
    }
  };

  const handleReject = async (id: string, title: string) => {
    const reason = prompt(`Reject "${title}"?\nEnter a reason (optional):`);
    if (reason === null) return;
    try {
      await rejectCourse({ id, reason: reason || undefined }).unwrap();
      toast.success(`"${title}" rejected`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to reject course');
    }
  };

  const handleArchive = async (id: string, title: string) => {
    if (!confirm(`Archive "${title}"? It will no longer be visible to students.`)) return;
    try {
      await archiveCourse(id).unwrap();
      toast.success(`"${title}" archived`);
    } catch (err: any) {
      toast.error(err?.data?.message || 'Failed to archive course');
    }
  };

  if (!user) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Course Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {meta ? `${meta.total} course${meta.total !== 1 ? 's' : ''} total` : 'Manage all platform courses'}
          </p>
        </div>
        <Link
          href="/dashboard/courses/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all"
        >
          <BookOpen className="h-4 w-4" />
          New Course
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search courses..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-primary-500/50 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3.5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none appearance-none cursor-pointer min-w-[160px]"
        >
          <option value="" className="bg-slate-900">All Status</option>
          <option value="pending_review" className="bg-slate-900">Pending Review</option>
          <option value="published" className="bg-slate-900">Published</option>
          <option value="draft" className="bg-slate-900">Draft</option>
          <option value="archived" className="bg-slate-900">Archived</option>
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" /></div>
      ) : error ? (
        <Alert type="error">Failed to load courses.</Alert>
      ) : courses.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No courses found</h3>
            <p className="text-sm text-slate-500">Try adjusting your search or filter</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-2">
            {courses.map((course: any) => (
              <Card key={course.id} glass hover>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center text-lg font-bold text-primary-400 flex-shrink-0">
                      {course.title?.charAt(0) || 'C'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-white text-sm truncate">{course.title}</span>
                        <span className={cn(
                          'text-[10px] px-2 py-0.5 rounded-full border font-medium',
                          course.status === 'published' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                          course.status === 'pending_review' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          course.status === 'draft' ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' :
                          'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        )}>
                          {course.status || 'draft'}
                        </span>
                        {course.is_published && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Published</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>${course.price || 0}</span>
                        <span className="text-slate-600">•</span>
                        <span>{course.level || 'beginner'}</span>
                        <span className="text-slate-600">•</span>
                        <span>{course.total_students || 0} students</span>
                        <span className="text-slate-600">•</span>
                        <span>Created {course.created_at ? timeAgo(course.created_at) : 'N/A'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        href={course.slug ? `/courses/${course.slug}` : '#'}
                        className="p-2 rounded-xl text-slate-500 hover:text-primary-400 hover:bg-white/10 transition-all"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {course.status === 'pending_review' && (
                        <button
                          onClick={() => handleApprove(course.id, course.title)}
                          className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-500/10 transition-all"
                          title="Approve"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      )}
                      {course.status === 'pending_review' && (
                        <button
                          onClick={() => handleReject(course.id, course.title)}
                          className="p-2 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                          title="Reject"
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      )}
                      {course.status === 'published' && (
                        <button
                          onClick={() => handleArchive(course.id, course.title)}
                          className="p-2 rounded-xl text-amber-400 hover:bg-amber-500/10 transition-all"
                          title="Archive"
                        >
                          <Archive className="h-4 w-4" />
                        </button>
                      )}
                      <Link
                        href={`/dashboard/courses/${course.id}/edit`}
                        className="p-2 rounded-xl text-slate-500 hover:text-primary-400 hover:bg-white/10 transition-all"
                        title="Edit"
                      >
                        <BookOpen className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(course.id, course.title)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button onClick={() => setPage(p => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
                  className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
