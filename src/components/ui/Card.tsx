'use client';

import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  glass?: boolean;
  gradient?: boolean;
}

export function Card({ children, className, padding = 'md', hover = false, glass = false, gradient = false }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl transition-all duration-300',
        glass
          ? 'glass-dashboard'
          : gradient
          ? 'card-gradient-border bg-slate-900/30'
          : 'bg-slate-900/40 border border-white/[0.04] shadow-lg',
        hover && 'hover:bg-white/[0.06] hover:border-white/[0.08] hover:shadow-xl hover:-translate-y-0.5',
        padding === 'sm' && 'p-4',
        padding === 'md' && 'p-5',
        padding === 'lg' && 'p-7',
        padding === 'none' && '',
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('flex items-center justify-between mb-4', className)}>
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-base font-semibold text-white', className)}>
      {children}
    </h3>
  );
}

export function CardContent({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('', className)}>{children}</div>;
}
