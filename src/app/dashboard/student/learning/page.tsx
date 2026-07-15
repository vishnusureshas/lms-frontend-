'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useListEnrollmentsQuery, useGetDashboardQuery } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import {
  BookOpen,
  PlayCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  BarChart3,
  Target,
  ArrowRight,
  Search,
  Award,
} from 'lucide-react';

export default function StudentLearningPage() {
  const { user } = useAuth();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const { data: enrollmentsData, isLoading } = useListEnrollmentsQuery({
    limit: 50,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
  });
  const { data: dashData } = useGetDashboardQuery();

  if (!user) return <Spinner size="lg" />;
  if (isLoading) return <Spinner size="lg" />;

  const enrollments = enrollmentsData?.data || [];
  const stats = dashData?.data;

  const filteredEnrollments = enrollments.filter((e: any) => {
    if (search && !e.title?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const activeEnrollments = enrollments.filter((e: any) => e.status === 'active');
  const completedEnrollments = enrollments.filter((e: any) => e.status === 'completed');
  const inProgress = enrollments.filter(
    (e: any) => e.status === 'active' && (e.progress_pct || 0) > 0 && (e.progress_pct || 0) < 100
  );

  const filters = [
    { label: 'All Courses', value: 'all', count: enrollments.length },
    { label: 'In Progress', value: 'active', count: activeEnrollments.length },
    { label: 'Completed', value: 'completed', count: completedEnrollments.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">My Learning</h1>
        <p className="text-sm text-slate-400 mt-1">Track your courses and continue learning</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="stat-gradient-blue glow-blue">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Enrolled</p>
                <p className="text-xl font-bold text-white tabular-nums">{stats?.totalEnrolled || enrollments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-emerald glow-emerald">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Completed</p>
                <p className="text-xl font-bold text-white tabular-nums">{completedEnrollments.length}</p>
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
                <p className="text-xs text-slate-400 uppercase tracking-wider">In Progress</p>
                <p className="text-xl font-bold text-white tabular-nums">{inProgress.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-gradient-amber glow-amber">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Target className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Progress</p>
                <p className="text-xl font-bold text-white tabular-nums">
                  {enrollments.length > 0
                    ? Math.round(
                        enrollments.reduce((sum: number, e: any) => sum + (e.progress_pct || 0), 0) /
                          enrollments.length
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search your courses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20 transition-all"
          />
        </div>

        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.04] border border-white/[0.06]">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.value
                  ? 'bg-primary-500/20 text-primary-300 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {f.label}
              <span className="ml-1.5 text-slate-500">({f.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Course List */}
      {filteredEnrollments.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <BookOpen className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">
              {search ? 'No courses match your search' : statusFilter === 'completed' ? 'No completed courses yet' : 'No enrolled courses yet'}
            </h3>
            <p className="text-sm text-slate-400 mb-6">
              {search
                ? 'Try adjusting your search terms'
                : statusFilter === 'completed'
                ? 'Complete a course to see it here'
                : 'Start by browsing our course catalog'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link
                href="/dashboard/browse"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white text-sm font-medium transition-all"
              >
                Browse Courses <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredEnrollments.map((enrollment: any) => {
            const progress = enrollment.progress_pct || 0;
            const isCompleted = enrollment.status === 'completed';

            return (
              <Card key={enrollment.id} glass hover className="group">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row gap-4 items-start">
                    <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      ) : (
                        <BookOpen className="h-8 w-8 text-primary-400" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/courses/${enrollment.slug}`}
                        className="font-semibold text-white hover:text-primary-400 transition-colors"
                      >
                        {enrollment.title || 'Untitled Course'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{enrollment.level || 'All levels'}</span>
                        <span>•</span>
                        <span>Instructor: {enrollment.instructor_name || 'Unknown'}</span>
                        <span>•</span>
                        <span>
                          Enrolled {new Date(enrollment.enrolled_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1.5">
                          <span className={isCompleted ? 'text-emerald-400' : 'text-slate-400'}>
                            {isCompleted ? 'Completed' : `${progress}% complete`}
                          </span>
                          <span className="text-slate-500">
                            {enrollment.total_lessons || 0} lessons
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full transition-all duration-700 ${
                              isCompleted
                                ? 'bg-emerald-500'
                                : 'bg-gradient-to-r from-primary-500 to-purple-500'
                            }`}
                            style={{ width: `${isCompleted ? 100 : progress}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex-shrink-0 self-center">
                      {isCompleted ? (
                        <Link
                          href="/dashboard/student/certificates"
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 text-sm font-medium transition-all"
                        >
                          <Award className="h-4 w-4" />
                          Certificate
                        </Link>
                      ) : (                          <Link
                              href={`/courses/${enrollment.slug}`}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 text-sm font-medium transition-all group/btn"
                            >
                              <PlayCircle className="h-4 w-4 group-hover/btn:scale-110 transition-transform" />
                              {progress > 0 ? 'Continue' : 'Start'}
                            </Link>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
