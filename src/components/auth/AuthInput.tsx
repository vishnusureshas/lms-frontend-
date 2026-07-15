'use client';

import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: React.ReactNode;
  error?: string;
  showPasswordToggle?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon, error, showPasswordToggle, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `field-${label.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const hasValue = props.value !== undefined && props.value !== '';

    return (
      <div className="w-full">
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 z-10 text-dark-400 pointer-events-none">
              {icon}
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            className={cn(
              'peer w-full bg-dark-800/50 border text-sm text-white placeholder-transparent transition-all duration-200',
              'focus:outline-none',
              icon ? 'pl-10 pr-10' : 'pl-4 pr-10',
              'py-3.5',
              'rounded-2xl',
              error
                ? 'border-red-500/50 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                : 'border-white/[0.08] hover:border-white/[0.15] focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/20',
              props.disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${inputId}-error` : undefined}
            {...props}
          />

          {/* Label */}
          <label
            htmlFor={inputId}
            className={cn(
              'absolute left-4 top-1/2 -translate-y-1/2 text-dark-400 transition-all duration-200 pointer-events-none origin-left',
              icon && 'left-10',
              (isFocused || hasValue) && 'top-0 -translate-y-1/2 text-xs px-2 left-3 bg-dark-900 rounded-md',
              isFocused && 'text-primary-400',
              error && 'text-red-400'
            )}
          >
            {label}
          </label>

          {/* Right side: password toggle or validation icon */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {error && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <AlertCircle className="h-4 w-4 text-red-400" />
                </motion.div>
              </AnimatePresence>
            )}
            {!error && hasValue && (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                >
                  <CheckCircle className="h-4 w-4 text-emerald-400" />
                </motion.div>
              </AnimatePresence>
            )}
            {(isPassword || showPasswordToggle) && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-dark-400 hover:text-dark-200 transition-colors p-0.5"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            )}
          </div>

          {/* Focus glow */}
          {isFocused && !error && (
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 pointer-events-none" />
          )}
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.p
              id={`${inputId}-error`}
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="text-xs text-red-400 mt-1.5 px-1"
              role="alert"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
