import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface Crumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: ReactNode;
  /** Small caption above the title, in the spec-sheet voice. */
  eyebrow?: ReactNode;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  className?: string;
}

export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="label-spec flex flex-wrap items-center gap-1 text-steel">
      {crumbs.map((crumb, index) => (
        <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
          {index > 0 ? <ChevronRight className="size-3" aria-hidden /> : null}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-ink hover:underline">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-ink-2">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

/** The top of every page inside the app: where you are, what this is, what you can do. */
export function PageHeader({ title, eyebrow, description, crumbs, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {crumbs ? <Breadcrumbs crumbs={crumbs} /> : eyebrow ? <p className="label-spec text-ember-deep">{eyebrow}</p> : null}
        <h1 className="display mt-2 text-4xl text-ink sm:text-5xl">{title}</h1>
        {description ? <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-steel">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  className?: string;
}

/** One number with its label. The number is the loudest thing on the tile. */
export function StatTile({ label, value, hint, icon, className }: StatTileProps) {
  return (
    <div className={cn('rounded-plate border border-rule bg-plate p-5 shadow-plate', className)}>
      <div className="flex items-center justify-between gap-2">
        <p className="label-spec text-steel">{label}</p>
        {icon ? <span className="text-steel-2">{icon}</span> : null}
      </div>
      <p className="display mt-3 text-5xl text-ink tabular-nums">{value}</p>
      {hint ? <p className="mt-2 text-[13px] text-steel">{hint}</p> : null}
    </div>
  );
}
