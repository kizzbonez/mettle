'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Box } from './scale';

/** The rendered width of an element, so an SVG can be drawn at real pixel size. */
export function useElementWidth<T extends HTMLElement>(): [React.RefObject<T | null>, number] {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry?.contentRect.width ?? 0)));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return [ref, width];
}

/** Horizontal hairlines with the value each one stands for. Recessive by design. */
export function Gridlines({ box, ticks, max, y }: { box: Box; ticks: number[]; max: number; y: (value: number, max: number) => number }) {
  return (
    <g aria-hidden>
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={box.left} x2={box.right} y1={y(tick, max)} y2={y(tick, max)} stroke="var(--color-chart-grid)" strokeWidth={1} />
          <text x={box.left - 8} y={y(tick, max)} dy="0.32em" textAnchor="end" className="fill-steel-2 font-mono text-[10px] tabular-nums">
            {tick.toLocaleString()}
          </text>
        </g>
      ))}
    </g>
  );
}

export interface TooltipRow {
  label: string;
  value: string;
  /** Color key for the series this row belongs to. */
  color?: string;
}

interface ChartTooltipProps {
  /** Pixel position of the hovered point, relative to the chart. */
  x: number;
  y: number;
  width: number;
  title: string;
  rows: TooltipRow[];
}

/** Floats beside the hovered mark and flips to stay inside the chart. */
export function ChartTooltip({ x, y, width, title, rows }: ChartTooltipProps) {
  const flip = x > width * 0.6;
  return (
    <div
      role="status"
      className="pointer-events-none absolute z-10 min-w-36 border border-ink bg-ink px-3 py-2 text-white shadow-lift"
      style={{ left: x, top: Math.max(0, y - 12), transform: `translate(${flip ? 'calc(-100% - 12px)' : '12px'}, -50%)` }}
    >
      <p className="label-spec text-forge-muted">{title}</p>
      {rows.map((row) => (
        <p key={row.label} className="mt-1 flex items-center justify-between gap-4 text-[13px]">
          <span className="flex items-center gap-1.5">
            {row.color ? <i className="size-2 rounded-full" style={{ background: row.color }} /> : null}
            {row.label}
          </span>
          <span className="font-semibold tabular-nums">{row.value}</span>
        </p>
      ))}
    </div>
  );
}

/** A legend entry: a color key, then the name in ordinary text color. */
export function LegendItem({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 text-[13px] text-ink-2">
      <i className="h-0.5 w-4" style={{ background: color }} aria-hidden />
      {children}
    </span>
  );
}
