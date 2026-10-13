'use client';

import { X } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
}

const widths = { md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' } as const;

/** A native dialog: focus is trapped and Escape closes it without extra code. */
export function Modal({ open, onClose, title, description, children, footer, size = 'md' }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === ref.current) onClose();
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-plate border border-ink bg-plate p-0 text-ink shadow-lift',
        'backdrop:bg-forge/60 backdrop:backdrop-blur-[2px] open:animate-rise',
        widths[size],
      )}
    >
      <div className="flex items-start justify-between gap-4 border-b border-rule px-6 py-4">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="mt-1 text-sm text-steel">{description}</p> : null}
        </div>
        <button type="button" onClick={onClose} className="-mr-2 grid size-8 place-items-center text-steel hover:text-ink" aria-label="Close">
          <X className="size-5" />
        </button>
      </div>
      <div className="max-h-[70dvh] overflow-y-auto px-6 py-5">{children}</div>
      {footer ? <div className="flex justify-end gap-3 border-t border-rule bg-rule-soft/50 px-6 py-4">{footer}</div> : null}
    </dialog>
  );
}
