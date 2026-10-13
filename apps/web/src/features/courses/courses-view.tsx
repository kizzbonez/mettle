'use client';

import type { Difficulty } from '@mettle/shared';
import { LoadState } from '@/design/patterns/load-state';
import { PageHeader } from '@/design/patterns/page-header';
import { TemperStrip } from '@/design/primitives/hallmark';
import { TrackIcon } from '@/design/primitives/track-icon';
import { plural } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { CatalogCourse, TrackSummary } from '@/types/catalog';
import { CourseCard } from './course-card';

type CatalogTrack = TrackSummary<CatalogCourse>;

const contents = (course: CatalogCourse) =>
  `${plural(course.lessonCount, 'lesson')} · ${plural(course.examCount, 'exam')} · ${plural(course.labCount, 'lab')}`;

function MyCourses({ tracks }: { tracks: CatalogTrack[] }) {
  const mine = tracks.flatMap((track) => track.courses.filter((course) => course.enrolled).map((course) => ({ course, track })));
  if (mine.length === 0) return null;
  return (
    <section className="mb-14">
      <h2 className="label-spec mb-4 text-steel">My courses · {mine.length}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {mine.map(({ course, track }) => (
          <CourseCard key={course.id} {...course} context={track.title} footnote={contents(course)} />
        ))}
      </div>
    </section>
  );
}

function TrackSection({ track }: { track: CatalogTrack }) {
  const progress: Partial<Record<Difficulty, number>> = {};
  for (const course of track.courses) progress[course.level] = course.progress.percent;
  return (
    <section className="border-t border-rule pt-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-4">
          <span className="grid size-12 shrink-0 place-items-center bg-ink text-ember">
            <TrackIcon name={track.icon} className="size-6" />
          </span>
          <div>
            <h2 className="display text-4xl">{track.title}</h2>
            <p className="mt-1.5 max-w-xl text-[15px] text-steel">{track.tagline}</p>
          </div>
        </div>
        <div className="w-full shrink-0 md:w-56">
          <p className="label-spec mb-2 text-steel">Track progress</p>
          <TemperStrip progress={progress} />
        </div>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {track.courses.map((course) => (
          <CourseCard key={course.id} {...course} footnote={contents(course)} />
        ))}
      </div>
    </section>
  );
}

export function CoursesView() {
  const { data, error, mutate } = useApi<{ tracks: CatalogTrack[] }>('/catalog');
  return (
    <>
      <PageHeader
        eyebrow="Courses"
        title="Tracks and levels"
        description="Each level is three lessons, a mock exam and a lab. Opening a level enrolls you; there is nothing to unlock."
      />
      <LoadState data={data} error={error} onRetry={() => void mutate()}>
        {(catalog) => (
          <>
            <MyCourses tracks={catalog.tracks} />
            <div className="space-y-12">
              {catalog.tracks.map((track) => (
                <TrackSection key={track.id} track={track} />
              ))}
            </div>
          </>
        )}
      </LoadState>
    </>
  );
}
