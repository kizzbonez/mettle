'use client';

import { useCallback, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical';
  /** Size of the first pane, in percent. */
  initial: number;
  min?: number;
  max?: number;
  first: ReactNode;
  second: ReactNode;
  className?: string;
}

/**
 * Two panes with a draggable divider. On narrow screens a horizontal split
 * stacks instead, because side-by-side code and prose do not fit a phone.
 */
export function SplitPane({ direction, initial, min = 20, max = 80, first, second, className }: SplitPaneProps) {
  const container = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(initial);
  const [dragging, setDragging] = useState(false);
  const horizontal = direction === 'horizontal';

  const move = useCallback(
    (event: PointerEvent) => {
      const box = container.current?.getBoundingClientRect();
      if (!box) return;
      const ratio = horizontal ? (event.clientX - box.left) / box.width : (event.clientY - box.top) / box.height;
      setSize(Math.min(max, Math.max(min, ratio * 100)));
    },
    [horizontal, max, min],
  );

  return (
    <div
      ref={container}
      className={cn('flex min-h-0 min-w-0', horizontal ? 'flex-col lg:flex-row' : 'flex-col', dragging && 'select-none', className)}
      style={{ ['--split' as string]: `${size}%` }}
    >
      <div className={cn('min-h-0 min-w-0 overflow-hidden', horizontal ? 'h-[45dvh] lg:h-auto lg:w-[var(--split)]' : 'h-[var(--split)]')}>{first}</div>
      <div
        role="separator"
        aria-orientation={horizontal ? 'vertical' : 'horizontal'}
        aria-label="Resize panes"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => dragging && move(event)}
        onPointerUp={() => setDragging(false)}
        onDoubleClick={() => setSize(initial)}
        className={cn(
          'group relative shrink-0 bg-forge-rule transition-colors hover:bg-ember',
          dragging && 'bg-ember',
          horizontal ? 'hidden w-px cursor-col-resize lg:block' : 'h-px cursor-row-resize',
        )}
      >
        {/* A wider invisible strip, so the 1px line is easy to grab. */}
        <span className={cn('absolute', horizontal ? 'inset-y-0 -left-1.5 w-3' : 'inset-x-0 -top-1.5 h-3')} />
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{second}</div>
    </div>
  );
}
