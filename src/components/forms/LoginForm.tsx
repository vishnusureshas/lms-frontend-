'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useLoginMutation } from '@/services/api';
import { setCredentials } from '@/store/slices/authSlice';
import { validateLoginForm } from '@/lib/validators';
import { getDashboardUrl } from '@/lib/utils';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { FullPageLoader } from '@/components/ui/Loader';
import { Mail, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

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

export default function LoginForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (serverError) setServerError(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const validation = validateLoginForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const result = await login(formData).unwrap();
      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        })
      );
      // Show beautiful loader while redirecting to dashboard
      setIsRedirecting(true);
      await new Promise((resolve) => setTimeout(resolve, 600));
      router.push(getDashboardUrl(result.data.user.role));
    } catch (err: any) {
      const message = err?.data?.message || 'Invalid credentials. Please try again.';
      setServerError(message);
    }
  };

  if (isRedirecting) {
    return <FullPageLoader mode="login" />;
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="space-y-5"
    >
      {/* Server error */}
      <AnimatePresence>
        {serverError && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            className="flex items-start gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm"
          >
            <AlertTriangle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-red-300">Authentication failed</p>
              <p className="text-red-400/80 mt-0.5">{serverError}</p>
            </div>
            <button
              type="button"
              onClick={() => setServerError(null)}
              className="text-red-400/60 hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Email */}
      <motion.div variants={fieldVariants}>
        <AuthInput
          label="Email address"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          autoComplete="email"
          autoFocus
          icon={<Mail className="h-4 w-4" />}
        />
      </motion.div>

      {/* Password */}
      <motion.div variants={fieldVariants}>
        <AuthInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          autoComplete="current-password"
          showPasswordToggle
          icon={<Lock className="h-4 w-4" />}
        />
      </motion.div>

      {/* Forgot password link */}
      <motion.div variants={fieldVariants} className="flex justify-end -mt-2">
        <Link
          href="/forgot-password"
          className="text-xs text-dark-400 hover:text-primary-400 transition-colors font-medium"
        >
          Forgot password?
        </Link>
      </motion.div>

      {/* Submit */}
      <motion.div variants={fieldVariants}>
        <AuthButton type="submit" fullWidth isLoading={isLoading} gradient>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-white/60 rounded-full animate-pulse" />
              Signing in...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Sign In
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </AuthButton>
      </motion.div>

      {/* Divider + Social */}
      <motion.div variants={fieldVariants}>
        <SocialLoginButtons mode="login" />
      </motion.div>

      {/* Sign up link */}
      <motion.p
        variants={fieldVariants}
        className="text-center text-sm text-dark-400"
      >
        Don&apos;t have an account?{' '}
        <Link
          href="/register"
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Create one
        </Link>
      </motion.p>
    </motion.form>
  );
}
