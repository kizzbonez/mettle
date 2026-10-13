import Link from 'next/link';
import { cn } from '@/lib/cn';

/** The mark on its own: an ember punch stamped with an M. */
export function Mark({ className }: { className?: string }) {
  return (
    <span className={cn('clip-hallmark display grid size-8 shrink-0 place-items-center bg-ember text-xl text-ink', className)} aria-hidden>
      M
    </span>
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
    <Link href={href} className={cn('inline-flex items-center gap-2.5', className)} aria-label={`${name} home`}>
      <Mark />
      <span className={cn('display text-[26px] tracking-[0.08em]', inverted ? 'text-white' : 'text-ink')}>{name}</span>
    </Link>
  );
}
