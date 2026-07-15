'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import { useForgotPasswordMutation } from '@/services/api';
import { Mail, ArrowLeft, CheckCircle, AlertTriangle, Send } from 'lucide-react';

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setError('');

    try {
      await forgotPassword({ email }).unwrap();
      setIsSent(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    }
  };

  if (isSent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center py-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="h-16 w-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle className="h-8 w-8 text-emerald-400" />
        </motion.div>

        <h3 className="text-xl font-semibold text-white mb-2">Check your email</h3>
        <p className="text-dark-400 text-sm leading-relaxed mb-2">
          We&apos;ve sent a password reset link to
        </p>
        <p className="text-primary-400 font-medium text-sm mb-8">{email}</p>

        <p className="text-xs text-dark-500 mb-6">
          Didn&apos;t receive the email? Check your spam folder or{' '}
          <button
            type="button"
            onClick={() => setIsSent(false)}
            className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
          >
            try again
          </button>
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-dark-400 hover:text-dark-200 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      <div className="text-center mb-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/[0.08] flex items-center justify-center mx-auto mb-4"
        >
          <Send className="h-6 w-6 text-blue-400" />
        </motion.div>
        <h3 className="text-lg font-semibold text-white">Reset your password</h3>
        <p className="text-dark-400 text-sm mt-1">
          Enter your email and we&apos;ll send you a reset link
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
            <div className="flex-1">
              <p className="text-red-300 font-medium">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email */}
      <motion.div variants={fieldVariants}>
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError('');
          }}
          autoComplete="email"
          autoFocus
          icon={<Mail className="h-4 w-4" />}
        />
      </motion.div>

      {/* Submit */}
      <motion.div variants={fieldVariants}>
        <AuthButton type="submit" fullWidth isLoading={isLoading} gradient>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-white/60 rounded-full animate-pulse" />
              Sending reset link...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Send Reset Link
              <Send className="h-4 w-4" />
            </span>
          )}
        </AuthButton>
      </motion.div>

      {/* Back */}
      <motion.p variants={fieldVariants} className="text-center text-sm">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-dark-400 hover:text-dark-200 transition-colors font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </Link>
      </motion.p>
    </motion.form>
  );
}
