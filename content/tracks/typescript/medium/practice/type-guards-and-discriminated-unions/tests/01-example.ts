// The example from the instructions.
import { assertDoor, describe, isTemperature, warmestRoom, type HomeEvent, type TemperatureEvent } from "./solution.js";

const events: HomeEvent[] = [
  { kind: "temperature", room: "bedroom", celsius: 19.5 },
  { kind: "door", door: "front", open: true },
  { kind: "temperature", room: "kitchen", celsius: 22 },
  { kind: "leak", room: "kitchen" },
];
const readings: TemperatureEvent[] = events.filter(isTemperature);
check.equal(readings.length, 2, "the number of temperature readings among the events");
check.equal(describe(events[1]), "front door opened", "describe() of the front door opening");
check.equal(describe(events[3]), "LEAK in the kitchen", "describe() of a leak");
check.equal(warmestRoom(events), "kitchen", "the warmest room");
check.throws(() => assertDoor(events[0]), "assertDoor of a temperature reading throws a TypeError", TypeError);
