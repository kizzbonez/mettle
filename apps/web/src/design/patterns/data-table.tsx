'use client';

import { ArrowDown, ArrowUp, ChevronsUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import type { ApiError } from '@/lib/api';
import { cn } from '@/lib/cn';
import type { Page } from '@/types/account';
import { Skeleton } from '../primitives/spinner';
import { EmptyState } from './notice';
import { Pagination } from './pagination';
import type { ListState } from './use-list-state';

export interface Column<T> {
  key: string;
  header: string;
  /** The name the API sorts by. Leave out for a column that cannot be sorted. */
  sortKey?: string;
  render: (row: T) => ReactNode;
  /** Classes for both the header and body cells: width, alignment. */
  className?: string;
}

export interface Selection {
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: Page<T> | undefined;
  error?: ApiError;
  state: ListState;
  onState: (patch: Partial<ListState>) => void;
  rowKey: (row: T) => string;
  selection?: Selection;
  onRowClick?: (row: T) => void;
  /** Shown when there are no rows at all. */
  empty: { title: string; hint?: string };
  label: string;
}

function SortHeader<T>({ column, state, onState }: { column: Column<T>; state: ListState; onState: DataTableProps<T>['onState'] }) {
  if (!column.sortKey) return <>{column.header}</>;
  const active = state.sort === column.sortKey;
  const next = active && state.order === 'asc' ? 'desc' : 'asc';
  const Icon = !active ? ChevronsUpDown : state.order === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button type="button" onClick={() => onState({ sort: column.sortKey, order: next })}
      className={cn('label-spec -mx-1 inline-flex items-center gap-1 px-1 py-0.5 hover:text-ink', active ? 'text-ink' : 'text-steel')}
      aria-label={`Sort by ${column.header}, ${next === 'asc' ? 'ascending' : 'descending'}`}>
      {column.header}
      <Icon className={cn('size-3.5', active ? 'text-ember-deep' : 'text-steel-2')} />
    </button>
  );
}

function toggleAll(rows: string[], selection: Selection): void {
  const all = rows.every((id) => selection.selected.has(id));
  const next = new Set(selection.selected);
  for (const id of rows) if (all) next.delete(id); else next.add(id);
  selection.onChange(next);
}

function toggleOne(id: string, selection: Selection): void {
  const next = new Set(selection.selected);
  if (next.has(id)) next.delete(id); else next.add(id);
  selection.onChange(next);
}

/**
 * A table whose paging, sorting and filtering happen on the server. It only
 * ever holds one page of rows, so it behaves the same with twenty rows or
 * twenty thousand.
 */
export function DataTable<T>(props: DataTableProps<T>) {
  const { columns, data, error, state, onState, rowKey, selection, onRowClick, empty, label } = props;
  const rows = data?.items ?? [];
  const ids = rows.map(rowKey);
  const span = columns.length + (selection ? 1 : 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-sm" aria-label={label} aria-busy={!data && !error}>
          <thead>
            <tr className="border-b border-rule bg-rule-soft/60 text-left">
              {selection ? (
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" className="size-4 accent-ember" aria-label="Select every row on this page"
                    checked={ids.length > 0 && ids.every((id) => selection.selected.has(id))} onChange={() => toggleAll(ids, selection)} />
                </th>
              ) : null}
              {columns.map((column) => (
                <th key={column.key} scope="col" className={cn('label-spec px-4 py-2.5 font-medium whitespace-nowrap text-steel', column.className)}
                  aria-sort={state.sort === column.sortKey ? (state.order === 'asc' ? 'ascending' : 'descending') : undefined}>
                  <SortHeader column={column} state={state} onState={onState} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-rule-soft">
            {!data && !error
              ? Array.from({ length: 6 }, (_, i) => (
                  <tr key={i}><td colSpan={span} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td></tr>
                ))
              : null}
            {rows.map((row) => {
              const id = rowKey(row);
              const picked = selection?.selected.has(id);
              return (
                <tr key={id} onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn('transition-colors', onRowClick && 'cursor-pointer', picked ? 'bg-ember-soft/60' : 'hover:bg-white')}>
                  {selection ? (
                    <td className="px-4 py-3" onClick={(event) => event.stopPropagation()}>
                      <input type="checkbox" className="size-4 accent-ember" aria-label="Select row" checked={picked ?? false} onChange={() => toggleOne(id, selection)} />
                    </td>
                  ) : null}
                  {columns.map((column) => (
                    <td key={column.key} className={cn('px-4 py-3 align-middle', column.className)}>{column.render(row)}</td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error ? <EmptyState title="This list could not be loaded">{error.message}</EmptyState> : null}
      {data && rows.length === 0 ? <EmptyState title={state.q || Object.values(state.filters).some(Boolean) ? 'Nothing matches these filters' : empty.title}>{empty.hint}</EmptyState> : null}
      {data && data.total > 0 ? <Pagination page={data} onState={onState} /> : null}
    </div>
  );
}
