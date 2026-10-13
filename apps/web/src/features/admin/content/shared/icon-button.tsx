import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const look = 'grid size-8 shrink-0 place-items-center text-steel hover:bg-rule-soft hover:text-ink disabled:pointer-events-none disabled:opacity-30';

interface IconButtonProps {
  /** Read by screen readers and shown as a tooltip; the icon alone says too little. */
  label: string;
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

/** A square, icon-only action for table rows and list items. */
export function IconButton({ label, onClick, children, disabled, className }: IconButtonProps) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn(look, className)}>
      {children}
    </button>
  );
}

export function IconLink({ label, href, children }: { label: string; href: string; children: ReactNode }) {
  return (
    <Link href={href} aria-label={label} title={label} className={look}>
      {children}
    </Link>
  );
}
