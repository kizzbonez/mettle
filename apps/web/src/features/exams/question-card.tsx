'use client';

import { Check, Flag, X } from 'lucide-react';
import { Markdown } from '@/design/patterns/markdown';
import { cn } from '@/lib/cn';
import type { AttemptOption, AttemptQuestion } from '@/types/assessment';

const HINT = { single: 'Choose one answer', multiple: 'Choose all that apply', true_false: 'True or false' } as const;
const LETTERS = 'ABCDEFGH';

interface OptionProps {
  option: AttemptOption;
  letter: string;
  selected: boolean;
  multiple: boolean;
  /** Present when the paper has been graded. */
  reviewed: boolean;
  onToggle?: () => void;
}

function optionTone({ option, selected, reviewed }: Pick<OptionProps, 'option' | 'selected' | 'reviewed'>): string {
  if (!reviewed) return selected ? 'border-ink bg-white shadow-press' : 'border-rule bg-plate hover:border-steel-2 hover:bg-white';
  if (option.isCorrect) return 'border-patina bg-patina-soft';
  return selected ? 'border-crimson bg-crimson-soft' : 'border-rule bg-plate opacity-70';
}

function Option(props: OptionProps) {
  const { option, letter, selected, multiple, reviewed, onToggle } = props;
  const marker = reviewed && option.isCorrect ? <Check className="size-4" strokeWidth={3} /> : reviewed && selected ? <X className="size-4" strokeWidth={3} /> : letter;
  return (
    <button
      type="button"
      role={multiple ? 'checkbox' : 'radio'}
      aria-checked={selected}
      disabled={reviewed}
      onClick={onToggle}
      className={cn('flex w-full items-start gap-4 rounded-plate border px-4 py-3.5 text-left transition-[border-color,background-color,box-shadow] disabled:cursor-default', optionTone(props))}
    >
      <span
        className={cn(
          'display grid size-8 shrink-0 place-items-center border text-base',
          multiple ? 'rounded-[2px]' : 'rounded-full',
          reviewed && option.isCorrect && 'border-patina bg-patina text-white',
          reviewed && !option.isCorrect && selected && 'border-crimson bg-crimson text-white',
          !reviewed && selected && 'border-ink bg-ink text-white',
          !selected && !(reviewed && option.isCorrect) && 'border-steel-2 text-steel',
        )}
      >
        {marker}
      </span>
      <span className="min-w-0 flex-1 pt-1">
        <Markdown compact>{option.bodyMd}</Markdown>
        {reviewed && selected ? <span className="label-spec text-steel">Your answer</span> : null}
      </span>
    </button>
  );
}

interface QuestionCardProps {
  question: AttemptQuestion;
  number: number;
  total: number;
  onSelect?: (optionIds: string[]) => void;
  onFlag?: () => void;
}

/** One question. Without `onSelect` it is read-only: the graded review. */
export function QuestionCard({ question, number, total, onSelect, onFlag }: QuestionCardProps) {
  const multiple = question.type === 'multiple';
  const reviewed = onSelect === undefined;

  function toggle(id: string) {
    if (!onSelect) return;
    const chosen = question.selectedOptionIds;
    if (multiple) onSelect(chosen.includes(id) ? chosen.filter((item) => item !== id) : [...chosen, id]);
    else onSelect(chosen.includes(id) ? [] : [id]);
  }

  return (
    <section aria-label={`Question ${number} of ${total}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="label-spec text-steel">
          Question {number} of {total} · <span className="text-ember-deep">{HINT[question.type]}</span>
        </p>
        {onFlag ? (
          <button type="button" onClick={onFlag} aria-pressed={question.flagged}
            className={cn('label-spec flex items-center gap-1.5 border px-2 py-1 transition-colors', question.flagged ? 'border-brass bg-brass-soft text-brass' : 'border-rule text-steel hover:border-steel-2')}>
            <Flag className="size-3.5" fill={question.flagged ? 'currentColor' : 'none'} /> {question.flagged ? 'Flagged' : 'Flag for review'}
          </button>
        ) : null}
      </div>
      <div className="text-ink"><Markdown compact>{question.promptMd}</Markdown></div>
      <div className="mt-6 space-y-2.5" role={multiple ? 'group' : 'radiogroup'}>
        {question.options.map((option, index) => (
          <Option key={option.id} option={option} letter={LETTERS[index] ?? '?'} selected={question.selectedOptionIds.includes(option.id)}
            multiple={multiple} reviewed={reviewed} onToggle={() => toggle(option.id)} />
        ))}
      </div>
      {reviewed && question.explanationMd ? (
        <div className="mt-5 border-l-4 border-ink bg-white px-5 py-4">
          <p className="label-spec mb-2 text-steel">Why</p>
          <Markdown compact>{question.explanationMd}</Markdown>
        </div>
      ) : null}
    </section>
  );
}
