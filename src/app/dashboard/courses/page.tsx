'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useListCoursesQuery, usePublishCourseMutation, useDeleteCourseMutation } from '@/services/api';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { SkeletonList, SkeletonStats } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import Button from '@/components/ui/Button';
import { BookOpen, Plus, Eye, Users, Star, Trash2, Send, Clock } from 'lucide-react';

export default function MyCourses() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'draft' | 'published' | 'pending_review'>('all');
  const { data, isLoading, error } = useListCoursesQuery({ instructorId: user?.id, limit: 50 });
  const [publishCourse] = usePublishCourseMutation();
  const [deleteCourse] = useDeleteCourseMutation();
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const courses = data?.data || [];
  const filtered = filter === 'all' ? courses : courses.filter(c => c.status === filter);
  const stats = {
    total: courses.length,
    published: courses.filter(c => c.is_published).length,
    draft: courses.filter(c => c.status === 'draft').length,
    pending: courses.filter(c => c.status === 'pending_review').length,
  };

  const handlePublish = async (id: string) => {
    try { await publishCourse(id).unwrap(); setActionMsg({ type: 'success', text: 'Course sent for review!' }); }
    catch (err: any) { setActionMsg({ type: 'error', text: err?.data?.message || 'Failed to publish' }); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this course?')) return;
    try { await deleteCourse(id).unwrap(); setActionMsg({ type: 'success', text: 'Course deleted' }); }
    catch (err: any) { setActionMsg({ type: 'error', text: err?.data?.message || 'Failed to delete' }); }
  };

  if (!user) return (
    <div className="space-y-6">
      <div className="h-8 w-48 bg-slate-800/40 animate-shimmer rounded-lg" />
      <SkeletonStats />
      <SkeletonList rows={5} />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-purple">My Courses</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your course catalog</p>
        </div>
        <Link href="/dashboard/courses/new">
          <Button className="flex items-center gap-2"><Plus className="h-4 w-4" /> New Course</Button>
        </Link>
      </div>

      {actionMsg && (
        <Alert type={actionMsg.type === 'success' ? 'success' : 'error'}>
          {actionMsg.text}
          <button onClick={() => setActionMsg(null)} className="ml-2 text-xs underline opacity-70">Dismiss</button>
        </Alert>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: stats.total, gradient: 'from-primary-500/20 to-purple-500/20', text: 'text-primary-400' },
          { label: 'Published', value: stats.published, gradient: 'from-emerald-500/20 to-cyan-500/20', text: 'text-emerald-400' },
          { label: 'Draft', value: stats.draft, gradient: 'from-slate-500/20 to-slate-600/20', text: 'text-slate-400' },
          { label: 'Pending', value: stats.pending, gradient: 'from-amber-500/20 to-orange-500/20', text: 'text-amber-400' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className={`p-4 text-center bg-gradient-to-br ${s.gradient} rounded-2xl`}>
              <p className={`text-xl font-bold ${s.text}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {(['all', 'draft', 'published', 'pending_review'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
              filter === f ? 'bg-primary-500/15 text-primary-400 border border-primary-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}>
            {f === 'pending_review' ? 'Pending Review' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Course list */}
      {isLoading ? (
        <SkeletonList rows={5} />
      ) : error ? (
        <Alert type="error">Failed to load courses.</Alert>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 font-medium">No courses found</p>
          <p className="text-sm text-slate-500 mt-1">{filter === 'all' ? 'Create your first course' : `No ${filter} courses`}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((course) => (
            <Card key={course.id} hover glass>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-12 w-16 sm:h-14 sm:w-20 flex-shrink-0 rounded-xl bg-gradient-to-br from-primary-500/30 to-purple-600/20 flex items-center justify-center text-white/60 font-bold text-lg">
                    {course.title?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-white text-sm truncate">{course.title}</h3>
                      {course.is_published ? (
                        <span className="badge-published text-[10px]">Published</span>
                      ) : course.status === 'pending_review' ? (
                        <span className="badge-pending text-[10px]">Pending</span>
                      ) : (
                        <span className="badge-draft text-[10px]">Draft</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      {course.level && <span className="capitalize">{course.level}</span>}
                      <span>${course.price || 0}</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{course.total_students || 0}</span>
                      <span className="flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" />{course.average_rating ? Number(course.average_rating).toFixed(1) : '0.0'}</span>
                      <span>{course.total_lessons || 0} lessons</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!course.is_published && course.status !== 'pending_review' && (
                      <button onClick={() => handlePublish(course.id)} className="p-2 rounded-lg text-primary-400 hover:bg-primary-500/10 transition-all" title="Submit for review">
                        <Send className="h-4 w-4" />
                      </button>
                    )}
                    <Link href={`/courses/${course.slug}`} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all" title="Preview">
                      <Eye className="h-4 w-4" />
                    </Link>
                    <button onClick={() => handleDelete(course.id)} className="p-2 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-all" title="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
