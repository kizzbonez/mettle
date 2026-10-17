// Greenhouse Controller
//
// Follow the TODOs: make Readings something plugins can add to, tie record and latestReading
// to its keys, type the GREENHOUSE_UNITS variable, and check it in units().

// TODO 1: type aliases never merge. Make this an exported interface.
export type Readings = {
  temperature: number;
  humidity: number;
};

// TODO 2: accept only the keys of Readings, with a value of that sensor's type.
export function record(sensor: string, value: unknown): void {
  throw new Error("Not implemented");
}

// TODO 3: return the sensor's type or undefined.
export function latestReading(sensor: string): unknown {
  throw new Error("Not implemented");
}

// TODO 4: a global augmentation typing GREENHOUSE_UNITS in NodeJS.ProcessEnv.

/** TODO 5: "metric" when unset, the value when valid, otherwise throw. */
export function units(): "metric" | "imperial" {
  throw new Error("Not implemented");
}
