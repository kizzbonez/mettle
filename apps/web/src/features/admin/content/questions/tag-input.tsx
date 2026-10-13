'use client';

import { X } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';

interface TagInputProps {
  label: string;
  value: string[];
  onChange: (tags: string[]) => void;
  error?: string;
  max?: number;
}

/** Tags as removable chips. Enter or a comma adds what was typed; Backspace in an empty box removes the last. */
export function TagInput({ label, value, onChange, error, max = 12 }: TagInputProps) {
  const id = useId();
  const [text, setText] = useState('');

  const add = () => {
    const typed = text.split(',').map((tag) => tag.trim()).filter(Boolean);
    if (typed.length > 0) onChange([...new Set([...value, ...typed])].slice(0, max));
    setText('');
  };
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((event.key === 'Enter' || event.key === ',') && text.trim() !== '') {
      event.preventDefault();
      add();
    } else if (event.key === ',') {
      event.preventDefault();
    } else if (event.key === 'Backspace' && text === '') {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="label-spec text-ink-2">{label}</label>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-plate border border-rule bg-white px-2 py-1.5 hover:border-steel-2 focus-within:border-ink focus-within:ring-3 focus-within:ring-ember/30">
        {value.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 rounded-[2px] border border-rule bg-rule-soft py-px pr-0.5 pl-1.5 font-mono text-xs text-ink-2">
            {tag}
            <button type="button" onClick={() => onChange(value.filter((item) => item !== tag))} aria-label={`Remove tag ${tag}`} className="grid size-4 place-items-center text-steel hover:text-ink">
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input id={id} value={text} onChange={(event) => setText(event.target.value)} onKeyDown={onKeyDown} onBlur={add} maxLength={40} disabled={value.length >= max}
          aria-invalid={error ? true : undefined} placeholder={value.length === 0 ? 'ownership, lifetimes' : ''}
          className="h-7 min-w-24 flex-1 bg-transparent px-1 text-[15px] text-ink placeholder:text-steel-2 focus:outline-none" />
      </div>
      {error ? (
        <p role="alert" className="text-[13px] font-medium text-crimson">{error}</p>
      ) : (
        <p className="text-[13px] text-steel">Press Enter or a comma after each. {value.length} of {max} used.</p>
      )}
    </div>
  );
}
