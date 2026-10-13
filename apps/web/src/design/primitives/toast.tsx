'use client';

import { CircleAlert, CircleCheck } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ToastTone = 'success' | 'error';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);
const LIFETIME_MS = 4500;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const push = useCallback((tone: ToastTone, message: string) => {
    const id = nextId.current++;
    setItems((current) => [...current.slice(-3), { id, tone, message }]);
    setTimeout(() => setItems((current) => current.filter((item) => item.id !== id)), LIFETIME_MS);
  }, []);

  const value = useMemo<ToastApi>(
    () => ({ success: (message) => push('success', message), error: (message) => push('error', message) }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex flex-col items-center gap-2 p-4 sm:items-end" aria-live="polite">
        {items.map((item) => (
          <div
            key={item.id}
            role="status"
            className={cn(
              'pointer-events-auto flex max-w-sm animate-rise items-start gap-3 rounded-plate border bg-forge px-4 py-3 text-sm text-forge-text shadow-lift',
              item.tone === 'success' ? 'border-l-4 border-forge-rule border-l-patina' : 'border-l-4 border-forge-rule border-l-crimson',
            )}
          >
            {item.tone === 'success' ? (
              <CircleCheck className="mt-0.5 size-4 shrink-0 text-[#4fc3a1]" />
            ) : (
              <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#f0747c]" />
            )}
            <span>{item.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
