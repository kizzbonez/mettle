'use client';

import { useEffect, useRef, useState } from 'react';

/** Seconds from "now" on the server's clock until `expiresAt`. */
export function secondsRemaining(expiresAt: string, clockOffsetMs: number, nowMs = Date.now()): number {
  return Math.max(0, Math.ceil((Date.parse(expiresAt) - (nowMs + clockOffsetMs)) / 1000));
}

/**
 * Counts down to the exam deadline. The deadline belongs to the server, so the
 * countdown is measured against the server's clock (`serverNow` as reported
 * with the paper), not this device's. A wrong system clock cannot buy time.
 */
export function useCountdown(expiresAt: string, serverNow: string, onExpire: () => void): number {
  const offset = useRef(Date.parse(serverNow) - Date.now());
  const expired = useRef(false);
  const callback = useRef(onExpire);
  const [seconds, setSeconds] = useState(() => secondsRemaining(expiresAt, offset.current));

  useEffect(() => {
    callback.current = onExpire;
  }, [onExpire]);

  useEffect(() => {
    const tick = () => {
      const left = secondsRemaining(expiresAt, offset.current);
      setSeconds(left);
      if (left === 0 && !expired.current) {
        expired.current = true;
        callback.current();
      }
    };
    tick();
    const timer = setInterval(tick, 500);
    return () => clearInterval(timer);
  }, [expiresAt]);

  return seconds;
}
