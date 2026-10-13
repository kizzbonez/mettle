'use client';

import { useSearchParams } from 'next/navigation';
import type { AdminLabDetail } from '@/types/content-admin';
import { EditorLoad } from '../shared/form-layout';
import { useCourses } from '../shared/use-catalog';
import { useEditable } from '../shared/use-editor';
import { LabFormView } from './lab-form';
import { LABS } from './lab-model';

/** The lab editor page: loads the lab (when there is one) and the courses it can belong to. */
export function LabEditor({ labId }: { labId?: string }) {
  const params = useSearchParams();
  const item = useEditable<AdminLabDetail>(labId ? `/admin/labs/${labId}` : null);
  const catalog = useCourses();
  const ready = catalog.courses && (!labId || item.data) ? { courses: catalog.courses } : undefined;
  const retry = () => {
    void item.mutate();
    void catalog.mutate();
  };

  return (
    <EditorLoad data={ready} error={item.error ?? catalog.error} onRetry={retry} what="lab" back={{ href: LABS, label: 'Back to labs' }}>
      {({ courses }) => (
        <LabFormView key={labId ?? 'new'} detail={item.data ?? null} courses={courses} startCourseId={params.get('courseId') ?? ''} onSaved={() => item.mutate()} />
      )}
    </EditorLoad>
  );
}
