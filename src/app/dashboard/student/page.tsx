'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useGetDashboardQuery, useListCoursesQuery } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { getDashboardUrl } from '@/lib/utils';
import { BookOpen, GraduationCap, TrendingUp, ArrowRight, Star, Users, Compass } from 'lucide-react';

export default function StudentDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data: dashData } = useGetDashboardQuery();
  const { data: coursesData } = useListCoursesQuery({ limit: 4, sort: '-createdAt' });

  useEffect(() => {
    if (!authLoading && user && user.role !== 'student') {
      router.replace(getDashboardUrl(user.role));
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) return <Spinner size="lg" />;
  if (user.role !== 'student') return null;

  const enrollments = dashData?.data?.enrollments || [];
  const totalEnrolled = dashData?.data?.totalEnrolled || enrollments.length;
  const totalCompleted = enrollments.filter((e: any) => e.status === 'completed').length;
  const avgProgress = enrollments.length > 0
    ? Math.round(enrollments.reduce((sum: number, e: any) => sum + (e.progress_pct || 0), 0) / enrollments.length)
    : 0;
  const recentCourses = coursesData?.data || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, <span className="gradient-text-amber">{user.fullName}</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">Continue your learning journey</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-gradient-blue glow-blue">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Enrolled</p>
                <p className="text-xl font-bold text-white tabular-nums">{totalEnrolled}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-emerald glow-emerald">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-xl font-bold text-white tabular-nums">{totalCompleted}</p>
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
                <p className="text-xs text-slate-400 uppercase tracking-wider">Progress</p>
                <p className="text-xl font-bold text-white tabular-nums">{avgProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-amber glow-amber">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Compass className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Available</p>
                <p className="text-xl font-bold text-white tabular-nums">{recentCourses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle>My Courses</CardTitle>
          {enrollments.length > 0 && <span className="text-xs text-slate-500">{enrollments.length} enrolled</span>}
        </CardHeader>
        <CardContent>
          {enrollments.length === 0 ? (
            <div className="text-center py-10">
              <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Not enrolled in any courses yet</p>
              <p className="text-sm text-slate-500 mt-1">Browse our catalog and start learning today</p>
              <Link href="/dashboard/browse" className="inline-flex items-center gap-1.5 mt-4 text-sm text-primary-400 hover:text-primary-300 font-medium transition-colors">
                Browse Courses <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {enrollments.map((e: any) => (
                <div key={e.id} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] transition-all">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0">
                      {e.title?.charAt(0) || 'C'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-white text-sm truncate">{e.title || 'Course'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-slate-500">{e.level}</span>
                        <span className="text-xs text-slate-600">•</span>
                        <span className="text-xs text-slate-500">{e.progress_pct || 0}% complete</span>
                      </div>
                    </div>
                  </div>
                  <div className="w-20 sm:w-28 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-purple-500 transition-all duration-500" style={{ width: `${e.progress_pct || 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card glass>
        <CardHeader>
          <CardTitle>Recommended Courses</CardTitle>
          <Link href="/dashboard/browse" className="text-xs text-primary-400 hover:text-primary-300 transition-colors">View All →</Link>
        </CardHeader>
        <CardContent>
          {recentCourses.length === 0 ? (
            <p className="text-sm text-slate-500 py-6 text-center">No courses available yet</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentCourses.slice(0, 4).map((course) => (
                <Link key={course.id} href={`/courses/${course.slug}`}>
                  <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.06] hover:border-white/[0.08] transition-all group">
                    <div className="flex items-start gap-3">
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center text-sm font-bold text-primary-400 flex-shrink-0">
                        {course.title?.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white text-sm group-hover:text-primary-400 transition-colors truncate">{course.title}</p>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                            {course.average_rating ? Number(course.average_rating).toFixed(1) : '0.0'}
                          </span>
                          <span>{course.level}</span>
                          <span className="font-medium text-primary-400">{course.price === 0 ? 'Free' : `$${course.price}`}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
