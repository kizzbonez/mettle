import Link from 'next/link';
import { cn } from '@/lib/cn';

/** The mark on its own: an ember punch stamped with an M. Drawn, so it adds no text to a link's name. */
export function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={cn('size-8 shrink-0', className)} aria-hidden>
      <polygon points="14,0 50,0 64,14 64,50 50,64 14,64 0,50 0,14" className="fill-ember" />
      <path d="M16 48V16h8.2L32 31.4 39.8 16H48v32h-7.4V29.8L34.2 42h-4.4l-6.4-12.2V48z" className="fill-ink" />
    </svg>
  );
}

interface WordmarkProps {
  href?: string;
  /** For dark surfaces. */
  inverted?: boolean;
  name?: string;
  className?: string;
}

export function Wordmark({ href = '/', inverted, name = 'Mettle', className }: WordmarkProps) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2.5', className)}>
      <Mark />
      <span className={cn('display text-[26px] tracking-[0.08em]', inverted ? 'text-white' : 'text-ink')}>{name}</span>
      <span className="sr-only">home</span>
    </Link>
  );
}
