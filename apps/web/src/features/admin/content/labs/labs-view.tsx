'use client';

import { FlaskConical, Pencil, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import type { Column } from '@/design/patterns/data-table';
import { LoadState } from '@/design/patterns/load-state';
import { EmptyState } from '@/design/patterns/notice';
import { PageHeader } from '@/design/patterns/page-header';
import { Badge, StatusBadge } from '@/design/primitives/badge';
import { ButtonLink } from '@/design/primitives/button';
import { Hallmark } from '@/design/primitives/hallmark';
import { Plate } from '@/design/primitives/plate';
import { timeAgo } from '@/lib/format';
import { useApi } from '@/lib/use-api';
import type { LabRow } from '@/types/content-admin';
import { IconButton, IconLink } from '../shared/icon-button';
import { LANGUAGE_LABEL } from '../shared/labels';
import { PlainTable } from '../shared/plain-table';
import { DeleteLabDialog } from './delete-lab';
import { LABS } from './lab-model';

function columns(onDelete: (lab: LabRow) => void): Column<LabRow>[] {
  return [
    {
      key: 'lab', header: 'Lab',
      render: (lab) => (
        <div className="max-w-72">
          <Link href={`${LABS}/${lab.id}`} onClick={(event) => event.stopPropagation()} title={lab.title} className="block truncate font-medium hover:underline">{lab.title}</Link>
          <p className="truncate font-mono text-xs text-steel">/{lab.slug}</p>
        </div>
      ),
    },
    {
      key: 'course', header: 'Course',
      render: (lab) => (
        <div className="flex items-center gap-3">
          <Hallmark level={lab.level} size="sm" />
          <div className="max-w-44">
            <p className="truncate" title={lab.courseTitle}>{lab.courseTitle}</p>
            <p className="truncate text-[13px] text-steel">{lab.trackTitle}</p>
          </div>
        </div>
      ),
    },
    { key: 'language', header: 'Language', render: (lab) => <Badge>{LANGUAGE_LABEL[lab.language]}</Badge> },
    { key: 'minutes', header: 'Minutes', render: (lab) => <span className="text-steel tabular-nums">{lab.estMinutes}</span> },
    { key: 'status', header: 'Status', render: (lab) => <StatusBadge status={lab.status} /> },
    { key: 'updated', header: 'Updated', render: (lab) => <span className="text-[13px] whitespace-nowrap text-steel">{timeAgo(lab.updatedAt)}</span> },
    {
      key: 'actions', header: '', className: 'w-20 text-right',
      render: (lab) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <IconLink label={`Edit ${lab.title}`} href={`${LABS}/${lab.id}`}><Pencil className="size-4" /></IconLink>
          <IconButton label={`Delete ${lab.title}`} onClick={() => onDelete(lab)}><Trash2 className="size-4" /></IconButton>
        </div>
      ),
    },
  ];
}

/** Every lab, in course order. Open one to edit it and to verify it in the sandbox. */
export function LabsView() {
  const router = useRouter();
  const { data, error, mutate } = useApi<{ labs: LabRow[] }>('/admin/labs');
  const [doomed, setDoomed] = useState<LabRow | null>(null);
  const cols = useMemo(() => columns(setDoomed), []);
  const add = <ButtonLink href={`${LABS}/new`} icon={<Plus className="size-4" />}>New lab</ButtonLink>;

  return (
    <>
      <PageHeader eyebrow="Content" title="Labs" description="Hands-on exercises whose code is built and tested in the sandbox. Each has a starter, a reference solution and test cases."
        actions={add} />
      <LoadState data={data} error={error} onRetry={() => void mutate()}>
        {(loaded) => (
          <Plate>
            {loaded.labs.length === 0 ? (
              <EmptyState icon={<FlaskConical className="size-5" />} title="No labs yet" action={add}>A lab belongs to a course, so add a track and a course first.</EmptyState>
            ) : (
              <PlainTable label="Labs" columns={cols} rows={loaded.labs} rowKey={(lab) => lab.id} onRowClick={(lab) => router.push(`${LABS}/${lab.id}`)} />
            )}
          </Plate>
        )}
      </LoadState>
      <DeleteLabDialog lab={doomed} onClose={() => setDoomed(null)} onDone={() => void mutate()} />
    </>
  );
}
