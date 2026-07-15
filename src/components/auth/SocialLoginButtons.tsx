'use client';

import { motion } from 'framer-motion';
import { Chrome, Github } from 'lucide-react';

interface SocialLoginButtonsProps {
  mode?: 'login' | 'register';
}

export default function SocialLoginButtons({ mode = 'login' }: SocialLoginButtonsProps) {
  const text = mode === 'login' ? 'Sign in' : 'Sign up';

  const buttons = [
    {
      name: 'Google',
      icon: Chrome,
      onClick: () => {},
      gradient: 'hover:from-red-500/10 hover:to-orange-500/10',
    },
    {
      name: 'GitHub',
      icon: Github,
      onClick: () => {},
      gradient: 'hover:from-gray-500/10 hover:to-dark-500/10',
    },
  ];

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/[0.08]" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-dark-900 px-4 text-dark-400">
            or {text} with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {buttons.map((button, index) => (
          <motion.button
            key={button.name}
            onClick={button.onClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 + index * 0.1 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl border border-white/[0.08] bg-dark-800/50 text-dark-200 text-sm font-medium transition-all duration-200 ${button.gradient} hover:border-white/[0.15] hover:text-white`}
          >
            <button.icon className="h-5 w-5" />
            {button.name}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
