'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store/store';
import Sidebar from '@/components/layout/Sidebar';
import Navbar from '@/components/layout/Navbar';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { LogoutLoader } from '@/components/ui/Loader';
import { useAuth } from '@/hooks/useAuth';
import { getDashboardUrl } from '@/lib/utils';
import { Menu } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useSelector(
    (state: RootState) => state.auth
  );
  const { isLoggingOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Role redirect
  useEffect(() => {
    if (user && typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path === '/dashboard' || path === '/dashboard/') {
        router.replace(getDashboardUrl(user.role));
      }
    }
  }, [user, router]);

  if (isLoading) return <FullPageSpinner />;
  if (!isAuthenticated) return null;

  return (
    <>
      {isLoggingOut && <LogoutLoader />}
      <div className="min-h-screen bg-[#020617] dash-grid">
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar - glass effect */}
          <Sidebar
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            isMobile={isMobile}
          />

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
            <Navbar
              onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
              isSidebarOpen={isSidebarOpen}
              isMobile={isMobile}
            />

            {/* Mobile sidebar toggle button (fixed) */}
            {isMobile && !isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 text-white shadow-2xl shadow-primary-500/30 flex items-center justify-center hover:scale-105 active:scale-95 transition-all duration-200"
                aria-label="Open menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}

            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <div className="max-w-7xl mx-auto animate-fade-in">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </>
  );
}
