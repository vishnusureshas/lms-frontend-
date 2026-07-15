'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  useListCoursesQuery,
  useGetEnrolledStudentsQuery,
} from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { cn } from '@/lib/utils';
import {
  Users,
  Search,
  GraduationCap,
  Mail,
  BarChart3,
  BookOpen,
  UserCheck,
  Calendar,
  TrendingUp,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export default function AdminStudentsPage() {
  const { user } = useAuth();
  const { data: coursesData, isLoading: coursesLoading } = useListCoursesQuery({ limit: 100 });
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const courses = coursesData?.data || [];
  const activeCourseId = selectedCourseId;

  const { data: studentsData, isLoading: studentsLoading, error: studentsError } = useGetEnrolledStudentsQuery(
    { courseId: activeCourseId, page, limit: 20 },
    { skip: !activeCourseId }
  );

  if (!user) return <Spinner size="lg" />;

  const students = studentsData?.data || [];
  const meta = studentsData?.meta as { page: number; limit: number; total: number; totalPages: number } | undefined;
  const totalActive = students.filter((s: any) => s.status === 'active').length;
  const totalCompleted = students.filter((s: any) => s.status === 'completed').length;

  const filteredStudents = students.filter((s: any) => {
    if (search && !s.full_name?.toLowerCase().includes(search.toLowerCase()) && !s.email?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const selectedCourse = courses.find((c: any) => c.id === activeCourseId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Enrolled Students</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {selectedCourse
              ? `Students enrolled in "${selectedCourse.title}"`
              : 'Select a course to view enrolled students'}
          </p>
        </div>
        <Link
          href="/dashboard/admin/courses"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-sm font-medium transition-all"
        >
          <BookOpen className="h-4 w-4" />
          Manage Courses
        </Link>
      </div>

      {/* Course Selector & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-[2]">
          <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 z-10" />
          <select
            value={selectedCourseId}
            onChange={(e) => { setSelectedCourseId(e.target.value); setPage(1); setSearch(''); }}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-slate-900">Select a course...</option>
            {courses.length === 0 && (
              <option value="" disabled className="bg-slate-900">No courses available</option>
            )}
            {courses.map((course: any) => (
              <option key={course.id} value={course.id} className="bg-slate-900">
                {course.title} {course.status ? `(${course.status})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search students by name or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            disabled={!activeCourseId}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          />
        </div>
      </div>

      {/* No course selected */}
      {!activeCourseId ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Users className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">Select a Course</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Choose a course from the dropdown above to view its enrolled students and their progress.
            </p>
          </CardContent>
        </Card>
      ) : studentsLoading ? (
        <div className="flex justify-center py-12"><Spinner size="lg" text="Loading students..." /></div>
      ) : studentsError ? (
        <Alert type="error">
          Failed to load enrolled students. The backend may be unavailable.
        </Alert>
      ) : students.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <UserCheck className="h-10 w-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-1">No students enrolled</h3>
            <p className="text-sm text-slate-400 mb-1">
              This course has no enrolled students yet.
            </p>
            {selectedCourse && (
              <Link
                href={`/courses/${selectedCourse.slug}`}
                className="text-sm text-primary-400 hover:underline inline-flex items-center gap-1"
              >
                View course page <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
                  <p className="text-lg font-bold text-white tabular-nums">{meta?.total || students.length}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Active</p>
                  <p className="text-lg font-bold text-white tabular-nums">{totalActive}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/15 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Completed</p>
                  <p className="text-lg font-bold text-white tabular-nums">{totalCompleted}</p>
                </div>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Completion Rate</p>
                  <p className="text-lg font-bold text-white tabular-nums">
                    {students.length > 0
                      ? Math.round((totalCompleted / students.length) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Students Table */}
          <Card glass>
            <CardHeader>
              <CardTitle>Enrolled Students</CardTitle>
              <span className="text-xs text-slate-500">{filteredStudents.length} of {meta?.total || students.length} shown</span>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="pb-3 font-medium pl-2">#</th>
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium">Email</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Progress</th>
                      <th className="pb-3 font-medium">Enrolled Date</th>
                      {totalCompleted > 0 && <th className="pb-3 font-medium">Completed</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredStudents.map((student: any, idx: number) => (
                      <tr key={student.id || student.enrollment_id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5 pl-2 text-xs text-slate-500 tabular-nums">
                          {((page - 1) * 20) + idx + 1}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-9 w-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0',
                              student.status === 'completed'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-gradient-to-br from-primary-500/20 to-purple-600/20 text-primary-400'
                            )}>
                              {student.full_name?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                            <span className="text-sm font-medium text-white truncate max-w-[180px]">
                              {student.full_name || 'Unknown'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-400">
                            <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate max-w-[220px]">{student.email || '—'}</span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            student.status === 'completed'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : student.status === 'active'
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'bg-slate-500/10 text-slate-400'
                          )}>
                            {student.status || 'active'}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className={cn(
                                  'h-2 rounded-full transition-all',
                                  student.progress_pct >= 100
                                    ? 'bg-emerald-500'
                                    : 'bg-gradient-to-r from-primary-500 to-purple-500'
                                )}
                                style={{ width: `${Math.min(student.progress_pct || 0, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-slate-400 w-8 tabular-nums">
                              {Math.round(student.progress_pct || 0)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-400">
                            <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                            {student.enrolled_at
                              ? new Date(student.enrolled_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </div>
                        </td>
                        {totalCompleted > 0 && (
                          <td className="py-3.5 text-sm text-slate-400">
                            {student.completed_at
                              ? new Date(student.completed_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : '—'}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {meta && meta.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/[0.06]">
                  <p className="text-sm text-slate-500">
                    Page {meta.page} of {meta.totalPages} ({meta.total} total)
                  </p>
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
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
