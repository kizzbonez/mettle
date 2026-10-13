import { BookOpenCheck, ClipboardCheck, ClipboardX, FlaskConical, LogIn, Stamp, type LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/design/patterns/notice';
import { cn } from '@/lib/cn';
import { timeAgo } from '@/lib/format';
import type { ActivityEvent } from '@/types/catalog';

const KINDS: Record<ActivityEvent['kind'], { icon: LucideIcon; verb: string; tone: string }> = {
  enrolled: { icon: LogIn, verb: 'Started', tone: 'bg-rule-soft text-ink-2' },
  lesson_completed: { icon: BookOpenCheck, verb: 'Read', tone: 'bg-rule-soft text-ink-2' },
  exam_passed: { icon: ClipboardCheck, verb: 'Passed', tone: 'bg-patina-soft text-patina' },
  exam_failed: { icon: ClipboardX, verb: 'Did not pass', tone: 'bg-crimson-soft text-crimson' },
  lab_passed: { icon: FlaskConical, verb: 'Passed the lab', tone: 'bg-patina-soft text-patina' },
  course_completed: { icon: Stamp, verb: 'Earned the mark for', tone: 'bg-ember text-ink' },
};

function Row({ event }: { event: ActivityEvent }) {
  const kind = KINDS[event.kind];
  const body = (
    <>
      <span className={cn('grid size-8 shrink-0 place-items-center', kind.tone)}>
        <kind.icon className="size-4" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm">
          <span className="text-steel">{kind.verb}</span> <span className="font-semibold text-ink">{event.title}</span>
          {event.meta.score !== undefined ? <span className="text-steel"> · {Math.round(event.meta.score)}%</span> : null}
        </span>
        <span className="label-spec text-steel-2">{timeAgo(event.createdAt)}</span>
      </span>
    </>
  );
  return (
    <li>
      {event.href ? (
        <Link href={event.href} className="flex items-center gap-3 px-5 py-3 hover:bg-white">{body}</Link>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3">{body}</div>
      )}
    </li>
  );
}

/** What the learner did recently, newest first. */
export function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) {
    return <EmptyState title="Nothing yet" className="py-10">Your lessons, exams and labs will show up here as you go.</EmptyState>;
  }
  return (
    <ul className="divide-y divide-rule-soft">
      {events.map((event) => (
        <Row key={event.id} event={event} />
      ))}
    </ul>
  );
}
