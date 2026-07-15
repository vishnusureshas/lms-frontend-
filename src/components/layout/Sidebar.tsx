'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  BarChart3,
  Settings,
  Compass,
  Award,
  MessageSquare,
  MessageCircle,
  FileText,
  FolderTree,
  LogOut,
  X,
  Sparkles,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard, roles: ['admin'] },
  { label: 'Users', href: '/dashboard/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Courses', href: '/dashboard/admin/courses', icon: BookOpen, roles: ['admin'] },
  { label: 'Students', href: '/dashboard/admin/students', icon: Users, roles: ['admin'] },
  { label: 'Categories', href: '/dashboard/admin/categories', icon: FolderTree, roles: ['admin'] },
  { label: 'Reports', href: '/dashboard/admin/reports', icon: FileText, roles: ['admin'] },

  { label: 'Dashboard', href: '/dashboard/instructor', icon: LayoutDashboard, roles: ['instructor'] },
  { label: 'My Courses', href: '/dashboard/courses', icon: BookOpen, roles: ['instructor'] },
  { label: 'Students', href: '/dashboard/instructor/students', icon: Users, roles: ['instructor'] },
  { label: 'Analytics', href: '/dashboard/instructor/analytics', icon: BarChart3, roles: ['instructor'] },

  { label: 'Dashboard', href: '/dashboard/student', icon: LayoutDashboard, roles: ['student'] },
  { label: 'Browse', href: '/dashboard/browse', icon: Compass, roles: ['student'] },
  { label: 'My Learning', href: '/dashboard/student/learning', icon: BookOpen, roles: ['student'] },
  { label: 'Certificates', href: '/dashboard/student/certificates', icon: Award, roles: ['student'] },

  { label: 'Discussions', href: '/dashboard/discussions', icon: MessageSquare, roles: ['student', 'instructor'] },
  { label: 'Chat', href: '/dashboard/chat', icon: MessageCircle, roles: ['student', 'instructor', 'admin'] },
  { label: 'Settings', href: '/dashboard/settings', icon: Settings, roles: ['admin', 'instructor', 'student'] },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function Sidebar({ isOpen, onClose, isMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout, isLoggingOut } = useAuth();

  const visibleItems = navItems.filter(
    (item) => user?.role && item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (['/dashboard/admin', '/dashboard/instructor', '/dashboard/student'].includes(href)) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out',
          isMobile
            ? cn('w-72', isOpen ? 'translate-x-0' : '-translate-x-full')
            : 'w-64 translate-x-0'
        )}
      >
        {/* Glass background */}
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl border-r border-white/[0.06]" />

        {/* Content */}
        <div className="relative flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-5 border-b border-white/[0.06] flex-shrink-0">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg gradient-text">EduLMS</span>
            </Link>
            {isMobile && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="h-5 w-5 text-slate-400" />
              </button>
            )}
          </div>

          {/* User section */}
          <div className="px-4 py-4 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.04]">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-sm text-white shadow-lg">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white truncate">{user?.fullName}</p>
                <p className="text-xs text-slate-400 capitalize flex items-center gap-1.5">
                  <span className={cn(
                    'h-1.5 w-1.5 rounded-full',
                    user?.role === 'admin' ? 'bg-amber-400' : user?.role === 'instructor' ? 'bg-emerald-400' : 'bg-blue-400'
                  )} />
                  {user?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
            {visibleItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  onClick={() => isMobile && onClose()}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    active
                      ? 'bg-gradient-to-r from-primary-500/15 to-purple-500/10 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5 flex-shrink-0 transition-colors duration-200',
                    active ? 'text-primary-400' : 'text-slate-500 group-hover:text-slate-300'
                  )} />
                  <span>{item.label}</span>
                  {active && (
                    <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary-400 shadow-lg shadow-primary-400/50" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-white/[0.06] flex-shrink-0">
            <button
              onClick={logout}
              disabled={isLoggingOut}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {/* Hover background */}
              <div className="absolute inset-0 bg-rose-500/0 group-hover:bg-rose-500/10 transition-all duration-200 rounded-xl" />
              <LogOut className={cn(
                'h-5 w-5 relative z-10 transition-colors duration-200',
                isLoggingOut ? 'text-rose-400 animate-pulse' : 'text-slate-400 group-hover:text-rose-400'
              )} />
              <span className={cn(
                'relative z-10 transition-colors duration-200',
                isLoggingOut ? 'text-rose-400' : 'text-slate-400 group-hover:text-rose-400'
              )}>
                {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
              </span>
              {isLoggingOut && (
                <div className="absolute inset-0 bg-rose-500/5 animate-pulse rounded-xl" />
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
