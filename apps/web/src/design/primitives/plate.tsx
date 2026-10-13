import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** The standard surface: a flat plate with a hairline border. */
export function Plate({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('rounded-plate border border-rule bg-plate shadow-plate', className)} {...rest}>
      {children}
    </div>
  );
}

interface PlateHeaderProps {
  title: ReactNode;
  caption?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PlateHeader({ title, caption, action, className }: PlateHeaderProps) {
  return (
    <div className={cn('flex items-start justify-between gap-4 border-b border-rule px-5 py-4', className)}>
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {caption ? <p className="mt-0.5 text-[13px] text-steel">{caption}</p> : null}
      </div>
      {action}
    </div>
  );
}

interface GaugeProps {
  /** 0 to 100. */
  value: number;
  tone?: 'ink' | 'ember' | 'patina';
  className?: string;
  label?: string;
}

const gaugeTones = { ink: 'bg-ink', ember: 'bg-ember', patina: 'bg-patina' } as const;

/** A progress bar read against a ruler: ten ticks under the track. */
export function Gauge({ value, tone = 'ink', className, label }: GaugeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={className}>
      <div
        className="h-2 w-full bg-rule"
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Progress'}
      >
        <div className={cn('h-full transition-[width] duration-500', gaugeTones[tone])} style={{ width: `${clamped}%` }} />
      </div>
      <div className="ticks mt-px h-1 w-full text-steel-2/70" aria-hidden />
    </div>
  );
}
