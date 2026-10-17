`HomeEvent` is a discriminated union on `kind`. Finish `solution.ts`. Some tests check your
**types**: they use your guard in `filter` and after `if`, and call your assertion function
before reading a door's fields, so a function that returns a plain `boolean` or `void` fails them.

1. **`LeakEvent`**: add `export interface LeakEvent { kind: "leak"; room: string }` and make it a
   member of `HomeEvent`.
2. **`isTemperature(event: HomeEvent): event is TemperatureEvent`**, a user-defined type guard:
   `true` exactly for temperature events.
3. **`assertDoor(event: HomeEvent): asserts event is DoorEvent`**, an assertion function: it
   returns nothing for a door event and throws a `TypeError` for any other event. Declare it
   with `function`.
4. **`describe(event: HomeEvent): string`** with a `switch` on `event.kind` that handles every
   kind and ends in a `default` that calls an `assertNever(value: never): never`, so that a kind
   arriving at run time from outside the union throws an `Error`. The lines are:

   | kind          | line                                                    |
   | ------------- | ------------------------------------------------------- |
   | `motion`      | `motion in the <room>`                                  |
   | `door`        | `<door> door opened` when `open`, else `<door> door closed` |
   | `temperature` | `<room> at <celsius> C`                                 |
   | `battery`     | `<device> battery at <percent>%`                        |
   | `leak`        | `LEAK in the <room>`                                    |

5. **`warmestRoom(events: readonly HomeEvent[]): string | undefined`** returns the room of the
   highest temperature reading, the earliest one on a tie, or `undefined` when there are no
   temperature readings. Use `events.filter(isTemperature)`.

Example:

```ts
const events: HomeEvent[] = [
  { kind: "temperature", room: "bedroom", celsius: 19.5 },
  { kind: "door", door: "front", open: true },
  { kind: "temperature", room: "kitchen", celsius: 22 },
  { kind: "leak", room: "kitchen" },
];
events.filter(isTemperature).length    // 2, and the result is a TemperatureEvent[]
describe(events[1])                    // "front door opened"
describe(events[3])                    // "LEAK in the kitchen"
warmestRoom(events)                    // "kitchen"
assertDoor(events[0])                  // throws a TypeError
```
