'use client';

import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: { value: string; positive: boolean };
  className?: string;
  color?: 'blue' | 'purple' | 'cyan' | 'emerald' | 'amber' | 'rose';
}

const gradientMap = {
  blue: { bg: 'stat-gradient-blue', iconBg: 'bg-blue-500/15', iconColor: 'text-blue-400', glow: 'glow-blue' },
  purple: { bg: 'stat-gradient-purple', iconBg: 'bg-purple-500/15', iconColor: 'text-purple-400', glow: 'glow-purple' },
  cyan: { bg: 'stat-gradient-cyan', iconBg: 'bg-cyan-500/15', iconColor: 'text-cyan-400', glow: 'glow-cyan' },
  emerald: { bg: 'stat-gradient-emerald', iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-400', glow: 'glow-emerald' },
  amber: { bg: 'stat-gradient-amber', iconBg: 'bg-amber-500/15', iconColor: 'text-amber-400', glow: 'glow-amber' },
  rose: { bg: 'stat-gradient-rose', iconBg: 'bg-rose-500/15', iconColor: 'text-rose-400', glow: 'glow-rose' },
};

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
  color = 'blue',
}: StatCardProps) {
  const s = gradientMap[color];

  return (
    <div
      className={cn(
        'rounded-2xl border border-white/[0.04] p-5 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 group',
        s.bg,
        s.glow,
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-bold text-white mt-1.5 tabular-nums">{value}</p>
          {description && (
            <p className="text-xs text-slate-500 mt-1 truncate">{description}</p>
          )}
          {trend && (
            <p className={cn('text-xs font-medium mt-2', trend.positive ? 'text-emerald-400' : 'text-rose-400')}>
              {trend.positive ? '↑' : '↓'} {trend.value}
            </p>
          )}
        </div>
        <div className={cn('rounded-xl p-3 flex-shrink-0 backdrop-blur-sm', s.iconBg, 'group-hover:scale-110 transition-transform duration-300')}>
          <Icon className={cn('h-5 w-5', s.iconColor)} />
        </div>
      </div>
    </div>
  );
}
