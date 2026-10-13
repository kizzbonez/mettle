'use client';

import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { useApi } from '@/lib/use-api';

/**
 * Reads the thing an editor page is about to change. Each visit to the page
 * asks the server again instead of starting from a cached copy, which could be
 * missing a colleague's edits, and nothing is refetched while the author types.
 */
export function useEditable<T>(path: string | null) {
  const [visit] = useState(() => Date.now().toString(36));
  return useApi<T>(path ? `${path}?visit=${visit}` : null, { revalidateIfStale: false, revalidateOnReconnect: false });
}

export interface FormDraft<F> {
  form: F;
  setForm: Dispatch<SetStateAction<F>>;
  set: (patch: Partial<F>) => void;
  /** The form differs from what is saved. */
  dirty: boolean;
  /** Call as a save is sent, so the reloaded copy can replace exactly what was sent. */
  markSent: () => void;
}

/**
 * The state of an editor form, started from the saved copy. When that copy is
 * reloaded after a save the form takes it (new ids, trimmed text), unless the
 * author has typed something since, which is never thrown away.
 */
export function useFormDraft<F extends object>(saved: F): FormDraft<F> {
  const [form, setForm] = useState(saved);
  const sent = useRef<F | null>(null);

  useEffect(() => {
    // Read now: the updater below runs later, after the marker has been cleared.
    const snapshot = sent.current;
    sent.current = null;
    setForm((current) => (snapshot === null || current === snapshot ? saved : current));
  }, [saved]);

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  return {
    form,
    setForm,
    set: (patch) => setForm((current) => ({ ...current, ...patch })),
    dirty,
    markSent: () => {
      sent.current = form;
    },
  };
}
