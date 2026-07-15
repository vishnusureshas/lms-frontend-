'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  useGetDashboardQuery,
  useGetAuditLogsQuery,
  useAdminListEnrollmentsQuery,
  useAdminListPaymentsQuery,
} from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { StatCard } from '@/components/ui/StatCard';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import { SkeletonList } from '@/components/ui/Skeleton';
import { cn, timeAgo } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  TrendingUp,
  Users,
  BookOpen,
  GraduationCap,
  Activity,
  BarChart3,
  Clock,
  UserCheck,
  Award,
  DollarSign,
  Shield,
  ChevronLeft,
  ChevronRight,
  FileText,
  Receipt,
  Calendar,
} from 'lucide-react';
import type { PaginationMeta } from '@/types';

type Tab = 'overview' | 'audit-logs' | 'enrollments' | 'payments';

const tabs: { id: Tab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'audit-logs', label: 'Audit Logs', icon: Shield },
  { id: 'enrollments', label: 'Enrollments', icon: GraduationCap },
  { id: 'payments', label: 'Payments', icon: DollarSign },
];

export default function AdminReportsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold gradient-text">Platform Reports</h1>
        <p className="text-sm text-slate-400 mt-0.5">Analytics, audit logs, and platform data</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06] w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setPage(1); }}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all',
                activeTab === tab.id
                  ? 'bg-primary-500/15 text-primary-400'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'audit-logs' && <AuditLogsTab page={page} setPage={setPage} />}
      {activeTab === 'enrollments' && <EnrollmentsTab page={page} setPage={setPage} />}
      {activeTab === 'payments' && <PaymentsTab page={page} setPage={setPage} />}
    </div>
  );
}

// ──────────────────────────────────────────────
// Overview Tab
// ──────────────────────────────────────────────
function OverviewTab() {
  const { data, isLoading, error } = useGetDashboardQuery();

  if (isLoading) {
    return <div className="flex justify-center py-12"><Spinner size="lg" text="Loading reports..." /></div>;
  }

  if (error || !data?.success) {
    return <Alert type="error">Failed to load reports data. Ensure the backend is running.</Alert>;
  }

  const stats = data.data.stats;
  const totalUsers = (stats?.users?.total_students || 0) +
    (stats?.users?.total_instructors || 0) +
    (stats?.users?.total_admins || 0);

  const activeEnrollments = stats?.enrollments?.active || 0;
  const completedEnrollments = stats?.enrollments?.completed || 0;
  const totalEnrollments = stats?.enrollments?.total || 0;
  const completionRate = totalEnrollments > 0
    ? Math.round((completedEnrollments / totalEnrollments) * 100)
    : 0;

  const totalCourses = stats?.courses?.total_courses || 0;
  const publishedCourses = stats?.courses?.published || 0;
  const pendingCourses = stats?.courses?.pending || 0;
  const publicationRate = totalCourses > 0
    ? Math.round((publishedCourses / totalCourses) * 100)
    : 0;

  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Users" value={totalUsers} icon={Users} color="blue"
          description={`${stats?.users?.total_students || 0} students, ${stats?.users?.total_instructors || 0} instructors`} />
        <StatCard title="Total Courses" value={totalCourses} icon={BookOpen} color="purple"
          description={`${publishedCourses} published, ${pendingCourses} pending`} />
        <StatCard title="Enrollments" value={totalEnrollments} icon={GraduationCap} color="emerald"
          description={`${activeEnrollments} active, ${completedEnrollments} completed`} />
        <StatCard title="Pending Reviews" value={stats?.pendingReviews || 0} icon={Clock} color="amber"
          description="Courses awaiting approval" />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Breakdown */}
        <Card glass>
          <CardHeader>
            <CardTitle>User Breakdown</CardTitle>
            <Users className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Students', count: stats?.users?.total_students || 0, color: 'bg-blue-500', iconColor: 'text-blue-400', icon: GraduationCap },
                { label: 'Instructors', count: stats?.users?.total_instructors || 0, color: 'bg-emerald-500', iconColor: 'text-emerald-400', icon: BookOpen },
                { label: 'Inactive Users', count: stats?.users?.inactive_users || 0, color: 'bg-rose-500', iconColor: 'text-rose-400', icon: Activity },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-white">{item.count}</span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${totalUsers > 0 ? (item.count / totalUsers) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Course Breakdown */}
        <Card glass>
          <CardHeader>
            <CardTitle>Course Status</CardTitle>
            <BarChart3 className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { label: 'Published', count: publishedCourses, color: 'bg-emerald-500', iconColor: 'text-emerald-400', icon: Award },
                { label: 'Pending Review', count: pendingCourses, color: 'bg-amber-500', iconColor: 'text-amber-400', icon: Clock },
                { label: 'Draft', count: stats?.courses?.draft || 0, color: 'bg-slate-500', iconColor: 'text-slate-400', icon: Activity },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-slate-300 flex items-center gap-2">
                      <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-white">{item.count}</span>
                  </div>
                  <div className="h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${item.color} transition-all duration-500`}
                      style={{ width: `${totalCourses > 0 ? (item.count / totalCourses) * 100 : 0}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Enrollment Metrics */}
        <Card glass>
          <CardHeader>
            <CardTitle>Enrollment Metrics</CardTitle>
            <UserCheck className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-2xl font-bold text-white">{activeEnrollments}</p>
                <p className="text-xs text-slate-500 mt-1">Active</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-2xl font-bold text-emerald-400">{completedEnrollments}</p>
                <p className="text-xs text-slate-500 mt-1">Completed</p>
              </div>
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                <p className="text-2xl font-bold text-amber-400">{completionRate}%</p>
                <p className="text-xs text-slate-500 mt-1">Completion</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card glass>
          <CardHeader>
            <CardTitle>Key Insights</CardTitle>
            <TrendingUp className="h-5 w-5 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Student-to-Instructor Ratio', value: `${(stats?.users?.total_instructors || 0) > 0 ? ((stats?.users?.total_students || 0) / (stats?.users?.total_instructors || 1)).toFixed(1) : '—'}:1` },
                { label: 'Avg Enrollments per Course', value: totalCourses > 0 ? (totalEnrollments / totalCourses).toFixed(1) : '0' },
                { label: 'Publication Rate', value: `${publicationRate}%`, color: 'text-emerald-400' },
                { label: 'Course Completion Rate', value: `${completionRate}%`, color: 'text-amber-400' },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                  <span className="text-sm text-slate-300">{item.label}</span>
                  <span className={cn('text-sm font-semibold', item.color || 'text-white')}>{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────
// Audit Logs Tab
// ──────────────────────────────────────────────
function AuditLogsTab({ page, setPage }: { page: number; setPage: (n: number) => void }) {
  const { data, isLoading, error } = useGetAuditLogsQuery({ page, limit: 20 });

  const logs = data?.data || [];
  const meta = data?.meta as PaginationMeta | undefined;

  return (
    <>
      <div>
        <h2 className="text-lg font-semibold text-white">Audit Logs</h2>
        <p className="text-sm text-slate-400">Admin actions history with timestamps</p>
      </div>

      {isLoading ? (
        <Card glass><CardContent className="p-6"><SkeletonList rows={8} /></CardContent></Card>
      ) : error ? (
        <Alert type="error">Failed to load audit logs. Ensure the backend is running.</Alert>
      ) : logs.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <Shield className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No audit logs yet</h3>
            <p className="text-sm text-slate-500">Admin actions will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card glass>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="pb-3 font-medium">Action</th>
                      <th className="pb-3 font-medium">Admin</th>
                      <th className="pb-3 font-medium">Target</th>
                      <th className="pb-3 font-medium">Details</th>
                      <th className="pb-3 font-medium">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {logs.map((log: any) => (
                      <tr key={log.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5">
                          <span className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
                            log.action?.includes('delete') ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                            log.action?.includes('ban') ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            log.action?.includes('approve') ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            log.action?.includes('update') ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-blue-500/10 text-blue-400 border-blue-500/20'
                          )}>
                            {log.action}
                          </span>
                        </td>
                        <td className="py-3.5 text-sm text-slate-300">{log.admin_name || 'System'}</td>
                        <td className="py-3.5 text-sm text-slate-400">
                          {log.target_type}: {log.target_id?.slice(0, 8)}...
                        </td>
                        <td className="py-3.5 text-sm text-slate-500 max-w-[200px] truncate">
                          {log.details ? JSON.stringify(log.details).slice(0, 60) : '—'}
                        </td>
                        <td className="py-3.5 text-sm text-slate-500">{timeAgo(log.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination meta={meta} page={page} setPage={setPage} />
          )}
        </>
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// Enrollments Tab
// ──────────────────────────────────────────────
function EnrollmentsTab({ page, setPage }: { page: number; setPage: (n: number) => void }) {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading, error } = useAdminListEnrollmentsQuery({
    page, limit: 20, status: statusFilter || undefined,
  });

  const enrollments = data?.data || [];
  const meta = data?.meta as PaginationMeta | undefined;

  const statusColors: Record<string, string> = {
    active: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    dropped: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    expired: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Enrollments</h2>
          <p className="text-sm text-slate-400">All platform enrollments</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none appearance-none cursor-pointer"
        >
          <option value="" className="bg-slate-900">All Status</option>
          <option value="active" className="bg-slate-900">Active</option>
          <option value="completed" className="bg-slate-900">Completed</option>
          <option value="dropped" className="bg-slate-900">Dropped</option>
        </select>
      </div>

      {isLoading ? (
        <Card glass><CardContent className="p-6"><SkeletonList rows={8} /></CardContent></Card>
      ) : error ? (
        <Alert type="error">Failed to load enrollments.</Alert>
      ) : enrollments.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <GraduationCap className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No enrollments found</h3>
            <p className="text-sm text-slate-500">Try adjusting your filter</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card glass>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="pb-3 font-medium">Student</th>
                      <th className="pb-3 font-medium">Course</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Progress</th>
                      <th className="pb-3 font-medium">Enrolled</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {enrollments.map((e: any) => (
                      <tr key={e.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5">
                          <div>
                            <p className="text-sm font-medium text-white">{e.student_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{e.student_email || ''}</p>
                          </div>
                        </td>
                        <td className="py-3.5 text-sm text-slate-300 max-w-[200px] truncate">{e.course_title || '—'}</td>
                        <td className="py-3.5">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', statusColors[e.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
                            {e.status}
                          </span>
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2 min-w-[100px]">
                            <div className="flex-1 bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div className={cn('h-2 rounded-full transition-all', e.progress_pct >= 100 ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary-500 to-purple-500')}
                                style={{ width: `${Math.min(e.progress_pct || 0, 100)}%` }} />
                            </div>
                            <span className="text-xs text-slate-400 w-8 tabular-nums">{Math.round(e.progress_pct || 0)}%</span>
                          </div>
                        </td>
                        <td className="py-3.5 text-sm text-slate-500">{e.enrolled_at ? timeAgo(e.enrolled_at) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination meta={meta} page={page} setPage={setPage} />
          )}
        </>
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// Payments Tab
// ──────────────────────────────────────────────
function PaymentsTab({ page, setPage }: { page: number; setPage: (n: number) => void }) {
  const [statusFilter, setStatusFilter] = useState('');
  const { data, isLoading, error } = useAdminListPaymentsQuery({
    page, limit: 20, status: statusFilter || undefined,
  });

  const payments = data?.data || [];
  const meta = data?.meta as PaginationMeta | undefined;

  const statusColors: Record<string, string> = {
    completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    refunded: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <>
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">Payments</h2>
          <p className="text-sm text-slate-400">Transaction history</p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-white text-sm focus:outline-none appearance-none cursor-pointer"
        >
          <option value="" className="bg-slate-900">All Status</option>
          <option value="completed" className="bg-slate-900">Completed</option>
          <option value="pending" className="bg-slate-900">Pending</option>
          <option value="failed" className="bg-slate-900">Failed</option>
          <option value="refunded" className="bg-slate-900">Refunded</option>
        </select>
      </div>

      {isLoading ? (
        <Card glass><CardContent className="p-6"><SkeletonList rows={8} /></CardContent></Card>
      ) : error ? (
        <Alert type="error">Failed to load payments.</Alert>
      ) : payments.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <Receipt className="h-14 w-14 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-1">No payments found</h3>
            <p className="text-sm text-slate-500">Transactions will appear here</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card glass>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-white/[0.06]">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Course</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 font-medium">Method</th>
                      <th className="pb-3 font-medium">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {payments.map((p: any) => (
                      <tr key={p.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="py-3.5">
                          <div>
                            <p className="text-sm font-medium text-white">{p.user_name || 'Unknown'}</p>
                            <p className="text-xs text-slate-500">{p.user_email || ''}</p>
                          </div>
                        </td>
                        <td className="py-3.5 text-sm text-slate-300 max-w-[180px] truncate">{p.course_title || '—'}</td>
                        <td className="py-3.5 text-sm font-semibold text-white">
                          ${Number(p.amount || 0).toFixed(2)}
                          <span className="text-xs text-slate-500 ml-1">{p.currency || 'USD'}</span>
                        </td>
                        <td className="py-3.5">
                          <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border', statusColors[p.status] || 'bg-slate-500/10 text-slate-400 border-slate-500/20')}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-sm text-slate-400">{p.payment_method || '—'}</td>
                        <td className="py-3.5 text-sm text-slate-500">{p.created_at ? timeAgo(p.created_at) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {meta && meta.totalPages > 1 && (
            <Pagination meta={meta} page={page} setPage={setPage} />
          )}
        </>
      )}
    </>
  );
}

// ──────────────────────────────────────────────
// Shared Pagination
// ──────────────────────────────────────────────
function Pagination({ meta, page, setPage }: { meta: PaginationMeta; page: number; setPage: (n: number) => void }) {
  return (
    <div className="flex items-center justify-between pt-2">
      <p className="text-sm text-slate-500">Page {meta.page} of {meta.totalPages}</p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => setPage(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => setPage(Math.min(meta.totalPages, page + 1))}
          disabled={page >= meta.totalPages}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
