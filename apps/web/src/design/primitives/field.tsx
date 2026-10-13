'use client';

import { Eye, EyeOff } from 'lucide-react';
import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

const control =
  'rounded-plate border border-rule bg-white px-3 text-[15px] text-ink placeholder:text-steel-2 ' +
  'transition-[border-color,box-shadow] hover:border-steel-2 ' +
  'focus:border-ink focus:outline-none focus:ring-3 focus:ring-ember/30 ' +
  'disabled:bg-rule-soft disabled:text-steel aria-invalid:border-crimson aria-invalid:ring-crimson/20';

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Label above, control, then an error or a hint below. */
function FieldShell({ id, label, error, hint, children, className }: FieldShellProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="label-spec text-ink-2">
        {label}
      </label>
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] font-medium text-crimson">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-steel">{hint}</p>
      ) : null}
    </div>
  );
}

interface CommonProps {
  label: string;
  error?: string;
  hint?: ReactNode;
  wrapperClassName?: string;
}

type InputProps = CommonProps & InputHTMLAttributes<HTMLInputElement>;

export function TextField({ label, error, hint, wrapperClassName, className, id, ...rest }: InputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} className={wrapperClassName}>
      <input
        id={fieldId}
        className={cn(control, 'h-11 w-full', className)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

export function PasswordField({ label, error, hint, wrapperClassName, className, id, ...rest }: InputProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  const [visible, setVisible] = useState(false);
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} className={wrapperClassName}>
      <div className="relative">
        <input
          id={fieldId}
          type={visible ? 'text' : 'password'}
          className={cn(control, 'h-11 w-full pr-11', className)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 grid w-11 place-items-center text-steel hover:text-ink"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOff className="size-4.5" /> : <Eye className="size-4.5" />}
        </button>
      </div>
    </FieldShell>
  );
}

type TextAreaProps = CommonProps & TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextAreaField({ label, error, hint, wrapperClassName, className, id, ...rest }: TextAreaProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} className={wrapperClassName}>
      <textarea
        id={fieldId}
        className={cn(control, 'min-h-28 w-full py-2.5 leading-relaxed', className)}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
    </FieldShell>
  );
}

type SelectProps = CommonProps & SelectHTMLAttributes<HTMLSelectElement>;

export function SelectField({ label, error, hint, wrapperClassName, className, id, children, ...rest }: SelectProps) {
  const auto = useId();
  const fieldId = id ?? auto;
  return (
    <FieldShell id={fieldId} label={label} error={error} hint={hint} className={wrapperClassName}>
      <select id={fieldId} className={cn(control, 'h-11 w-full pr-8', className)} aria-invalid={error ? true : undefined} {...rest}>
        {children}
      </select>
    </FieldShell>
  );
}

/** A bare, compact select for toolbars, where the label is visually hidden. */
export function InlineSelect({ label, className, children, ...rest }: { label: string } & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select aria-label={label} className={cn(control, 'h-9 pr-8 text-sm', className)} {...rest}>
      {children}
    </select>
  );
}

export function Checkbox({ label, className, ...rest }: { label: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn('flex cursor-pointer items-start gap-2.5 text-sm text-ink-2', className)}>
      <input type="checkbox" className="mt-0.5 size-4 shrink-0 accent-ember" {...rest} />
      <span>{label}</span>
    </label>
  );
}
