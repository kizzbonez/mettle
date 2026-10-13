'use client';

import { Plus, Route } from 'lucide-react';
import { useState } from 'react';
import { LoadState } from '@/design/patterns/load-state';
import { EmptyState } from '@/design/patterns/notice';
import { PageHeader } from '@/design/patterns/page-header';
import { Button } from '@/design/primitives/button';
import { Plate } from '@/design/primitives/plate';
import { useCourses, useTracks } from '../shared/use-catalog';
import { CourseDialog } from './course-dialog';
import { DeleteCourseDialog, DeleteTrackDialog } from './delete-dialogs';
import { TrackDialog } from './track-dialog';
import { TrackPlate, type TrackDialogState } from './track-plate';

/** Every track with its courses, and the dialogs that add, change and delete them. */
export function TracksView() {
  const tracks = useTracks();
  const courses = useCourses();
  const [dialog, setDialog] = useState<TrackDialogState>(null);
  const data = tracks.tracks && courses.courses ? { tracks: tracks.tracks, courses: courses.courses } : undefined;
  const close = () => setDialog(null);
  const reload = () => {
    void tracks.mutate();
    void courses.mutate();
  };
  const addTrack = () => setDialog({ kind: 'track', track: null });
  const doomed = dialog?.kind === 'delete-track' ? dialog.track : null;

  return (
    <>
      <PageHeader eyebrow="Content" title="Tracks & courses"
        description="A track is a subject. Each of its courses is one level, and holds that level's lessons, exams and labs."
        actions={<Button onClick={addTrack} icon={<Plus className="size-4" />}>Add track</Button>} />
      <LoadState data={data} error={tracks.error ?? courses.error} onRetry={reload}>
        {(loaded) => loaded.tracks.length === 0 ? (
          <Plate>
            <EmptyState icon={<Route className="size-5" />} title="No tracks yet" action={<Button variant="secondary" onClick={addTrack}>Add the first track</Button>}>
              Start with a subject, then add a course for each level it teaches.
            </EmptyState>
          </Plate>
        ) : (
          <div className="space-y-6">
            {loaded.tracks.map((track) => (
              <TrackPlate key={track.id} track={track} courses={loaded.courses.filter((course) => course.trackId === track.id)} onOpen={setDialog} />
            ))}
          </div>
        )}
      </LoadState>
      <TrackDialog open={dialog?.kind === 'track'} track={dialog?.kind === 'track' ? dialog.track : null} onClose={close} onDone={reload} />
      <CourseDialog track={dialog?.kind === 'course' ? dialog.track : null} course={dialog?.kind === 'course' ? dialog.course : null} onClose={close} onDone={reload} />
      <DeleteTrackDialog track={doomed} courses={(courses.courses ?? []).filter((course) => course.trackId === doomed?.id)} onClose={close} onDone={reload} />
      <DeleteCourseDialog course={dialog?.kind === 'delete-course' ? dialog.course : null} onClose={close} onDone={reload} />
    </>
  );
}
