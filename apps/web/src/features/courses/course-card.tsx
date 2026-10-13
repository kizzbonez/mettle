import type { Difficulty } from '@mettle/shared';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { Hallmark, LevelLabel, temperBg } from '@/design/primitives/hallmark';
import { Gauge } from '@/design/primitives/plate';
import { cn } from '@/lib/cn';
import type { Progress } from '@/types/catalog';

interface CourseCardProps {
  id: string;
  level: Difficulty;
  title: string;
  summary?: string;
  /** Shown above the title, e.g. the track name. */
  context?: string;
  progress?: Progress;
  enrolled?: boolean;
  completed?: boolean;
  /** The line under the gauge: what is next, or what the level contains. */
  footnote?: string;
}

function cta(enrolled: boolean | undefined, completed: boolean | undefined): string {
  if (completed) return 'Review';
  return enrolled ? 'Continue' : 'Start level';
}

/** One level of a track. The top edge carries the level's temper color. */
export function CourseCard({ id, level, title, summary, context, progress, enrolled, completed, footnote }: CourseCardProps) {
  return (
    <Link
      href={`/courses/${id}`}
      className="group relative flex h-full flex-col rounded-plate border border-rule bg-plate p-5 shadow-plate transition-[box-shadow,border-color] hover:border-ink hover:shadow-lift"
    >
      <span className={cn('absolute inset-x-0 top-0 h-1 rounded-t-plate', temperBg[level])} aria-hidden />
      <div className="flex items-start gap-3">
        <Hallmark level={level} muted={!completed} />
        <div className="min-w-0">
          <LevelLabel level={level} />
          {context ? <p className="label-spec mt-0.5 truncate text-steel">{context}</p> : null}
        </div>
        {completed ? (
          <span className="ml-auto grid size-6 shrink-0 place-items-center bg-patina text-white" title="Completed">
            <Check className="size-4" strokeWidth={3} />
          </span>
        ) : null}
      </div>
      <h3 className="mt-4 text-lg leading-snug font-semibold">{title}</h3>
      {summary ? <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed text-steel">{summary}</p> : null}
      <div className="mt-auto pt-5">
        {progress && enrolled ? (
          <>
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="label-spec text-steel">{progress.done} of {progress.total} done</span>
              <span className="display text-xl tabular-nums">{progress.percent}%</span>
            </div>
            <Gauge value={progress.percent} tone={completed ? 'patina' : 'ink'} />
          </>
        ) : null}
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="truncate text-[13px] text-steel">{footnote}</span>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-ink group-hover:text-ember-deep">
            {cta(enrolled, completed)} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
