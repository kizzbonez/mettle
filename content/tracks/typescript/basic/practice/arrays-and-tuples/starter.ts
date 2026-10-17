// The rain gauge in the school's weather garden. Each reading is one day's
// rain in millimetres, in the order of the days. Every function only reads the
// readings, so each one takes them as a readonly array.

export function totalRain(readings: readonly number[]): number {
  throw new Error("Not implemented");
}

export function wetDays(readings: readonly number[]): number {
  throw new Error("Not implemented");
}

// TODO: number[] is too loose for this function, which always returns exactly
// two numbers, the lowest and the highest reading. Change it to a tuple type.
export function driestAndWettest(readings: readonly number[]): number[] {
  throw new Error("Not implemented");
}

export function wettestReadings(readings: readonly number[], count: number): number[] {
  throw new Error("Not implemented");
}
