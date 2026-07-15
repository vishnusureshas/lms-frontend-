'use client';

import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { api } from '@/services/api';

// ───── Redux Store ─────
export const store = configureStore({
  reducer: {
    auth: authReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore non-serializable values in these paths
        ignoredActions: ['api/executeQuery/fulfilled'],
      },
    }).concat(api.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// ───── TypeScript Types ─────
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
