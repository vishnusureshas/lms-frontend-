'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useGetDashboardQuery } from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { timeAgo, getDashboardUrl } from '@/lib/utils';
import { Users, BookOpen, GraduationCap, Clock, Activity, TrendingUp, UserCheck, AlertTriangle } from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const { data, isLoading, error } = useGetDashboardQuery();

  useEffect(() => {
    if (!authLoading && user && user.role !== 'admin') {
      router.replace(getDashboardUrl(user.role));
    }
  }, [user, authLoading, router]);

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!user || user.role !== 'admin') return null;

  if (error || !data?.success) {
    return (
      <Alert type="error">
        Failed to load dashboard. Ensure the backend is running.
      </Alert>
    );
  }

  const stats = data.data.stats;
  const recentUsers = data.data.recentUsers || [];
  const recentEnrollments = data.data.recentEnrollments || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
        <p className="text-sm text-slate-400 mt-1">Platform overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Students" value={stats?.users?.total_students || 0} icon={GraduationCap} color="blue" description="Enrolled learners" />
        <StatCard title="Instructors" value={stats?.users?.total_instructors || 0} icon={Users} color="purple" description="Course creators" />
        <StatCard title="Active Courses" value={stats?.courses?.published || 0} icon={BookOpen} color="cyan" description={`${stats?.courses?.pending || 0} pending review`} />
        <StatCard title="Enrollments" value={stats?.enrollments?.active || 0} icon={UserCheck} color="emerald" description={`${stats?.enrollments?.completed || 0} completed`} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Pending Reviews" value={stats?.pendingReviews || 0} icon={Clock} color="amber" description="Courses awaiting approval" />
        <StatCard title="Total Users" value={(stats?.users?.total_students || 0) + (stats?.users?.total_instructors || 0) + (stats?.users?.total_admins || 0)} icon={Activity} color="blue" description={`${stats?.users?.inactive_users || 0} inactive`} />
        <StatCard title="Total Courses" value={stats?.courses?.total_courses || 0} icon={TrendingUp} color="rose" description="Across all categories" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card glass>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <span className="text-xs text-slate-500">Last 5</span>
          </CardHeader>
          <CardContent>
            {recentUsers.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No recent users</p>
            ) : (
              <div className="space-y-1">
                {recentUsers.slice(0, 5).map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500/20 to-purple-500/20 flex items-center justify-center text-sm font-bold text-primary-400">
                        {u.full_name?.charAt(0) || 'U'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{u.full_name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 capitalize border border-primary-500/10">
                        {u.role}
                      </span>
                      <span className="text-xs text-slate-500">{timeAgo(u.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card glass>
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
            <span className="text-xs text-slate-500">Last 5</span>
          </CardHeader>
          <CardContent>
            {recentEnrollments.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No enrollments yet</p>
            ) : (
              <div className="space-y-1">
                {recentEnrollments.slice(0, 5).map((e: any, idx: number) => (
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
    </div>
  );
}
