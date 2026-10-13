'use client';

import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Column } from '@/design/patterns/data-table';
import { LoadState } from '@/design/patterns/load-state';
import { EmptyState } from '@/design/patterns/notice';
import { PageHeader } from '@/design/patterns/page-header';
import { Badge, StatusBadge } from '@/design/primitives/badge';
import { ButtonLink } from '@/design/primitives/button';
import { Plate, PlateHeader } from '@/design/primitives/plate';
import { plural } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { ExamRow } from '@/types/content-admin';
import { IconButton, IconLink } from '../shared/icon-button';
import { PlainTable } from '../shared/plain-table';
import { DeleteExamDialog } from './delete-exam';
import { EXAMS } from './exam-model';

function columns(onDelete: (exam: ExamRow) => void): Column<ExamRow>[] {
  return [
    {
      key: 'exam', header: 'Exam',
      render: (exam) => (
        <div className="max-w-72">
          <Link href={`${EXAMS}/${exam.id}`} onClick={(event) => event.stopPropagation()} title={exam.title} className="block truncate font-medium hover:underline">{exam.title}</Link>
          <p className="truncate font-mono text-xs text-steel">/{exam.slug}</p>
        </div>
      ),
    },
    // Fixed widths, so the columns line up from one track's table to the next.
    { key: 'course', header: 'Course', className: 'w-56', render: (exam) => <span className="block max-w-52 truncate text-ink-2">{exam.courseTitle ?? <span className="text-steel">Whole track</span>}</span> },
    { key: 'mode', header: 'Mode', className: 'w-28', render: (exam) => <Badge tone={exam.mode === 'fixed' ? 'ink' : 'neutral'}>{exam.mode}</Badge> },
    {
      key: 'sitting', header: 'Sitting', className: 'w-48',
      render: (exam) => (
        <div className="whitespace-nowrap tabular-nums">
          <p className="text-ink-2">{exam.timeLimitMinutes} min · {exam.passPercent}% to pass</p>
          <p className="text-[13px] text-steel">{exam.maxAttempts === null ? 'Unlimited attempts' : plural(exam.maxAttempts, 'attempt')}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', className: 'w-32', render: (exam) => <StatusBadge status={exam.status} /> },
    {
      key: 'actions', header: '', className: 'w-20 text-right',
      render: (exam) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <IconLink label={`Edit ${exam.title}`} href={`${EXAMS}/${exam.id}`}><Pencil className="size-4" /></IconLink>
          <IconButton label={`Delete ${exam.title}`} onClick={() => onDelete(exam)}><Trash2 className="size-4" /></IconButton>
        </div>
      ),
    },
  ];
}

/** Exams grouped under their track, in the order the API returns them (track order, then exam order). */
function byTrack(exams: ExamRow[]): { trackId: string; title: string; exams: ExamRow[] }[] {
  const groups = new Map<string, { trackId: string; title: string; exams: ExamRow[] }>();
  for (const exam of exams) {
    const group = groups.get(exam.trackId) ?? { trackId: exam.trackId, title: exam.trackTitle, exams: [] };
    group.exams.push(exam);
    groups.set(exam.trackId, group);
  }
  return [...groups.values()];
}

export function ExamsView() {
  const router = useRouter();
  const { data, error, mutate } = useApi<{ exams: ExamRow[] }>('/admin/exams');
  const [doomed, setDoomed] = useState<ExamRow | null>(null);
  const cols = useMemo(() => columns(setDoomed), []);
  const add = <ButtonLink href={`${EXAMS}/new`} icon={<Plus className="size-4" />}>New exam</ButtonLink>;

  return (
    <>
      <PageHeader eyebrow="Content" title="Exams" description="Timed papers, by track. A dynamic exam samples the question bank for each attempt; a fixed exam asks the same pinned questions every time."
        actions={add} />
      <LoadState data={data} error={error} onRetry={() => void mutate()}>
        {(loaded) => loaded.exams.length === 0 ? (
          <Plate><EmptyState icon={<ClipboardList className="size-5" />} title="No exams yet" action={add}>An exam needs a track to belong to and questions in the bank to draw from.</EmptyState></Plate>
        ) : (
          <div className="space-y-6">
            {byTrack(loaded.exams).map((group) => (
              <Plate key={group.trackId}>
                <PlateHeader title={group.title} caption={plural(group.exams.length, 'exam')} />
                <PlainTable label={`${group.title} exams`} columns={cols} rows={group.exams} rowKey={(exam) => exam.id} onRowClick={(exam) => router.push(`${EXAMS}/${exam.id}`)} />
              </Plate>
            ))}
          </div>
        )}
      </LoadState>
      <DeleteExamDialog exam={doomed} onClose={() => setDoomed(null)} onDone={() => void mutate()} />
    </>
  );
}
