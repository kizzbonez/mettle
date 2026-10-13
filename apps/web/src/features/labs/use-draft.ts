'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

const SAVE_DELAY_MS = 1200;

export type DraftStatus = 'saved' | 'unsaved' | 'saving' | 'error';

/**
 * The learner's code, saved to the server a moment after they stop typing so
 * that closing the tab loses nothing. `flush` saves at once, for Run and Submit.
 */
export function useDraft(labId: string, initial: string) {
  const [code, setCode] = useState(initial);
  const [status, setStatus] = useState<DraftStatus>('saved');
  const latest = useRef(initial);
  const stored = useRef(initial);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    const value = latest.current;
    if (value === stored.current) return;
    setStatus('saving');
    try {
      await api.put(`/labs/${labId}/draft`, { code: value });
      stored.current = value;
      setStatus(latest.current === value ? 'saved' : 'unsaved');
    } catch {
      setStatus('error');
    }
  }, [labId]);

  const update = useCallback(
    (value: string) => {
      latest.current = value;
      setCode(value);
      setStatus('unsaved');
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void flush(), SAVE_DELAY_MS);
    },
    [flush],
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  return { code, status, update, flush };
}
