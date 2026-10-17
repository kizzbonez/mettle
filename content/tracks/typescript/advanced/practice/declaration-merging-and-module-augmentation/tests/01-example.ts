// The example from the instructions: this test is a plugin that adds a soil moisture sensor.
import { latestReading, record, units } from "./solution.js";

declare module "./solution.js" {
  interface Readings {
    soilMoisture: number;
  }
}

record("temperature", 21.5);
record("soilMoisture", 38);
const soil: number | undefined = latestReading("soilMoisture");
check.equal(soil, 38, "a plugin's sensor can be recorded and read back");
check.equal(latestReading("temperature"), 21.5, "a built-in sensor can be recorded and read back");
check.equal(latestReading("humidity"), undefined, "a sensor with no reading yet gives undefined");

delete process.env.GREENHOUSE_UNITS;
check.equal(units(), "metric", "units are metric when GREENHOUSE_UNITS is not set");

export function misuse(): void {
  // @ts-expect-error humidity is a number
  record("humidity", "damp");
}
