import { Notice } from '@/design/patterns/notice';
import { ApiError, errorMessage, fieldErrors } from '@/lib/api';

interface FormErrorProps {
  error: unknown;
  /** Field names the form shows an error beside. `options` also covers `options.2.bodyMd`. */
  placed: string[];
  className?: string;
}

/**
 * The message at the top of a form, for whatever is not already shown beside a
 * field: a lost connection, a conflict, or a field the form has no control for.
 */
export function FormError({ error, placed, className }: FormErrorProps) {
  if (!error) return null;
  const fields = Object.entries(fieldErrors(error));
  const loose = fields.filter(([name]) => !placed.some((key) => name === key || name.startsWith(`${key}.`)));
  const onSlug = error instanceof ApiError && error.code === 'already_exists' && placed.includes('slug');
  if (onSlug || (fields.length > 0 && loose.length === 0)) return null;
  return (
    <Notice tone="error" title={loose.length > 0 ? errorMessage(error) : undefined} className={className}>
      {loose.length > 0 ? (
        <ul className="mt-1 space-y-0.5">
          {loose.map(([name, message]) => (
            <li key={name}><span className="font-mono text-[13px]">{name}</span>: {message}</li>
          ))}
        </ul>
      ) : (
        errorMessage(error)
      )}
    </Notice>
  );
}
