'use client';

import { useState } from 'react';
import { ChartTooltip, Gridlines, useElementWidth } from './chart-frame';
import { axisTicks, plotBox, shortDay, valueY } from './scale';

interface ColumnChartProps {
  /** ISO days, one per value. */
  days: string[];
  values: number[];
  /** What one unit is called, for the tooltip. */
  unit: string;
  height?: number;
  label: string;
}

const MARGIN = { top: 12, right: 8, bottom: 26, left: 32 };
const MAX_BAR = 24;
const GAP = 2;
const RADIUS = 3;

/** A bar with a rounded top and a square foot on the baseline. */
function barPath(x: number, y: number, width: number, bottom: number): string {
  const radius = Math.min(RADIUS, width / 2, Math.max(0, bottom - y));
  return `M${x},${bottom} V${y + radius} Q${x},${y} ${x + radius},${y} H${x + width - radius} Q${x + width},${y} ${x + width},${y + radius} V${bottom} Z`;
}

/** One series of daily counts as columns. A single series needs no legend: the title names it. */
export function ColumnChart({ days, values, unit, height = 200, label }: ColumnChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const box = plotBox(width, height, MARGIN);
  const ticks = axisTicks(Math.max(0, ...values), 2);
  const max = ticks.at(-1) ?? 1;
  const slot = box.width / Math.max(1, values.length);
  const bar = Math.max(1, Math.min(MAX_BAR, slot - GAP));
  const center = (index: number) => box.left + slot * index + slot / 2;
  const dayLabels = [0, Math.floor((days.length - 1) / 2), days.length - 1];

  return (
    <div ref={ref} className="relative" style={{ height }}>
      {width > 0 ? (
        <svg width={width} height={height} role="img" aria-label={label}>
          <Gridlines box={box} ticks={ticks} max={max} y={(value, top) => valueY(box, value, top)} />
          {values.map((value, index) => (
            <g key={days[index]} onPointerEnter={() => setHover(index)} onPointerLeave={() => setHover(null)}>
              {/* The hit target is the whole slot, so thin and empty columns can still be hovered. */}
              <rect x={box.left + slot * index} y={box.top} width={slot} height={box.height} fill="transparent" />
              {value > 0 ? (
                <path d={barPath(center(index) - bar / 2, valueY(box, value, max), bar, box.bottom)} fill="var(--color-chart-1)" opacity={hover === null || hover === index ? 1 : 0.45} />
              ) : null}
            </g>
          ))}
          <line x1={box.left} x2={box.right} y1={box.bottom} y2={box.bottom} stroke="var(--color-rule)" strokeWidth={1} />
          {dayLabels.map((index, position) => (
            <text key={index} x={position === 0 ? box.left : position === 2 ? box.right : center(index)} y={height - 6}
              textAnchor={position === 0 ? 'start' : position === 2 ? 'end' : 'middle'} className="fill-steel-2 font-mono text-[10px]">
              {shortDay(days[index] ?? '')}
            </text>
          ))}
        </svg>
      ) : null}
      {hover !== null ? (
        <ChartTooltip x={center(hover)} y={valueY(box, values[hover] ?? 0, max)} width={width} title={shortDay(days[hover] ?? '')}
          rows={[{ label: unit, value: (values[hover] ?? 0).toLocaleString() }]} />
      ) : null}
    </div>
  );
}
