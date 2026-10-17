// A plugin augments Readings with two sensors; record and latestReading accept them with their types.
import { latestReading, record, type Readings } from "./solution.js";

type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;
type Expect<T extends true> = T;

declare module "./solution.js" {
  interface Readings {
    ventOpen: boolean;
    lastWatered: string;
  }
}

const vent = latestReading("ventOpen");
const watered = latestReading("lastWatered");

export type Cases = [
  Expect<Equal<keyof Readings, "temperature" | "humidity" | "ventOpen" | "lastWatered">>,
  Expect<Equal<Readings["ventOpen"], boolean>>,
  Expect<Equal<typeof vent, boolean | undefined>>,
  Expect<Equal<typeof watered, string | undefined>>,
];

check.equal(vent, undefined, "a plugin sensor with no reading yet gives undefined");
record("ventOpen", true);
record("lastWatered", "06:30");
check.equal(latestReading("ventOpen"), true, "a boolean plugin reading is read back");
check.equal(latestReading("lastWatered"), "06:30", "a text plugin reading is read back");
record("ventOpen", false);
check.equal(latestReading("ventOpen"), false, "a later reading replaces the earlier one, even when it is false");
check.equal(latestReading("temperature"), undefined, "the built-in sensors are not affected by plugin readings");

export function misuse(): void {
  // @ts-expect-error the vent reading is a boolean
  record("ventOpen", "open");
  // @ts-expect-error no plugin added a co2 sensor
  record("co2", 410);
  // @ts-expect-error no plugin added a co2 sensor to read either
  latestReading("co2");
  // @ts-expect-error a vent reading may be missing, and is a boolean when present
  const sure: boolean = latestReading("ventOpen");
  console.log(sure);
}
