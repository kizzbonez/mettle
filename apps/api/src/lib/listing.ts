import { asc, desc, type AnyColumn, type SQL } from 'drizzle-orm';
import { z } from 'zod';

/** Query string every paginated table endpoint accepts. */
export const listQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().max(40).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  q: z.string().trim().max(100).optional(),
});

export type ListQuery = z.infer<typeof listQuery>;

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export function toPage<T>(items: T[], total: number, query: ListQuery): Page<T> {
  return {
    items,
    total,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}

export const offsetOf = (query: ListQuery) => (query.page - 1) * query.pageSize;

/**
 * Sorting is restricted to an allow-list of columns: the `sort` parameter picks
 * a key from `sortable` and can never name an arbitrary column.
 */
export function orderOf(
  sortable: Record<string, AnyColumn | SQL>,
  query: ListQuery,
  fallback: string,
): SQL {
  const column = sortable[query.sort ?? fallback] ?? sortable[fallback];
  if (!column) throw new Error(`Unknown fallback sort column: ${fallback}`);
  return query.order === 'asc' ? asc(column) : desc(column);
}

/** Escapes LIKE wildcards in user input and wraps it for a contains-search. */
export function containsPattern(term: string): string {
  return `%${term.replace(/[\\%_]/g, '\\$&')}%`;
}
