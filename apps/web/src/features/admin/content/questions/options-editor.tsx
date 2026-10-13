'use client';

import type { QuestionType } from '@mettle/shared';
import { ArrowDown, ArrowUp, Plus, X } from 'lucide-react';
import { useId } from 'react';
import { Button } from '@/design/primitives/button';
import { cn } from '@/lib/cn';
import { BareTextArea, RowError } from '../shared/bare-field';
import { IconButton } from '../shared/icon-button';
import { move, patchAt, removeAt } from '../shared/lists';
import { markCorrect, MAX_OPTIONS, MIN_OPTIONS, newOption, type OptionDraft, type QuestionForm } from './question-model';

const LETTERS = 'ABCDEFGH';

const RULE: Record<QuestionType, string> = {
  single: 'Mark the one correct answer.',
  multiple: 'Mark every correct answer. There must be at least two.',
  true_false: 'A true/false question has exactly two options. Mark the correct one.',
};

interface OptionRowProps {
  option: OptionDraft;
  index: number;
  count: number;
  /** Several options may be correct, so the mark is a checkbox rather than a radio button. */
  multiple: boolean;
  group: string;
  error?: string;
  onText: (bodyMd: string) => void;
  onMark: () => void;
  onMove: (by: -1 | 1) => void;
  onRemove: () => void;
}

function OptionRow({ option, index, count, multiple, group, error, onText, onMark, onMove, onRemove }: OptionRowProps) {
  const letter = LETTERS[index] ?? '?';
  return (
    <li className={cn('space-y-1.5 rounded-plate border p-2.5', option.isCorrect ? 'border-patina/50 bg-patina-soft/60' : 'border-rule bg-white/50')}>
      <div className="flex flex-wrap items-start gap-x-3 gap-y-2 sm:flex-nowrap">
        <span className="display mt-1 grid size-8 shrink-0 place-items-center border border-steel-2 bg-white text-base text-steel" aria-hidden>{letter}</span>
        <BareTextArea label={`Option ${letter}`} rows={1} value={option.bodyMd} onChange={(event) => onText(event.target.value)} invalid={Boolean(error)}
          maxLength={2000} placeholder="Markdown is allowed" className="min-h-10 min-w-0 flex-1 [field-sizing:content]" />
        <label className="label-spec mt-3 flex shrink-0 cursor-pointer items-center gap-1.5 text-ink-2">
          <input type={multiple ? 'checkbox' : 'radio'} name={group} checked={option.isCorrect} onChange={onMark} className="size-4 accent-ember" aria-label={`Option ${letter} is correct`} />
          Correct
        </label>
        <div className="mt-1 flex shrink-0">
          <IconButton label={`Move option ${letter} up`} disabled={index === 0} onClick={() => onMove(-1)}><ArrowUp className="size-4" /></IconButton>
          <IconButton label={`Move option ${letter} down`} disabled={index === count - 1} onClick={() => onMove(1)}><ArrowDown className="size-4" /></IconButton>
          <IconButton label={`Remove option ${letter}`} disabled={count <= MIN_OPTIONS} onClick={onRemove}><X className="size-4" /></IconButton>
        </div>
      </div>
      <RowError>{error}</RowError>
    </li>
  );
}

interface OptionsEditorProps {
  form: QuestionForm;
  onChange: (options: OptionDraft[]) => void;
  /** The API's field errors: `options` for the set, `options.2.bodyMd` for one of them. */
  fields: Record<string, string>;
}

/** The answer options: their text, their order, and which are correct for this type of question. */
export function OptionsEditor({ form, onChange, fields }: OptionsEditorProps) {
  const group = useId();
  const { options, type } = form;
  const limit = type === 'true_false' ? MIN_OPTIONS : MAX_OPTIONS;
  return (
    <fieldset>
      <legend className="label-spec text-ink-2">Options</legend>
      <p className="mt-1 text-[13px] text-steel">{RULE[type]}</p>
      <ol className="mt-2.5 space-y-2">
        {options.map((option, index) => (
          <OptionRow key={option.key} option={option} index={index} count={options.length} multiple={type === 'multiple'} group={group}
            error={fields[`options.${index}.bodyMd`]}
            onText={(bodyMd) => onChange(patchAt(options, index, { bodyMd }))}
            onMark={() => onChange(markCorrect(form, option.key))}
            onMove={(by) => onChange(move(options, index, by))}
            onRemove={() => onChange(removeAt(options, index))} />
        ))}
      </ol>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <Button size="sm" variant="secondary" disabled={options.length >= limit} onClick={() => onChange([...options, newOption()])} icon={<Plus className="size-4" />}>Add option</Button>
        <span className="text-[13px] text-steel tabular-nums">{options.length} of {limit}</span>
        <RowError>{fields.options}</RowError>
      </div>
    </fieldset>
  );
}
