'use client';

import { SelectField } from '@/design/primitives/field';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';

interface LabLessonSelectProps {
  courseId: string;
  value: string;
  onChange: (lessonId: string) => void;
  error?: string;
}

/** Ties a lab to one lesson of its course, which makes it that lesson's practice lab. */
export function LabLessonSelect({ courseId, value, onChange, error }: LabLessonSelectProps) {
  const path = courseId ? `/admin/lessons?courseId=${courseId}&pageSize=100&sort=sortOrder&order=asc` : null;
  const { data } = useApi<Page<{ id: string; title: string }>>(path);
  return (
    <SelectField label="Offered" value={value} onChange={(event) => onChange(event.target.value)} error={error}
      hint="A lab tied to a lesson is that lesson's practice lab: it is offered at the end of the lesson and listed under it.">
      <option value="">At the end of the level</option>
      {(data?.items ?? []).map((lesson, index) => (
        <option key={lesson.id} value={lesson.id}>{`As practice for lesson ${index + 1}: ${lesson.title}`}</option>
      ))}
    </SelectField>
  );
}
