'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

export interface ListState {
  page: number;
  pageSize: number;
  sort: string;
  order: 'asc' | 'desc';
  q: string;
  /** Any other filter, by name. An empty string means "not filtered". */
  filters: Record<string, string>;
}

export interface ListDefaults {
  sort: string;
  order?: 'asc' | 'desc';
  pageSize?: number;
  /** Names of the filters this table has. */
  filters?: string[];
}

const RESERVED = ['page', 'pageSize', 'sort', 'order', 'q'];

/** The query string the API expects for this state. */
export function toQuery(state: ListState): string {
  const params = new URLSearchParams({
    page: String(state.page),
    pageSize: String(state.pageSize),
    sort: state.sort,
    order: state.order,
  });
  if (state.q) params.set('q', state.q);
  for (const [name, value] of Object.entries(state.filters)) if (value) params.set(name, value);
  return params.toString();
}

export function readState(params: URLSearchParams, defaults: ListDefaults): ListState {
  const number = (name: string, fallback: number) => {
    const value = Number.parseInt(params.get(name) ?? '', 10);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  const filters: Record<string, string> = {};
  for (const name of defaults.filters ?? []) filters[name] = params.get(name) ?? '';
  return {
    page: number('page', 1),
    pageSize: Math.min(100, number('pageSize', defaults.pageSize ?? 20)),
    sort: params.get('sort') ?? defaults.sort,
    order: params.get('order') === 'asc' ? 'asc' : params.get('order') === 'desc' ? 'desc' : (defaults.order ?? 'desc'),
    q: params.get('q') ?? '',
    filters,
  };
}

/** Applies a change. Anything other than paging goes back to the first page. */
export function applyPatch(state: ListState, patch: Partial<ListState>): ListState {
  const next = { ...state, ...patch, filters: { ...state.filters, ...patch.filters } };
  const pagingOnly = Object.keys(patch).every((key) => key === 'page');
  return pagingOnly ? next : { ...next, page: patch.page ?? 1 };
}

/**
 * Table state kept in the URL, so a sorted, filtered page can be reloaded,
 * bookmarked or sent to a colleague and show the same rows.
 */
export function useListState(defaults: ListDefaults): [ListState, (patch: Partial<ListState>) => void] {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const key = params.toString();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `defaults` is a literal at every call site
  const state = useMemo(() => readState(new URLSearchParams(key), defaults), [key]);

  const update = useCallback(
    (patch: Partial<ListState>) => {
      const next = applyPatch(state, patch);
      const url = new URLSearchParams(key);
      for (const name of [...RESERVED, ...Object.keys(next.filters)]) url.delete(name);
      for (const [name, value] of new URLSearchParams(toQuery(next))) url.set(name, value);
      router.replace(`${pathname}?${url.toString()}`, { scroll: false });
    },
    [key, pathname, router, state],
  );

  return [state, update];
}
