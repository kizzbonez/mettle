import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

/**
 * Controls for rows of a list (answer options, exam rules, fixtures, tests),
 * where a caption above every control would be noise. They look like the field
 * primitives, which always draw a visible label, and take their name from
 * `label` instead, read by screen readers.
 */
const control =
  'w-full rounded-plate border border-rule bg-white px-3 text-[15px] text-ink placeholder:text-steel-2 ' +
  'transition-[border-color,box-shadow] hover:border-steel-2 ' +
  'focus:border-ink focus:outline-none focus:ring-3 focus:ring-ember/30 ' +
  'disabled:bg-rule-soft disabled:text-steel aria-invalid:border-crimson aria-invalid:ring-crimson/20';

interface Named {
  label: string;
  invalid?: boolean;
}

export function BareInput({ label, invalid, className, ...rest }: Named & InputHTMLAttributes<HTMLInputElement>) {
  return <input aria-label={label} aria-invalid={invalid || undefined} className={cn(control, 'h-10', className)} {...rest} />;
}

export function BareTextArea({ label, invalid, className, ...rest }: Named & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea aria-label={label} aria-invalid={invalid || undefined} className={cn(control, 'py-2 leading-relaxed', className)} {...rest} />;
}

export function BareSelect({ label, invalid, className, children, ...rest }: Named & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select aria-label={label} aria-invalid={invalid || undefined} className={cn(control, 'h-10 pr-8', className)} {...rest}>
      {children}
    </select>
  );
}

/** The message under a row whose field the API refused. */
export function RowError({ children }: { children?: string }) {
  return children ? <p role="alert" className="text-[13px] font-medium text-crimson">{children}</p> : null;
}
