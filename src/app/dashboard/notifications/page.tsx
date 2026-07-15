'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from '@/services/api';
import type { Notification, PaginationMeta } from '@/types';
import { Spinner } from '@/components/ui/Spinner';
import { SkeletonList } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import toast from 'react-hot-toast';
import { cn, timeAgo, getDashboardUrl } from '@/lib/utils';
import {
  Bell,
  ArrowLeft,
  CheckCheck,
  Trash2,
  MessageSquare,
  Award,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Sparkles,
  CreditCard,
  Zap,
  FileText,
  ChevronLeft,
  ChevronRight,
  Mail,
  MailOpen,
} from 'lucide-react';

const notificationIcons: Record<string, any> = {
  enrollment: GraduationCap,
  course_update: BookOpen,
  quiz_graded: Award,
  assignment_due: AlertCircle,
  grade_posted: FileText,
  certificate_issued: Award,
  discussion_reply: MessageSquare,
  course_approved: Sparkles,
  payment_received: CreditCard,
  system_announcement: Zap,
};

const notificationColors: Record<string, string> = {
  enrollment: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  course_update: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  quiz_graded: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  assignment_due: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
  grade_posted: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
  certificate_issued: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  discussion_reply: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
  course_approved: 'bg-green-500/15 text-green-400 border-green-500/20',
  payment_received: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  system_announcement: 'bg-pink-500/15 text-pink-400 border-pink-500/20',
};

const notificationLabels: Record<string, string> = {
  enrollment: 'Enrollment',
  course_update: 'Course Update',
  quiz_graded: 'Quiz Graded',
  assignment_due: 'Assignment Due',
  grade_posted: 'Grade Posted',
  certificate_issued: 'Certificate',
  discussion_reply: 'Discussion Reply',
  course_approved: 'Course Approved',
  payment_received: 'Payment',
  system_announcement: 'Announcement',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const limit = 20;

  const { data, isLoading, error } = useListNotificationsQuery({ page, limit });
  const { data: unreadData } = useGetUnreadCountQuery();
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();
  const [deleteNotif] = useDeleteNotificationMutation();

  const notifications = data?.data || [];
  const meta = data?.meta as PaginationMeta | undefined;
  const unreadCount = unreadData?.data?.unreadCount || 0;

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id).unwrap();
    } catch {
      toast.error('Failed to mark as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotif(id).unwrap();
      toast.success('Notification deleted');
    } catch {
      toast.error('Failed to delete notification');
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!user) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link
            href={getDashboardUrl(user.role)}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Notifications</h1>
            <p className="text-sm text-slate-400">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead} isLoading={isMarkingAll} variant="secondary" size="sm">
              <CheckCheck className="h-4 w-4" />
              Mark All Read
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <Card glass>
          <CardContent className="p-6">
            <SkeletonList rows={6} />
          </CardContent>
        </Card>
      ) : error ? (
        <Alert type="error">Failed to load notifications.</Alert>
      ) : notifications.length === 0 ? (
        <Card glass>
          <CardContent className="py-16 text-center">
            <div className="h-20 w-20 rounded-3xl bg-white/[0.04] flex items-center justify-center mx-auto mb-4">
              <Bell className="h-10 w-10 text-slate-600" />
            </div>
            <h2 className="text-lg font-semibold text-white mb-1">No notifications yet</h2>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
              Notifications about your courses, quizzes, discussions, and more will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* List */}
          <div className="space-y-2">
            {notifications.map((notif: Notification) => {
              const IconComp = notificationIcons[notif.type] || Bell;
              const colorClass = notificationColors[notif.type] || 'bg-white/[0.04] text-slate-400 border-white/[0.06]';
              const isSelected = selectedIds.has(notif.id);

              return (
                <div
                  key={notif.id}
                  className={cn(
                    'relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-200 group',
                    isSelected
                      ? 'bg-primary-500/5 border-primary-500/20'
                      : notif.is_read
                        ? 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04]'
                        : 'bg-gradient-to-r from-white/[0.04] to-white/[0.01] border-white/[0.08] hover:from-white/[0.06] hover:to-white/[0.03]'
                  )}
                >
                  {/* Unread dot */}
                  {!notif.is_read && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-primary-400 shadow-lg shadow-primary-400/50" />
                  )}

                  {/* Checkbox */}
                  <div className="flex-shrink-0 pt-1">
                    <button
                      onClick={() => toggleSelect(notif.id)}
                      className={cn(
                        'h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all',
                        isSelected
                          ? 'bg-primary-500 border-primary-500'
                          : 'border-slate-600 hover:border-slate-500'
                      )}
                    >
                      {isSelected && (
                        <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Icon */}
                  <div className={cn('h-11 w-11 rounded-2xl border flex items-center justify-center flex-shrink-0', colorClass)}>                          <IconComp className="h-5 w-5" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn(
                            'text-[10px] px-2 py-0.5 rounded-full font-medium',
                            colorClass
                          )}>
                            {notificationLabels[notif.type] || notif.type}
                          </span>
                          {!notif.is_read && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-500/10 text-primary-400 border border-primary-500/20">
                              New
                            </span>
                          )}
                        </div>
                        <h3 className={cn(
                          'text-sm mt-1.5',
                          notif.is_read ? 'text-slate-300' : 'text-white font-medium'
                        )}>
                          {notif.title}
                        </h3>
                        {notif.message && (
                          <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 mt-2">{timeAgo(notif.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!notif.is_read && (
                      <button
                        onClick={() => handleMarkRead(notif.id)}
                        className="p-2 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-all"
                        title="Mark as read"
                      >
                        <MailOpen className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(notif.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
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
        </>
      )}
    </div>
  );
}
