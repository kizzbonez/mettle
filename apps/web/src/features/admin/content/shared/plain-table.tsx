import type { Column } from '@/design/patterns/data-table';
import { cn } from '@/lib/cn';

interface PlainTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  label: string;
  onRowClick?: (row: T) => void;
}

/**
 * A table for a list the API returns whole (exams, labs): the look of the
 * server-driven DataTable, without its paging and sorting, which these
 * endpoints do not offer.
 */
export function PlainTable<T>({ columns, rows, rowKey, label, onRowClick }: PlainTableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-sm" aria-label={label}>
        <thead>
          <tr className="border-b border-rule bg-rule-soft/60 text-left">
            {columns.map((column) => (
              <th key={column.key} scope="col" className={cn('label-spec px-4 py-2.5 font-medium whitespace-nowrap text-steel', column.className)}>{column.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rule-soft">
          {rows.map((row) => (
            <tr key={rowKey(row)} onClick={onRowClick ? () => onRowClick(row) : undefined} className={cn('transition-colors hover:bg-white', onRowClick && 'cursor-pointer')}>
              {columns.map((column) => <td key={column.key} className={cn('px-4 py-3 align-middle', column.className)}>{column.render(row)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
