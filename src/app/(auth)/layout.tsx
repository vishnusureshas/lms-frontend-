'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedBackground from '@/components/auth/AnimatedBackground';
import AuthHero from '@/components/auth/AuthHero';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="relative min-h-screen bg-dark-950 overflow-hidden auth-grid">
      {/* Animated particles */}
      <AnimatedBackground />

      {/* Main container */}
      <div className="relative z-10 flex min-h-screen">
        {/* Left side - Hero (55%) */}
        <div className="hidden lg:flex lg:w-[55%] min-h-screen relative">
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-dark-950 via-dark-900 to-dark-950/50" />

          {/* Floating gradient orbs */}
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-blob-slow" />
          <div className="absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-blob-fast" />

          {/* Hero content */}
          <div className="relative h-full w-full">
            <AuthHero />
          </div>
        </div>

        {/* Right side - Auth Card (45%) */}
        <div className="w-full lg:w-[45%] min-h-screen flex items-center justify-center relative">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-bl from-dark-950 via-dark-900 to-dark-950/80" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/5 to-transparent rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-purple-500/5 to-transparent rounded-full blur-3xl" />

          {/* Mobile top bar (shown only on < lg) */}
          <div className="lg:hidden absolute top-0 left-0 right-0 p-6">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xs">LS</span>
              </div>
              <span className="text-sm font-semibold text-white">LearnStream</span>
            </div>
          </div>

          {/* Auth Card */}
          <div className="relative w-full max-w-[440px] px-6 py-8 lg:py-0">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={mounted ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative"
            >
              {/* Glass card */}
              <div className="relative glass-strong rounded-3xl p-8 md:p-10 gradient-border">
                {/* Card glow */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 rounded-3xl blur-sm -z-10" />

                {/* Card content with page transitions */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={pathname}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {children}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <p className="text-center text-xs text-dark-600 mt-6">
                &copy; {new Date().getFullYear()} LearnStream. All rights reserved.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
