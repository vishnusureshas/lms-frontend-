'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useGetDashboardQuery } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { timeAgo, getDashboardUrl } from '@/lib/utils';
import { BookOpen, Users, GraduationCap, TrendingUp, Plus, Eye } from 'lucide-react';

export default function InstructorDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useGetDashboardQuery();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'instructor') {
      router.replace(getDashboardUrl(user.role));
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" text="Loading your dashboard..." />
      </div>
    );
  }

  if (!user || user.role !== 'instructor') return null;

  if (error || !data?.success) {
    return (
      <Alert type="error">
        Could not load dashboard. Ensure the backend is running.
      </Alert>
    );
  }

  const { totalCourses, publishedCourses, totalStudents, totalEnrollments, courses, recentEnrollments } = data.data;

  const ratedCourses = (courses || []).filter((c: any) => c.average_rating > 0);
  const avgRating = ratedCourses.length > 0
    ? (ratedCourses.reduce((sum: number, c: any) => sum + Number(c.average_rating), 0) / ratedCourses.length).toFixed(1)
    : '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text-purple">Instructor Dashboard</h1>
          <p className="text-sm text-slate-400 mt-1">Manage your courses and track student progress</p>
        </div>
        <Link href="/dashboard/courses/new" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all duration-200 hover:-translate-y-0.5">
          <Plus className="h-4 w-4" />
          New Course
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Courses" value={totalCourses || 0} icon={BookOpen} color="blue" description={`${publishedCourses || 0} published`} />
        <StatCard title="Total Students" value={totalStudents || 0} icon={Users} color="emerald" />
        <StatCard title="Enrollments" value={totalEnrollments || 0} icon={GraduationCap} color="purple" />
        <StatCard title="Avg. Rating" value={avgRating} icon={TrendingUp} color="amber" />
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          <Link href="/dashboard/courses" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">
            View All →
          </Link>
        </CardHeader>
        <CardContent>
          {!courses || courses.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No courses yet</p>
              <p className="text-sm text-slate-500 mt-1">Create your first course to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {courses.slice(0, 5).map((course: any) => (
                <div key={course.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-all group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0">
                      {course.title?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-medium text-white text-sm truncate">{course.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {course.is_published ? (
                          <span className="badge-published text-[10px] px-2 py-0.5">Published</span>
                        ) : course.status === 'pending_review' ? (
                          <span className="badge-pending text-[10px] px-2 py-0.5">Pending</span>
                        ) : (
                          <span className="badge-draft text-[10px] px-2 py-0.5">Draft</span>
                        )}
                        <span className="text-xs text-slate-500">{course.total_students || 0} students</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500">{course.total_lessons || 0} lessons</span>
                      </div>
                    </div>
                  </div>
                  <Link href={`/courses/${course.slug}`} className="p-2 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100 flex-shrink-0">
                    <Eye className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader>
          <CardTitle>Recent Enrollments</CardTitle>
          <span className="text-xs text-slate-500">Latest</span>
        </CardHeader>
        <CardContent>
          {!recentEnrollments || recentEnrollments.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No enrollments yet</p>
          ) : (
            <div className="space-y-1">
              {recentEnrollments.map((e: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 flex items-center justify-center">
                      <GraduationCap className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{e.student_name}</p>
                      <p className="text-xs text-slate-500">{e.course_title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">{timeAgo(e.created_at)}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
