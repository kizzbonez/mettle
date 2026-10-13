import { LEVELS } from '@mettle/shared';
import { ArrowUpRight } from 'lucide-react';
import Link from 'next/link';
import { Hallmark } from '@/design/primitives/hallmark';
import { TrackIcon } from '@/design/primitives/track-icon';
import { plural } from '@/lib/format';
import type { TrackSummary } from '@/types/catalog';

function LevelRow({ track, levelKey }: { track: TrackSummary; levelKey: (typeof LEVELS)[number]['key'] }) {
  const course = track.courses.find((item) => item.level === levelKey);
  const level = LEVELS.find((item) => item.key === levelKey);
  return (
    <li className="flex items-center gap-3 py-2.5">
      <Hallmark level={levelKey} size="sm" muted={!course} />
      <div className="min-w-0 flex-1">
        <p className={course ? 'text-sm font-semibold' : 'text-sm text-steel-2'}>{course?.title ?? level?.label}</p>
        <p className="label-spec mt-0.5 text-steel">
          {course ? `${plural(course.lessonCount, 'lesson')} · 1 exam · ${plural(course.labCount, 'lab')}` : 'In development'}
        </p>
      </div>
    </li>
  );
}

function TrackCard({ track, href }: { track: TrackSummary; href: string }) {
  return (
    <article className="group clip-notch flex flex-col border border-rule bg-plate transition-shadow hover:shadow-lift">
      <div className="flex items-start justify-between gap-4 border-b border-rule p-6">
        <div>
          <p className="label-spec text-steel">Track</p>
          <h3 className="display mt-2 text-4xl">{track.title}</h3>
        </div>
        <span className="grid size-12 shrink-0 place-items-center bg-ink text-ember">
          <TrackIcon name={track.icon} className="size-6" />
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="font-semibold">{track.tagline}</p>
        <p className="mt-2 text-sm leading-relaxed text-steel">{track.description}</p>
        <ul className="mt-5 divide-y divide-rule-soft border-y border-rule-soft">
          {LEVELS.map((level) => (
            <LevelRow key={level.key} track={track} levelKey={level.key} />
          ))}
        </ul>
        <Link href={href} className="mt-6 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-ink underline decoration-ember decoration-2 underline-offset-4 group-hover:text-ember-deep">
          Start this track <ArrowUpRight className="size-4" />
        </Link>
      </div>
    </article>
  );
}

interface TracksSectionProps {
  tracks: TrackSummary[];
  registrationOpen: boolean;
}

export function TracksSection({ tracks, registrationOpen }: TracksSectionProps) {
  return (
    <section id="tracks" className="mx-auto max-w-7xl scroll-mt-10 px-6 py-24 lg:px-10">
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <p className="label-spec text-ember-deep">The tracks</p>
          <h2 className="display mt-3 text-5xl sm:text-6xl">Pick what you want to be good at</h2>
        </div>
        <p className="max-w-sm text-[15px] leading-relaxed text-steel">
          Tracks are independent. Start any of them at Basic, or jump straight to the level you think you are at and let the
          exam tell you.
        </p>
      </div>
      {tracks.length === 0 ? (
        <p className="mt-12 border border-dashed border-steel-2 p-10 text-center text-steel">The curriculum is being loaded. Check back in a moment.</p>
      ) : (
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {tracks.map((track) => (
            <TrackCard key={track.id} track={track} href={registrationOpen ? '/register' : '/login'} />
          ))}
        </div>
      )}
    </section>
  );
}
