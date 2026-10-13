'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { DataTable, type Column } from '@/design/patterns/data-table';
import { PageHeader } from '@/design/patterns/page-header';
import { TableToolbar } from '@/design/patterns/pagination';
import { toQuery, useListState } from '@/design/patterns/use-list-state';
import { StatusBadge } from '@/design/primitives/badge';
import { ButtonLink } from '@/design/primitives/button';
import { InlineSelect } from '@/design/primitives/field';
import { Hallmark } from '@/design/primitives/hallmark';
import { Plate } from '@/design/primitives/plate';
import { timeAgo } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';
import type { LessonRow } from '@/types/content-admin';
import { ConfirmDelete } from '../shared/confirm-delete';
import { IconButton, IconLink } from '../shared/icon-button';
import { CourseOptions, StatusOptions } from '../shared/options';
import { useCourses } from '../shared/use-catalog';
import { LESSON_DELETE_NOTE, LESSONS } from './lesson-model';

function columns(onDelete: (lesson: LessonRow) => void): Column<LessonRow>[] {
  return [
    {
      key: 'lesson', header: 'Lesson', sortKey: 'title',
      render: (lesson) => (
        <div className="max-w-64">
          <Link href={`${LESSONS}/${lesson.id}`} onClick={(event) => event.stopPropagation()} title={lesson.title} className="block truncate font-medium hover:underline">{lesson.title}</Link>
          <p className="truncate font-mono text-xs text-steel">/{lesson.slug}</p>
        </div>
      ),
    },
    {
      key: 'course', header: 'Course',
      render: (lesson) => (
        <div className="flex items-center gap-3">
          <Hallmark level={lesson.level} size="sm" />
          <div className="max-w-44">
            <p className="truncate" title={lesson.courseTitle}>{lesson.courseTitle}</p>
            <p className="truncate text-[13px] text-steel">{lesson.trackTitle}</p>
          </div>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sortKey: 'status', render: (lesson) => <StatusBadge status={lesson.status} /> },
    { key: 'minutes', header: 'Minutes', sortKey: 'estMinutes', render: (lesson) => <span className="text-steel tabular-nums">{lesson.estMinutes}</span> },
    { key: 'order', header: 'Order', sortKey: 'sortOrder', render: (lesson) => <span className="text-steel tabular-nums">{lesson.sortOrder}</span> },
    { key: 'updated', header: 'Updated', sortKey: 'updatedAt', render: (lesson) => <span className="text-[13px] whitespace-nowrap text-steel">{timeAgo(lesson.updatedAt)}</span> },
    {
      key: 'actions', header: '', className: 'w-20 text-right',
      render: (lesson) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <IconLink label={`Edit ${lesson.title}`} href={`${LESSONS}/${lesson.id}`}><Pencil className="size-4" /></IconLink>
          <IconButton label={`Delete ${lesson.title}`} onClick={() => onDelete(lesson)}><Trash2 className="size-4" /></IconButton>
        </div>
      ),
    },
  ];
}

export function LessonsView() {
  const router = useRouter();
  const [state, setState] = useListState({ sort: 'updatedAt', filters: ['courseId', 'status'] });
  const { data, error, mutate } = useApi<Page<LessonRow>>(`/admin/lessons?${toQuery(state)}`, { keepPreviousData: true });
  const { courses } = useCourses();
  const [doomed, setDoomed] = useState<LessonRow | null>(null);
  const cols = useMemo(() => columns(setDoomed), []);
  const { courseId } = state.filters;

  return (
    <>
      <PageHeader eyebrow="Content" title="Lessons" description="The reading in every course. Search, filters and sorting run on the server."
        actions={<ButtonLink href={courseId ? `${LESSONS}/new?courseId=${courseId}` : `${LESSONS}/new`} icon={<Plus className="size-4" />}>New lesson</ButtonLink>} />
      <Plate>
        <TableToolbar state={state} onState={setState} searchPlaceholder="Search by title"
          filters={
            <>
              <InlineSelect label="Filter by course" value={courseId} onChange={(event) => setState({ filters: { courseId: event.target.value } })} className="max-w-64">
                <option value="">All courses</option>
                <CourseOptions courses={courses ?? []} />
              </InlineSelect>
              <InlineSelect label="Filter by status" value={state.filters.status} onChange={(event) => setState({ filters: { status: event.target.value } })}>
                <option value="">Any status</option>
                <StatusOptions />
              </InlineSelect>
            </>
          } />
        <DataTable label="Lessons" columns={cols} data={data} error={error} state={state} onState={setState} rowKey={(lesson) => lesson.id}
          onRowClick={(lesson) => router.push(`${LESSONS}/${lesson.id}`)}
          empty={{ title: 'No lessons yet', hint: 'Write the first one with New lesson.' }} />
      </Plate>
      <ConfirmDelete path={doomed ? `/admin/lessons/${doomed.id}` : null} title="Delete this lesson?" subject={doomed ? `${doomed.title} · ${doomed.courseTitle}` : undefined}
        confirmLabel="Delete lesson" success={`${doomed?.title ?? 'The lesson'} was deleted.`} onClose={() => setDoomed(null)} onDone={() => void mutate()}>
        <p>{LESSON_DELETE_NOTE}</p>
      </ConfirmDelete>
    </>
  );
}
