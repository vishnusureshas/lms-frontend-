'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, GraduationCap, BookOpen, Zap, Brain, Rocket, Star, Globe, Code2, Palette } from 'lucide-react';

const LOADING_MESSAGES: Record<string, { text: string; icon: typeof Sparkles }[]> = {
  login: [
    { text: 'Verifying your identity...', icon: Sparkles },
    { text: 'Loading your courses...', icon: BookOpen },
    { text: 'Syncing your progress...', icon: Brain },
    { text: 'Almost ready...', icon: Zap },
  ],
  register: [
    { text: 'Creating your account...', icon: Rocket },
    { text: 'Setting up your profile...', icon: Star },
    { text: 'Preparing your dashboard...', icon: Globe },
    { text: 'Welcome aboard!', icon: Sparkles },
  ],
};

const COLORS = [
  { from: '#6366f1', to: '#a855f7' },
  { from: '#06b6d4', to: '#6366f1' },
  { from: '#a855f7', to: '#ec4899' },
  { from: '#10b981', to: '#06b6d4' },
];

interface FullPageLoaderProps {
  mode: 'login' | 'register';
}

export function FullPageLoader({ mode }: FullPageLoaderProps) {
  const messages = LOADING_MESSAGES[mode];
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [colorIndex, setColorIndex] = useState(0);

  useEffect(() => {
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
      setColorIndex((prev) => (prev + 1) % COLORS.length);
    }, 1800);
    return () => clearInterval(msgInterval);
  }, [messages.length]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return 95;
        }
        const increment = Math.max(1, 18 * (1 - prev / 100));
        return Math.min(95, prev + increment);
      });
    }, 250);
    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = messages[messageIndex].icon;
  const color = COLORS[colorIndex];

  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 1,
      duration: Math.random() * 3 + 2,
      delay: Math.random() * 2,
    })),
  []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[#020617]">
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${color.from}22 0%, transparent 60%)`,
          }}
        />
        <motion.div
          className="absolute inset-0"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          style={{
            background: `radial-gradient(ellipse at 80% 80%, ${color.to}18 0%, transparent 50%)`,
          }}
        />
      </div>

      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(99, 102, 241, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(99, 102, 241, 0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-blue-500/15 to-purple-500/10 rounded-full blur-3xl animate-blob-slow" />
      <div className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-cyan-500/12 to-blue-500/8 rounded-full blur-3xl animate-blob" />
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-gradient-to-br from-purple-500/12 to-pink-500/8 rounded-full blur-3xl animate-blob-fast" />

      <div className="relative z-10 flex flex-col items-center gap-8">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 0.8 }}
          className="relative"
        >
          <motion.div
            className="absolute inset-0 rounded-3xl blur-2xl"
            animate={{
              background: [
                `radial-gradient(circle, ${color.from}40, ${color.to}20)`,
                `radial-gradient(circle, ${color.to}40, ${color.from}20)`,
                `radial-gradient(circle, ${color.from}40, ${color.to}20)`,
              ],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          <div className="relative h-24 w-24 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 border border-white/[0.08] flex items-center justify-center shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-purple-500/10 to-cyan-500/10" />
            <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/[0.02] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />

            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            >
              <GraduationCap className="h-10 w-10 text-primary-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col items-center gap-1"
        >
          <h2 className="text-2xl font-bold gradient-text tracking-tight">EduLMS</h2>
          <motion.p
            className="text-xs font-medium tracking-widest uppercase"
            animate={{ color: [color.from, color.to, color.from] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            {mode === 'login' ? 'Signing you in' : 'Creating your account'}
          </motion.p>
        </motion.div>

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
                <CurrentIcon className="h-5 w-5" style={{ color: color.from }} />
              </motion.div>
              <span className="text-base text-slate-300 font-medium">
                {messages[messageIndex].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="w-64 sm:w-80">
          <div className="relative h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.03] to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
            <motion.div
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: `linear-gradient(90deg, ${color.from}, ${color.to})`,
                width: `${progress}%`,
              }}
            />
            <div
              className="absolute inset-y-0 left-0 rounded-full blur-sm"
              style={{
                background: `linear-gradient(90deg, ${color.from}80, ${color.to}40, transparent)`,
                width: `${progress + 15}%`,
              }}
            />
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-[10px] text-slate-600 font-medium uppercase tracking-wider">
              {mode === 'login' ? 'Redirecting' : 'Setting up'}
            </span>
            <span className="text-[10px] text-slate-600 font-mono">{Math.round(progress)}%</span>
          </div>
        </div>

        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="h-2 w-2 rounded-full"
              style={{
                background: `linear-gradient(135deg, ${color.from}, ${color.to})`,
              }}
              animate={{
                y: [0, -8, 0],
                opacity: [0.3, 1, 0.3],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.5, duration: 0.8 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2 h-[1px] w-40"
        style={{
          background: `linear-gradient(90deg, transparent, ${color.from}60, ${color.to}60, transparent)`,
        }}
      />
    </div>
  );
}

/**
 * Logout overlay
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
      <FullPageLoader mode="login" />
    </motion.div>
  );
}
