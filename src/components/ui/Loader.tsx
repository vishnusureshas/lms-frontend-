'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GraduationCap, BookOpen, Zap, Brain } from 'lucide-react';

// ───── Messages that cycle during loading ─────
const LOADING_MESSAGES = [
  { text: 'Preparing your dashboard...', icon: Sparkles },
  { text: 'Loading your courses...', icon: BookOpen },
  { text: 'Syncing your progress...', icon: Brain },
  { text: 'Almost ready...', icon: Zap },
];

interface FullPageLoaderProps {
  mode: 'login' | 'logout';
}

export function FullPageLoader({ mode }: FullPageLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Cycle through messages
  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(msgInterval);
  }, []);

  // Animate progress bar smoothly
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        // Slow down as it progresses
        const increment = Math.max(1, 15 * (1 - prev / 100));
        return Math.min(95, prev + increment);
      });
    }, 300);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = LOADING_MESSAGES[messageIndex].icon;

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
      {/* ───── Animated gradient background ───── */}
      <div className="absolute inset-0 bg-[#020617]">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-cyan-500/5 animate-pulse-glow" />
      </div>

      {/* ───── Floating gradient orbs ───── */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-full blur-3xl animate-blob-slow" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-500/12 to-blue-500/8 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-gradient-to-br from-purple-500/12 to-pink-500/8 rounded-full blur-3xl animate-blob-fast" />
      <div className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-gradient-to-br from-emerald-500/8 to-cyan-500/6 rounded-full blur-3xl animate-blob-slow" style={{ animationDelay: '2s' }} />

      {/* ───── Grid overlay ───── */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      {/* ───── Content ───── */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* ── Animated Logo ── */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 0.8 }}
          className="relative"
        >
          {/* Glow behind logo */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary-500/30 to-purple-500/30 rounded-3xl blur-2xl animate-pulse-glow" />

          {/* Logo container */}
          <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/[0.08] flex items-center justify-center shadow-2xl overflow-hidden">
            {/* Inner shimmer */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/10 to-cyan-500/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.02] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />

            {/* Icon */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <GraduationCap className="h-10 w-10 text-primary-400" />
            </motion.div>
          </div>
        </motion.div>

        {/* ── Brand Name ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-1"
        >
          <h2 className="text-2xl font-bold gradient-text tracking-tight">EduLMS</h2>
          <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">
            {mode === 'login' ? 'Signing you in' : 'Signing you out'}
          </p>
        </motion.div>

        {/* ── Animated Messages ── */}
        <div className="h-12 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={messageIndex}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="flex items-center gap-3"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <CurrentIcon className="h-5 w-5 text-primary-400" />
              </motion.div>
              <span className="text-base text-slate-300 font-medium">
                {LOADING_MESSAGES[messageIndex].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* ── Progress Bar ── */}
        <div className="w-64 sm:w-80">
          <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            {/* Background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            {/* Progress fill */}
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-500 via-purple-500 to-cyan-500"
              style={{ width: `${progress}%` }}
              layout
            />
            {/* Glow on progress */}
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-400/50 via-purple-400/50 to-transparent blur-sm"
              style={{ width: `${progress + 10}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
              {mode === 'login' ? 'Redirecting' : 'Please wait'}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">{Math.round(progress)}%</span>
          </div>
        </div>

        {/* ── Loading Dots ── */}
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full bg-primary-400/60"
              animate={{
                y: [0, -6, 0],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      {/* ───── Bottom decorative line ───── */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 h-[1px] w-40 bg-gradient-to-r from-transparent via-primary-500/30 to-transparent"
      />
    </div>
  );
}

/**
 * Logout overlay - renders inside the dashboard layout
 * to show the loader when the user signs out
 */
export function LogoutLoader() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[9999]"
    >
      <FullPageLoader mode="logout" />
    </motion.div>
  );
}
