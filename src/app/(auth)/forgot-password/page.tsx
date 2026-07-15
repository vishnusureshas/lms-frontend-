'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import type { RootState } from '@/store/store';
import ForgotPasswordForm from '@/components/forms/ForgotPasswordForm';
import { getDashboardUrl } from '@/lib/utils';
import { FullPageSpinner } from '@/components/ui/Spinner';
import { KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useSelector(
    (state: RootState) => state.auth
  );

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated && user) {
      router.replace(getDashboardUrl(user.role));
    }
  }, [isAuthenticated, isLoading, user, router]);

  if (isLoading) return <FullPageSpinner />;
  if (isAuthenticated) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/[0.08] flex items-center justify-center mx-auto mb-4"
        >
          <KeyRound className="h-6 w-6 text-cyan-400" />
        </motion.div>
      </div>

      {/* Form */}
      <ForgotPasswordForm />
    </motion.div>
  );
}
