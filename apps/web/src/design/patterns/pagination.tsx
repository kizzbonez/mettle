'use client';

import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Page } from '@/types/account';
import { InlineSelect } from '../primitives/field';
import type { ListState } from './use-list-state';

const PAGE_SIZES = [10, 20, 50, 100];

/** Page numbers to show: always the first and last, and a window around the current one. */
export function pageWindow(current: number, count: number): (number | 'gap')[] {
  const wanted = new Set([1, count, current - 1, current, current + 1].filter((n) => n >= 1 && n <= count));
  const sorted = [...wanted].sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  for (const [index, page] of sorted.entries()) {
    const previous = sorted[index - 1];
    if (previous !== undefined && page - previous > 1) result.push('gap');
    result.push(page);
  }
  return result;
}

interface PaginationProps {
  page: Page<unknown>;
  onState: (patch: Partial<ListState>) => void;
}

export function Pagination({ page, onState }: PaginationProps) {
  const first = (page.page - 1) * page.pageSize + 1;
  const last = Math.min(page.total, page.page * page.pageSize);
  const step = 'grid size-8 place-items-center border border-rule bg-white text-ink hover:border-ink disabled:pointer-events-none disabled:opacity-40';
  return (
    <div className="flex flex-col gap-3 border-t border-rule px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3 text-[13px] text-steel">
        <span className="tabular-nums">{first.toLocaleString()}–{last.toLocaleString()} of {page.total.toLocaleString()}</span>
        <InlineSelect label="Rows per page" value={page.pageSize} onChange={(event) => onState({ pageSize: Number(event.target.value), page: 1 })} className="h-8 text-[13px]">
          {PAGE_SIZES.map((size) => <option key={size} value={size}>{size} per page</option>)}
        </InlineSelect>
      </div>
      <nav className="flex items-center gap-1" aria-label="Pages">
        <button type="button" className={step} disabled={page.page <= 1} onClick={() => onState({ page: page.page - 1 })} aria-label="Previous page">
          <ChevronLeft className="size-4" />
        </button>
        {pageWindow(page.page, page.pageCount).map((item, index) =>
          item === 'gap' ? (
            <span key={`gap-${index}`} className="px-1 text-steel-2">…</span>
          ) : (
            <button key={item} type="button" onClick={() => onState({ page: item })} aria-current={item === page.page ? 'page' : undefined}
              className={cn('display grid size-8 place-items-center border text-base tabular-nums', item === page.page ? 'border-ink bg-ink text-white' : 'border-rule bg-white hover:border-ink')}>
              {item}
            </button>
          ),
        )}
        <button type="button" className={step} disabled={page.page >= page.pageCount} onClick={() => onState({ page: page.page + 1 })} aria-label="Next page">
          <ChevronRight className="size-4" />
        </button>
      </nav>
    </div>
  );
}

interface TableToolbarProps {
  state: ListState;
  onState: (patch: Partial<ListState>) => void;
  searchPlaceholder: string;
  /** Filter controls, to the right of the search box. */
  filters?: ReactNode;
  /** Replaces the filters while rows are selected. */
  bulk?: ReactNode;
}

const SEARCH_DELAY_MS = 300;

/** Search (debounced), filters, and the actions for selected rows. */
export function TableToolbar({ state, onState, searchPlaceholder, filters, bulk }: TableToolbarProps) {
  const [text, setText] = useState(state.q);

  useEffect(() => setText(state.q), [state.q]);
  useEffect(() => {
    if (text === state.q) return;
    const timer = setTimeout(() => onState({ q: text }), SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [onState, state.q, text]);

  const filtered = state.q !== '' || Object.values(state.filters).some(Boolean);
  const cleared = Object.fromEntries(Object.keys(state.filters).map((name) => [name, '']));
  return (
    <div className="flex flex-col gap-3 border-b border-rule px-4 py-3 lg:flex-row lg:items-center">
      <div className="relative lg:w-72">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-steel-2" />
        <input type="search" value={text} onChange={(event) => setText(event.target.value)} placeholder={searchPlaceholder} aria-label={searchPlaceholder}
          className="h-9 w-full rounded-plate border border-rule bg-white pr-3 pl-9 text-sm placeholder:text-steel-2 focus:border-ink focus:ring-3 focus:ring-ember/30 focus:outline-none" />
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-2">
        {bulk ?? filters}
        {!bulk && filtered ? (
          <button type="button" onClick={() => { setText(''); onState({ q: '', filters: cleared }); }} className="label-spec flex items-center gap-1 px-2 py-1 text-steel hover:text-ink">
            <X className="size-3.5" /> Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
