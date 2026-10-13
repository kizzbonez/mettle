import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type NoticeTone = 'info' | 'success' | 'warning' | 'error';

const tones: Record<NoticeTone, { box: string; icon: typeof Info }> = {
  info: { box: 'border-rule bg-white text-ink-2', icon: Info },
  success: { box: 'border-patina/40 bg-patina-soft text-[#124d3f]', icon: CircleCheck },
  warning: { box: 'border-brass/40 bg-brass-soft text-[#5c4508]', icon: TriangleAlert },
  error: { box: 'border-crimson/35 bg-crimson-soft text-[#7a161d]', icon: CircleAlert },
};

interface NoticeProps {
  tone?: NoticeTone;
  title?: string;
  children?: ReactNode;
  className?: string;
}

/** An inline message: form errors, confirmations, warnings. */
export function Notice({ tone = 'info', title, children, className }: NoticeProps) {
  const { box, icon: Icon } = tones[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('flex gap-3 rounded-plate border px-4 py-3 text-sm', box, className)}>
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div className="min-w-0 leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children}
      </div>
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}

/** What a list shows when there is nothing in it yet, with the way to change that. */
export function EmptyState({ icon, title, children, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 px-6 py-14 text-center', className)}>
      {icon ? <div className="grid size-12 place-items-center border border-dashed border-steel-2 text-steel">{icon}</div> : null}
      <h3 className="text-base font-semibold">{title}</h3>
      {children ? <p className="max-w-sm text-sm text-steel">{children}</p> : null}
      {action}
    </div>
  );
}
