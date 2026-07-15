'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '@/store/store';
import { loadAuthFromStorage } from '@/store/slices/authSlice';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { getDashboardUrl } from '@/lib/utils';

export default function HomePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated, isLoading, user } = useSelector(
    (state: RootState) => state.auth
  );
  const hasRedirected = useRef(false);

  // Force load auth from storage on mount
  useEffect(() => {
    dispatch(loadAuthFromStorage());
  }, [dispatch]);

  useEffect(() => {
    if (hasRedirected.current) return;
    if (isLoading) return;

    hasRedirected.current = true;

    if (isAuthenticated && user) {
      router.replace(getDashboardUrl(user.role));
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, user, router]);

  // Safety fallback: if loading takes > 3s, check localStorage directly and redirect
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (hasRedirected.current) return;

      try {
        const accessToken = localStorage.getItem('accessToken');
        const userStr = localStorage.getItem('user');

        if (accessToken && userStr) {
          const parsedUser = JSON.parse(userStr);
          hasRedirected.current = true;
          router.replace(getDashboardUrl(parsedUser.role));
        } else {
          hasRedirected.current = true;
          router.replace('/login');
        }
      } catch {
        hasRedirected.current = true;
        router.replace('/login');
      }
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return <FullPageSpinner />;
}
