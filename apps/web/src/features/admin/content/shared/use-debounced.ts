'use client';

import { useEffect, useState } from 'react';

/** The value, once it has stopped changing for `delayMs`. Keeps typing from sending a request per keystroke. */
export function useDebounced<T>(value: T, delayMs = 300): T {
  const [settled, setSettled] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setSettled(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return settled;
}
