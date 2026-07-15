'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { capitalize } from '@/lib/utils';
import { LogOut, User, ChevronDown, Menu, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import NotificationDropdown from '@/components/notifications/NotificationDropdown';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  isMobile?: boolean;
}

export default function Navbar({ onToggleSidebar, isSidebarOpen, isMobile }: NavbarProps) {
  const { user, logout, isLoggingOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex-shrink-0">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl border-b border-white/[0.06]" />
      <div className="relative flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left */}
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}

          {/* Search (desktop) */}
          <div className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-400 text-sm w-64">
            <Search className="h-4 w-4 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent border-none outline-none text-white placeholder-slate-500 w-full text-sm"
            />
            <kbd className="hidden lg:inline-flex text-xs px-1.5 py-0.5 rounded bg-white/10 text-slate-500 font-medium">⌘K</kbd>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <NotificationDropdown />

          {/* User dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.06] transition-all group"
            >
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center font-bold text-xs text-white shadow-lg">
                {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium text-white truncate max-w-[120px]">
                  {user?.fullName}
                </p>
                <p className="text-xs text-slate-400">{capitalize(user?.role || '')}</p>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
            </button>

            {/* Dropdown */}
            {isDropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/[0.08] shadow-2xl py-2 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/[0.06]">
                    <p className="text-sm font-semibold text-white">{user?.fullName}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
                  </div>
                  <div className="p-1">
                    <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-slate-300 hover:bg-white/10 hover:text-white transition-all">
                      <User className="h-4 w-4" />
                      Profile
                    </button>
                    <button
                      onClick={() => { setIsDropdownOpen(false); logout(); }}
                      disabled={isLoggingOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <LogOut className={cn('h-4 w-4', isLoggingOut && 'animate-pulse')} />
                      {isLoggingOut ? 'Signing Out...' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
