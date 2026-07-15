'use client';

import { ButtonHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  gradient?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      fullWidth = false,
      gradient = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (disabled || isLoading) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const id = Date.now();

      setRipples((prev) => [...prev, { x, y, id }]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);

      props.onClick?.(e);
    };

    const baseStyles =
      'relative inline-flex items-center justify-center font-semibold rounded-2xl overflow-hidden transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none';

    const variants = {
      primary:
        'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 active:shadow-md active:scale-[0.98]',
      secondary:
        'bg-dark-800 text-dark-100 border border-white/[0.08] hover:bg-dark-700 hover:border-white/[0.15] active:scale-[0.98]',
      outline:
        'border border-white/[0.15] text-dark-200 hover:bg-white/[0.05] hover:border-white/[0.25] active:scale-[0.98]',
      ghost: 'text-dark-300 hover:text-white hover:bg-white/[0.05] active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-4 py-2 text-xs gap-2',
      md: 'px-5 py-3 text-sm gap-2.5',
      lg: 'px-7 py-3.5 text-base gap-3',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          gradient && 'btn-gradient',
          className
        )}
        {...props}
      >
        {/* Ripple effect */}
        {ripples.map((ripple) => (
          <span
            key={ripple.id}
            className="absolute rounded-full bg-white/20 pointer-events-none"
            style={{
              left: ripple.x - 8,
              top: ripple.y - 8,
              width: 16,
              height: 16,
              animation: 'ripple 0.6s ease-out',
            }}
          />
        ))}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-white" />
          </div>
        )}

        {/* Gradient shimmer line */}
        {gradient && (
          <div className="absolute inset-0 shimmer opacity-50" />
        )}

        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
