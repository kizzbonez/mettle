import { cn } from '@/lib/cn';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <svg className={cn('size-5 animate-spin', className)} viewBox="0 0 24 24" fill="none" role="status" aria-label={label}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}

/** A grey block that stands in for content while it loads. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-plate bg-ink/8', className)} aria-hidden />;
}

export function PageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="flex min-h-[40dvh] flex-col items-center justify-center gap-3 text-steel">
      <Spinner className="size-7 text-ember" label={label} />
      <span className="label-spec">{label}</span>
    </div>
  );
}
