import { levelInfo } from '@mettle/shared';
import { Pencil, Trash2 } from 'lucide-react';
import type { Column } from '@/design/patterns/data-table';
import { StatusBadge } from '@/design/primitives/badge';
import { Hallmark } from '@/design/primitives/hallmark';
import { timeAgo } from '@/lib/format';
import type { QuestionRow } from '@/types/content-admin';
import { IconButton } from '../shared/icon-button';
import { excerpt, TYPE_LABEL } from '../shared/labels';

interface RowActions {
  onEdit: (question: QuestionRow) => void;
  onDelete: (question: QuestionRow) => void;
}

function Prompt({ question }: { question: QuestionRow }) {
  return (
    <div className="max-w-md min-w-56">
      <p className="line-clamp-2 leading-snug">{excerpt(question.promptMd, 180)}</p>
      {question.tags.length > 0 ? (
        <p className="mt-1 flex flex-wrap gap-1">
          {question.tags.map((tag) => <span key={tag} className="rounded-[2px] border border-rule bg-rule-soft px-1 font-mono text-[11px] text-steel">{tag}</span>)}
        </p>
      ) : null}
    </div>
  );
}

/** The bank's columns. Only the ones the API can order by are sortable. */
export function questionColumns({ onEdit, onDelete }: RowActions): Column<QuestionRow>[] {
  return [
    { key: 'prompt', header: 'Question', render: (question) => <Prompt question={question} /> },
    { key: 'type', header: 'Type', sortKey: 'type', render: (question) => <span className="text-[13px] whitespace-nowrap text-ink-2">{TYPE_LABEL[question.type]}</span> },
    {
      key: 'difficulty', header: 'Difficulty', sortKey: 'difficulty',
      render: (question) => (
        <span className="flex items-center gap-2 text-[13px] whitespace-nowrap text-ink-2">
          <Hallmark level={question.difficulty} size="sm" /> {levelInfo(question.difficulty).label}
        </span>
      ),
    },
    {
      key: 'filed', header: 'Track · category',
      render: (question) => (
        <div className="max-w-40 text-[13px]">
          <p className="truncate">{question.trackTitle ?? <span className="text-steel-2">No track</span>}</p>
          <p className="truncate text-steel">{question.categoryName ?? 'No category'}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', sortKey: 'status', render: (question) => <StatusBadge status={question.status} /> },
    { key: 'updated', header: 'Updated', sortKey: 'updatedAt', render: (question) => <span className="text-[13px] whitespace-nowrap text-steel">{timeAgo(question.updatedAt)}</span> },
    {
      key: 'actions', header: '', className: 'w-20 text-right',
      render: (question) => (
        <div className="flex justify-end" onClick={(event) => event.stopPropagation()}>
          <IconButton label={`Edit question: ${excerpt(question.promptMd, 50)}`} onClick={() => onEdit(question)}><Pencil className="size-4" /></IconButton>
          <IconButton label={`Delete question: ${excerpt(question.promptMd, 50)}`} onClick={() => onDelete(question)}><Trash2 className="size-4" /></IconButton>
        </div>
      ),
    },
  ];
}
