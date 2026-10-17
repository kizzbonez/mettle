// record and latestReading for the built-in sensors: keys tied to Readings, latest value kept.
import { latestReading, record, type Readings } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

const temperature = latestReading("temperature");

export type Cases = [
  Expect<Equal<keyof Readings, "temperature" | "humidity">>,
  Expect<Equal<typeof temperature, number | undefined>>,
  Expect<Equal<Readings["humidity"], number>>,
];

check.equal(temperature, undefined, "nothing is recorded before the first reading");
record("temperature", 18);
record("temperature", 23.5);
check.equal(latestReading("temperature"), 23.5, "the latest temperature replaces the earlier one");
record("humidity", 0);
check.equal(latestReading("humidity"), 0, "a reading of 0 is kept, not treated as missing");
check.equal(latestReading("temperature"), 23.5, "recording humidity leaves the temperature alone");
record("temperature", -4);
check.equal(latestReading("temperature"), -4, "a temperature below zero is a reading like any other");

export function misuse(): void {
  // @ts-expect-error temperature is a number
  record("temperature", "warm");
  // @ts-expect-error there is no pressure sensor
  record("pressure", 1013);
  // @ts-expect-error a reading needs a value
  record("humidity");
}
