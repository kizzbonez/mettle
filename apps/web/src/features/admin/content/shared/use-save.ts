'use client';

import { useCallback, useState } from 'react';
import { useToast } from '@/design/primitives/toast';
import { ApiError, errorMessage, fieldErrors } from '@/lib/api';

/**
 * Runs a write, says how it went in a toast, and keeps the error for the form
 * to show beside its fields. `run` resolves to the response, or to null when
 * the request failed.
 */
export function useSave() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const run = useCallback(
    async <T>(work: () => Promise<T>, success: string | ((result: T) => string)): Promise<T | null> => {
      setBusy(true);
      setError(null);
      try {
        const result = await work();
        toast.success(typeof success === 'string' ? success : success(result));
        setBusy(false);
        return result;
      } catch (cause) {
        setError(cause);
        toast.error(errorMessage(cause));
        setBusy(false);
        return null;
      }
    },
    [toast],
  );

  const clear = useCallback(() => setError(null), []);
  return { busy, error, fields: fieldErrors(error), run, clear };
}

/** The error for a list field: its own, or that of the first entry in it (`outcomes.3`). */
export function listError(fields: Record<string, string>, name: string): string | undefined {
  if (fields[name]) return fields[name];
  const nested = Object.keys(fields).find((key) => key.startsWith(`${name}.`));
  return nested ? fields[nested] : undefined;
}

/** A duplicate slug comes back as a conflict rather than a field error; this puts it on the slug field. */
export function slugError(error: unknown): string | undefined {
  const fields = fieldErrors(error);
  if (fields.slug) return fields.slug;
  return error instanceof ApiError && error.code === 'already_exists' ? error.message : undefined;
}
