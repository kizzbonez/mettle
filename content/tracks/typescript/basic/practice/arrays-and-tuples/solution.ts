// The rain gauge in the school's weather garden. Each reading is one day's
// rain in millimetres, in the order of the days. Every function only reads the
// readings, so each one takes them as a readonly array.

export function totalRain(readings: readonly number[]): number {
  return readings.reduce((sum, mm) => sum + mm, 0);
}

export function wetDays(readings: readonly number[]): number {
  return readings.filter((mm) => mm > 0).length;
}

export function driestAndWettest(readings: readonly number[]): [number, number] {
  return [Math.min(...readings), Math.max(...readings)];
}

export function wettestReadings(readings: readonly number[], count: number): number[] {
  return readings.toSorted((a, b) => b - a).slice(0, count);
}
