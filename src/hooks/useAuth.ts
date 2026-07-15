'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '@/store/store';
import { loadAuthFromStorage, logout as logoutAction } from '@/store/slices/authSlice';
import { useLogoutMutation } from '@/services/api';
import { getDashboardUrl } from '@/lib/utils';

/**
 * Hook for auth state, login redirect, and logout
 */
export function useAuth() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const [backendLogout] = useLogoutMutation();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { user, isAuthenticated, isLoading, accessToken } = useSelector(
    (state: RootState) => state.auth
  );

  // Load persisted auth on mount
  useEffect(() => {
    dispatch(loadAuthFromStorage());
  }, [dispatch]);

  /**
   * Logout — shows loader, clears state, and redirects to login
   */
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      if (accessToken) {
        await backendLogout().unwrap();
      }
    } catch {
      // Proceed with local logout even if API call fails
    }
    // Brief delay to show the beautiful loader
    await new Promise((resolve) => setTimeout(resolve, 800));
    dispatch(logoutAction());
    setIsLoggingOut(false);
    router.push('/login');
  };

  /**
   * Redirect to the correct dashboard based on role
   */
  const redirectToDashboard = () => {
    if (!user) return '/login';
    const path = getDashboardUrl(user.role);
    router.push(path);
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isLoggingOut,
    logout: handleLogout,
    redirectToDashboard,
  };
}
