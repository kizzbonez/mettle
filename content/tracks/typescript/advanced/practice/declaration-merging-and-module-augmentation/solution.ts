/** The reading type of each sensor. Plugins add their sensors with `declare module`. */
export interface Readings {
  temperature: number;
  humidity: number;
}

const latest = new Map<string, unknown>();

/** Stores the latest reading of a sensor. */
export function record<K extends keyof Readings>(sensor: K, value: Readings[K]): void {
  latest.set(sensor, value);
}

/** The latest reading of a sensor, or undefined if none has been recorded. */
export function latestReading<K extends keyof Readings>(sensor: K): Readings[K] | undefined {
  return latest.get(sensor) as Readings[K] | undefined;
}

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      GREENHOUSE_UNITS?: "metric" | "imperial";
    }
  }
}

/** "metric" when GREENHOUSE_UNITS is unset, the value when valid, otherwise throw. */
export function units(): "metric" | "imperial" {
  const raw: string | undefined = process.env.GREENHOUSE_UNITS;
  if (raw === undefined) return "metric";
  if (raw === "metric" || raw === "imperial") return raw;
  throw new Error(`GREENHOUSE_UNITS must be metric or imperial, not "${raw}"`);
}
