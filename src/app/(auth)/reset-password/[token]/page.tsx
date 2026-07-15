'use client';

import { useState, type FormEvent } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useResetPasswordMutation } from '@/services/api';
import {
  Lock,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  KeyRound,
} from 'lucide-react';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.password) {
      setError('Password is required');
      return;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      await resetPassword({ token, password: formData.password }).unwrap();
      setIsSuccess(true);
    } catch {
      setError('Failed to reset password. The link may have expired.');
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-6 space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto"
        >
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </motion.div>

        <div>
          <h3 className="text-xl font-semibold text-white">Password Reset Successfully!</h3>
          <p className="text-dark-400 text-sm mt-1">Your password has been updated.</p>
        </div>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-primary-500 to-purple-600 text-white text-sm font-medium hover:shadow-lg hover:shadow-primary-500/25 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Sign in with new password
        </Link>
      </motion.div>
    );
  }

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
          className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-white/[0.08] flex items-center justify-center mx-auto mb-4"
        >
          <KeyRound className="h-6 w-6 text-emerald-400" />
        </motion.div>
        <h2 className="text-2xl font-bold text-white tracking-tight">
          Set new password
        </h2>
        <p className="text-dark-400 text-sm mt-1.5">
          Enter your new password below
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm"
          >
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthInput
          label="New Password"
          type="password"
          placeholder="Enter new password"
          value={formData.password}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, password: e.target.value }));
            if (error) setError('');
          }}
          autoComplete="new-password"
          autoFocus
          icon={<Lock className="h-4 w-4" />}
        />

        <AuthInput
          label="Confirm Password"
          type="password"
          placeholder="Confirm new password"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, confirmPassword: e.target.value }));
            if (error) setError('');
          }}
          autoComplete="new-password"
          icon={<Lock className="h-4 w-4" />}
        />

        <AuthButton type="submit" fullWidth isLoading={isLoading} gradient>
          {isLoading ? 'Resetting...' : 'Reset Password'}
        </AuthButton>
      </form>

      <p className="text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </p>
    </motion.div>
  );
}
