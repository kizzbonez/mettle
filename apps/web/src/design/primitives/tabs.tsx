'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<K extends string> {
  key: K;
  label: ReactNode;
  count?: number;
}

interface TabsProps<K extends string> {
  items: TabItem<K>[];
  value: K;
  onChange: (key: K) => void;
  /** For dark surfaces such as the lab workspace. */
  forge?: boolean;
  className?: string;
}

/** Underlined tabs. The active tab carries an ember rule, like a marked gauge. */
export function Tabs<K extends string>({ items, value, onChange, forge, className }: TabsProps<K>) {
  return (
    <div role="tablist" className={cn('flex gap-1 overflow-x-auto border-b', forge ? 'border-forge-rule' : 'border-rule', className)}>
      {items.map((item) => {
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.key)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-3.5 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors',
              active && 'border-ember',
              !active && 'border-transparent',
              forge
                ? active ? 'text-white' : 'text-forge-muted hover:text-forge-text'
                : active ? 'text-ink' : 'text-steel hover:text-ink',
            )}
          >
            {item.label}
            {item.count !== undefined ? (
              <span className={cn('label-spec rounded-[2px] px-1', forge ? 'bg-forge-3 text-forge-muted' : 'bg-rule-soft text-steel')}>
                {item.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
