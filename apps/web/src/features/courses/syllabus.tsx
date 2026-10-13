import { LAB_LANGUAGE_LABEL } from '@mettle/shared';
import { BookOpenText, Check, ChevronRight, ClipboardList, FlaskConical, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { Badge } from '@/design/primitives/badge';
import { cn } from '@/lib/cn';
import { formatPercent, plural } from '@/lib/format';
import type { CourseDetail } from '@/types/catalog';

interface RowProps {
  href: string;
  icon: LucideIcon;
  kind: string;
  title: string;
  meta: ReactNode;
  done: boolean;
  /** The first unfinished item: where "Continue" leads. */
  current: boolean;
  aside?: ReactNode;
}

function Row({ href, icon: Icon, kind, title, meta, done, current, aside }: RowProps) {
  return (
    <li>
      <Link href={href} className={cn('group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white', current && 'bg-white')}>
        <span
          className={cn(
            'grid size-9 shrink-0 place-items-center border',
            done ? 'border-patina bg-patina text-white' : current ? 'border-ember bg-ember-soft text-ember-deep' : 'border-rule bg-rule-soft text-steel',
          )}
        >
          {done ? <Check className="size-4.5" strokeWidth={3} /> : <Icon className="size-4.5" aria-hidden />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="label-spec text-steel">{kind}</p>
          <p className="truncate font-semibold">{title}</p>
          <p className="truncate text-[13px] text-steel">{meta}</p>
        </div>
        {aside}
        {current ? <Badge tone="ember">Next</Badge> : null}
        <ChevronRight className="size-5 shrink-0 text-steel-2 transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
      </Link>
    </li>
  );
}

/** The contents of a level in study order: lessons, then the exam, then the lab. */
export function Syllabus({ course }: { course: CourseDetail }) {
  const nextId = course.next?.id;
  return (
    <ol className="divide-y divide-rule-soft">
      {course.lessons.map((lesson, index) => (
        <Row
          key={lesson.id}
          href={`/lessons/${lesson.id}`}
          icon={BookOpenText}
          kind={`Lesson ${String(index + 1).padStart(2, '0')}`}
          title={lesson.title}
          meta={`${lesson.estMinutes} min · ${lesson.summary}`}
          done={lesson.done}
          current={lesson.id === nextId}
        />
      ))}
      {course.exams.map((exam) => (
        <Row
          key={exam.id}
          href={`/exams/${exam.id}`}
          icon={ClipboardList}
          kind="Mock exam"
          title={exam.title}
          meta={`${exam.timeLimitMinutes} min · pass mark ${exam.passPercent}%${exam.attempts ? ` · ${plural(exam.attempts, 'attempt')}` : ''}`}
          done={exam.done}
          current={exam.id === nextId}
          aside={exam.bestScore !== null ? <span className="display text-2xl tabular-nums">{formatPercent(exam.bestScore)}</span> : null}
        />
      ))}
      {course.labs.map((lab) => (
        <Row
          key={lab.id}
          href={`/labs/${lab.id}`}
          icon={FlaskConical}
          kind={`Lab · ${LAB_LANGUAGE_LABEL[lab.language]}`}
          title={lab.title}
          meta={`About ${lab.estMinutes} min · ${lab.summary}`}
          done={lab.done}
          current={lab.id === nextId}
        />
      ))}
    </ol>
  );
}
