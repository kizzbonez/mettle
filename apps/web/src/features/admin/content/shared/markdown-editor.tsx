'use client';

import { useDeferredValue, type ReactNode } from 'react';
import { Markdown } from '@/design/patterns/markdown';
import { TextAreaField } from '@/design/primitives/field';
import { cn } from '@/lib/cn';

const heights = { sm: 'h-36', md: 'h-64', lg: 'h-[36rem]' } as const;

interface MarkdownEditorProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  size?: keyof typeof heights;
  /** Tighter preview type, for short text such as questions. */
  compact?: boolean;
}

/** A Markdown source box with the rendered result beside it, or below it on a narrow screen. */
export function MarkdownEditor({ label, value, onChange, error, hint, size = 'md', compact }: MarkdownEditorProps) {
  // On a long document the preview may trail a keystroke behind, so typing is never held up.
  const shown = useDeferredValue(value);
  return (
    <div className="grid gap-x-4 gap-y-3 lg:grid-cols-2">
      <TextAreaField label={label} value={value} onChange={(event) => onChange(event.target.value)} error={error} hint={hint}
        className={cn('resize-none font-mono text-[13px]!', heights[size])} />
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="label-spec text-steel">Preview</p>
        <div tabIndex={0} role="region" aria-label={`${label} preview`}
          className={cn('overflow-y-auto rounded-plate border border-rule bg-white px-4 py-3', heights[size])}>
          {shown.trim() ? <Markdown compact={compact}>{shown}</Markdown> : <p className="text-sm text-steel-2">Nothing to preview yet.</p>}
        </div>
      </div>
    </div>
  );
}
