'use client';

import { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store } from '@/store/store';
import { loadAuthFromStorage } from '@/store/slices/authSlice';
import { Toaster } from 'react-hot-toast';
import type { ReactNode } from 'react';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Hydrates Redux auth state from localStorage on app mount.
 * This runs once when the app first loads in the browser.
 */
function HydrateAuth() {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(loadAuthFromStorage());
  }, [dispatch]);

  return null;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <Provider store={store}>
      <HydrateAuth />
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            borderRadius: '12px',
            background: '#1f2937',
            color: '#f9fafb',
            fontSize: '14px',
          },
        }}
      />
    </Provider>
  );
}
