import React, { type ReactNode } from 'react';
import clsx from 'clsx';

interface FinanceCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'orange' | 'purple';
  trend?: {
    text: string;
    positive?: boolean;
  };
  onClick?: () => void;
  className?: string;
  badge?: string;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'default',
  trend,
  onClick,
  className,
  badge,
}) => {
  const variantStyles = {
    default: 'bg-slate-900/80 border-slate-800 text-slate-100 hover:border-slate-700',
    emerald: 'bg-gradient-to-br from-emerald-950/40 via-slate-900/90 to-slate-900 border-emerald-500/30 text-emerald-400 hover:border-emerald-500/50 card-glow-green',
    amber: 'bg-gradient-to-br from-amber-950/40 via-slate-900/90 to-slate-900 border-amber-500/30 text-amber-400 hover:border-amber-500/50 card-glow-yellow',
    rose: 'bg-gradient-to-br from-rose-950/50 via-slate-900/95 to-slate-900 border-rose-500/40 text-rose-400 hover:border-rose-500/60 card-glow-red',
    indigo: 'bg-gradient-to-br from-indigo-950/40 via-slate-900/90 to-slate-900 border-indigo-500/30 text-indigo-400 hover:border-indigo-500/50',
    orange: 'bg-gradient-to-br from-orange-950/40 via-slate-900/90 to-slate-900 border-orange-500/30 text-orange-400 hover:border-orange-500/50',
    purple: 'bg-gradient-to-br from-purple-950/40 via-slate-900/90 to-slate-900 border-purple-500/30 text-purple-400 hover:border-purple-500/50',
  };

  const iconBgStyles = {
    default: 'bg-slate-800 text-slate-300',
    emerald: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    rose: 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse',
    indigo: 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
    purple: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'relative rounded-2xl p-5 border transition-all duration-200 backdrop-blur-sm',
        onClick && 'cursor-pointer active:scale-[0.99] select-none',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-400">{title}</span>
          {badge && (
            <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {badge}
            </span>
          )}
        </div>
        <div className={clsx('p-2.5 rounded-xl transition-transform duration-200', iconBgStyles[variant])}>
          {icon}
        </div>
      </div>

      <div className="flex flex-col">
        <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-1">
          {value}
        </div>

        {subtitle && (
          <div className="text-xs text-slate-400 line-clamp-1">{subtitle}</div>
        )}

        {trend && (
          <div
            className={clsx(
              'mt-2.5 text-xs font-semibold flex items-center gap-1.5',
              trend.positive ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            <span>{trend.positive ? '↑' : '↓'}</span>
            <span>{trend.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
