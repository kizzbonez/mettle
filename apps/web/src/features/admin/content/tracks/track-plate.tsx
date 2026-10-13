import { Pencil, Plus, Trash2 } from 'lucide-react';
import { StatusBadge } from '@/design/primitives/badge';
import { Button } from '@/design/primitives/button';
import { Hallmark, LevelLabel } from '@/design/primitives/hallmark';
import { Plate } from '@/design/primitives/plate';
import { TrackIcon } from '@/design/primitives/track-icon';
import { plural } from '@/lib/format';
import type { AdminCourse, AdminTrack } from '@/types/content-admin';
import { IconButton } from '../shared/icon-button';

export type TrackDialogState =
  | { kind: 'track'; track: AdminTrack | null }
  | { kind: 'course'; track: AdminTrack; course: AdminCourse | null }
  | { kind: 'delete-track'; track: AdminTrack }
  | { kind: 'delete-course'; course: AdminCourse }
  | null;

type Open = (dialog: TrackDialogState) => void;

function CourseRow({ track, course, onOpen }: { track: AdminTrack; course: AdminCourse; onOpen: Open }) {
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 py-3 transition-colors hover:bg-white">
      <Hallmark level={course.level} size="sm" />
      {/* The basis makes the status and actions drop to a second line on a phone instead of squeezing the title. */}
      <div className="min-w-0 flex-1 basis-44">
        <p className="truncate font-medium">{course.title}</p>
        <p className="flex flex-wrap items-center gap-x-2">
          <LevelLabel level={course.level} />
          <span className="label-spec truncate text-steel-2 normal-case">/{course.slug}</span>
        </p>
      </div>
      <span className="hidden text-[13px] text-steel tabular-nums md:block">{plural(course.outcomes.length, 'outcome')}</span>
      <div className="flex items-center gap-2 pl-11 sm:pl-0">
        <StatusBadge status={course.status} />
        <div className="flex">
          <IconButton label={`Edit ${course.title}`} onClick={() => onOpen({ kind: 'course', track, course })}><Pencil className="size-4" /></IconButton>
          <IconButton label={`Delete ${course.title}`} onClick={() => onOpen({ kind: 'delete-course', course })}><Trash2 className="size-4" /></IconButton>
        </div>
      </div>
    </li>
  );
}

/** One track, with the courses that make up its levels listed under it. */
export function TrackPlate({ track, courses, onOpen }: { track: AdminTrack; courses: AdminCourse[]; onOpen: Open }) {
  return (
    <Plate>
      <section aria-label={track.title}>
        <div className="flex flex-col gap-4 border-b border-rule px-5 py-4 sm:flex-row sm:items-start">
          <span className="grid size-11 shrink-0 place-items-center border border-rule bg-white text-ink"><TrackIcon name={track.icon} className="size-5" /></span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <h2 className="text-lg font-semibold text-ink">{track.title}</h2>
              <StatusBadge status={track.status} />
            </div>
            <p className="label-spec mt-1 text-steel">
              <span className="normal-case">/{track.slug}</span> · Order {track.sortOrder} · {plural(courses.length, 'course')}
            </p>
            {track.tagline ? <p className="mt-2 max-w-2xl text-sm text-steel">{track.tagline}</p> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button size="sm" variant="secondary" onClick={() => onOpen({ kind: 'course', track, course: null })} icon={<Plus className="size-4" />}>Add course</Button>
            <IconButton label={`Edit ${track.title}`} onClick={() => onOpen({ kind: 'track', track })}><Pencil className="size-4" /></IconButton>
            <IconButton label={`Delete ${track.title}`} onClick={() => onOpen({ kind: 'delete-track', track })}><Trash2 className="size-4" /></IconButton>
          </div>
        </div>
        {courses.length > 0 ? (
          <ul className="divide-y divide-rule-soft">
            {courses.map((course) => <CourseRow key={course.id} track={track} course={course} onOpen={onOpen} />)}
          </ul>
        ) : (
          <p className="px-5 py-6 text-sm text-steel">No courses yet. Add one for each level this track teaches.</p>
        )}
      </section>
    </Plate>
  );
}
