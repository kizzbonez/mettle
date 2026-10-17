Complete `solution.ts`, the controller's module. Hidden tests act as sensor plugins: they add
sensors to `Readings` with `declare module "./solution.js"`, so your types must let them. They
also use `@ts-expect-error` lines and exact type comparisons.

1. **`Readings`** maps each sensor name to the type of its reading: `temperature: number` and
   `humidity: number`. The starter declares it as a type alias, and type aliases never merge.
   Make it an exported **interface**, so a plugin's augmentation merges into it.
2. **`record(sensor, value)`** stores the latest reading of a sensor, replacing any earlier one.
   Its `sensor` parameter accepts only the keys of `Readings` (including the ones plugins add),
   and `value` must have that sensor's type: `record("humidity", "damp")` must not compile.
   Keep the readings in a module-level `Map<string, unknown>`.
3. **`latestReading(sensor)`** returns the latest reading of that sensor, or `undefined` if none
   has been recorded. Its return type is the sensor's type or `undefined`: `number | undefined`
   for `"temperature"`.
4. Add a **global augmentation** (`declare global`) that types the environment variable
   `GREENHOUSE_UNITS` in `NodeJS.ProcessEnv` as optional, `"metric" | "imperial"`.
5. **`units()`** returns `"metric"` when `GREENHOUSE_UNITS` is not set, and its value when it is
   `"metric"` or `"imperial"`. The type is only a promise, so check: for any other value, throw an
   `Error` whose message includes the value. Read it into a `string | undefined` variable first,
   so the checks narrow it.

Example, with a plugin module adding a sensor:

```ts
// soil-plugin.ts
import { latestReading, record, units } from "./solution.js";

declare module "./solution.js" {
  interface Readings {
    soilMoisture: number;
  }
}

record("temperature", 21.5);
record("soilMoisture", 38);
latestReading("soilMoisture");   // 38, typed number | undefined
latestReading("humidity");       // undefined: nothing recorded yet
record("humidity", "damp");      // compile error: humidity is a number
units();                         // "metric" when GREENHOUSE_UNITS is not set
```
