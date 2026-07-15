'use client';

import { useAuth } from '@/hooks/useAuth';
import {
  useListCoursesQuery,
  useGetDashboardQuery,
} from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  BarChart3,
  Users,
  BookOpen,
  TrendingUp,
  DollarSign,
  Activity,
  Star,
  Eye,
} from 'lucide-react';

export default function InstructorAnalyticsPage() {
  const { user } = useAuth();
  const { data: coursesData, isLoading: coursesLoading } = useListCoursesQuery({ limit: 100 });
  const { data: dashData } = useGetDashboardQuery();

  if (!user) return <Spinner size="lg" />;
  if (coursesLoading) return <Spinner size="lg" />;

  const courses = coursesData?.data || [];
  const dash = dashData?.data || {};

  // Compute aggregate stats
  const totalStudents = courses.reduce((sum: number, c: any) => sum + (c.total_students || 0), 0);
  const publishedCourses = courses.filter((c: any) => c.is_published);
  const pendingCourses = courses.filter((c: any) => c.status === 'pending_review' || c.status === 'draft');
  const totalRevenue = courses.reduce((sum: number, c: any) => sum + ((c.price || 0) * (c.total_students || 0)), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-sm text-slate-400 mt-1">Track your course performance and student engagement</p>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-gradient-blue glow-blue">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Courses</p>
                <p className="text-xl font-bold text-white tabular-nums">{courses.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">{publishedCourses.length} published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-emerald glow-emerald">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Students</p>
                <p className="text-xl font-bold text-white tabular-nums">{totalStudents}</p>
                <p className="text-xs text-slate-500 mt-0.5">across all courses</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-purple glow-purple">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Pending Review</p>
                <p className="text-xl font-bold text-white tabular-nums">{pendingCourses.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">awaiting action</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-amber glow-amber">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Activity className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Engagement</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {totalStudents > 0 && courses.length > 0
                    ? Math.round(totalStudents / courses.length)
                    : 0}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">avg students/course</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Course Performance Table */}
      <Card glass>
        <CardHeader>
          <CardTitle>Course Performance</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">No courses yet</p>
              <p className="text-sm text-slate-500 mt-1">Create your first course to see analytics</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                    <th className="pb-3 font-medium">Course</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Students</th>
                    <th className="pb-3 font-medium">Rating</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Revenue</th>
                    <th className="pb-3 font-medium">Lessons</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {courses.map((course: any) => (
                    <tr key={course.id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0">
                            {course.title?.charAt(0) || 'C'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-white truncate max-w-[200px]">
                              {course.title || 'Untitled'}
                            </p>
                            <p className="text-xs text-slate-500">{course.level || 'beginner'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          course.status === 'published'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : course.status === 'pending_review'
                            ? 'bg-amber-500/10 text-amber-400'
                            : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {course.status || 'draft'}
                        </span>
                      </td>
                      <td className="py-3.5 text-sm text-slate-400">{course.total_students || 0}</td>
                      <td className="py-3.5">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                          <span className="text-slate-300">
                            {course.average_rating ? Number(course.average_rating).toFixed(1) : '0.0'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 text-sm text-slate-400">
                        {course.price === 0 ? 'Free' : `$${course.price}`}
                      </td>
                      <td className="py-3.5 text-sm text-emerald-400 font-medium">
                        {course.price > 0
                          ? `$${((course.price || 0) * (course.total_students || 0)).toFixed(2)}`
                          : '—'}
                      </td>
                      <td className="py-3.5 text-sm text-slate-400">{course.total_lessons || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card glass>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary-400" />
              <CardTitle>Top Performing Course</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {courses.length === 0 ? (
              <p className="text-sm text-slate-500">No data available</p>
            ) : (
              (() => {
                const top = courses.reduce((best: any, c: any) =>
                  (c.total_students || 0) > (best?.total_students || 0) ? c : best
                , courses[0]);
                return (
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 flex items-center justify-center">
                      <TrendingUp className="h-6 w-6 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">{top.title}</p>
                      <p className="text-xs text-slate-400">
                        {top.total_students || 0} students ·{' '}
                        {top.average_rating ? Number(top.average_rating).toFixed(1) : '0.0'} rating
                      </p>
                    </div>
                  </div>
                );
              })()
            )}
          </CardContent>
        </Card>
        <Card glass>
          <CardHeader>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary-400" />
              <CardTitle>Revenue Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {totalRevenue > 0 ? `$${totalRevenue.toFixed(2)}` : '$0.00'}
                </p>
                <p className="text-xs text-slate-400">
                  {publishedCourses.length} courses · {totalStudents} students
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
