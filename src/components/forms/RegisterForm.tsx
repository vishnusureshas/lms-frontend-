'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useRegisterMutation } from '@/services/api';
import { setCredentials } from '@/store/slices/authSlice';
import { validateRegisterForm } from '@/lib/validators';
import { getDashboardUrl } from '@/lib/utils';
import AuthInput from '@/components/auth/AuthInput';
import AuthButton from '@/components/auth/AuthButton';
import SocialLoginButtons from '@/components/auth/SocialLoginButtons';
import { Mail, Lock, User, AlertTriangle, ArrowRight, GraduationCap, Code2 } from 'lucide-react';

const formVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const fieldVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function RegisterForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [register, { isLoading }] = useRegisterMutation();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' as 'student' | 'instructor',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

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

    const validation = validateRegisterForm(formData);
    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    try {
      const result = await register({
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      }).unwrap();

      dispatch(
        setCredentials({
          user: result.data.user,
          accessToken: result.data.accessToken,
          refreshToken: result.data.refreshToken,
        })
      );

      router.push(getDashboardUrl(result.data.user.role));
    } catch (err: any) {
      const message = err?.data?.message || 'Registration failed. Please try again.';
      setServerError(message);
    }
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      variants={formVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
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
              <p className="font-medium text-red-300">Registration failed</p>
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

      {/* Full Name */}
      <motion.div variants={fieldVariants}>
        <AuthInput
          label="Full name"
          placeholder="John Doe"
          value={formData.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          error={errors.fullName}
          autoComplete="name"
          autoFocus
          icon={<User className="h-4 w-4" />}
        />
      </motion.div>

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
          icon={<Mail className="h-4 w-4" />}
        />
      </motion.div>

      {/* Password */}
      <motion.div variants={fieldVariants}>
        <AuthInput
          label="Password"
          type="password"
          placeholder="Min. 8 characters, 1 uppercase, 1 number"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          autoComplete="new-password"
          showPasswordToggle
          icon={<Lock className="h-4 w-4" />}
        />
      </motion.div>

      {/* Confirm Password */}
      <motion.div variants={fieldVariants}>
        <AuthInput
          label="Confirm password"
          type="password"
          placeholder="Re-enter your password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
          showPasswordToggle
          icon={<Lock className="h-4 w-4" />}
        />
      </motion.div>

      {/* Role selector */}
      <motion.div variants={fieldVariants}>
        <label className="block text-xs font-medium text-dark-300 mb-2.5">
          I want to join as
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'student', label: 'Student', icon: GraduationCap, desc: 'Learn and grow' },
            { value: 'instructor', label: 'Instructor', icon: Code2, desc: 'Teach and inspire' },
          ].map((role) => (
            <motion.button
              key={role.value}
              type="button"
              onClick={() => handleChange('role', role.value)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                formData.role === role.value
                  ? 'border-primary-500/50 bg-primary-500/10 glow-blue'
                  : 'border-white/[0.08] bg-dark-800/50 hover:border-white/[0.15]'
              }`}
            >
              <role.icon className={`h-5 w-5 mb-2 ${
                formData.role === role.value ? 'text-primary-400' : 'text-dark-400'
              }`} />
              <p className={`text-sm font-medium ${
                formData.role === role.value ? 'text-white' : 'text-dark-200'
              }`}>
                {role.label}
              </p>
              <p className="text-xs text-dark-500 mt-0.5">{role.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Submit */}
      <motion.div variants={fieldVariants} className="pt-1">
        <AuthButton type="submit" fullWidth isLoading={isLoading} gradient>
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 bg-white/60 rounded-full animate-pulse" />
              Creating account...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Create Account
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </AuthButton>
      </motion.div>

      {/* Divider + Social */}
      <motion.div variants={fieldVariants}>
        <SocialLoginButtons mode="register" />
      </motion.div>

      {/* Sign in link */}
      <motion.p
        variants={fieldVariants}
        className="text-center text-sm text-dark-400"
      >
        Already have an account?{' '}
        <Link
          href="/login"
          className="text-primary-400 hover:text-primary-300 font-medium transition-colors"
        >
          Sign in
        </Link>
      </motion.p>
    </motion.form>
  );
}
