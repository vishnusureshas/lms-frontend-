'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import {
  useListNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from '@/services/api';
import type { Notification } from '@/types';
import { cn, timeAgo } from '@/lib/utils';
import {
  Bell,
  X,
  CheckCheck,
  Mail,
  ExternalLink,
  Award,
  MessageSquare,
  BookOpen,
  GraduationCap,
  AlertCircle,
  Sparkles,
  CreditCard,
  Zap,
  FileText,
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

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useGetUnreadCountQuery(undefined, { pollingInterval: 30000 });
  const { data: notifsData, isLoading } = useListNotificationsQuery({ limit: 10 }, { skip: !isOpen });
  const [markRead] = useMarkNotificationReadMutation();
  const [markAllRead] = useMarkAllNotificationsReadMutation();

  const unreadCount = unreadData?.data?.unreadCount || 0;
  const notifications = notifsData?.data || [];

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await markRead(id).unwrap();
    } catch {
      // silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
    } catch {
      // silently fail
    }
  };

  return (
    <div ref={dropdownRef} className="relative">
      {/* Bell button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative p-2 rounded-xl transition-all duration-200',
          isOpen
            ? 'text-white bg-white/10'
            : 'text-slate-400 hover:text-white hover:bg-white/10'
        )}
        aria-label={`Notifications (${unreadCount} unread)`}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold shadow-lg shadow-rose-500/40">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[380px] sm:w-[420px] max-h-[520px] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl shadow-black/40 z-50 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary-400" />
              <h3 className="text-sm font-semibold text-white">Notifications</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 font-medium">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  className="text-xs px-2.5 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all flex items-center gap-1"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="h-9 w-9 rounded-xl bg-slate-800/60 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-slate-800/60 rounded w-3/4" />
                      <div className="h-2.5 bg-slate-800/40 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="h-10 w-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500 font-medium">No notifications yet</p>
                <p className="text-xs text-slate-600 mt-1">Check back later for updates</p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.04]">
                {notifications.map((notif: Notification) => {
                  const IconComp = notificationIcons[notif.type] || Bell;
                  const colorClass = notificationColors[notif.type] || 'bg-white/[0.04] text-slate-400 border-white/[0.06]';

                  return (
                    <div
                      key={notif.id}
                      className={cn(
                        'relative flex gap-3 px-4 py-3 transition-all duration-150 cursor-pointer group',
                        notif.is_read ? 'opacity-60 hover:opacity-80' : 'bg-white/[0.02] hover:bg-white/[0.04]'
                      )}
                      onClick={() => {
                        if (!notif.is_read) handleMarkRead(notif.id);
                      }}
                    >
                      {/* Unread indicator */}
                      {!notif.is_read && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-primary-400 shadow-lg shadow-primary-400/50" />
                      )}

                      {/* Icon */}
                      <div className={cn(
                        'h-9 w-9 rounded-xl border flex items-center justify-center flex-shrink-0 mt-0.5',
                        colorClass
                      )}>
                        <IconComp className="h-4 w-4" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn(
                            'text-sm leading-snug',
                            notif.is_read ? 'text-slate-400' : 'text-slate-200 font-medium'
                          )}>
                            {notif.title}
                          </p>
                          {/* Mark read action */}
                          {!notif.is_read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkRead(notif.id);
                              }}
                              className="flex-shrink-0 p-1 rounded-md text-slate-500 opacity-0 group-hover:opacity-100 hover:text-white hover:bg-white/10 transition-all"
                              title="Mark as read"
                            >
                              <CheckCheck className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        {notif.message && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notif.message}</p>
                        )}
                        <p className="text-[11px] text-slate-600 mt-1.5">{timeAgo(notif.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-white/[0.06] flex-shrink-0">
              <Link
                href="/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-white/[0.06] transition-all font-medium"
              >
                <ExternalLink className="h-4 w-4" />
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
