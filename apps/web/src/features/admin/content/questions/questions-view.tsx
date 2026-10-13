'use client';

import { Plus, Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DataTable } from '@/design/patterns/data-table';
import { PageHeader } from '@/design/patterns/page-header';
import { TableToolbar } from '@/design/patterns/pagination';
import { toQuery, useListState, type ListState } from '@/design/patterns/use-list-state';
import { Button } from '@/design/primitives/button';
import { InlineSelect } from '@/design/primitives/field';
import { Plate } from '@/design/primitives/plate';
import { useApi } from '@/lib/use-api';
import type { Page } from '@/types/account';
import type { AdminTrack, Category, QuestionRow } from '@/types/content-admin';
import { ConfirmDelete } from '../shared/confirm-delete';
import { excerpt } from '../shared/labels';
import { CategoryOptions, LevelOptions, StatusOptions, TrackOptions, TypeOptions } from '../shared/options';
import { useCategories, useTracks } from '../shared/use-catalog';
import { ImportDialog } from './import-dialog';
import { questionColumns } from './question-columns';
import { QuestionDialog, type QuestionTarget } from './question-dialog';

const FILTERS = ['trackId', 'categoryId', 'difficulty', 'status', 'type'];

interface FiltersProps {
  state: ListState;
  onState: (patch: Partial<ListState>) => void;
  tracks: AdminTrack[];
  categories: Category[];
}

function Filters({ state, onState, tracks, categories }: FiltersProps) {
  const filter = (name: string) => ({
    value: state.filters[name],
    onChange: (event: React.ChangeEvent<HTMLSelectElement>) => onState({ filters: { [name]: event.target.value } }),
  });
  return (
    <>
      <InlineSelect label="Filter by track" {...filter('trackId')} className="max-w-44"><option value="">All tracks</option><TrackOptions tracks={tracks} /></InlineSelect>
      <InlineSelect label="Filter by category" {...filter('categoryId')} className="max-w-44"><option value="">All categories</option><CategoryOptions categories={categories} /></InlineSelect>
      <InlineSelect label="Filter by difficulty" {...filter('difficulty')}><option value="">Any difficulty</option><LevelOptions /></InlineSelect>
      <InlineSelect label="Filter by status" {...filter('status')}><option value="">Any status</option><StatusOptions /></InlineSelect>
      <InlineSelect label="Filter by type" {...filter('type')}><option value="">Any type</option><TypeOptions /></InlineSelect>
    </>
  );
}

/** The question bank: one page of rows at a time, however many questions there are. */
export function QuestionsView() {
  const [state, setState] = useListState({ sort: 'updatedAt', filters: FILTERS });
  const { data, error, mutate } = useApi<Page<QuestionRow>>(`/admin/questions?${toQuery(state)}`, { keepPreviousData: true });
  const tracks = useTracks().tracks ?? [];
  const categories = useCategories().categories ?? [];
  const [target, setTarget] = useState<QuestionTarget>(null);
  const [importing, setImporting] = useState(false);
  const [doomed, setDoomed] = useState<QuestionRow | null>(null);
  const cols = useMemo(() => questionColumns({ onEdit: (question) => setTarget({ id: question.id }), onDelete: setDoomed }), []);
  const reload = () => void mutate();

  return (
    <>
      <PageHeader eyebrow="Content" title="Question bank"
        description={`${data ? `${data.total.toLocaleString()} ${data.total === 1 ? 'question matches' : 'questions match'}. ` : ''}Exams draw from here by track, category, difficulty and tag. Only one page is ever loaded, so the bank can grow without slowing down.`}
        actions={<>
          <Button variant="secondary" onClick={() => setImporting(true)} icon={<Upload className="size-4" />}>Import</Button>
          <Button onClick={() => setTarget({ id: null })} icon={<Plus className="size-4" />}>New question</Button>
        </>} />
      <Plate>
        <TableToolbar state={state} onState={setState} searchPlaceholder="Search the question text"
          filters={<Filters state={state} onState={setState} tracks={tracks} categories={categories} />} />
        <DataTable label="Questions" columns={cols} data={data} error={error} state={state} onState={setState} rowKey={(question) => question.id}
          onRowClick={(question) => setTarget({ id: question.id })}
          empty={{ title: 'The bank is empty', hint: 'Write a question, or import a batch from a JSON file.' }} />
      </Plate>
      <QuestionDialog target={target} startTrackId={state.filters.trackId ?? ''} tracks={tracks} categories={categories} onClose={() => setTarget(null)} onDone={reload} />
      <ImportDialog open={importing} tracks={tracks} categories={categories} onClose={() => setImporting(false)} onDone={reload} />
      <ConfirmDelete path={doomed ? `/admin/questions/${doomed.id}` : null} title="Delete this question?" subject={doomed ? excerpt(doomed.promptMd, 120) : undefined}
        confirmLabel="Delete question" success="The question was deleted." onClose={() => setDoomed(null)} onDone={reload}>
        <p>It is removed from the bank, from any fixed exam that pins it, and from the review of every past attempt that included it. Scores already awarded do not change.</p>
        <p>To stop using a question without losing that history, set its status to archived instead.</p>
      </ConfirmDelete>
    </>
  );
}
