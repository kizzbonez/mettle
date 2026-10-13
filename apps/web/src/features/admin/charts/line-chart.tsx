'use client';

import { useState, type PointerEvent } from 'react';
import { ChartTooltip, Gridlines, LegendItem, useElementWidth } from './chart-frame';
import { axisTicks, nearestIndex, plotBox, pointX, shortDay, valueY, type Box } from './scale';

export interface LineSeries {
  name: string;
  /** A CSS color; identity is also carried by the legend and the tooltip. */
  color: string;
  values: number[];
}

interface LineChartProps {
  /** ISO days, one per value. */
  days: string[];
  series: LineSeries[];
  height?: number;
  label: string;
}

const MARGIN = { top: 12, right: 16, bottom: 26, left: 40 };

function linePath(box: Box, values: number[], max: number): string {
  return values.map((value, i) => `${i === 0 ? 'M' : 'L'}${pointX(box, i, values.length).toFixed(1)},${valueY(box, value, max).toFixed(1)}`).join(' ');
}

function Series({ box, series, max }: { box: Box; series: LineSeries; max: number }) {
  const line = linePath(box, series.values, max);
  const last = series.values.length - 1;
  return (
    <g>
      {/* A wash under the line, never a saturated block. */}
      <path d={`${line} L${box.right},${box.bottom} L${box.left},${box.bottom} Z`} fill={series.color} opacity={0.1} />
      <path d={line} fill="none" stroke={series.color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={pointX(box, last, series.values.length)} cy={valueY(box, series.values[last] ?? 0, max)} r={4} fill={series.color} stroke="var(--color-plate)" strokeWidth={2} />
    </g>
  );
}

/** Daily counts as lines on one shared axis, with a crosshair and tooltip on hover. */
export function LineChart({ days, series, height = 240, label }: LineChartProps) {
  const [ref, width] = useElementWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const box = plotBox(width, height, MARGIN);
  const ticks = axisTicks(Math.max(0, ...series.flatMap((item) => item.values)));
  const max = ticks.at(-1) ?? 1;
  const dayLabels = [0, Math.floor((days.length - 1) / 2), days.length - 1];

  function track(event: PointerEvent<SVGRectElement>) {
    const bounds = event.currentTarget.ownerSVGElement?.getBoundingClientRect();
    if (bounds) setHover(nearestIndex(box, event.clientX - bounds.left, days.length));
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1">
        {series.map((item) => <LegendItem key={item.name} color={item.color}>{item.name}</LegendItem>)}
      </div>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 ? (
          <svg width={width} height={height} role="img" aria-label={label}>
            <Gridlines box={box} ticks={ticks} max={max} y={(value, top) => valueY(box, value, top)} />
            {dayLabels.map((index, position) => (
              <text key={index} x={pointX(box, index, days.length)} y={height - 6} textAnchor={position === 0 ? 'start' : position === 2 ? 'end' : 'middle'} className="fill-steel-2 font-mono text-[10px]">
                {shortDay(days[index] ?? '')}
              </text>
            ))}
            {series.map((item) => <Series key={item.name} box={box} series={item} max={max} />)}
            {hover !== null ? (
              <g aria-hidden>
                <line x1={pointX(box, hover, days.length)} x2={pointX(box, hover, days.length)} y1={box.top} y2={box.bottom} stroke="var(--color-ink)" strokeWidth={1} />
                {series.map((item) => (
                  <circle key={item.name} cx={pointX(box, hover, days.length)} cy={valueY(box, item.values[hover] ?? 0, max)} r={5} fill={item.color} stroke="var(--color-plate)" strokeWidth={2} />
                ))}
              </g>
            ) : null}
            {/* The whole plot is the hover target, not just the 2px lines. */}
            <rect x={box.left} y={box.top} width={box.width} height={box.height} fill="transparent" onPointerMove={track} onPointerLeave={() => setHover(null)} />
          </svg>
        ) : null}
        {hover !== null ? (
          <ChartTooltip x={pointX(box, hover, days.length)} y={box.top + box.height / 2} width={width} title={shortDay(days[hover] ?? '')}
            rows={series.map((item) => ({ label: item.name, value: (item.values[hover] ?? 0).toLocaleString(), color: item.color }))} />
        ) : null}
      </div>
    </div>
  );
}
